# DevBank Microservices — CI/CD with AWS CodePipeline & ECS

A microservices demo project simulating DevBank's migration to a containerized,
automated deployment pipeline on AWS. A NodeJS backend API and a React frontend
are built, containerized with Docker, and deployed independently to Amazon ECS
(AWS Fargate) using AWS CodePipeline and CodeBuild.

## Architecture

```
GitHub (backend repo)  --> CodePipeline --> CodeBuild --> Docker Hub --> ECS Fargate (backend-service)
GitHub (frontend repo) --> CodePipeline --> CodeBuild --> Docker Hub --> ECS Fargate (frontend-service)
```

- **Backend**: Node.js + Express REST API (port 4000)
- **Frontend**: React SPA served via Nginx (port 3000)
- **CI/CD**: Each service has its own CodePipeline. A push to GitHub triggers
  CodeBuild, which builds a Docker image, pushes it to Docker Hub, and hands
  off an `imagedefinitions.json` artifact that CodePipeline uses to update the
  corresponding ECS service.
- **Compute**: Both services run as serverless containers on ECS Fargate for
  high availability without managing EC2 instances.

## Repository layout

```
devbank-microservices/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── buildspec.yml
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   └── buildspec.yml
├── ecs/
│   ├── backend-task-def.json
│   └── frontend-task-def.json
└── infrastructure/
    └── pipeline-cloudformation.yaml
```

> In a real setup, backend and frontend typically live in **separate GitHub
> repos** (as referenced by the two CodePipelines), since each has its own
> build/deploy lifecycle. This repo bundles both for demo/reference purposes —
> split them into `devbank-backend` and `devbank-frontend` repos if you want
> the pipelines to work as configured.

## Quick demo (no AWS needed)

This spins up the full microservices setup — two independently containerized
services talking to each other — entirely on your machine:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000/api/health

This proves out the containerization and service-separation parts of the
architecture without touching AWS. The `.github/workflows/build.yml` file
also gives you a **real, free CI pipeline** (via GitHub Actions) that builds
and smoke-tests both images on every push — so you have a genuinely working
pipeline to show, even before deploying anything to AWS. The CodePipeline/ECS
pieces (below) are the AWS-native equivalent for when you're ready to deploy.

## Running locally (without Docker Compose)

```bash
# Backend
cd backend
npm install
npm start        # http://localhost:4000/api/health

# Frontend (in another terminal)
cd frontend
npm install
REACT_APP_API_URL=http://localhost:4000 npm start   # http://localhost:3000
```

Or with Docker individually:

```bash
docker build -t devbank-backend ./backend
docker run -p 4000:4000 devbank-backend

docker build -t devbank-frontend --build-arg REACT_APP_API_URL=http://localhost:4000 ./frontend
docker run -p 3000:3000 devbank-frontend
```

## Deploying the pipeline (AWS)

1. **Create a Docker Hub account/repo access token** — CodeBuild pushes
   images there (`DOCKERHUB_USERNAME` / `DOCKERHUB_PASSWORD`).
2. **Create a CodeStar Connections GitHub connection** in the AWS console
   (Developer Tools → Settings → Connections) and authorize it against your
   GitHub org/repos. Copy its ARN.
3. **Deploy the infrastructure stack:**
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/pipeline-cloudformation.yaml \
     --stack-name devbank-pipeline \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       GitHubConnectionArn=<connection-arn> \
       GitHubRepoBackend=<org>/devbank-backend \
       GitHubRepoFrontend=<org>/devbank-frontend \
       DockerHubUsername=<username> \
       DockerHubPassword=<token> \
       VpcId=<vpc-id> \
       SubnetIds=<subnet-1>,<subnet-2>
   ```
4. **Register the ECS task definitions** (update the placeholders for account
   ID, region, and Docker Hub username first):
   ```bash
   aws ecs register-task-definition --cli-input-json file://ecs/backend-task-def.json
   aws ecs register-task-definition --cli-input-json file://ecs/frontend-task-def.json
   ```
5. **Create the ECS services** (`backend-service`, `frontend-service`) on the
   `devbank-cluster` created by the stack, using the registered task
   definitions and the `ServiceSecurityGroup` output.
6. Push a commit to each GitHub repo — CodePipeline picks it up automatically
   and deploys the new image to ECS.

## Validating the deployment

Once services are `ACTIVE` in the ECS console, grab each task's public IP
(Fargate with a public subnet) and hit:

- Backend: `http://<backend-public-ip>:4000/api/health`
- Frontend: `http://<frontend-public-ip>:3000`

## Tools used

| Tool | Purpose |
|---|---|
| AWS CodePipeline | Orchestrates the build → deploy stages |
| AWS CodeBuild | Builds Docker images from source, pushes to Docker Hub |
| Docker | Packages backend/frontend with their dependencies |
| Amazon ECS (Fargate) | Runs the containers serverlessly, high availability |
| GitHub | Source control and pipeline trigger |

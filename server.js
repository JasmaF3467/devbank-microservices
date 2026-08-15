const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'devbank-backend', time: new Date().toISOString() });
});

app.get('/api/accounts', (req, res) => {
  res.json([
    { id: 1, name: 'Checking', balance: 4820.55 },
    { id: 2, name: 'Savings', balance: 15230.12 }
  ]);
});

app.listen(PORT, () => {
  console.log(`DevBank backend listening on port ${PORT}`);
});

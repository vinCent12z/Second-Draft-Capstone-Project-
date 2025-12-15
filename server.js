const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

let latestProcessHTML = '';
let latestRoundsData = [];

// 🔐 Define a secret token (store in env variable for production)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'supersecret123';

// Admin deploy endpoint (secured)
app.post('/deploy', (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }

  const { processHTML, roundsData } = req.body;
  latestProcessHTML = processHTML || '';
  latestRoundsData = roundsData || [];
  console.log('✅ New deployment received');
  res.json({ message: 'Deployment saved successfully' });
});

// Judge fetch endpoint
app.get('/latest', (req, res) => {
  res.json({
    processHTML: latestProcessHTML,
    roundsData: latestRoundsData
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

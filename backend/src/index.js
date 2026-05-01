require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./config/firebase');

const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const friendsRouter = require('./routes/friends');
const debtsRouter = require('./routes/debts');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://localhost:5500')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/transactions', transactionsRouter);
app.use('/categories', categoriesRouter);
app.use('/friends', friendsRouter);
app.use('/debts', debtsRouter);

app.listen(PORT, () => {
  console.log(`Finance Tracker API running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

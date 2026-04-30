require('dotenv').config();
const express = require('express');
const cors = require('cors');

const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const friendsRouter = require('./routes/friends');
const debtsRouter = require('./routes/debts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/transactions', transactionsRouter);
app.use('/categories', categoriesRouter);
app.use('/friends', friendsRouter);
app.use('/debts', debtsRouter);

app.listen(PORT, () => {
  console.log(`Finance Tracker API running on port ${PORT}`);
});

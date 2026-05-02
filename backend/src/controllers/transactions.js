const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const col = () => db.collection('transactions');

const getAll = async (req, res) => {
  const { year, month } = req.query;
  let query = col();
  if (year && month) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    query = query
      .where('date', '>=', Timestamp.fromDate(start))
      .where('date', '<', Timestamp.fromDate(end));
  }
  const snap = await query.orderBy('date', 'desc').get();
  const transactions = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, date: data.date?.toDate().toISOString() ?? null };
  });
  res.json(transactions);
};

const create = async (req, res) => {
  const { amount, type, category, description, date } = req.body;
  const data = {
    amount: Number(amount),
    type,
    category,
    description,
    date: Timestamp.fromDate(new Date(date)),
  };
  const ref = await col().add(data);
  res.status(201).json({ id: ref.id, ...data, date });
};

const update = async (req, res) => {
  const { amount, type, category, description, date } = req.body;
  const data = {
    amount: Number(amount),
    type,
    category,
    description,
    date: Timestamp.fromDate(new Date(date)),
  };
  await col().doc(req.params.id).update(data);
  res.json({ id: req.params.id, ...data, date });
};

const remove = async (req, res) => {
  await col().doc(req.params.id).delete();
  res.status(204).send();
};

module.exports = { getAll, create, update, remove };

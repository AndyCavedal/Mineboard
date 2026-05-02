const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const col = () => db.collection('debts');

const getAll = async (req, res) => {
  const snap = await col().orderBy('date', 'desc').get();
  const debts = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, date: data.date?.toDate().toISOString() ?? null };
  });
  res.json(debts);
};

const create = async (req, res) => {
  const { fromFriend, toFriend, amount, concept, date } = req.body;
  const data = {
    fromFriend,
    toFriend,
    amount: Number(amount),
    concept,
    paid: false,
    date: Timestamp.fromDate(new Date(date ?? Date.now())),
  };
  const ref = await col().add(data);
  res.status(201).json({ id: ref.id, ...data, date: data.date.toDate().toISOString() });
};

const update = async (req, res) => {
  const { fromFriend, toFriend, amount, concept, paid, date } = req.body;
  const data = {};
  if (fromFriend !== undefined) data.fromFriend = fromFriend;
  if (toFriend !== undefined) data.toFriend = toFriend;
  if (amount !== undefined) data.amount = Number(amount);
  if (concept !== undefined) data.concept = concept;
  if (paid !== undefined) data.paid = Boolean(paid);
  if (date !== undefined) data.date = Timestamp.fromDate(new Date(date));
  await col().doc(req.params.id).update(data);
  res.json({ id: req.params.id, ...data });
};

const remove = async (req, res) => {
  await col().doc(req.params.id).delete();
  res.status(204).send();
};

module.exports = { getAll, create, update, remove };

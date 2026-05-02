const { db } = require('../config/firebase');

const col = () => db.collection('categories');

const getAll = async (req, res) => {
  const snap = await col().orderBy('name').get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};

const create = async (req, res) => {
  const { name, color } = req.body;
  const ref = await col().add({ name, color });
  res.status(201).json({ id: ref.id, name, color });
};

const update = async (req, res) => {
  const { name, color } = req.body;
  await col().doc(req.params.id).update({ name, color });
  res.json({ id: req.params.id, name, color });
};

const remove = async (req, res) => {
  await col().doc(req.params.id).delete();
  res.status(204).send();
};

module.exports = { getAll, create, update, remove };

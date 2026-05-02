const { db } = require('../config/firebase');

const col = () => db.collection('friends');

const getAll = async (req, res) => {
  const snap = await col().orderBy('name').get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};

const create = async (req, res) => {
  const { name } = req.body;
  const ref = await col().add({ name });
  res.status(201).json({ id: ref.id, name });
};

const remove = async (req, res) => {
  await col().doc(req.params.id).delete();
  res.status(204).send();
};

module.exports = { getAll, create, remove };

const { db } = require('../config/firebase');

const col = () => db.collection('categories');

const getAll = async (req, res) => {
  try {
    const snap = await col().orderBy('name').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    console.error('[categories.getAll]', e.message);
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, color } = req.body;
    const ref = await col().add({ name, color });
    res.status(201).json({ id: ref.id, name, color });
  } catch (e) {
    console.error('[categories.create]', e.message);
    res.status(500).json({ error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, color } = req.body;
    await col().doc(req.params.id).update({ name, color });
    res.json({ id: req.params.id, name, color });
  } catch (e) {
    console.error('[categories.update]', e.message);
    res.status(500).json({ error: e.message });
  }
};

const remove = async (req, res) => {
  try {
    await col().doc(req.params.id).delete();
    res.status(204).send();
  } catch (e) {
    console.error('[categories.remove]', e.message);
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getAll, create, update, remove };

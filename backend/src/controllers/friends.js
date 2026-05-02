const { db } = require('../config/firebase');

const col = () => db.collection('friends');

const getAll = async (req, res) => {
  try {
    const snap = await col().orderBy('name').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    console.error('[friends.getAll]', e.message);
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const { name } = req.body;
    const ref = await col().add({ name });
    res.status(201).json({ id: ref.id, name });
  } catch (e) {
    console.error('[friends.create]', e.message);
    res.status(500).json({ error: e.message });
  }
};

const remove = async (req, res) => {
  try {
    await col().doc(req.params.id).delete();
    res.status(204).send();
  } catch (e) {
    console.error('[friends.remove]', e.message);
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getAll, create, remove };

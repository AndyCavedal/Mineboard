// TODO: implement transaction logic
const getAll = async (req, res) => { res.json([]); };
const create = async (req, res) => { res.status(201).json({}); };
const update = async (req, res) => { res.json({}); };
const remove = async (req, res) => { res.status(204).send(); };

module.exports = { getAll, create, update, remove };

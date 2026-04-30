// TODO: implement friends logic
const getAll = async (req, res) => { res.json([]); };
const create = async (req, res) => { res.status(201).json({}); };
const remove = async (req, res) => { res.status(204).send(); };

module.exports = { getAll, create, remove };

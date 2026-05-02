const { admin, db } = require('../config/firebase');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    const snap = await db.collection('allowedUsers')
      .where('email', '==', decoded.email)
      .limit(1)
      .get();
    if (snap.empty) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const userData = snap.docs[0].data();
    req.user = { uid: decoded.uid, email: decoded.email, role: userData.role, name: userData.name };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Owner only' });
  }
  next();
}

module.exports = { requireAuth, requireOwner };

const { admin, db } = require('../config/firebase');

// Cache allowedUsers lookups per uid for 5 minutes to avoid a Firestore
// round-trip on every request. Entries are keyed by uid and expire lazily.
const _authCache = new Map();
const AUTH_CACHE_TTL = 5 * 60 * 1000;

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));

    const cached = _authCache.get(decoded.uid);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    const snap = await db.collection('allowedUsers')
      .where('email', '==', decoded.email)
      .limit(1)
      .get();
    if (snap.empty) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const userData = snap.docs[0].data();
    req.user = { uid: decoded.uid, email: decoded.email, role: userData.role, name: userData.name };
    _authCache.set(decoded.uid, { user: req.user, expiresAt: Date.now() + AUTH_CACHE_TTL });
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

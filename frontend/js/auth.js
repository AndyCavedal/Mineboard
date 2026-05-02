/* =====================
   Firebase Auth
   ===================== */

let _user = null;
let _token = null;
let _role = null;

function initAuth() {
  firebase.initializeApp(window.FIREBASE_CONFIG);

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      _user = user;
      _token = await user.getIdToken();
    } else {
      _user = null;
      _token = null;
      _role = null;
    }
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
  });
}

async function getToken() {
  if (!_user) return null;
  _token = await _user.getIdToken();
  return _token;
}

async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  await firebase.auth().signInWithPopup(provider);
}

function signOut() {
  return firebase.auth().signOut();
}

function getCurrentUser() {
  return _user;
}

function getUserRole() {
  return _role;
}

function setUserRole(role) {
  _role = role;
}

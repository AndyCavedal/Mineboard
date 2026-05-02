window.APP_CONFIG = {
  API_BASE_URL:
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : 'https://mineboard-api.onrender.com',
};

window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAeIMdSiQqE8l9CImnclGzdgqekzP7F4-Y',
  authDomain: 'mineboard-4ba8b.firebaseapp.com',
  projectId: 'mineboard-4ba8b',
  storageBucket: 'mineboard-4ba8b.firebasestorage.app',
  messagingSenderId: '5846544620',
  appId: '1:5846544620:web:b4e5a1f7eeb5d9665b75c9',
};

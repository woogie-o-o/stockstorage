// Copy this file to config.local.js and fill it outside version control.
// Do not commit real Firebase or API keys.
window.WOOGI_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

window.WOOGI_FIREBASE_REGION = "asia-northeast3";

// Optional: set this when the SPA is hosted separately from the API proxy.
// Example: "https://woogi-stock-api.example.run.app"
window.WOOGI_API_BASE_URL = "";

// Optional UI hint: add Firebase Auth UIDs that should see the admin screen.
// Production Firestore/Storage authorization still requires a rules UID or custom claim { admin: true }.
window.WOOGI_ADMIN_UIDS = [];

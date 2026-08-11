const read = (key, fallback = '') => import.meta.env[key] || fallback;

export const runtime = Object.freeze({
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
  githubRepo: read('VITE_GITHUB_REPO'),
  demoCampaignId: read('VITE_DEMO_CAMPAIGN_ID', 'campanha-demo'),
  demoLeaderId: read('VITE_DEMO_LEADER_ID', 'lider-demo'),
  firebase: {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: read('VITE_FIREBASE_APP_ID')
  }
});

export const hasFirebaseConfig = Boolean(
  runtime.firebase.apiKey && runtime.firebase.authDomain && runtime.firebase.projectId && runtime.firebase.appId
);

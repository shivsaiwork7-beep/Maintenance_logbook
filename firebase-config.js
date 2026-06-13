// Firebase Configuration
// Replace these values with your Firebase project credentials
// Get these from Firebase Console: https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db;
let auth;

async function initializeFirebase() {
  try {
    // Dynamically load Firebase SDKs from CDN
    if (typeof firebase === 'undefined') {
      await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    }

    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    
    console.log("Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return false;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Cloud storage functions
async function loadEntriesFromCloud() {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("No authenticated user, using local storage");
      return loadEntriesLocal();
    }

    const snapshot = await db.ref(`users/${userId}/entries`).once('value');
    return snapshot.val() || [];
  } catch (error) {
    console.error("Error loading from cloud:", error);
    return loadEntriesLocal(); // Fallback to local storage
  }
}

async function saveEntriesToCloud(data) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn("No authenticated user, saving to local storage only");
      return saveEntriesLocal(data);
    }

    await db.ref(`users/${userId}/entries`).set(data);
    saveEntriesLocal(data); // Keep local copy as backup
    console.log("Entries saved to cloud successfully");
    return true;
  } catch (error) {
    console.error("Error saving to cloud:", error);
    saveEntriesLocal(data); // Fallback to local storage
    return false;
  }
}

// Fallback local storage functions
function loadEntriesLocal() {
  try {
    const raw = localStorage.getItem("maintenance-logbook-entries");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntriesLocal(data) {
  localStorage.setItem("maintenance-logbook-entries", JSON.stringify(data));
}

// Auth functions
async function signUpUser(email, password) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    return result.user;
  } catch (error) {
    console.error("Signup error:", error.message);
    throw error;
  }
}

async function signInUser(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return result.user;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
}

async function signOutUser() {
  try {
    await auth.signOut();
    console.log("User signed out");
  } catch (error) {
    console.error("Logout error:", error);
  }
}

function onAuthStateChanged(callback) {
  auth.onAuthStateChanged(callback);
}

// Real-time sync (optional - syncs when data changes in cloud)
function syncEntriesRealtime(callback) {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    db.ref(`users/${userId}/entries`).on('value', (snapshot) => {
      const data = snapshot.val() || [];
      callback(data);
    });
  } catch (error) {
    console.error("Real-time sync error:", error);
  }
}

function stopRealtimeSync() {
  try {
    const userId = auth.currentUser?.uid;
    if (userId) {
      db.ref(`users/${userId}/entries`).off();
    }
  } catch (error) {
    console.error("Error stopping real-time sync:", error);
  }
}

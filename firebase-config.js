// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCz1jZPJL6SINl2tvigEKLygVT5X5zmuEk",
  authDomain: "maintenance-logbook-07.firebaseapp.com",
  databaseURL: "https://maintenance-logbook-07-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maintenance-logbook-07",
  storageBucket: "maintenance-logbook-07.firebasestorage.app",
  messagingSenderId: "969479649512",
  appId: "1:969479649512:web:482a058af253ee641e715d",
  measurementId: "G-638MMTE27X"
};

let db = null;
let auth = null;
let firebaseReady = false;

// ==========================================
// LOAD FIREBASE SDK
// ==========================================

async function initializeFirebase() {
  try {

    if (typeof firebase === "undefined") {

      await loadScript(
        "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"
      );

      await loadScript(
        "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"
      );

      await loadScript(
        "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"
      );
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    db = firebase.database();
    auth = firebase.auth();

    firebaseReady = true;

    console.log("Firebase initialized");
    return true;

  } catch (error) {

    firebaseReady = false;

    console.warn(
      "Firebase unavailable. Running local storage mode.",
      error
    );

    return false;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {

    const script = document.createElement("script");

    script.src = src;

    script.onload = resolve;

    script.onerror = reject;

    document.head.appendChild(script);
  });
}

// ==========================================
// LOCAL STORAGE
// ==========================================

const STORAGE_KEY = "maintenance-logbook-entries";

function saveEntriesLocal(data) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    console.log("Saved locally");

    return true;

  } catch (error) {

    console.error(
      "Local save failed:",
      error
    );

    return false;
  }
}

function loadEntriesLocal() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    return raw
      ? JSON.parse(raw)
      : [];

  } catch (error) {

    console.error(error);

    return [];
  }
}

// ==========================================
// CLOUD + LOCAL SAVE
// ==========================================

async function saveEntriesToCloud(data) {

  // ALWAYS SAVE LOCALLY FIRST

  saveEntriesLocal(data);

  try {

    if (
      !firebaseReady ||
      !db ||
      !auth ||
      !auth.currentUser
    ) {

      console.log(
        "Cloud unavailable. Saved locally only."
      );

      return true;
    }

    await db
      .ref(
        `users/${auth.currentUser.uid}/entries`
      )
      .set(data);

    console.log(
      "Saved to Firebase"
    );

    return true;

  } catch (error) {

    console.error(
      "Firebase save failed:",
      error
    );

    return true;
  }
}

async function loadEntriesFromCloud() {

  try {

    if (
      !firebaseReady ||
      !db ||
      !auth ||
      !auth.currentUser
    ) {

      console.log(
        "Loading from local storage"
      );

      return loadEntriesLocal();
    }

    const snapshot =
      await db
        .ref(
          `users/${auth.currentUser.uid}/entries`
        )
        .once("value");

    const cloudData =
      snapshot.val();

    if (
      Array.isArray(cloudData)
    ) {

      saveEntriesLocal(
        cloudData
      );

      return cloudData;
    }

    return loadEntriesLocal();

  } catch (error) {

    console.error(
      "Cloud load failed:",
      error
    );

    return loadEntriesLocal();
  }
}

// ==========================================
// AUTH FUNCTIONS
// ==========================================

async function signUpUser(
  email,
  password
) {

  if (!auth) {
    throw new Error(
      "Firebase Auth unavailable"
    );
  }

  const result =
    await auth.createUserWithEmailAndPassword(
      email,
      password
    );

  return result.user;
}

async function signInUser(
  email,
  password
) {

  if (!auth) {
    throw new Error(
      "Firebase Auth unavailable"
    );
  }

  const result =
    await auth.signInWithEmailAndPassword(
      email,
      password
    );

  return result.user;
}

async function signOutUser() {

  if (!auth) return;

  await auth.signOut();
}

function onAuthStateChanged(
  callback
) {

  if (!auth) return;

  auth.onAuthStateChanged(
    callback
  );
}

// ==========================================
// REALTIME SYNC
// ==========================================

let entriesRef = null;

function syncEntriesRealtime(
  callback
) {

  try {

    if (
      !auth ||
      !auth.currentUser
    ) {
      return;
    }

    entriesRef =
      db.ref(
        `users/${auth.currentUser.uid}/entries`
      );

    entriesRef.on(
      "value",
      snapshot => {

        const data =
          snapshot.val() || [];

        saveEntriesLocal(
          data
        );

        callback(data);
      }
    );

  } catch (error) {

    console.error(error);
  }
}

function stopRealtimeSync() {

  try {

    if (entriesRef) {

      entriesRef.off();

      entriesRef = null;
    }

  } catch (error) {

    console.error(error);
  }
}
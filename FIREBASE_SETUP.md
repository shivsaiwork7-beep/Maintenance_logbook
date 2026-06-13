# Cloud Database Setup Guide - Firebase Realtime Database

This guide explains how to set up Firebase Realtime Database for your Maintenance Logbook app.

## What's Changed

Your app now stores data in **Firebase Realtime Database** instead of local browser storage:

- ✅ **Secure Cloud Storage**: All maintenance logs are stored in the cloud
- ✅ **Real-time Sync**: Changes sync across devices automatically
- ✅ **User Authentication**: Firebase handles secure login/signup
- ✅ **Offline Fallback**: Data syncs when connection is restored
- ✅ **Sync Indicator**: Green dot shows when data is synced

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create Project"**
3. Enter a project name (e.g., "maintenance-logbook")
4. Disable Google Analytics (optional)
5. Click **Create Project** and wait for completion

## Step 2: Set Up Realtime Database

1. In Firebase Console, go to **Realtime Database** (left sidebar)
2. Click **Create Database**
3. Choose **Start in Test Mode** (for development)
4. Select your preferred region
5. Click **Enable**

> ⚠️ Note: Test Mode allows anyone with the database URL to read/write. For production, update security rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Step 3: Enable Email/Password Authentication

1. Go to **Authentication** in Firebase Console
2. Click **Get Started**
3. Click **Email/Password** provider
4. Enable it and click **Save**
5. Go to **Users** tab and click **Add User**
6. Create a test user (e.g., test@example.com / password123)

## Step 4: Get Firebase Credentials

1. Click the **Settings icon** (⚙️) → **Project Settings**
2. Under **Your apps**, click the **Web icon** (</> )
3. Register your app with a name
4. Copy the config object

Example config looks like:
```javascript
{
  apiKey: "AIzaSyD...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123..."
}
```

## Step 5: Update Your App

1. Open [firebase-config.js](firebase-config.js)
2. Replace the placeholder values in the `firebaseConfig` object with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file
4. Push changes to your repository

## Step 6: Test the Setup

1. Open your app in a browser
2. You should see the login screen
3. Use the test user credentials (email/password you created in Step 3)
4. Create a new maintenance log entry
5. Check **Firebase Console → Realtime Database** to see your data stored

You should see data structure like:
```
users/
  ├─ [user-uid]/
  │  ├─ entries/
  │  │  ├─ [0]/
  │  │  │  ├─ technician: "John Doe"
  │  │  │  ├─ site: "Plant A"
  │  │  │  └─ ...
```

## Features

### Real-time Sync
- When you add/edit entries on one device, they appear on others instantly
- Look for the green "Synced" indicator in the header

### Offline Support
- Changes are saved locally and synced when connection returns
- See amber "Syncing..." indicator during sync

### Automatic Backup
- All data is backed up in Firebase cloud storage
- Can be exported via Firebase Console

## Troubleshooting

### "Firebase not initialized" error
- Check that your Firebase credentials are correct in `firebase-config.js`
- Verify database URL is accessible

### Login fails
- Confirm email/password user exists in Firebase Authentication
- Check browser console for detailed error messages

### Data not appearing
- Go to Firebase Console → Realtime Database
- Verify your test user's data exists under `users/[uid]/entries`
- Check browser console for sync errors

### Security Rules Issues
- While in development, Test Mode is fine
- For production, update security rules in Firebase Console

## File Structure

```
├── firebase-config.js      ← Firebase setup (edit credentials here)
├── script.js               ← Updated to use Cloud DB
├── index.html              ← Updated login form
└── styles.css              ← Unchanged
```

## Next Steps

### For Production:
1. Upgrade to Blaze plan (pay-as-you-go)
2. Update Realtime Database security rules
3. Set up user signup functionality
4. Add user role management

### Data Export:
- Firebase Console → Realtime Database → Export JSON
- Data is also accessible via REST API

### Monitoring:
- Firebase Console → Analytics to track usage
- Monitor database read/write costs

---

Need help? Check [Firebase Documentation](https://firebase.google.com/docs/database) or Firebase Console support.

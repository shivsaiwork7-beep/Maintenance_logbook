# Cloud Database Quick Reference

## What's New

Your Maintenance Logbook now uses **Firebase Realtime Database** to store data in the cloud instead of your browser.

## Key Files Added/Modified

| File | Changes |
|------|---------|
| `firebase-config.js` | **NEW** - Firebase setup and cloud functions |
| `script.js` | Updated to use cloud storage, new async functions |
| `index.html` | Updated login form (email instead of username) |
| `FIREBASE_SETUP.md` | Complete setup instructions |

## Features Enabled

✅ Cloud storage of all maintenance logs  
✅ Automatic syncing across devices  
✅ Secure Firebase authentication  
✅ Offline support with fallback to local storage  
✅ Real-time data sync indicator (green/amber dot)  

## Quick Setup (5 minutes)

1. **Create Firebase project** → [Firebase Console](https://console.firebase.google.com/)
2. **Enable Realtime Database** → Choose "Test Mode"
3. **Enable Email/Password Auth** → Create test user
4. **Get credentials** → Copy Firebase config
5. **Edit `firebase-config.js`** → Paste credentials
6. **Test** → Login with test email and create entry

## Login Changes

**Before**: Username: admin, Password: password123  
**After**: Email: your@email.com, Password: (Firebase user)

First user must be created in Firebase Console → Authentication → Users tab

## Sync Indicator (Header)

- 🟢 **Green "Synced"** - Data saved to cloud
- 🟠 **Amber "Syncing..."** - Uploading to cloud  
- ⚪ **Gray "Offline"** - No Firebase/not logged in

## Data Structure in Cloud

```
Firebase Realtime Database:
└─ users/
   └─ [user-uid]/
      └─ entries/
         └─ [0-50 entries array]
```

Each entry contains: technician, site, equipment, workDate, etc.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Login fails | Create user in Firebase Auth console |
| Can't find credentials | Go to Firebase Settings → Web app |
| Data not syncing | Check Firebase credentials in `firebase-config.js` |
| Offline mode | Use local storage fallback, syncs when online |

## Security (Important!)

**For Testing**: Current config in Test Mode (anyone can read/write)  
**For Production**: Update security rules in Firebase Console:

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

## Files to Deploy

Commit and push these files:
- ✅ `firebase-config.js` (with YOUR credentials)
- ✅ `script.js` (updated for cloud)
- ✅ `index.html` (new login form)
- ✅ `FIREBASE_SETUP.md` (documentation)

## Next Features You Can Add

- User roles (admin, technician, supervisor)
- Data analytics dashboard
- Automated reports
- Backup scheduling
- Multi-team support

---

**Need details?** Read [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

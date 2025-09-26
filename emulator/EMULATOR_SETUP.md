# Firebase Emulator Configuration

This project now supports running with either production Firebase services or local Firebase emulators for development.

## Quick Start

### Production Mode (Default)
```bash
npm start
```
Uses production Firebase services.

### Emulator Mode
```bash
npm run start:emulator
```
Starts Firebase emulators and React app concurrently.

### Emulator Mode with Seeded Data
```bash
npm run start:emulator:seed
```
Starts emulators with pre-seeded test data.

### Seeding Options
```bash
# Seed both authentication users and Firestore data (recommended)
npm run emulator:seed

# Seed only authentication users
npm run emulator:seed:auth

# Seed only Firestore data
npm run emulator:seed:firestore
```

**Default Test Accounts:**
- **Admin**: `admin@ad.min` / `adminadmin` (parent role, because custom auth qualities don't translate to user doc creation)
- **Parent**: `user@us.er` / `useruser` (parent role)  
- **Test**: `test@te.st` / `testest` (parent role)

## Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start React app with production Firebase |
| `npm run start:emulator` | Start React app with Firebase emulators |
| `npm run start:emulator:seed` | Start with emulators + seeded data |
| `npm run emulator:start` | Start only Firebase emulators |
| `npm run emulator:stop` | Stop Firebase emulators |
| `npm run emulator:seed` | Seed emulator with auth users + Firestore data (runs both scripts) |
| `npm run emulator:seed:auth` | Seed authentication users only |
| `npm run emulator:seed:firestore` | Seed Firestore data only |

## Emulator Services

When running in emulator mode, the following services are available:

- **Firestore**: `localhost:8080`
- **Authentication**: `localhost:9099`
- **Storage**: `localhost:9199`
- **Functions**: `localhost:5001`
- **Pub/Sub**: `localhost:8085`
- **Emulator UI**: `localhost:4000`

## Configuration Details

### Environment Variables

The system uses `REACT_APP_USE_EMULATOR` to determine the mode:

- `REACT_APP_USE_EMULATOR=false` (default) → Production Firebase
- `REACT_APP_USE_EMULATOR=true` → Firebase Emulators

### Firebase Configuration

The app automatically detects the emulator mode and connects to the appropriate services:

- **Production**: Uses your Firebase project configuration
- **Emulator**: Connects to local emulator services

### Console Logging

The emulator configuration runs silently in the background. When using emulator mode:

- **No console logs** are displayed for emulator connections (clean implementation)
- **Emulator UI** at `http://localhost:4000` shows connection status
- **Browser Network tab** will show requests to `localhost:8080`, `localhost:9099`, etc.
- **Firebase DevTools** will indicate emulator usage

## Development Workflow

### For Production Development
```bash
npm start
```

### For Emulator Development
```bash
# Start with fresh emulators
npm run start:emulator

# Start with seeded data
npm run start:emulator:seed
```

### Stopping Services
- Press `Ctrl+C` to stop both React app and emulators
- Or use `npm run emulator:stop` to stop only emulators

## Troubleshooting

### "Multiple Instances" Warning

If you see this warning:
```
⚠ emulators: It seems that you are running multiple instances of the emulator suite for project latertots-a6694. This may result in unexpected behavior.
```

**This is usually caused by:**
1. **Leftover processes** from previous emulator runs
2. **Debug log files** that make Firebase think multiple instances are running
3. **Incomplete shutdown** of emulator processes

**Solution:**
```bash
# 1. Kill all emulator processes
npm run emulator:stop

# 2. Check for remaining processes
lsof -i :8080 -i :8085 -i :9099 -i :9199 -i :5001 -i :4000

# 3. Kill any remaining processes manually
kill -9 <PID>

# 4. Remove debug log files
rm -f firebase-debug.log firestore-debug.log pubsub-debug.log

# 5. Restart emulators
npm run start:emulator
```

### Port Conflicts
If you get port conflicts, make sure no other services are using the emulator ports:
- Firestore: 8080
- Auth: 9099
- Storage: 9199
- Functions: 5001
- Pub/Sub: 8085
- UI: 4000

**Check for port conflicts:**
```bash
lsof -i :8080 -i :8085 -i :9099 -i :9199 -i :5001 -i :4000
```

### Emulator Connection Issues
- Ensure Firebase CLI is installed: `npm install -g firebase-tools`
- Check that emulators are running: `npm run emulator:start`
- Verify emulator UI is accessible at `http://localhost:4000`

### Environment Variables
Make sure your `.env` file contains the required Firebase configuration variables for production mode.

### Clean Restart
If you're experiencing persistent issues:

```bash
# Complete cleanup and restart
npm run emulator:stop
pkill -f firebase
pkill -f java
rm -f *debug*.log
npm run start:emulator
```

### Debug Information
- **Emulator UI**: Check `http://localhost:4000` for emulator status
- **Debug Logs**: Check `firebase-debug.log` for detailed error information
- **Process Status**: Use `lsof -i :8080` to check if Firestore emulator is running

## Architecture

The emulator configuration is implemented through:

1. **Package.json Scripts**: Orchestrate emulator and React app startup using `concurrently`
2. **Environment Detection**: Automatic mode switching based on `REACT_APP_USE_EMULATOR`
3. **Firebase Config**: Clean conditional connection to emulators vs production
4. **Service Configs**: Individual emulator connections for Firestore, Auth, Storage
5. **Silent Operation**: No debug logging - clean, production-ready implementation

### Folder Structure
```
emulator/
├── auth/
│   └── auth-seed.mjs          # Authentication user seeding
├── firestore/
│   ├── seed.mjs              # Firestore data seeding
│   ├── firestore.rules       # Firestore security rules
│   └── storage.rules         # Storage security rules
├── functions/                # Cloud Functions
├── firebase.json            # Emulator configuration
└── EMULATOR_SETUP.md        # This documentation
```

### Key Files:
- `src/config/firebase.js` - Main Firebase app initialization and Storage emulator
- `src/config/firestore.js` - Firestore database with emulator connection
- `src/config/firebaseAuth.js` - Authentication with emulator connection
- `emulator/firebase.json` - Emulator configuration and rules
- `emulator/auth/auth-seed.mjs` - Authentication user seeding (uses env vars)
- `emulator/firestore/seed.mjs` - Firestore data seeding (uses env vars)
- `package.json` - Orchestration scripts
- `.env` - Environment variables for Firebase configuration

This setup provides a seamless development experience while maintaining clear separation between production and development environments.

## Implementation Notes

### Clean Architecture
The current implementation is **production-ready** with:
- **No debug logging** cluttering the console
- **Silent emulator connections** that work seamlessly
- **Error handling** for connection conflicts
- **Environment-based switching** without manual configuration
- **Environment variable usage** in all emulator scripts for security

### Security Best Practices
- **✅ Environment Variables**: All Firebase configs use `process.env` variables
- **✅ No Hardcoded Secrets**: No API keys or project IDs in source code
- **✅ Consistent Configuration**: Same env vars used across app and emulator scripts
- **✅ Secure Development**: Emulator scripts inherit production security practices

### What Was Removed
During development, extensive debugging was added and then removed:
- ❌ `db._delegate` property debugging (unreliable indicator)
- ❌ Console logs for emulator connections
- ❌ Environment variable debugging
- ❌ Database object structure analysis

The current implementation focuses on **clean, silent operation** that works reliably without cluttering the development experience.

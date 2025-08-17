# 🔄 Clear Authentication Cache

## Issue: App Bypassing Login Screen

The app is currently showing the chat screen directly because it has cached mock authentication data from the previous static implementation.

## 🚀 Solution: Clear App Data

### Method 1: Reset App Data (Recommended)

**For iOS Simulator:**
1. **Device Menu** → **Erase All Content and Settings**
2. **Restart** the simulator
3. **Reinstall** the app

**For Physical Device:**
1. **Delete the app** from your device
2. **Reinstall** from Expo/development build

### Method 2: Clear AsyncStorage Programmatically

Add this temporary code to clear cached data:

```typescript
// Add to app/index.tsx temporarily
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this in useEffect before checkAuthState()
await AsyncStorage.clear(); // This clears all cached data
```

### Method 3: Force Logout

Add a logout button temporarily to any screen:

```typescript
import { useAuthStore } from '../src/shared/stores/authStore';

const { logout } = useAuthStore();

// Add button
<TouchableOpacity onPress={() => logout()}>
  <Text>Force Logout</Text>
</TouchableOpacity>
```

## ✅ Expected Behavior After Clearing Cache

1. **App starts** → Shows loading screen
2. **Auth check** → No valid Supabase session found
3. **Redirects to** → Launch screen (login/signup)
4. **User can** → Create real account or sign in
5. **After auth** → Proper flow through onboarding to chat

## 🎯 Why This Happened

The previous implementation used mock authentication with persistent storage. The Zustand store cached:
- `isAuthenticated: true`
- `user: mockUser`
- `hasCompletedOnboarding: true`

Now that we've updated to use real Supabase authentication, we need to clear this cached data.

## 🔧 Verification

After clearing cache, the app should:
- ✅ Show launch screen first
- ✅ Require real authentication
- ✅ Connect to Supabase database
- ✅ No more analytics network errors
- ✅ Dynamic content from database

Your Supabase backend is ready - we just need to clear the old cached authentication state!

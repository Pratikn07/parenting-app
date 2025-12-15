---
description: Publish an Over-The-Air (OTA) update to production users
---

# Publishing OTA Updates

Use this workflow to publish instant updates to your production app without going through App Store review.

## When to Use OTA Updates

✅ **Use OTA for:**
- Bug fixes
- UI/UX improvements
- Feature changes (JavaScript/TypeScript code)
- Text changes
- Style updates
- API endpoint changes

❌ **Do NOT use OTA for:**
- Native code changes
- New permissions
- Version number changes
- Changes to app.json or eas.json

## Steps

### 1. Make Your Changes
Edit any JavaScript/TypeScript files in the project as needed.

### 2. Test Locally
```bash
npm run ios
```
or
```bash
npm run android
```

### 3. Publish the Update
```bash
eas update --branch production --message "Brief description of changes"
```

**Example:**
```bash
eas update --branch production --message "Fixed recipe detail crash"
```

### 4. Verify Publication
- Check the output for the update ID
- Visit: https://expo.dev/accounts/pratik_n/projects/parenting-app/updates
- Confirm the update appears

### 5. User Experience
- Users with the production build will receive the update on **next app restart**
- Updates download automatically in the background
- No action required from users

## Important Notes

- **Runtime Version:** Updates only work for builds with matching runtime version (currently `1.0.0`)
- **Build Required:** If you change native code or bump versions, you need a new build: `eas build --platform ios --profile production`
- **Channels:** Make sure to publish to the correct channel:
  - `production` - Live App Store users
  - `preview` - Internal testing
  - `development` - Development builds

## Checking Update Status

View all published updates:
```bash
eas update:list --branch production
```

View update details:
```bash
eas update:view [UPDATE_ID]
```

## Rollback an Update

If you need to rollback to a previous version:
```bash
eas branch:publish --branch production --update [PREVIOUS_UPDATE_ID]
```

# 04 Development & DevOps Guide

## Local Setup
1. **System Requirements**: Node.js 18+ LTS, Expo CLI.
2. **Dependencies**:
   ```bash
   npm install
   ```
3. **Launch**:
   ```bash
   npx expo start
   ```

---

## Environment Configuration
Configure `.env` with the following variables for local development:
```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=https://<web-app>.vercel.app
```

---

## EAS Build & Deployment
- **Account**: `devenweb` (devenpawaray@gmail.com).
- **Pre-Build Checks**:
  - Re-link project: `eas init`
  - Ensure `app.json` has `owner: "devenweb"`.
- **Android APK Build (Preview)**:
  ```bash
  npx eas build --profile preview --platform android
  ```
- **Production iOS Build**:
  ```bash
  npx eas build --profile production --platform ios
  ```

---

## Troubleshooting

### Android Device Authorization Error
If the device shows "not authorized" when connecting via Expo Go:
```bash
npx expo start --localhost
```
This forces a local tunnel that bypasses the authorization check. Alternatively, open Expo Go on the device, scan the QR code, and approve the prompt.

### `react-native-screens` Patch Conflict
Current version: **4.4.0**. If `patch-package` fails during `npm install`:
```bash
npx patch-package react-native-screens
```
This regenerates the patch file for the current installed version.

### AAPT Build Errors
- Do **not** name JPEG files with `.png` extensions — EAS will fail during Android resource merging.
- Check `lib/imageUtils.ts` if images or icons are missing in production builds.

### Metro Bundler Cache Issues
```bash
npx expo start --clear
```

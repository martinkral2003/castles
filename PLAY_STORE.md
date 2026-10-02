# Publishing Keepfall on Google Play

## 1. One-time setup
1. Install Node.js (LTS) and Android Studio.
2. In this folder:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npm run build
   npx cap add android
   npx cap sync android
   ```
3. Edit `capacitor.config.json`: set `appId` to your own reverse-domain id (for example `com.yourname.keepfall`). It can never change after the first upload.

## 2. Each release
```bash
npm run build
npx cap sync android
npx cap open android
```
In Android Studio: Build → Generate Signed App Bundle → Android App Bundle (.aab). Create a keystore the first time,
back it up somewhere safe, and never commit it (it's in `.gitignore`). Bump the version code in
`android/app/build.gradle` for every upload.

## 3. Play Console
1. Create a developer account (one-time registration fee).
2. Create the app, then fill in the store listing, content rating questionnaire, Data safety form and a privacy policy URL
   (a simple page on GitHub Pages works).
3. New personal accounts must run a **closed test with at least 12 testers opted in for 14 consecutive days**
   before applying for production access. Recruit friends early.
4. After the test, apply for production access and publish.

## Notes
- Lock the app to portrait in `android/app/src/main/AndroidManifest.xml` (`android:screenOrientation="portrait"` on the activity) if you want.
- Saved progress uses localStorage, which persists inside the app's WebView.
- Online play needs the relay server described in `CLAUDE.md`; ship single-player first.

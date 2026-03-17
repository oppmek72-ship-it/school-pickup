# Play Store Publishing Guide

## Option 1: PWA Install (Fastest - No Play Store needed)

Parents can install the app directly from their phone browser right now:

**Android (Chrome):**
1. Open the app URL in Chrome
2. Tap menu (3 dots) > "Install app" or "Add to Home screen"
3. App icon appears on home screen - works like a native app!

**iPhone (Safari):**
1. Open the app URL in Safari
2. Tap Share > "Add to Home Screen"

## Option 2: Play Store via PWABuilder (Recommended)

### Prerequisites
- App deployed to a public HTTPS URL (Vercel, Netlify, or Railway)
- Google Play Developer account ($25 one-time fee at https://play.google.com/console)

### Steps

1. **Deploy the app** to a public URL:
   ```bash
   cd frontend && npm run build
   # Upload dist/ to Vercel: npx vercel
   ```

2. **Go to https://www.pwabuilder.com**
   - Enter your deployed URL
   - Click "Package for stores" > "Android"
   - Download the generated AAB file

3. **Upload to Google Play Console:**
   - Create app > Name: "Smart School Pick-up"
   - Category: Education
   - Upload the AAB file
   - Add screenshots, description, content rating
   - Submit for review (usually 1-3 days)

## Option 3: Share APK Directly

If Play Store review is too slow:
1. Use PWABuilder to generate an APK (not AAB)
2. Share the APK file via LINE/WhatsApp group or QR code download link
3. Parents install by opening the APK file

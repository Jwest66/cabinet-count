# Cabinet Count

A barcode-scanning inventory app for your cabinet, pantry and fridge. It runs in your phone's browser, installs to your home screen, and works offline.

## What's in this folder

| File | What it does |
|---|---|
| `index.html` | The whole app |
| `manifest.webmanifest` | Lets your phone install it with a name and icon |
| `sw.js` | Keeps the app working offline |
| `vendor/zxing.min.js` | Barcode reader for iPhones (Android uses the phone's built-in reader) |
| `icon-*.png`, `apple-touch-icon.png` | Home-screen icons |

## Put it online (GitHub Pages, free, about 10 minutes)

The camera only works on a secure (`https://`) address, so the app needs hosting. Any static host works. These steps use GitHub's website, so you don't need git.

1. Sign in at github.com, or create a free account.
2. Click **New repository**. Name it `cabinet-count`, set it to **Public**, and click **Create repository**.
3. On the empty repo page, click **uploading an existing file**.
4. Unzip the download on a computer, open the `cabinet-count` folder, select **everything inside it** (including the `vendor` folder), and drag it onto the upload page. Click **Commit changes**.
5. Go to **Settings → Pages**. Under **Branch**, pick `main` and `/ (root)`, then click **Save**.
6. Wait a minute or two, then refresh that page. It shows your address, something like `https://YOUR-NAME.github.io/cabinet-count/`.

GitHub Pages only serves public repos on a free account. The code is public, but your inventory is not: it's stored on your phone, never on GitHub.

**Netlify alternative:** go to app.netlify.com/drop and drag the unzipped `cabinet-count` folder onto the page. You get an `https://` address right away.

## Install it on your phone

**iPhone (Safari):** open your address, tap **Share**, then **Add to Home Screen**.

**Android (Chrome):** open your address, tap **⋮**, then **Add to Home screen** (or **Install app**).

Open it from the new icon. The first time you tap **Scan barcode**, allow camera access.

## Using it

- **Scan barcode** opens a live viewfinder. Hold the barcode inside the yellow box.
- The **first scan** of a product looks it up and fills in the name. Confirm or edit it, pick where it lives, and save.
- **Later scans** add 1, or use 1 if you switch the toggle. The scanner stays open so you can scan a whole bag of groceries in a row. Tap **Done** when finished.
- **Light** turns on the flashlight in dark cabinets (Android only; iPhone browsers don't allow it).
- **−** and **+** adjust counts by hand. Tap an item to rename, move or delete it.

## Product lookup

The app checks **Open Food Facts** first (free and open, strong on groceries), then **UPCitemdb**'s free trial tier (broader, with a daily lookup limit). If neither knows the barcode, you type the name once. Lookups need an internet connection; everything else works offline.

## Your data

Items are stored only in this browser on this phone. Deleting the app, or clearing Safari/Chrome website data, deletes them.

Open the **⋯** menu to:

- **Save backup file**: a `.json` file you can keep in iCloud Drive, Google Drive or email.
- **Restore from backup**: load a backup on this phone or a new one.
- **Export spreadsheet (CSV)**: opens in Excel or Google Sheets.

## Updating the app later

Edit `index.html`, change `VERSION` at the top of `sw.js` (for example to `cabinet-count-v2`), and upload both files again. Phones pick up the new version the second time you open the app.

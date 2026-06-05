# BuyWise

BuyWise is a mobile-first Progressive Web App that helps users decide whether buying a phone, bike, car, or house is financially safe based on income, existing EMIs, savings, down payment, tenure, interest rate, and monthly ownership costs.

Tagline: Know before you buy.

## Features

- Phone, bike, car, and house affordability checks
- Monthly or annual income input
- Monthly essential expenses and emergency fund check
- Multiple existing EMI entries
- Reducing balance EMI calculation
- Product-specific risk rules and practical advice
- Safer budget suggestion
- Indian currency formatting
- Light and dark theme with saved preference
- Saved form inputs using localStorage
- Offline support through a service worker
- Installable PWA manifest

## File Structure

```text
project root/
|-- index.html
|-- style.css
|-- app.js
|-- manifest.json
|-- service-worker.js
|-- README.md
|-- icon.svg
|-- icon-192.png
`-- icon-512.png
```

## Run in VS Code

1. Open the project folder in VS Code.
2. Install the Live Server extension.
3. Right-click `index.html`.
4. Click "Open with Live Server".
5. Test the app in your browser.
6. Upload files to GitHub.
7. Enable GitHub Pages from repository settings.

## GitHub Pages

Upload the contents of this folder to a GitHub repository. In the repository settings, open Pages, choose the branch that contains the app, and save. The app uses relative paths, so it works from a GitHub Pages project URL.

## Icons

The app includes `icon.svg`, `icon-192.png`, and `icon-512.png` in the root folder. To replace them, keep the same filenames or update the paths in `index.html`, `manifest.json`, and `service-worker.js`.

If you need to export PNG icons again, open `icon.svg` in a design tool or browser export workflow and save:

- `icon-192.png` at 192 x 192
- `icon-512.png` at 512 x 512

## Clear Old Service Worker Cache

If an old version keeps loading:

1. Open browser DevTools.
2. Go to Application.
3. Open Service Workers and unregister the BuyWise service worker.
4. Open Storage and clear site data.
5. Reload the page.

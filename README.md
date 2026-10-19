# eBay Variation Matrix

Firefox extension (desktop and Android) that adds an **"Show all variations"** button below the variation dropdowns on eBay listings. It opens a list of every variation combination with its price and stock.

- Filter by text, sort by price, hide sold-out variations
- The currently selected variation is highlighted and the cheapest in-stock price is shown in green
- Click or tap a row to switch the listing to that variation
- Full-screen card layout on phones, table on desktop, follows the system dark mode

## Permissions

None. The extension has no `permissions` entry. It only declares a content script for `https://*.ebay.<tld>/itm/*` (de, com, at, ch, co.uk, ie, fr, it, es, nl, be, pl, ca, com.au). All data comes from the variation model that eBay already embeds in the item page, so the extension makes no network requests and collects no data.

## How it works

eBay embeds a `"MSKU":{"_type":"VariationViewModel",…}` object in an inline script. `src/parse.js` cuts that JSON out and joins `selectMenus`, `menuItemMap`, `variationCombinations` and `variationsMap` into one row per variation. `src/content.js` renders the button and the dialog inside closed shadow roots so eBay's CSS can't affect them. If eBay re-renders the variation block, the button is added again.

## Install for development

- **Desktop:** open `about:debugging#/runtime/this-firefox`, choose *Load Temporary Add-on…* and select `manifest.json`. Or run `npx web-ext run`.
- **Android:** `npx web-ext run -t firefox-android --adb-device <id> --firefox-apk org.mozilla.firefox` (USB debugging on). For a permanent install, sign the extension on addons.mozilla.org.

With Manifest V3, Firefox may ask you to allow access to eBay sites. Accept it, or turn it on in the add-on's *Permissions* tab.

## Build and test

```sh
npx web-ext lint
npx web-ext build            # zip in web-ext-artifacts/
node test/parse.test.js saved-item-page.html
```

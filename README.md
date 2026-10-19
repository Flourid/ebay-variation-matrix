# Variation Matrix for eBay

Firefox extension (desktop and Android) that adds an **"Show all variations"** button below the variation dropdowns on eBay listings. It opens a list of every variation combination with its price and stock.

- Filter by text, sort by any column (click a header; on phones the headers are a row of sort buttons), hide sold-out variations
- Filter each property column (Material, Farbe, …) with the funnel icon in its header, or right-click / long-press the header: type words to keep values containing any of them (e.g. `pla petg`), and tick or untick individual values
- If a listing has variation dropdowns but the data can't be read (usually because eBay changed its page), a "Couldn't read the variations – report a problem" link appears instead of the button. It opens a prefilled GitHub issue (`.github/ISSUE_TEMPLATE/broken-listing.yml`) with the listing address (tracking parameters removed), device, Firefox and add-on version; nothing is sent unless the user submits it
- Prices are formatted for the site language (e.g. "14,99 €" on eBay.de)
- The currently selected variation is highlighted and the cheapest in-stock price is shown in green
- Variations already in your cart get an "Im Warenkorb" / "In cart" badge. eBay's item page only says whether a variation is in the cart, not how many, and it reflects the cart when the page was loaded
- Click or tap a row to switch the listing to that variation
- Search, column filters, "in stock only" and sort order are remembered per item while the tab is open, including after picking a variation
- Full-screen card layout on phones, table on desktop; always light to match eBay (set `FOLLOW_SYSTEM_DARK_MODE` in `src/content.js` to follow the system dark mode)

Not affiliated with or endorsed by eBay Inc.

## Permissions

None. The extension has no `permissions` entry. It only declares a content script for `https://*.ebay.<tld>/itm/*` (de, com, at, ch, co.uk, ie, fr, it, es, nl, be, pl, ca, com.au). All data comes from the variation model that eBay already embeds in the item page, so the extension makes no network requests and collects no data. The remembered filter and sort are kept in the tab's `sessionStorage` and are cleared when the tab closes.

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
node test/parse.test.js test/fixtures/item-127910134556-desktop.html
```

Saved eBay pages for testing go in `test/fixtures/`. That directory is git-ignored because saved pages can contain personal data (see `test/fixtures/README.md`).

## Publishing to addons.mozilla.org

`amo-metadata.json` holds the store listing (summary, description, categories, license, notes for reviewers). `web-ext sign` sends it along with the upload:

```sh
npx web-ext sign --channel=listed --amo-metadata=amo-metadata.json \
  --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET"
```

Get the key ("JWT issuer") and secret at <https://addons.mozilla.org/developers/addon/api/key/>.

This is automated by `.github/workflows/release.yml`: push a tag such as `v1.1.0` and GitHub Actions sets that version in `manifest.json`, lints, builds and submits it to AMO for review, then attaches the zip to a GitHub release. It reads the repository secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`. Each tag must be a higher version than the last upload.

```sh
git tag v1.0.0 && git push origin v1.0.0
```

## License

MIT, see `LICENSE`.

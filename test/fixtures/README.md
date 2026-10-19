# Test fixtures (local only)

Saved eBay pages used for testing go here. Everything in this directory except this README is ignored by git: saved pages can contain your name, address, cart contents and session tokens, so they must not be pushed.

Save pages in Firefox with Ctrl+S → "Web Page, HTML only". Suggested names:

- `item-<id>.html`: an item page with variations
- `item-<id>-in-cart.html`: the same item while some of its variations are in your cart
- `cart.html`: your cart page

Run the parser test against a page with:

```sh
node test/parse.test.js test/fixtures/item-<id>.html
```

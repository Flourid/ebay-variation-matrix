// Extracts eBay's multi-SKU ("MSKU") variation model from the inline page
// scripts and flattens it into one row per purchasable variation.
// Kept free of DOM access so it can be tested with plain Node.
(function (root) {
  "use strict";

  const MARKER = '"MSKU":{"_type":"VariationViewModel"';

  // Returns the end index (exclusive) of the JSON object starting at `start`,
  // or -1 if it is not closed. Skips braces that appear inside strings.
  function findObjectEnd(text, start) {
    let depth = 0;
    let inString = false;
    for (let i = start; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (inString) {
        if (c === 92 /* \ */) i++;
        else if (c === 34 /* " */) inString = false;
      } else if (c === 34) {
        inString = true;
      } else if (c === 123 /* { */) {
        depth++;
      } else if (c === 125 /* } */) {
        depth--;
        if (depth === 0) return i + 1;
      }
    }
    return -1;
  }

  function extractMsku(text) {
    const at = text.indexOf(MARKER);
    if (at < 0) return null;
    const start = at + '"MSKU":'.length;
    const end = findObjectEnd(text, start);
    if (end < 0) return null;
    try {
      const msku = JSON.parse(text.slice(start, end));
      return msku && msku.selectMenus && msku.variationCombinations ? msku : null;
    } catch (e) {
      return null;
    }
  }

  function spansText(display) {
    const spans = display && display.textSpans;
    return Array.isArray(spans) ? spans.map((s) => s.text).join(" ").trim() : "";
  }

  function firstSpanText(display) {
    const spans = display && display.textSpans;
    return Array.isArray(spans) && spans.length ? String(spans[0].text).trim() : "";
  }

  function buildMatrix(msku) {
    const menus = msku.selectMenus.map((m) => ({
      id: m.id,
      label: m.displayLabel,
      valueIds: m.menuItemValueIds || [],
    }));

    // valueId -> [menuIndex, position within that menu]
    const valueIndex = new Map();
    menus.forEach((menu, mi) => {
      menu.valueIds.forEach((vid, pos) => valueIndex.set(String(vid), [mi, pos]));
    });

    const items = msku.menuItemMap || {};
    const variations = msku.variationsMap || {};
    const rows = [];

    for (const [key, variationId] of Object.entries(msku.variationCombinations)) {
      const values = new Array(menus.length).fill("");
      const order = new Array(menus.length).fill(0);
      for (const vid of key.split("_")) {
        const idx = valueIndex.get(vid);
        if (!idx) continue;
        const item = items[vid] || {};
        values[idx[0]] = item.displayName || item.valueName || "";
        order[idx[0]] = idx[1];
      }

      const v = variations[String(variationId)] || {};
      const price = v.binModel && v.binModel.price;
      const amount = price && price.value ? price.value.value : null;
      const qty = v.quantity || {};

      rows.push({
        variationId: String(variationId),
        values,
        order,
        price: typeof amount === "number" ? amount : null,
        currency: price && price.value ? price.value.currency : null,
        priceText: spansText(price),
        // First span is per-variation stock ("30 available"); later spans
        // repeat listing-wide stats like the total sold count.
        availability: firstSpanText(qty.availabilitySignal),
        outOfStock: !!qty.outOfStock,
      });
    }

    rows.sort((a, b) => {
      for (let i = 0; i < a.order.length; i++) {
        if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i];
      }
      return 0;
    });

    return {
      labels: menus.map((m) => m.label),
      rows,
      selectedVariationId: msku.selectedVariationId != null ? String(msku.selectedVariationId) : null,
      outOfStockLabel: spansText(msku.outOfStockLabel),
    };
  }

  root.EbayVariationMatrix = { extractMsku, buildMatrix };
})(typeof globalThis !== "undefined" ? globalThis : this);

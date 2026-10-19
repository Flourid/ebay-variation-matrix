(function () {
  "use strict";

  const { extractMsku, buildMatrix } = globalThis.EbayVariationMatrix;

  const CONTAINER_SELECTOR = '[data-testid="x-msku-evo"], .x-msku-evo';
  const BUTTON_HOST_ID = "evm-button-host";
  const MODAL_HOST_ID = "evm-modal-host";

  const STRINGS = {
    en: {
      button: "Show all variations",
      title: "All variations",
      filter: "Filter…",
      sort: "Sort",
      sortDefault: "Default order",
      inStockOnly: "In stock only",
      price: "Price",
      availability: "Availability",
      outOfStock: "Out of stock",
      current: "selected",
      close: "Close",
      count: (shown, total) => `${shown} of ${total} variations`,
      noMatch: "No variations match.",
      hint: "Tap a row to select that variation.",
    },
    de: {
      button: "Alle Varianten anzeigen",
      title: "Alle Varianten",
      filter: "Filtern…",
      sort: "Sortierung",
      sortDefault: "Standard",
      inStockOnly: "Nur verfügbare",
      price: "Preis",
      availability: "Verfügbarkeit",
      outOfStock: "Nicht vorrätig",
      current: "ausgewählt",
      close: "Schließen",
      count: (shown, total) => `${shown} von ${total} Varianten`,
      noMatch: "Keine passenden Varianten.",
      hint: "Zeile antippen, um die Variante auszuwählen.",
    },
  };

  const lang = (document.documentElement.lang || navigator.language || "en").toLowerCase();
  const t = STRINGS[lang.slice(0, 2)] || STRINGS.en;

  let cachedMatrix;

  function loadMatrix() {
    if (cachedMatrix !== undefined) return cachedMatrix;
    cachedMatrix = null;
    for (const script of document.querySelectorAll("script:not([src])")) {
      const text = script.textContent;
      if (!text || text.indexOf('"VariationViewModel"') < 0) continue;
      const msku = extractMsku(text);
      if (msku) {
        cachedMatrix = buildMatrix(msku);
        break;
      }
    }
    return cachedMatrix;
  }

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") node.className = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
    }
    for (const child of children) {
      if (child != null) node.append(child);
    }
    return node;
  }

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat(lang, { style: "currency", currency }).format(amount);
    } catch (e) {
      return `${currency} ${amount}`;
    }
  }

  const BUTTON_CSS = `
    button {
      display: inline-flex; align-items: center; gap: 8px;
      width: 100%; min-height: 40px; padding: 8px 16px; box-sizing: border-box;
      justify-content: center;
      font: inherit; font-size: 14px; font-weight: 700;
      color: #3665f3; background: transparent;
      border: 1px solid #3665f3; border-radius: 20px; cursor: pointer;
    }
    button:hover { background: rgba(54, 101, 243, 0.06); }
    button:focus-visible { outline: 2px solid #3665f3; outline-offset: 2px; }
    svg { width: 16px; height: 16px; flex: none; }
  `;

  const MODAL_CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .backdrop {
      position: fixed; inset: 0; z-index: 2147483646;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      font: 14px/1.4 "Market Sans", Arial, sans-serif;
      --bg: #fff; --fg: #191919; --muted: #707070; --line: #e5e5e5;
      --hover: #f7f7f7; --accent: #3665f3; --accent-bg: #eef2fe; --ok: #05823f;
      color: var(--fg);
    }
    @media (prefers-color-scheme: dark) {
      .backdrop {
        --bg: #1c1c1e; --fg: #f2f2f2; --muted: #a0a0a0; --line: #3a3a3c;
        --hover: #2a2a2d; --accent: #7a9cff; --accent-bg: #23304f; --ok: #4cc77f;
      }
    }
    .dialog {
      background: var(--bg); width: min(960px, calc(100vw - 32px));
      max-height: calc(100vh - 48px); border-radius: 16px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 16px 8px;
    }
    h2 { margin: 0; font-size: 18px; flex: 1; }
    .close {
      width: 40px; height: 40px; border: 0; border-radius: 50%;
      background: transparent; color: var(--fg); font-size: 24px; line-height: 1;
      cursor: pointer;
    }
    .close:hover { background: var(--hover); }
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      padding: 0 16px 12px; border-bottom: 1px solid var(--line);
    }
    .toolbar input[type="search"], .toolbar select {
      font: inherit; color: var(--fg); background: var(--bg);
      border: 1px solid var(--line); border-radius: 8px;
      min-height: 36px; padding: 6px 10px;
    }
    .toolbar input[type="search"] { flex: 1 1 200px; min-width: 0; }
    .toolbar label { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .summary { padding: 8px 16px; color: var(--muted); font-size: 13px; }
    .scroll { overflow: auto; flex: 1; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
    table { width: 100%; border-collapse: collapse; }
    th {
      position: sticky; top: 0; background: var(--bg); z-index: 1;
      text-align: left; font-weight: 700; padding: 8px 12px;
      border-bottom: 1px solid var(--line); white-space: nowrap;
    }
    td { padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
    th.num, td.num { text-align: right; white-space: nowrap; }
    th button {
      all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
      font-weight: 700; border-radius: 4px;
    }
    th button:hover { color: var(--accent); }
    th button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    th .arrow { width: 1em; text-align: center; color: var(--accent); }
    th:not([aria-sort]) .arrow::after { content: "↕"; color: var(--muted); opacity: 0.5; }
    th[aria-sort="ascending"] .arrow::after { content: "↑"; }
    th[aria-sort="descending"] .arrow::after { content: "↓"; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: var(--hover); }
    tbody tr:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    tr.current { background: var(--accent-bg); }
    tr.current td:first-child { box-shadow: inset 3px 0 0 var(--accent); }
    tr.oos { color: var(--muted); }
    tr.oos .price { text-decoration: line-through; }
    .price { font-weight: 700; }
    tr.cheapest .price { color: var(--ok); }
    .badge {
      display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 8px;
      font-size: 11px; font-weight: 700; background: var(--accent); color: var(--bg);
      vertical-align: middle;
    }
    .avail { color: var(--muted); font-size: 13px; }
    .empty { padding: 24px 16px; text-align: center; color: var(--muted); }
    .hint { padding: 8px 16px 12px; color: var(--muted); font-size: 12px; border-top: 1px solid var(--line); }

    /* Phones: full-screen sheet, rows become stacked cards. */
    @media (max-width: 640px) {
      .backdrop { align-items: stretch; }
      .dialog { width: 100vw; max-height: none; height: 100%; border-radius: 0; }
      thead { display: none; }
      table, tbody, tr, td { display: block; }
      tr {
        display: grid; grid-template-columns: 1fr auto; gap: 2px 12px;
        padding: 10px 16px; border-bottom: 1px solid var(--line);
      }
      td { padding: 0; border: 0; }
      td.attr { grid-column: 1; }
      td.attr .lbl { color: var(--muted); }
      td.attr .lbl::after { content: ": "; }
      td.price-cell { grid-column: 2; grid-row: 1; text-align: right; }
      td.avail-cell { grid-column: 1 / -1; }
      tr.current td:first-child { box-shadow: none; }
      tr.current { box-shadow: inset 3px 0 0 var(--accent); }
    }
    @media (min-width: 641px) {
      td.attr .lbl { display: none; }
    }
  `;

  // Stock number from "28 verfügbar", "More than 10 available", "10+ …".
  // In-stock text without a number is eBay's "Last one" / "Letzter Artikel".
  function stockCount(row) {
    if (row.outOfStock) return 0;
    if (!row.availability) return null;
    const m = /\d[\d.,\s]*/.exec(row.availability);
    return m ? parseInt(m[0].replace(/[^\d]/g, ""), 10) : 1;
  }

  function variationUrl(variationId) {
    const url = new URL(location.href);
    url.searchParams.set("var", variationId);
    return url.toString();
  }

  function openModal() {
    const matrix = loadMatrix();
    if (!matrix || document.getElementById(MODAL_HOST_ID)) return;

    const currentId = new URL(location.href).searchParams.get("var") || matrix.selectedVariationId;
    const prices = matrix.rows.filter((r) => r.price != null && !r.outOfStock).map((r) => r.price);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const currency = (matrix.rows.find((r) => r.currency) || {}).currency;

    const host = el("div", { id: MODAL_HOST_ID });
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.append(el("style", {}, MODAL_CSS));

    const collator = new Intl.Collator(lang, { numeric: true, sensitivity: "base" });
    const columns = [
      ...matrix.labels.map((label, i) => ({
        key: String(i),
        label,
        value: (r) => r.values[i] || null,
        compare: (a, b) => collator.compare(a, b),
      })),
      { key: "price", label: t.price, num: true, value: (r) => r.price, compare: (a, b) => a - b },
      { key: "stock", label: t.availability, value: stockCount, compare: (a, b) => a - b },
    ];
    let sortKey = null;
    let sortDir = 1;

    const search = el("input", { type: "search", placeholder: t.filter, "aria-label": t.filter });
    const sort = el(
      "select",
      { "aria-label": t.sort },
      el("option", { value: "default" }, t.sortDefault),
      ...columns.flatMap((c) => [
        el("option", { value: `${c.key}:1` }, `${c.label} ↑`),
        el("option", { value: `${c.key}:-1` }, `${c.label} ↓`),
      ])
    );
    const headers = columns.map((c) =>
      el(
        "th",
        { scope: "col", class: c.num ? "num" : false },
        el(
          "button",
          { type: "button", onclick: () => toggleSort(c.key) },
          c.label,
          el("span", { class: "arrow", "aria-hidden": "true" })
        )
      )
    );

    // Header clicks cycle ascending → descending → default order.
    function toggleSort(key) {
      if (sortKey !== key) {
        sortKey = key;
        sortDir = 1;
      } else if (sortDir === 1) {
        sortDir = -1;
      } else {
        sortKey = null;
      }
      render();
      scroll.scrollTop = 0;
    }

    function sortRows(rows) {
      const col = columns.find((c) => c.key === sortKey);
      if (!col) return rows;
      // Rows without a value stay at the end in both directions; ties keep the default order.
      return rows
        .map((r) => [r, col.value(r)])
        .sort(([, a], [, b]) => {
          if (a == null) return b == null ? 0 : 1;
          if (b == null) return -1;
          return col.compare(a, b) * sortDir;
        })
        .map(([r]) => r);
    }
    const inStock = el("input", { type: "checkbox" });
    const summary = el("div", { class: "summary", role: "status" });
    const tbody = el("tbody");
    const scroll = el(
      "div",
      { class: "scroll" },
      el(
        "table",
        {},
        el(
          "thead",
          {},
          el("tr", {}, ...headers)
        ),
        tbody
      )
    );

    function close() {
      host.remove();
      document.documentElement.style.removeProperty("overflow");
      document.removeEventListener("keydown", onKey, true);
    }

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    }

    function select(row) {
      if (row.variationId === currentId) {
        close();
        return;
      }
      location.assign(variationUrl(row.variationId));
    }

    function render() {
      const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      let rows = matrix.rows.filter((r) => {
        if (inStock.checked && r.outOfStock) return false;
        if (!terms.length) return true;
        const hay = r.values.join(" ").toLowerCase();
        return terms.every((term) => hay.includes(term));
      });
      rows = sortRows(rows);

      sort.value = sortKey == null ? "default" : `${sortKey}:${sortDir}`;
      columns.forEach((c, i) => {
        if (c.key === sortKey) headers[i].setAttribute("aria-sort", sortDir === 1 ? "ascending" : "descending");
        else headers[i].removeAttribute("aria-sort");
      });

      let text = t.count(rows.length, matrix.rows.length);
      if (minPrice != null && currency) {
        text +=
          minPrice === maxPrice
            ? ` · ${formatMoney(minPrice, currency)}`
            : ` · ${formatMoney(minPrice, currency)} – ${formatMoney(maxPrice, currency)}`;
      }
      summary.textContent = text;

      tbody.replaceChildren();
      if (!rows.length) {
        tbody.append(
          el("tr", {}, el("td", { class: "empty", colspan: matrix.labels.length + 2 }, t.noMatch))
        );
        return;
      }

      const frag = document.createDocumentFragment();
      for (const row of rows) {
        const classes = [];
        if (row.variationId === currentId) classes.push("current");
        if (row.outOfStock) classes.push("oos");
        if (!row.outOfStock && row.price != null && row.price === minPrice) classes.push("cheapest");

        const priceText =
          row.priceText || (row.price != null && row.currency ? formatMoney(row.price, row.currency) : "–");
        const availText = row.outOfStock ? matrix.outOfStockLabel || t.outOfStock : row.availability;

        const tr = el(
          "tr",
          {
            class: classes.join(" "),
            tabindex: "0",
            "aria-current": row.variationId === currentId ? "true" : false,
            onclick: () => select(row),
            onkeydown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                select(row);
              }
            },
          },
          ...row.values.map((v, i) =>
            el(
              "td",
              { class: "attr" },
              el("span", { class: "lbl" }, matrix.labels[i]),
              v,
              i === 0 && row.variationId === currentId ? el("span", { class: "badge" }, t.current) : null
            )
          ),
          el("td", { class: "num price-cell" }, el("span", { class: "price" }, priceText)),
          el("td", { class: "avail-cell" }, el("span", { class: "avail" }, availText || ""))
        );
        frag.append(tr);
      }
      tbody.append(frag);
    }

    search.addEventListener("input", render);
    sort.addEventListener("change", () => {
      const [key, dir] = sort.value.split(":");
      sortKey = sort.value === "default" ? null : key;
      sortDir = Number(dir) || 1;
      render();
      scroll.scrollTop = 0;
    });
    inStock.addEventListener("change", render);

    const backdrop = el(
      "div",
      {
        class: "backdrop",
        onclick: (e) => {
          if (e.target === backdrop) close();
        },
      },
      el(
        "div",
        { class: "dialog", role: "dialog", "aria-modal": "true", "aria-label": t.title },
        el(
          "header",
          {},
          el("h2", {}, t.title),
          el("button", { class: "close", type: "button", "aria-label": t.close, onclick: close }, "×")
        ),
        el("div", { class: "toolbar" }, search, sort, el("label", {}, inStock, t.inStockOnly)),
        summary,
        scroll,
        el("div", { class: "hint" }, t.hint)
      )
    );
    shadow.append(backdrop);

    render();
    document.body.append(host);
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKey, true);

    const current = tbody.querySelector("tr.current");
    if (current) current.scrollIntoView({ block: "center" });
    if (window.matchMedia("(pointer: fine)").matches) search.focus();
  }

  function createButton() {
    // Inline style: page CSS would override a :host rule.
    const host = el("div", { id: BUTTON_HOST_ID, style: "display:block;margin:12px 0 0;padding:0" });
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.append(el("style", {}, BUTTON_CSS));
    const button = el("button", { type: "button", onclick: openModal });
    button.innerHTML =
      '<svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="14" height="2" rx="1"/><rect x="1" y="12" width="14" height="2" rx="1"/></svg>';
    button.append(t.button);
    shadow.append(button);
    return host;
  }

  function ensureButton() {
    // The mobile page carries a hidden duplicate of the block; use the visible one.
    const container = Array.from(document.querySelectorAll(CONTAINER_SELECTOR)).find(
      (node) => node.getClientRects().length > 0
    );
    if (!container) return;
    const existing = document.getElementById(BUTTON_HOST_ID);
    if (existing && existing.previousElementSibling === container) return;
    const matrix = loadMatrix();
    if (!matrix || matrix.rows.length < 2) return;
    if (existing) existing.remove();
    container.after(createButton());
  }

  ensureButton();

  // eBay re-renders the variation block when a selection changes; put the
  // button back if it gets dropped.
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      ensureButton();
    });
  }).observe(document.body, { childList: true, subtree: true });
})();

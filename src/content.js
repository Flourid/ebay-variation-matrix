(function () {
  "use strict";

  const { extractMsku, buildMatrix } = globalThis.EbayVariationMatrix;

  const CONTAINER_SELECTOR = '[data-testid="x-msku-evo"], .x-msku-evo';
  const BUTTON_HOST_ID = "evm-button-host";
  const MODAL_HOST_ID = "evm-modal-host";
  const ISSUE_URL = "https://github.com/Flourid/ebay-variation-matrix/issues/new";
  // eBay's website is light-only, so the dialog stays light to match it.
  // Set to true to follow the system dark mode again (see DARK_CSS).
  const FOLLOW_SYSTEM_DARK_MODE = false;

  const STRINGS = {
    en: {
      button: "Show all variations",
      title: "All variations",
      filter: "Filter…",
      inStockOnly: "In stock only",
      price: "Price",
      availability: "Availability",
      outOfStock: "Out of stock",
      current: "selected",
      inCart: "In cart",
      inCartCount: (n) => `${n} in cart`,
      filterColumn: (label) => `Filter ${label}`,
      contains: "Contains… (e.g. pla petg)",
      selectAll: "Select all",
      clearFilter: "Clear filter",
      clearAll: "Clear all filters",
      noValues: "No values",
      broken: "Couldn't read the variations – report a problem",
      close: "Close",
      count: (shown, total) => `${shown} of ${total} variations`,
      noMatch: "No variations match.",
      hint: "Tap a row to select that variation.",
    },
    de: {
      button: "Alle Varianten anzeigen",
      title: "Alle Varianten",
      filter: "Filtern…",
      inStockOnly: "Nur verfügbare",
      price: "Preis",
      availability: "Verfügbarkeit",
      outOfStock: "Nicht vorrätig",
      current: "ausgewählt",
      inCart: "Im Warenkorb",
      inCartCount: (n) => `${n} im Warenkorb`,
      filterColumn: (label) => `${label} filtern`,
      contains: "Enthält… (z. B. pla petg)",
      selectAll: "Alle auswählen",
      clearFilter: "Filter löschen",
      clearAll: "Alle Filter löschen",
      noValues: "Keine Werte",
      broken: "Varianten konnten nicht gelesen werden – Problem melden",
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
    a {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      min-height: 40px; padding: 8px 16px; box-sizing: border-box;
      font: inherit; font-size: 13px; color: #707070; text-align: center;
      border: 1px dashed #c7c7c7; border-radius: 20px;
    }
    a:hover { color: #3665f3; border-color: #3665f3; }
    a:focus-visible { outline: 2px solid #3665f3; outline-offset: 2px; }
  `;

  const DARK_CSS = `
    @media (prefers-color-scheme: dark) {
      .backdrop {
        --bg: #1c1c1e; --fg: #f2f2f2; --muted: #a0a0a0; --line: #3a3a3c;
        --hover: #2a2a2d; --accent: #7a9cff; --accent-bg: #23304f; --ok: #4cc77f;
      }
    }
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
    ${FOLLOW_SYSTEM_DARK_MODE ? DARK_CSS : ""}
    .dialog {
      background: var(--bg); width: min(960px, calc(100vw - 32px));
      max-height: calc(100vh - 48px); border-radius: 16px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      position: relative;
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
    .toolbar input[type="search"] {
      font: inherit; color: var(--fg); background: var(--bg);
      border: 1px solid var(--line); border-radius: 8px;
      min-height: 36px; padding: 6px 10px; flex: 1 1 200px; min-width: 0;
    }
    .toolbar label { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .link {
      font: inherit; font-size: 13px; color: var(--accent); background: none;
      border: 0; padding: 4px 0; cursor: pointer;
    }
    .link:hover { text-decoration: underline; }
    .summary { padding: 8px 16px; color: var(--muted); font-size: 13px; }
    .scroll {
      overflow: auto; flex: 1; min-height: 0;
      -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    }
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
    th .filter-btn { margin-left: 6px; padding: 2px; color: var(--muted); opacity: 0.6; }
    th .filter-btn:hover, th .filter-btn.active { color: var(--accent); opacity: 1; }
    .filter-btn svg { width: 12px; height: 12px; display: block; }

    /* Column filter popup, positioned inside the dialog under its header. */
    .fp {
      position: absolute; z-index: 3; display: flex; flex-direction: column; gap: 8px;
      padding: 12px; background: var(--bg); border: 1px solid var(--line); border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    .fp-title { font-weight: 700; }
    .fp input[type="search"] {
      font: inherit; color: var(--fg); background: var(--bg); width: 100%;
      border: 1px solid var(--line); border-radius: 8px; min-height: 36px; padding: 6px 10px;
    }
    .fp label { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; }
    .fp-all { font-weight: 700; border-bottom: 1px solid var(--line); padding-bottom: 8px !important; }
    .fp-list { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; }
    .fp-val { flex: 1; }
    .fp-count { color: var(--muted); font-size: 12px; }
    .fp-empty { color: var(--muted); padding: 4px 0; }
    .fp .link { align-self: flex-start; }
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
    .cart {
      display: inline-flex; align-items: center; gap: 4px; padding: 0 6px;
      border: 1px solid var(--accent); border-radius: 8px;
      font-size: 11px; font-weight: 700; color: var(--accent); white-space: nowrap;
      vertical-align: middle;
    }
    .cart svg { width: 12px; height: 12px; }
    .empty { padding: 24px 16px; text-align: center; color: var(--muted); }
    .hint { padding: 8px 16px 12px; color: var(--muted); font-size: 12px; border-top: 1px solid var(--line); }

    /* Phones: full-screen sheet, rows become stacked cards. */
    @media (max-width: 640px) {
      .backdrop { align-items: stretch; }
      .dialog { width: 100vw; max-height: none; height: 100%; border-radius: 0; }
      /* Column headers become a scrollable row of sort chips above the cards. */
      table, thead, tbody, tbody tr, td { display: block; }
      /* The shadow covers a thin strip at the top edge where rows scrolled under
         the sticky header show through when it lands on a fractional pixel. */
      thead { position: sticky; top: 0; z-index: 1; background: var(--bg); box-shadow: 0 -4px 0 var(--bg); }
      thead tr {
        display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
        padding: 8px 16px; border-bottom: 1px solid var(--line);
      }
      th {
        position: static; display: flex; align-items: center; padding: 0;
        border: 1px solid var(--line); border-radius: 16px;
      }
      th.cart-col { display: none; }
      th button { padding: 6px 12px; font-size: 13px; white-space: nowrap; }
      th button.sort:not(:last-child) { padding-right: 4px; }
      th .filter-btn { margin: 0; padding: 6px 12px 6px 6px; }
      th[aria-sort] { border-color: var(--accent); background: var(--accent-bg); }
      th[aria-sort] button.sort { color: var(--accent); }
      tbody tr {
        display: grid; grid-template-columns: 1fr auto; gap: 2px 12px;
        padding: 10px 16px; border-bottom: 1px solid var(--line);
      }
      td { padding: 0; border: 0; }
      td.attr { grid-column: 1; }
      td.attr .lbl { color: var(--muted); }
      td.attr .lbl::after { content: ": "; }
      td.price-cell { grid-column: 2; grid-row: 1; text-align: right; }
      td.avail-cell { grid-column: 1; }
      td.cart-cell { grid-column: 2; text-align: right; }
      tr.current td:first-child { box-shadow: none; }
      tr.current { box-shadow: inset 3px 0 0 var(--accent); }
    }
    @media (min-width: 641px) {
      td.attr .lbl { display: none; }
      /* Availability and badge columns shrink to their content so the badge
         sits right after the availability text; spare width goes to the attributes. */
      .avail-col, .cart-col { width: 1%; white-space: nowrap; }
      td.cart-col { padding-left: 0; }
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

  // Filter and sort survive closing the dialog and the reload after picking a
  // variation. Kept per tab and per item, since columns differ between items.
  const itemId = (/\/itm\/(?:[^/]+\/)?(\d+)/.exec(location.pathname) || [])[1] || location.pathname;
  const STATE_KEY = `evm-state:${itemId}`;

  function loadState() {
    try {
      return JSON.parse(sessionStorage.getItem(STATE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage blocked or full: the dialog still works, it just won't remember.
    }
  }

  function cartBadge() {
    const badge = el("span", { class: "cart" });
    badge.innerHTML =
      '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1.5h2l1.6 8.5h8l1.4-6H4"/><circle cx="6" cy="13.5" r="1.2"/><circle cx="12" cy="13.5" r="1.2"/></svg>';
    badge.append(t.inCart);
    return badge;
  }

  function filterIcon() {
    const span = el("span", { "aria-hidden": "true" });
    span.innerHTML =
      '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 2h13a.5.5 0 0 1 .4.8L10 9v5l-4-2V9L1.1 2.8a.5.5 0 0 1 .4-.8Z"/></svg>';
    return span;
  }

  function words(text) {
    return text.toLowerCase().split(/[\s,]+/).filter(Boolean);
  }

  // Column text filters keep values that contain any of the words.
  function matchesAny(value, text) {
    const list = words(text);
    if (!list.length) return true;
    const v = (value || "").toLowerCase();
    return list.some((w) => v.includes(w));
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
        filterIndex: i,
        value: (r) => r.values[i] || null,
        compare: (a, b) => collator.compare(a, b),
      })),
      { key: "price", label: t.price, num: true, value: (r) => r.price, compare: (a, b) => a - b },
      { key: "stock", label: t.availability, cls: "avail-col", value: stockCount, compare: (a, b) => a - b },
    ];
    const saved = loadState();
    let sortKey = columns.some((c) => c.key === saved.sortKey) ? saved.sortKey : null;
    let sortDir = saved.sortDir === -1 ? -1 : 1;

    // Column filters: index -> { text, excluded: Set of unticked values }.
    const filters = new Map();
    for (const [k, f] of Object.entries(saved.filters || {})) {
      const i = Number(k);
      if (!(i >= 0 && i < matrix.labels.length) || !f) continue;
      filters.set(i, {
        text: typeof f.text === "string" ? f.text : "",
        excluded: new Set(Array.isArray(f.excluded) ? f.excluded : []),
      });
    }
    const isActive = (f) => !!f && (words(f.text).length > 0 || f.excluded.size > 0);

    // Popup lists values in the same order as eBay's dropdowns.
    const valueOrder = matrix.labels.map((_, i) => {
      const order = new Map();
      for (const r of matrix.rows) {
        if (!order.has(r.values[i]) || r.order[i] < order.get(r.values[i])) order.set(r.values[i], r.order[i]);
      }
      return order;
    });

    // Whether a row passes search, stock and column filters (except column `skip`).
    function passes(r, skip) {
      if (inStock.checked && r.outOfStock) return false;
      const terms = words(search.value);
      if (terms.length) {
        const hay = r.values.join(" ").toLowerCase();
        if (!terms.every((term) => hay.includes(term))) return false;
      }
      for (const [i, f] of filters) {
        if (i === skip) continue;
        const v = r.values[i];
        if (f.excluded.has(v) || !matchesAny(v, f.text)) return false;
      }
      return true;
    }

    const search = el("input", { type: "search", placeholder: t.filter, "aria-label": t.filter });
    // Own column so the badges line up after the widest availability text.
    const hasCart = matrix.rows.some((r) => r.inCart);
    const headers = columns.map((c) =>
      el(
        "th",
        { scope: "col", class: [c.num && "num", c.cls].filter(Boolean).join(" ") || false },
        el(
          "button",
          { type: "button", class: "sort", onclick: () => toggleSort(c.key) },
          c.label,
          el("span", { class: "arrow", "aria-hidden": "true" })
        ),
        c.filterIndex != null
          ? el(
              "button",
              {
                type: "button",
                class: "filter-btn",
                title: t.filterColumn(c.label),
                "aria-label": t.filterColumn(c.label),
                "aria-haspopup": "dialog",
                onclick: (e) => toggleFilter(c.filterIndex, e.currentTarget),
              },
              filterIcon()
            )
          : null
      )
    );
    // Right-click (long-press on phones) on a property header opens its filter.
    columns.forEach((c, i) => {
      if (c.filterIndex == null) return;
      headers[i].addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openFilter(c.filterIndex, headers[i]);
      });
    });

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
    const clearAll = el(
      "button",
      {
        type: "button",
        class: "link",
        hidden: true,
        onclick: () => {
          filters.clear();
          closeFilter();
          render();
        },
      },
      t.clearAll
    );
    search.value = typeof saved.search === "string" ? saved.search : "";
    inStock.checked = saved.inStock === true;
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
          el("tr", {}, ...headers, hasCart ? el("th", { scope: "col", class: "cart-col", "aria-label": t.inCart }) : null)
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
        if (popup) closeFilter();
        else close();
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
      let rows = matrix.rows.filter((r) => passes(r, -1));
      rows = sortRows(rows);

      const savedFilters = {};
      for (const [i, f] of filters) {
        if (isActive(f)) savedFilters[i] = { text: f.text, excluded: [...f.excluded] };
      }
      saveState({ search: search.value, inStock: inStock.checked, sortKey, sortDir, filters: savedFilters });

      columns.forEach((c, i) => {
        const btn = headers[i].querySelector(".filter-btn");
        if (btn) btn.classList.toggle("active", isActive(filters.get(c.filterIndex)));
      });
      clearAll.hidden = !Object.keys(savedFilters).length;
      if (popup) fillFilter();

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
      const inCartCount = matrix.rows.filter((r) => r.inCart).length;
      if (inCartCount) text += ` · ${t.inCartCount(inCartCount)}`;
      summary.textContent = text;

      tbody.replaceChildren();
      if (!rows.length) {
        tbody.append(
          el("tr", {}, el("td", { class: "empty", colspan: columns.length + (hasCart ? 1 : 0) }, t.noMatch))
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
          row.price != null && row.currency ? formatMoney(row.price, row.currency) : row.priceText || "–";
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
          el("td", { class: "avail-cell avail-col" }, el("span", { class: "avail" }, availText || "")),
          hasCart ? el("td", { class: "cart-cell cart-col" }, row.inCart ? cartBadge() : null) : null
        );
        frag.append(tr);
      }
      tbody.append(frag);
    }

    let popup = null;

    function toggleFilter(i, anchor) {
      if (popup && popup.index === i) closeFilter();
      else openFilter(i, anchor);
    }

    function closeFilter() {
      if (!popup) return;
      popup.panel.remove();
      popup = null;
    }

    function openFilter(i, anchor) {
      closeFilter();
      if (!filters.has(i)) filters.set(i, { text: "", excluded: new Set() });
      const f = filters.get(i);
      const label = matrix.labels[i];

      const input = el("input", { type: "search", placeholder: t.contains, "aria-label": t.contains });
      input.value = f.text;
      input.addEventListener("input", () => {
        f.text = input.value;
        render();
      });
      const all = el("input", { type: "checkbox" });
      all.addEventListener("change", () => {
        for (const v of popup.visible) {
          if (all.checked) f.excluded.delete(v);
          else f.excluded.add(v);
        }
        render();
      });
      const list = el("div", { class: "fp-list", role: "group", "aria-label": label });
      const panel = el(
        "div",
        { class: "fp", role: "dialog", "aria-label": t.filterColumn(label) },
        el("div", { class: "fp-title" }, label),
        input,
        el("label", { class: "fp-all" }, all, t.selectAll),
        list,
        el(
          "button",
          {
            type: "button",
            class: "link",
            onclick: () => {
              filters.delete(i);
              closeFilter();
              render();
            },
          },
          t.clearFilter
        )
      );
      popup = { index: i, filter: f, panel, list, all, visible: [] };
      dialog.append(panel);

      const d = dialog.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      // Phones get a full-width panel; desktop a small one under the header.
      const width = matchMedia("(max-width: 640px)").matches ? d.width - 32 : Math.min(280, d.width - 32);
      const left = Math.max(16, Math.min(a.left - d.left, d.width - width - 16));
      const top = a.bottom - d.top + 4;
      panel.style.cssText = `left:${left}px;top:${top}px;width:${width}px;max-height:${Math.max(180, d.height - top - 16)}px`;

      fillFilter();
      if (window.matchMedia("(pointer: fine)").matches) input.focus();
    }

    // (Re)builds the popup's value list from rows that pass the other filters.
    function fillFilter() {
      const { index: i, filter: f, list, all } = popup;
      const counts = new Map();
      for (const r of matrix.rows) {
        if (passes(r, i)) counts.set(r.values[i], (counts.get(r.values[i]) || 0) + 1);
      }
      // Unticked values stay listed so they can be ticked again.
      for (const v of f.excluded) if (!counts.has(v)) counts.set(v, 0);
      const order = valueOrder[i];
      const visible = [...counts.keys()]
        .filter((v) => matchesAny(v, f.text))
        .sort((a, b) => (order.has(a) ? order.get(a) : Infinity) - (order.has(b) ? order.get(b) : Infinity));
      popup.visible = visible;

      const focused = shadow.activeElement && shadow.activeElement.getAttribute("data-value");
      list.replaceChildren(
        ...(visible.length
          ? visible.map((v) => {
              const box = el("input", { type: "checkbox", "data-value": v });
              box.checked = !f.excluded.has(v);
              box.addEventListener("change", () => {
                if (box.checked) f.excluded.delete(v);
                else f.excluded.add(v);
                render();
              });
              return el(
                "label",
                {},
                box,
                el("span", { class: "fp-val" }, v),
                el("span", { class: "fp-count" }, String(counts.get(v)))
              );
            })
          : [el("div", { class: "fp-empty" }, t.noValues)])
      );
      if (focused != null) {
        const again = [...list.querySelectorAll("input")].find((b) => b.getAttribute("data-value") === focused);
        if (again) again.focus();
      }

      const ticked = visible.filter((v) => !f.excluded.has(v)).length;
      all.checked = visible.length > 0 && ticked === visible.length;
      all.indeterminate = ticked > 0 && ticked < visible.length;
    }

    search.addEventListener("input", render);
    inStock.addEventListener("change", render);

    const dialog = el(
      "div",
      { class: "dialog", role: "dialog", "aria-modal": "true", "aria-label": t.title },
      el(
        "header",
        {},
        el("h2", {}, t.title),
        el("button", { class: "close", type: "button", "aria-label": t.close, onclick: close }, "×")
      ),
      el("div", { class: "toolbar" }, search, el("label", {}, inStock, t.inStockOnly), clearAll),
      summary,
      scroll,
      el("div", { class: "hint" }, t.hint)
    );
    // A click outside the filter popup closes it (its own header button toggles it).
    dialog.addEventListener("pointerdown", (e) => {
      if (popup && !popup.panel.contains(e.target) && !e.target.closest(".filter-btn")) closeFilter();
    });
    const backdrop = el(
      "div",
      {
        class: "backdrop",
        onclick: (e) => {
          if (e.target === backdrop) close();
        },
      },
      dialog
    );
    shadow.append(backdrop);

    render();
    document.body.append(host);
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", onKey, true);

    const current = tbody.querySelector("tr.current");
    if (current) {
      const offset = current.getBoundingClientRect().top - scroll.getBoundingClientRect().top;
      scroll.scrollTop += offset - (scroll.clientHeight - current.offsetHeight) / 2;
    }
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

  function addonVersion() {
    try {
      return browser.runtime.getManifest().version;
    } catch (e) {
      return "";
    }
  }

  // Prefilled issue for when eBay changed its page and the data can't be read.
  // Only the listing's address is included, without tracking parameters.
  function reportUrl() {
    const page = new URL(location.href);
    const variation = page.searchParams.get("var");
    const listing = page.origin + page.pathname + (variation ? `?var=${encodeURIComponent(variation)}` : "");
    const ua = navigator.userAgent;
    const params = new URLSearchParams({
      template: "broken-listing.yml",
      title: `Not working: ${page.hostname}${page.pathname}`,
      listing,
      what: "The add-on showed \"Couldn't read the variations\" on this listing.",
      platform: /Android/.test(ua) ? "Firefox for Android" : "Firefox (desktop)",
      firefox: (/Firefox\/([\d.]+)/.exec(ua) || [])[1] || "",
      version: addonVersion(),
    });
    return `${ISSUE_URL}?${params}`;
  }

  function createReportLink() {
    const host = el("div", { id: BUTTON_HOST_ID, style: "display:block;margin:12px 0 0;padding:0" });
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.append(el("style", {}, BUTTON_CSS));
    // The address is built on click so it carries the variation picked by then.
    const link = el("a", { href: ISSUE_URL, target: "_blank", rel: "noopener noreferrer" }, t.broken);
    const refresh = () => link.setAttribute("href", reportUrl());
    link.addEventListener("pointerdown", refresh);
    link.addEventListener("focus", refresh);
    shadow.append(link);
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
    // A single variation needs no list; no data at all means eBay changed its page.
    if (matrix && matrix.rows.length === 1) return;
    if (existing) existing.remove();
    container.after(matrix && matrix.rows.length ? createButton() : createReportLink());
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

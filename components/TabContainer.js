import styles from "./TabContainer.css" with { type: "css" };

let uid = 0;

class TabContainer extends HTMLElement {
  static get observedAttributes() {
    return ["selected", "group"];
  }

  #shadow;
  #observer = null;
  #bodyObserver = null;
  #connected = false;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
    // Los paneles [data-tab] viven en el Light DOM: compartir la hoja a nivel
    // document (una sola vez) para que les apliquen las reglas base de panel
    if (!document.adoptedStyleSheets.includes(styles)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
    }
  }

  connectedCallback() {
    this.#connected = true;
    this.#render();
    this.#upgradeButtons();
    this.#upgradePanels();

    const initial = this.getAttribute("selected") ?? this.#firstEnabled()?.getAttribute("value") ?? "";
    if (initial) this.#apply(initial, { emit: false });

    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeyDown);

    this.#observer = new MutationObserver(() => {
      this.#upgradeButtons();
      this.#upgradePanels();
      // Si el botón seleccionado desapareció, caer al primero disponible
      if (!this.#findButton(this.#current())) this.#apply(this.#firstEnabled()?.getAttribute("value") ?? "", { emit: false });
      else this.#apply(this.#current(), { emit: false });
    });
    this.#observer.observe(this, { childList: true, subtree: false });

    // Solo cuando los paneles viven fuera: reaccionar si se añaden/quitan [data-tab]
    if (this.#internalPanels().length === 0 && document.body) {
      this.#bodyObserver = new MutationObserver(() => {
        this.#upgradePanels();
        this.#apply(this.#current(), { emit: false });
      });
      this.#bodyObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  disconnectedCallback() {
    this.#connected = false;
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("keydown", this.#onKeyDown);
    this.#observer?.disconnect();
    this.#observer = null;
    this.#bodyObserver?.disconnect();
    this.#bodyObserver = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.#connected || oldVal === newVal) return;
    if (name === "selected" && newVal !== null) this.#apply(newVal, { emit: false });
    if (name === "group") {
      this.#upgradePanels();
      this.#apply(this.#current(), { emit: false });
    }
  }

  // ——— public API ———
  get value() {
    return this.#current();
  }

  set value(id) {
    this.select(id);
  }

  get selected() {
    return this.#current();
  }

  set selected(id) {
    this.select(id);
  }

  select(id) {
    this.#apply(id, { emit: true });
  }

  // ——— internals ———
  #render() {
    this.#shadow.innerHTML = /* html */`
      <div class="tablist" role="tablist">
        <slot></slot>
      </div>
    `;
  }

  #buttons() {
    return [...this.querySelectorAll("button[value]")];
  }

  #firstEnabled() {
    return this.#buttons().find((b) => !b.disabled && !b.hasAttribute("disabled"));
  }

  #findButton(value) {
    return this.#buttons().find((b) => b.getAttribute("value") === value);
  }

  #current() {
    return this.getAttribute("selected") ?? "";
  }

  #group() {
    return this.getAttribute("group") ?? "";
  }

  #internalPanels() {
    return [...this.querySelectorAll("[data-tab]")];
  }

  #getPanels() {
    const internal = this.#internalPanels();
    if (internal.length > 0) return internal;

    const group = this.#group();
    if (group) {
      return [...document.querySelectorAll(`[data-tab][data-group="${CSS.escape(group)}"]`)];
    }

    // Proximidad: hermanos siguientes hasta el próximo tab-container
    const panels = [];
    let el = this.nextElementSibling;
    while (el && el.tagName.toLowerCase() !== "tab-container") {
      if (el.hasAttribute("data-tab")) panels.push(el);
      panels.push(...el.querySelectorAll(":scope [data-tab]"));
      el = el.nextElementSibling;
    }
    if (panels.length > 0) return panels;

    // Fallback: [data-tab] sin grupo que no estén dentro de otro tab-container
    return [...document.querySelectorAll("[data-tab]:not([data-group])")].filter(
      (p) => !p.closest("tab-container") || p.closest("tab-container") === this
    );
  }

  #ensureId(el, prefix) {
    if (!el.id) el.id = `${prefix}-${++uid}`;
    return el.id;
  }

  #upgradeButtons() {
    const current = this.#current() || this.#firstEnabled()?.getAttribute("value") || "";
    for (const btn of this.#buttons()) {
      btn.setAttribute("role", "tab");
      const selected = btn.getAttribute("value") === current;
      btn.setAttribute("aria-selected", String(selected));
      // Todas las tabs paran con TAB (sin roving tabindex); las disabled
      // nativas no son enfocables aunque tengan tabindex 0
      btn.tabIndex = 0;
      this.#ensureId(btn, "tab-btn");
    }
  }

  #upgradePanels() {
    for (const panel of this.#getPanels()) {
      panel.setAttribute("role", "tabpanel");
      const btn = this.#findButton(panel.getAttribute("data-tab"));
      if (btn) panel.setAttribute("aria-labelledby", this.#ensureId(btn, "tab-btn"));
    }
  }

  #apply(value, { emit } = {}) {
    const target = this.#findButton(value) ?? this.#firstEnabled();
    if (!target) return;
    const id = target.getAttribute("value");
    const previous = this.#current();

    if (this.getAttribute("selected") !== id) this.setAttribute("selected", id);

    for (const btn of this.#buttons()) {
      const selected = btn === target;
      btn.setAttribute("aria-selected", String(selected));
      btn.tabIndex = 0;
    }

    for (const panel of this.#getPanels()) {
      panel.hidden = panel.getAttribute("data-tab") !== id;
    }

    if (emit && previous !== id) {
      this.dispatchEvent(
        new CustomEvent("tab-change", {
          bubbles: true,
          composed: true,
          detail: { value: id, previous },
        })
      );
    }
  }

  #onClick = (e) => {
    const btn = e.target.closest("button[value]");
    if (!btn || !this.contains(btn)) return;
    if (btn.disabled || btn.hasAttribute("disabled")) return;
    btn.focus();
    this.#apply(btn.getAttribute("value"), { emit: true });
  };

  #onKeyDown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const enabled = this.#buttons().filter((b) => !b.disabled && !b.hasAttribute("disabled"));
    if (enabled.length < 2) return;
    e.preventDefault();
    const current = this.#findButton(this.#current());
    let idx = enabled.indexOf(current);
    if (e.key === "ArrowRight") idx = (idx + 1) % enabled.length;
    if (e.key === "ArrowLeft") idx = (idx - 1 + enabled.length) % enabled.length;
    if (e.key === "Home") idx = 0;
    if (e.key === "End") idx = enabled.length - 1;
    enabled[idx].focus();
    this.#apply(enabled[idx].getAttribute("value"), { emit: true });
  };
}

customElements.define("tab-container", TabContainer);

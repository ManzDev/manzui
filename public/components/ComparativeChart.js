import styles from "./ComparativeChart.css" with { type: "css" };

class ComparativeChart extends HTMLElement {
  #shadow;
  #observer = null;

  static get observedAttributes() {
    return ["label", "unit", "sort"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#render();
    this.#observer = new MutationObserver(() => this.#render());
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "selected"] });
  }

  disconnectedCallback() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }

  attributeChangedCallback() {
    if (this.#shadow) {
      this.#render();
    }
  }

  #parseItems() {
    const nodes = [...this.querySelectorAll("data")];
    let items = nodes.map((el) => {
      const raw = (el.getAttribute("value") ?? el.value ?? "").trim();
      const numeric = parseFloat(raw.replace(",", "."));
      return {
        label: (el.textContent || "").trim(),
        raw,
        value: Number.isFinite(numeric) ? numeric : 0,
        selected: el.hasAttribute("selected"),
      };
    });

    if (this.hasAttribute("sort")) {
      const dir = (this.getAttribute("sort") || "").toLowerCase();
      const asc = dir === "asc" || dir === "ascending";
      items = [...items].sort((a, b) => asc ? a.value - b.value : b.value - a.value);
    }

    return items;
  }

  #niceScale(max) {
    const COUNT = 5;
    if (max <= 0) {
      return { maxRounded: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
    }
    const maxRounded = max;
    const ticks = Array.from({ length: COUNT }, (_, i) => {
      const v = (max * i) / (COUNT - 1);
      return Number(v.toFixed(10));
    });
    return { maxRounded, ticks };
  }

  #formatTick(v, unit) {
    let s = String(v);
    if (s.includes(".")) {
      s = s.replace(/\.?0+$/, "");
    }
    return unit ? `${s}${unit}` : s;
  }

  #escape(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  #render() {
    const label = this.getAttribute("label") || "";
    const unit = this.getAttribute("unit") || "";
    const items = this.#parseItems();

    if (items.length === 0) {
      this.#shadow.innerHTML = `<div class="notice">Añade al menos un &lt;data value="..."&gt; dentro de &lt;comparative-chart&gt;.</div>`;
      return;
    }

    const max = Math.max(...items.map((i) => i.value), 0);
    const { maxRounded, ticks } = this.#niceScale(max);

    const scaleTicks = ticks.map((v) => {
      const txt = this.#escape(this.#formatTick(v, unit));
      return `<span class="tick">${txt}</span>`;
    }).join("");

    const gridLines = ticks.map(() => `<span class="grid-line"></span>`).join("");

    const rows = items.map((item) => {
      const pct = maxRounded > 0 ? (item.value / maxRounded) * 100 : 0;
      const display = unit ? `${item.raw} ${unit}` : item.raw;
      const safeLabel = this.#escape(item.label);
      const safeDisplay = this.#escape(display);
      const sel = item.selected ? ` selected` : ``;
      const part = item.selected ? ` part="selected"` : ``;
      return /* html */`
        <div class="row${sel}"${part}>
          <span class="row-label${sel}"${part} title="${safeLabel}">${safeLabel}</span>
          <div class="bar-cell">
            <span class="bar${sel}"${part} style="--w: ${pct}%; width: ${pct}%"></span>
            <span class="row-value${sel}"${part}>${safeDisplay}</span>
          </div>
        </div>
      `;
    }).join("");

    this.#shadow.innerHTML = /* html */`
      <div class="chart" role="img" aria-label="${this.#escape(label) || "Gráfico comparativo"}">
        ${label ? `<header class="header"><span class="title">${this.#escape(label)}</span></header>` : ""}
        <div class="body">
          <div class="rows-wrapper">
            <div class="grid" aria-hidden="true">${gridLines}</div>
            <div class="rows">${rows}</div>
          </div>
          <div class="scale-row" aria-hidden="true">
            <div class="spacer"></div>
            <div class="scale">${scaleTicks}</div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("comparative-chart", ComparativeChart);

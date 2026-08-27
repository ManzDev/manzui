import styles from "./ImageValuesViewer.css" with { type: "css" };

class ImageValuesViewer extends HTMLElement {
  #shadow;
  #path;
  #ref;
  #prefix;
  #min;
  #max;
  #images;
  #currentIndex;
  #optionsMode;

  static get observedAttributes() {
    return ["path", "ref", "prefix", "min", "max"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
    this.#images = [];
    this.#currentIndex = 0;
    this.#optionsMode = false;
  }

  connectedCallback() {
    this.#applyAttributes();
    this.#buildImages();
    this.#render();
  }

  attributeChangedCallback() {
    this.#applyAttributes();
    this.#buildImages();
    if (this.#shadow.querySelector(".container")) {
      this.#render();
    }
  }

  #applyAttributes() {
    this.#path = this.getAttribute("path") || "/assets/images/";
    this.#ref = this.getAttribute("ref") || "";
    this.#prefix = this.getAttribute("prefix");
    this.#min = parseFloat(this.getAttribute("min")) || 0;
    this.#max = parseFloat(this.getAttribute("max")) || 1;
  }

  #buildImages() {
    this.#images = [];

    const path = this.#path.endsWith("/") ? this.#path : `${this.#path}/`;

    if (!this.#prefix) {
      this.#images = this.#getOptionsImages(path);
      if (this.#images.length > 0) {
        this.#optionsMode = true;
        return;
      }
    }

    this.#optionsMode = false;
    const step = 0.10;

    for (let s = this.#min; s <= this.#max + 0.001; s += step) {
      const strength = Math.round(s * 100) / 100;
      const filename = `${this.#prefix ?? ""}${strength.toFixed(2)}.avif`;
      this.#images.push({
        src: `${path}${filename}`,
        strength,
        caption: strength.toFixed(2),
      });
    }
  }

  #getOptionsImages(basePath) {
    const template = this.querySelector("template");
    if (!template) return [];

    return [...template.content.querySelectorAll("option")]
      .map((option) => {
        const value = option.getAttribute("value")?.trim();
        if (!value) return null;

        const isAbsolute = /^(https?:)?\/\/|^\/|^data:/i.test(value);
        const src = isAbsolute ? value : `${basePath}${value}`;
        const fallback = value.split("/").pop().replace(/\.[^.]+$/, "");
        const label = option.textContent.trim();

        return {
          src,
          caption: label || fallback,
        };
      })
      .filter(Boolean);
  }

  #getClosestIndex(strength) {
    if (this.#images.length === 0) return 0;

    let closest = 0;
    let minDiff = Infinity;

    this.#images.forEach((img, i) => {
      const diff = Math.abs(img.strength - strength);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });

    return closest;
  }

  #render() {
    if (this.#images.length === 0) {
      this.#shadow.innerHTML = "";
      return;
    }

    const current = this.#images[this.#currentIndex];
    const refPath = `${this.#path}/${this.#ref}`;
    const rangeMin = this.#optionsMode ? 0 : this.#min;
    const rangeMax = this.#optionsMode ? this.#images.length - 1 : this.#max;
    const rangeStep = this.#optionsMode ? 1 : "0.01";
    const rangeValue = this.#optionsMode ? this.#currentIndex : current.strength;
    const getAlt = (img) =>
      this.#optionsMode ? img.caption : `Imagen con strength ${img.strength}`;

    this.#shadow.innerHTML = /* html */`
      <div class="container">
        <div class="image-wrapper">
          <img src="${current.src}" alt="${getAlt(current)}" />
          <div class="strength-badge">${current.caption}</div>
          ${this.#ref ? `<img class="ref-img" src="${refPath}" alt="Imagen de referencia" />` : ""}
        </div>
        <div class="controls">
          ${this.#optionsMode ? "" : "<label>strength</label>"}
          <div class="range-wrapper">
            <input type="range"
              min="${rangeMin}"
              max="${rangeMax}"
              step="${rangeStep}"
              value="${rangeValue}" />
            <span class="value">${current.caption}</span>
          </div>
        </div>
        <div class="ticks">
          ${this.#images.map((img, i) => `
            <span class="tick${i === this.#currentIndex ? " active" : ""}"
                  data-index="${i}">
              ${img.caption}
            </span>
          `).join("")}
        </div>
      </div>
    `;

    const range = this.#shadow.querySelector("input[type='range']");
    const valueEl = this.#shadow.querySelector(".value");
    const imgEl = this.#shadow.querySelector("img");
    const badgeEl = this.#shadow.querySelector(".strength-badge");
    const ticks = this.#shadow.querySelectorAll(".tick");

    const updateImage = (index) => {
      this.#currentIndex = index;
      const img = this.#images[index];
      imgEl.src = img.src;
      imgEl.alt = getAlt(img);
      badgeEl.textContent = img.caption;
      valueEl.textContent = img.caption;
      range.value = this.#optionsMode ? index : img.strength;

      ticks.forEach((t, i) => {
        t.classList.toggle("active", i === index);
      });
    };

    range.addEventListener("input", (e) => {
      const idx = this.#optionsMode
        ? parseInt(e.target.value, 10)
        : this.#getClosestIndex(parseFloat(e.target.value));
      updateImage(idx);
    });

    ticks.forEach((tick) => {
      tick.addEventListener("click", () => {
        const idx = parseInt(tick.dataset.index, 10);
        updateImage(idx);
      });
    });
  }
}

customElements.define("image-values-viewer", ImageValuesViewer);

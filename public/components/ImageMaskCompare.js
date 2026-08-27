import styles from "./ImageMaskCompare.css" with { type: "css" };

class ImageMaskCompare extends HTMLElement {
  #shadow;
  #path;
  #base;
  #mask;
  #result;
  #clip;
  #opacity;

  static get observedAttributes() {
    return ["path", "base", "mask", "result"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
    this.#clip = 50;
    this.#opacity = 0;
  }

  connectedCallback() {
    this.#applyAttributes();
    this.#render();
  }

  attributeChangedCallback() {
    this.#applyAttributes();
    if (this.#shadow.querySelector(".container")) {
      this.#render();
    }
  }

  #applyAttributes() {
    this.#path = this.getAttribute("path") || "/assets/images/";
    this.#base = this.getAttribute("base") || "";
    this.#mask = this.getAttribute("mask") || "";
    this.#result = this.getAttribute("result") || "";
  }

  #render() {
    const path = this.#path.endsWith("/") ? this.#path : `${this.#path}/`;

    this.#shadow.innerHTML = /* html */`
      <div class="container">
        <div class="image-wrapper">
          <img class="img-base" src="${path}${this.#base}" alt="Imagen original" />
          <img class="img-result" src="${path}${this.#result}" alt="Imagen generada" />
          <img class="img-mask" src="${path}${this.#mask}" alt="Máscara" />
        </div>
        <div class="controls">
          <label>resultado</label>
          <div class="range-wrapper">
            <input type="range" class="range-clip" min="0" max="100" step="1" value="${this.#clip}" />
            <span class="value">${this.#clip}%</span>
          </div>
        </div>
        <div class="controls controls-divider">
          <label>máscara</label>
          <div class="range-wrapper">
            <input type="range" class="range-mask" min="0" max="100" step="1" value="${this.#opacity}" />
            <span class="value">${this.#opacity}%</span>
          </div>
        </div>
      </div>
    `;

    const rangeClip = this.#shadow.querySelector(".range-clip");
    const rangeMask = this.#shadow.querySelector(".range-mask");
    const valueClip = rangeClip.parentElement.querySelector(".value");
    const valueMask = rangeMask.parentElement.querySelector(".value");
    const resultImg = this.#shadow.querySelector(".img-result");
    const maskImg = this.#shadow.querySelector(".img-mask");

    rangeClip.addEventListener("input", (e) => {
      this.#clip = parseInt(e.target.value, 10);
      const right = 100 - this.#clip;
      resultImg.style.clipPath = `inset(0 ${right}% 0 0)`;
      valueClip.textContent = `${this.#clip}%`;
    });

    rangeMask.addEventListener("input", (e) => {
      this.#opacity = parseInt(e.target.value, 10);
      maskImg.style.opacity = this.#opacity / 100;
      valueMask.textContent = `${this.#opacity}%`;
    });
  }
}

customElements.define("image-mask-compare", ImageMaskCompare);

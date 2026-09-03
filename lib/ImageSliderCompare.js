import styles from "./ImageSliderCompare.css" with { type: "css" };

class ImageSliderCompare extends HTMLElement {
  static MIN_ZOOM = 1;
  static MAX_ZOOM = 1.8;
  static ZOOM_STEP = 0.2;

  #shadow;
  #images = [];
  #pos = 50;
  #zoom = 1;
  #indexA = 0;
  #indexB = 1;
  #dragging = false;
  #slider;
  #stage;
  #topImg;
  #divider;
  #handle;
  #posBadge;
  #zoomBadge;
  #clipA;
  #clipB;

  static get observedAttributes() {
    return ["pos", "zoom"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#loadImages();
    this.#render();
  }

  attributeChangedCallback(name) {
    if (name === "pos") {
      this.#applyPos();
    } else if (name === "zoom") {
      this.#applyZoom();
    }
  }

  #parsePos() {
    const raw = this.getAttribute("pos");
    if (raw == null) return 50;
    const v = parseFloat(raw);
    if (isNaN(v)) return 50;
    return Math.min(100, Math.max(0, v));
  }

  #parseZoom() {
    const raw = this.getAttribute("zoom");
    if (raw == null) return 100;
    const v = parseFloat(raw);
    if (isNaN(v)) return 100;
    return Math.min(ImageSliderCompare.MAX_ZOOM * 100, Math.max(ImageSliderCompare.MIN_ZOOM * 100, v));
  }

  #loadImages() {
    this.#images = [...this.querySelectorAll("img")].map((img, i) => ({
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || `Imagen ${i + 1}`,
    }));
    this.#pos = this.#parsePos();
    this.#zoom = this.#parseZoom() / 100;
    this.#indexA = 0;
    this.#indexB = this.#images.length > 1 ? 1 : 0;
  }

  #render() {
    if (this.#images.length < 2) {
      this.#shadow.innerHTML = `<div class="notice">Se necesitan al menos 2 imágenes dentro de &lt;image-slider-compare&gt;.</div>`;
      return;
    }

    const a = this.#images[this.#indexA];
    const b = this.#images[this.#indexB];
    const multi = this.#images.length > 2;

    const options = (selected) =>
      this.#images
        .map((img, i) => `<option value="${i}"${i === selected ? " selected" : ""}>${img.alt}</option>`)
        .join("");

    this.#shadow.innerHTML = /* html */`
      <div class="container">
        <div class="slider">
          <div class="stage">
            <img class="img-layer img-a" src="${a.src}" alt="${a.alt}" />
            <img class="img-layer img-b" src="${b.src}" alt="${b.alt}" />
          </div>
          <div class="divider">
            <div class="handle" tabindex="0" role="slider"
                 aria-valuemin="0" aria-valuemax="100"
                 aria-valuenow="${Math.round(this.#pos)}"
                 aria-label="Divisor de comparación">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 7l-4 5 4 5" />
                <path d="M15 7l4 5-4 5" />
              </svg>
            </div>
          </div>
          <div class="clip clip-a"><span class="badge badge-a">${a.alt}</span></div>
          <div class="clip clip-b"><span class="badge badge-b">${b.alt}</span></div>
          <div class="pos-badge">${Math.round(this.#pos)}%</div>
          <div class="zoom-badge">${Math.round(this.#zoom * 100)}%</div>
        </div>
        ${multi ? `
        <div class="selectors">
          <label>Base (A)
            <select class="sel-a">${options(this.#indexA)}</select>
          </label>
          <label>Comparar (B)
            <select class="sel-b">${options(this.#indexB)}</select>
          </label>
        </div>` : ""}
      </div>
    `;

    this.#slider = this.#shadow.querySelector(".slider");
    this.#stage = this.#shadow.querySelector(".stage");
    this.#topImg = this.#shadow.querySelector(".img-b");
    this.#divider = this.#shadow.querySelector(".divider");
    this.#handle = this.#shadow.querySelector(".handle");
    this.#posBadge = this.#shadow.querySelector(".pos-badge");
    this.#zoomBadge = this.#shadow.querySelector(".zoom-badge");
    this.#clipA = this.#shadow.querySelector(".clip-a");
    this.#clipB = this.#shadow.querySelector(".clip-b");

    this.#slider.addEventListener("pointerdown", (e) => this.#onDown(e));
    this.#slider.addEventListener("pointermove", (e) => this.#onMove(e));
    this.#slider.addEventListener("pointerup", (e) => this.#onUp(e));
    this.#slider.addEventListener("pointercancel", (e) => this.#onUp(e));
    this.#slider.addEventListener("wheel", (e) => this.#onWheel(e), { passive: false });
    this.#handle.addEventListener("keydown", (e) => this.#onKey(e));

    if (multi) {
      this.#shadow.querySelector(".sel-a").addEventListener("change", (e) => {
        const newA = parseInt(e.target.value, 10);
        // Evita que A y B sean la misma imagen: si coinciden, la anterior A
        // pasa a ser B (intercambio).
        if (newA === this.#indexB) this.#indexB = this.#indexA;
        this.#indexA = newA;
        this.#render();
      });
      this.#shadow.querySelector(".sel-b").addEventListener("change", (e) => {
        const newB = parseInt(e.target.value, 10);
        if (newB === this.#indexA) this.#indexA = this.#indexB;
        this.#indexB = newB;
        this.#render();
      });
    }

    this.#applyPos();
    this.#applyZoom();
  }

  #applyPos() {
    const pct = this.#pos;
    // El divisor vive en el espacio de pantalla (0% = borde izquierdo,
    // 100% = borde derecho). La imagen B se recorta en su propio sistema de
    // coordenadas locales (que está escalado por el zoom), de modo que su
    // borde coincida exactamente con el divisor sea cual sea el zoom.
    const clipStart = 50 + (pct - 50) / this.#zoom;
    if (this.#topImg) this.#topImg.style.clipPath = `inset(0 0 0 ${clipStart}%)`;
    if (this.#divider) this.#divider.style.left = `${pct}%`;
    if (this.#posBadge) this.#posBadge.textContent = `${Math.round(pct)}%`;
    if (this.#handle) this.#handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    // Cada badge vive dentro de su mitad: al mover el divisor, su contenedor
    // se estrecha y el badge queda progresivamente oculto con su imagen.
    if (this.#clipA) this.#clipA.style.width = `${pct}%`;
    if (this.#clipB) this.#clipB.style.width = `${100 - pct}%`;
  }

  #applyZoom() {
    if (this.#stage) this.#stage.style.transform = `scale(${this.#zoom})`;
    if (this.#zoomBadge) this.#zoomBadge.textContent = `${Math.round(this.#zoom * 100)}%`;
  }

  #updateFromEvent(e) {
    const rect = this.#slider.getBoundingClientRect();
    const W = rect.width;
    if (W === 0) return;
    const x = e.clientX - rect.left;
    let pct = (x / W) * 100;
    pct = Math.min(100, Math.max(0, pct));
    this.#pos = pct;
    this.#applyPos();
  }

  #onDown(e) {
    this.#dragging = true;
    try { this.#slider.setPointerCapture(e.pointerId); } catch { }
    this.#updateFromEvent(e);
  }

  #onMove(e) {
    if (this.#dragging) this.#updateFromEvent(e);
  }

  #onUp(e) {
    this.#dragging = false;
    try { this.#slider.releasePointerCapture(e.pointerId); } catch { }
  }

  #onWheel(e) {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    this.#zoom = Math.min(
      ImageSliderCompare.MAX_ZOOM,
      Math.max(ImageSliderCompare.MIN_ZOOM, this.#zoom + dir * ImageSliderCompare.ZOOM_STEP)
    );
    this.#applyZoom();
  }

  #onKey(e) {
    let handled = true;
    switch (e.key) {
      case "ArrowLeft": this.#pos = Math.max(0, this.#pos - 1); break;
      case "ArrowRight": this.#pos = Math.min(100, this.#pos + 1); break;
      case "Home": this.#pos = 0; break;
      case "End": this.#pos = 100; break;
      default: handled = false;
    }
    if (handled) {
      e.preventDefault();
      this.#applyPos();
    }
  }
}

customElements.define("image-slider-compare", ImageSliderCompare);

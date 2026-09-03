import styles from "./ImagePins.css" with { type: "css" };

let uid = 0;

class ImagePins extends HTMLElement {
  #shadow;
  #pins = [];
  #observer = null;
  #connected = false;

  static get observedAttributes() {
    return ["src", "alt"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#connected = true;
    this.#loadPins();
    this.#render();
    this.#shadow.addEventListener("click", this.#onClick);
    this.#shadow.addEventListener("keydown", this.#onKeyDown);
    this.#shadow.addEventListener("focusout", this.#onFocusOut);

    this.#observer = new MutationObserver(() => {
      this.#loadPins();
      this.#render();
    });
    this.#observer.observe(this, { childList: true, subtree: false, attributes: false });
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#shadow.removeEventListener("click", this.#onClick);
    this.#shadow.removeEventListener("keydown", this.#onKeyDown);
    this.#shadow.removeEventListener("focusout", this.#onFocusOut);
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback() {
    if (!this.#connected) return;
    this.#render();
  }

  #parsePercent(value, fallback) {
    if (value == null || value === "") return fallback;
    const num = parseFloat(String(value).replace("%", "").trim());
    if (Number.isNaN(num)) return fallback;
    return Math.min(100, Math.max(0, num));
  }

  #loadPins() {
    this.#pins = [...this.querySelectorAll("info-pin")].map((pin, i) => ({
      x: this.#parsePercent(pin.getAttribute("x"), 50),
      y: this.#parsePercent(pin.getAttribute("y"), 50),
      color: (pin.getAttribute("color") || "#ffd54a").trim(),
      html: pin.innerHTML.trim(),
      id: `image-pins-tip-${++uid}-${i}`,
    }));
  }

  #resolveImage() {
    const srcAttr = this.getAttribute("src")?.trim();
    const altAttr = this.getAttribute("alt") ?? "";
    if (srcAttr) return { src: srcAttr, alt: altAttr };
    const innerImg = this.querySelector("img");
    if (innerImg) {
      return {
        src: innerImg.getAttribute("src") || "",
        alt: innerImg.getAttribute("alt") ?? "",
      };
    }
    return { src: "", alt: altAttr };
  }

  #render() {
    const { src, alt } = this.#resolveImage();

    if (!src) {
      this.#shadow.innerHTML = `<div class="notice">Se necesita un atributo <code>src</code> en &lt;image-pins&gt;.</div>`;
      return;
    }

    const pins = this.#pins.map((pin) => {
      const below = pin.y < 30 ? ` data-pos="below"` : "";
      const label = pin.html.replace(/<[^>]*>/g, "").trim().slice(0, 60) || `Punto en ${pin.x}%, ${pin.y}%`;
      return /* html */`
        <div class="pin" style="left: ${pin.x}%; top: ${pin.y}%; --pin-color: ${pin.color};"${below}>
          <button type="button" class="pin-btn" aria-describedby="${pin.id}" aria-expanded="false" aria-label="Mostrar información: ${label.replace(/"/g, "&quot;")}">
            <span class="dot" aria-hidden="true"></span>
          </button>
          <div class="tooltip" role="tooltip" id="${pin.id}">${pin.html}</div>
        </div>
      `;
    }).join("");

    this.#shadow.innerHTML = /* html */`
      <div class="container">
        <img src="${src}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy" />
        ${pins}
      </div>
    `;
  }

  #closeAll(except = null) {
    for (const pin of this.#shadow.querySelectorAll(".pin.open")) {
      if (pin !== except) {
        pin.classList.remove("open");
        pin.querySelector(".pin-btn")?.setAttribute("aria-expanded", "false");
      }
    }
  }

  #onClick = (e) => {
    // Click dentro del tooltip (p. ej. un enlace): dejar actuar por defecto sin cerrar
    if (e.target.closest?.(".tooltip")) return;
    const btn = e.target.closest(".pin-btn");
    if (!btn || !this.#shadow.contains(btn)) {
      this.#closeAll();
      return;
    }
    const pin = btn.closest(".pin");
    const willOpen = !pin.classList.contains("open");
    this.#closeAll(pin);
    pin.classList.toggle("open", willOpen);
    btn.setAttribute("aria-expanded", String(willOpen));
  };

  #onKeyDown = (e) => {
    if (e.key === "Escape") {
      const open = this.#shadow.querySelector(".pin.open");
      this.#closeAll();
      if (open && e.target.closest?.(".pin")) {
        open.querySelector(".pin-btn")?.focus();
      }
    }
  };

  #onFocusOut = (e) => {
    const pin = e.target.closest?.(".pin");
    if (!pin) return;
    if (!pin.contains(e.relatedTarget)) {
      pin.classList.remove("open");
      pin.querySelector(".pin-btn")?.setAttribute("aria-expanded", "false");
    }
  };
}

customElements.define("image-pins", ImagePins);

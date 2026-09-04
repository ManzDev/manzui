import styles from "./InputKnob.css" with { type: "css" };

const ARC_DEG = 270;
const START_DEG = 135;
const DRAG_PX = 200;

class InputKnob extends HTMLElement {
  static get observedAttributes() {
    return ["min", "max", "value", "step", "size", "color", "gap", "disabled"];
  }

  #shadow;
  #min = 0;
  #max = 100;
  #value = 50;
  #step = 1;
  #reflecting = false;
  #dragging = false;
  #moved = false;
  #startX = 0;
  #startValue = 0;
  #downX = 0;
  #downY = 0;
  #knob = null;
  #progress = null;
  #thumbWrap = null;
  #label = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#syncFromAttributes();
    this.#render();
    this.#update();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || this.#reflecting) return;
    this.#syncFromAttributes();
    this.#update();
  }

  // ——— public API (range-like) ———
  get value() {
    return this.#value;
  }

  set value(v) {
    this.#commit(Number(v), { emitInput: false, emitChange: false, reflect: true });
  }

  get min() {
    return this.#min;
  }

  set min(v) {
    this.setAttribute("min", String(Number(v)));
  }

  get max() {
    return this.#max;
  }

  set max(v) {
    this.setAttribute("max", String(Number(v)));
  }

  get step() {
    return this.#step;
  }

  set step(v) {
    this.setAttribute("step", String(Number(v)));
  }

  get size() {
    return this.getAttribute("size");
  }

  set size(v) {
    if (v == null) this.removeAttribute("size");
    else this.setAttribute("size", String(v));
  }

  get color() {
    return this.getAttribute("color");
  }

  set color(v) {
    if (v == null) this.removeAttribute("color");
    else this.setAttribute("color", v);
  }

  get gap() {
    return this.getAttribute("gap");
  }

  set gap(v) {
    if (v == null) this.removeAttribute("gap");
    else this.setAttribute("gap", String(v));
  }

  // ——— internals ———
  #parseNum(raw, fallback) {
    if (raw == null) return fallback;
    const v = Number(raw);
    return Number.isFinite(v) ? v : fallback;
  }

  #syncFromAttributes() {
    let min = this.#parseNum(this.getAttribute("min"), 0);
    let max = this.#parseNum(this.getAttribute("max"), 100);
    if (max < min) [min, max] = [max, min];
    this.#min = min;
    this.#max = max;
    const step = this.#parseNum(this.getAttribute("step"), 1);
    this.#step = step > 0 ? step : 1;
    this.#value = this.#snap(this.#clamp(this.#parseNum(this.getAttribute("value"), min)));
    this.#applyPresentation();
  }

  #applyPresentation() {
    const size = this.#parseNum(this.getAttribute("size"), NaN);
    if (Number.isFinite(size) && size > 0) {
      this.style.setProperty("--knob-size", `${size}px`);
    } else {
      this.style.removeProperty("--knob-size");
    }
    const color = this.getAttribute("color");
    if (color != null && color.trim() !== "") {
      this.style.setProperty("--knob-color", color.trim());
    } else {
      this.style.removeProperty("--knob-color");
    }
    const gap = this.#parseNum(this.getAttribute("gap"), NaN);
    if (Number.isFinite(gap) && gap >= 0) {
      this.style.setProperty("--knob-gap", `${gap}px`);
    } else {
      this.style.removeProperty("--knob-gap");
    }
  }

  #clamp(v) {
    return Math.min(this.#max, Math.max(this.#min, v));
  }

  #decimals(n) {
    const s = String(n);
    const i = s.indexOf(".");
    return i < 0 ? 0 : s.length - i - 1;
  }

  #snap(v) {
    const { min, max, step } = this;
    if (!Number.isFinite(v)) return min;
    const clamped = Math.min(max, Math.max(min, v));
    const steps = Math.round((clamped - min) / step);
    const precision = Math.max(this.#decimals(step), this.#decimals(min));
    return Number((min + steps * step).toFixed(precision));
  }

  #normalized() {
    if (this.#max === this.#min) return 0;
    return (this.#value - this.#min) / (this.#max - this.#min);
  }

  #valueFromPoint(clientX, clientY) {
    const svg = this.#shadow.querySelector("svg");
    const rect = svg.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    // Gap inferior entre 45º y 135º: fijar al extremo más cercano
    if (deg > 45 && deg < 135) {
      deg = deg < 90 ? 45 : 135;
    }
    if (deg < 45) deg += 360;
    const t = (deg - START_DEG) / ARC_DEG;
    return this.#snap(this.#min + t * (this.#max - this.#min));
  }

  #commit(v, { emitInput = true, emitChange = false, reflect = true } = {}) {
    const next = this.#snap(this.#clamp(Number(v)));
    if (!Number.isFinite(next)) return;
    const changed = next !== this.#value;
    this.#value = next;
    if (reflect) {
      this.#reflecting = true;
      this.setAttribute("value", String(next));
      this.#reflecting = false;
    }
    this.#update();
    if (changed && emitInput) this.#emit("input");
    if (changed && emitChange) this.#emit("change");
  }

  #emit(name) {
    this.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true, detail: { value: this.#value } }),
    );
  }

  #render() {
    this.#shadow.innerHTML = /* html */`
      <div class="knob" role="slider" tabindex="0"
        aria-label="Control giratorio"
        aria-valuemin="${this.#min}" aria-valuemax="${this.#max}"
        aria-valuenow="${this.#value}">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="track" cx="50" cy="50" r="42"
            pathLength="100" stroke-dasharray="75 100"
            transform="rotate(135 50 50)" />
          <circle class="progress" cx="50" cy="50" r="42"
            pathLength="100" stroke-dasharray="75 100"
            transform="rotate(135 50 50)" />
        </svg>
        <div class="thumb-wrap" aria-hidden="true"><span class="thumb"></span></div>
        <div class="face" aria-hidden="true"><span class="value"></span></div>
      </div>
    `;

    this.#knob = this.#shadow.querySelector(".knob");
    this.#progress = this.#shadow.querySelector(".progress");
    this.#thumbWrap = this.#shadow.querySelector(".thumb-wrap");
    this.#label = this.#shadow.querySelector(".value");

    this.#knob.addEventListener("pointerdown", (e) => this.#onDown(e));
    this.#knob.addEventListener("pointermove", (e) => this.#onMove(e));
    this.#knob.addEventListener("pointerup", (e) => this.#onUp(e));
    this.#knob.addEventListener("pointercancel", (e) => this.#onUp(e));
    this.#knob.addEventListener("keydown", (e) => this.#onKey(e));
    this.#knob.addEventListener("wheel", (e) => this.#onWheel(e), { passive: false });
  }

  #update() {
    if (!this.#knob) return;
    const t = this.#normalized();
    const disabled = this.hasAttribute("disabled");
    this.#progress.style.strokeDashoffset = String(75 * (1 - t));
    this.#thumbWrap.style.transform = `rotate(${-135 + ARC_DEG * t}deg)`;
    this.#label.textContent = String(this.#value);
    this.#knob.setAttribute("aria-valuemin", String(this.#min));
    this.#knob.setAttribute("aria-valuemax", String(this.#max));
    this.#knob.setAttribute("aria-valuenow", String(this.#value));
    this.#knob.setAttribute("aria-disabled", String(disabled));
    this.#knob.tabIndex = disabled ? -1 : 0;
  }

  #onDown(e) {
    if (this.hasAttribute("disabled")) return;
    if (e.button !== undefined && e.button !== 0) return;
    this.#dragging = true;
    this.#moved = false;
    this.#startX = e.clientX;
    this.#downX = e.clientX;
    this.#downY = e.clientY;
    this.#startValue = this.#value;
    this.#knob.classList.add("dragging");
    try {
      this.#knob.setPointerCapture(e.pointerId);
    } catch {}
    this.#knob.focus();
    e.preventDefault();
  }

  #onMove(e) {
    if (!this.#dragging) return;
    if (Math.hypot(e.clientX - this.#downX, e.clientY - this.#downY) > 4) {
      this.#moved = true;
    }
    if (!this.#moved) return;
    const range = this.#max - this.#min;
    const fine = e.shiftKey ? 0.1 : 1;
    const delta = ((e.clientX - this.#startX) / DRAG_PX) * range * fine;
    this.#commit(this.#startValue + delta, { emitInput: true, reflect: true });
  }

  #onUp(e) {
    if (!this.#dragging) return;
    this.#dragging = false;
    this.#knob.classList.remove("dragging");
    try {
      this.#knob.releasePointerCapture(e.pointerId);
    } catch {}
    if (!this.#moved) {
      // Click sin arrastre: saltar al ángulo clicado
      this.#commit(this.#valueFromPoint(e.clientX, e.clientY), {
        emitInput: true,
        emitChange: true,
        reflect: true,
      });
    } else {
      this.#emit("change");
    }
  }

  #onKey(e) {
    if (this.hasAttribute("disabled")) return;
    const page = this.#step * 10;
    let next = null;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        next = this.#value + this.#step;
        break;
      case "ArrowDown":
      case "ArrowLeft":
        next = this.#value - this.#step;
        break;
      case "PageUp":
        next = this.#value + page;
        break;
      case "PageDown":
        next = this.#value - page;
        break;
      case "Home":
        next = this.#min;
        break;
      case "End":
        next = this.#max;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.#commit(next, { emitInput: true, emitChange: true, reflect: true });
  }

  #onWheel(e) {
    if (this.hasAttribute("disabled")) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const jump = (e.shiftKey ? this.#step * 10 : this.#step) * dir;
    this.#commit(this.#value + jump, { emitInput: true, emitChange: true, reflect: true });
  }
}

customElements.define("input-knob", InputKnob);

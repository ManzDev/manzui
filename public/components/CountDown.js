import styles from "./CountDown.css" with { type: "css" };

class CountDown extends HTMLElement {
  #shadow;
  #date;
  #interval;
  #remaining;
  #prev = {};

  static get observedAttributes() {
    return ["date"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
    this.#remaining = Infinity;
  }

  connectedCallback() {
    this.#applyAttributes();
    this.#render();
    this.#startTimer();
  }

  disconnectedCallback() {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }

  attributeChangedCallback() {
    this.#applyAttributes();
    this.#startTimer();
  }

  #applyAttributes() {
    const raw = this.getAttribute("date");
    if (raw) {
      this.#date = new Date(raw);
    }
  }

  #startTimer() {
    if (this.#interval) {
      clearInterval(this.#interval);
    }

    const target = this.#date?.getTime() ?? Infinity;
    this.#remaining = (target - Date.now()) / 1000;

    if (this.#remaining <= 0) {
      this.#emitEvent();
      return;
    }

    this.#interval = setInterval(() => {
      this.#remaining = (target - Date.now()) / 1000;

      if (this.#remaining <= 0) {
        clearInterval(this.#interval);
        this.#interval = null;
        this.#emitEvent();
        this.#render();
      } else {
        this.#render();
      }
    }, 1000);
  }

  #emitEvent() {
    this.dispatchEvent(new CustomEvent("countdown-end", {
      detail: { date: this.#date?.toISOString() },
      bubbles: true,
      composed: true,
    }));
  }

  #getTimeComponents() {
    const total = Math.max(0, Math.ceil(this.#remaining));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return { days, hours, minutes, secs };
  }

  #pad2(n) {
    return String(n).padStart(2, "0").split("");
  }

  // value = nuevo dígito, prev = dígito anterior (para la animación de flip)
  #digitCard(value, prev, flip) {
    const cls = flip ? "digit flip" : "digit";
    return /* html */`
      <div class="${cls}">
        <div class="top"><span>${value}</span></div>
        <div class="bottom"><span>${prev}</span></div>
        <div class="flip-top"><span>${prev}</span></div>
        <div class="flip-bottom"><span>${value}</span></div>
      </div>
    `;
  }

  // Alinea los dígitos por la derecha (el menos significativo) para comparar
  #unitCard(label, digits, prevDigits) {
    const len = digits.length;
    let html = "";
    for (let i = 0; i < len; i++) {
      const value = digits[i];
      const pIdx = prevDigits.length - len + i;
      const prev = pIdx >= 0 ? prevDigits[pIdx] : value;
      const flip = prev !== value;
      html += this.#digitCard(value, prev, flip);
    }
    return /* html */`
      <div class="unit">
        <div class="label">${label}</div>
        <div class="digits">${html}</div>
      </div>
    `;
  }

  #render() {
    if (!this.#date || this.#remaining <= 0) {
      this.#shadow.innerHTML = `<div class="expired">Tiempo finalizado</div>`;
      return;
    }

    const t = this.#getTimeComponents();
    const daysStr = String(t.days).split("");
    const hoursStr = String(t.hours).padStart(2, "0").split("");
    const minsStr = this.#pad2(t.minutes);
    const secsStr = this.#pad2(t.secs);

    const prev = this.#prev;
    const nDays = prev.days ? prev.days.split("") : [];
    const nHours = prev.hours ? prev.hours.split("") : [];
    const nMin = prev.minutes ? prev.minutes.split("") : [];
    const nSec = prev.seconds ? prev.seconds.split("") : [];

    this.#prev = {
      days: daysStr.join(""),
      hours: hoursStr.join(""),
      minutes: minsStr.join(""),
      seconds: secsStr.join(""),
    };

    const units = [];
    if (t.days > 0) {
      units.push(this.#unitCard("DÍAS", daysStr, nDays));
    }
    units.push(this.#unitCard("HORAS", hoursStr, nHours));
    units.push(this.#unitCard("MIN", minsStr, nMin));
    units.push(this.#unitCard("SEG", secsStr, nSec));

    this.#shadow.innerHTML = `<div class="flip-clock">${units.join("")}</div>`;
  }
}

customElements.define("count-down", CountDown);

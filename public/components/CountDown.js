import styles from "./CountDown.css" with { type: "css" };

class CountDown extends HTMLElement {
  #shadow;
  #date;
  #interval;
  #remaining;

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

    const now = Date.now();
    const target = this.#date?.getTime() ?? Infinity;
    this.#remaining = (target - now) / 1000;

    if (this.#remaining <= 0) {
      this.#emitEvent();
      return;
    }

    this.#interval = setInterval(() => {
      this.#remaining -= 1;

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

  #formatTime(seconds) {
    const total = Math.ceil(seconds);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
  }

  #render() {
    if (!this.#date || this.#remaining <= 0) {
      this.#shadow.innerHTML = `<div class="countdown expired">Tiempo finalizado</div>`;
      return;
    }

    this.#shadow.innerHTML = `<div class="countdown">${this.#formatTime(this.#remaining)}</div>`;
  }
}

customElements.define("count-down", CountDown);

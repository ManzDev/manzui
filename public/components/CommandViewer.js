import styles from "./CommandViewer.css" with { type: "css" };

class CommandViewer extends HTMLElement {
  #shadow;
  #title = "";
  #prompt = "$";
  #start = 0;
  #steps = [];
  #current = 0;
  #typingToken = 0;

  static get observedAttributes() {
    return ["label", "prompt", "start"];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#applyAttributes();
    this.#loadSteps();
    this.#current = Math.min(this.#start, Math.max(0, this.#steps.length - 1));
    this.#render();
  }

  attributeChangedCallback() {
    this.#applyAttributes();
    if (this.#shadow.querySelector(".command-viewer")) {
      this.#loadSteps();
      this.#current = Math.min(this.#current, Math.max(0, this.#steps.length - 1));
      this.#render();
    }
  }

  #applyAttributes() {
    this.#title = this.getAttribute("label") || "";
    const prompt = this.getAttribute("prompt");
    this.#prompt = prompt === null ? "$" : prompt;
    const start = parseInt(this.getAttribute("start"), 10);
    this.#start = Number.isFinite(start) && start > 0 ? start : 0;
  }

  #loadSteps() {
    this.#steps = [...this.querySelectorAll(":scope > nav")].map((nav) => {
      const code = nav.querySelector("code");
      const samp = nav.querySelector("samp");
      return {
        command: code ? code.textContent.trim() : "",
        output: samp ? samp.textContent.trim() : "",
        subtitle: nav.getAttribute("label") || "",
      };
    });
  }

  #goTo(index) {
    if (this.#steps.length === 0) return;
    this.#current = Math.min(this.#steps.length - 1, Math.max(0, index));
    this.#render();
    this.#emitChange();
  }

  #emitChange() {
    this.dispatchEvent(new CustomEvent("command-step-change", {
      detail: { index: this.#current, total: this.#steps.length },
      bubbles: true,
      composed: true,
    }));
  }

  #render() {
    if (this.#steps.length === 0) {
      this.#shadow.innerHTML = `<div class="notice">Añade al menos un &lt;nav&gt; con un &lt;code&gt; dentro de &lt;command-viewer&gt;.</div>`;
      return;
    }

    const step = this.#steps[this.#current];
    const total = this.#steps.length;
    const showPrompt = this.#prompt !== "";

    const dots = this.#steps
      .map((_, i) => `<button class="dot${i === this.#current ? " active" : ""}" data-index="${i}" aria-label="Ir al paso ${i + 1}"></button>`)
      .join("");

    this.#shadow.innerHTML = /* html */`
      <div class="command-viewer" tabindex="0" role="group" aria-label="${this.#title || "Visor de comandos"}">
        <header class="header">
          <div class="heading">
            <span class="title">${this.#title}</span>
            ${step.subtitle ? `<span class="subtitle">${step.subtitle}</span>` : ""}
          </div>
          <span class="counter">${this.#current + 1} de ${total}</span>
        </header>
        <div class="body">
          <div class="command">
            ${showPrompt ? `<span class="prompt">${this.#prompt}</span>` : ""}
            <code class="cmd"></code>
            <button class="copy" type="button" aria-label="Copiar comando">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          ${step.output ? `<samp class="output"></samp>` : ""}
        </div>
        <footer class="controls">
          <button class="nav prev" type="button" aria-label="Paso anterior">◀</button>
          <div class="dots">${dots}</div>
          <button class="nav next" type="button" aria-label="Paso siguiente">▶</button>
        </footer>
      </div>
    `;

    const prev = this.#shadow.querySelector(".prev");
    const next = this.#shadow.querySelector(".next");
    const copy = this.#shadow.querySelector(".copy");

    prev.disabled = this.#current === 0;
    next.disabled = this.#current === total - 1;

    prev.addEventListener("click", () => this.#goTo(this.#current - 1));
    next.addEventListener("click", () => this.#goTo(this.#current + 1));

    this.#shadow.querySelectorAll(".dot").forEach((dot) => {
      dot.addEventListener("click", () => this.#goTo(parseInt(dot.dataset.index, 10)));
    });

    copy.addEventListener("click", () => this.#copy(step.command, copy));

    this.#shadow.querySelector(".command-viewer").addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.#goTo(this.#current - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.#goTo(this.#current + 1);
      }
    });

    this.#animateStep();
  }

  async #animateStep() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = this.#steps[this.#current];
    const cmdEl = this.#shadow.querySelector(".cmd");
    const outEl = this.#shadow.querySelector(".output");
    const token = ++this.#typingToken;

    if (reduce) {
      if (cmdEl) cmdEl.textContent = step.command;
      if (outEl) outEl.textContent = step.output;
      return;
    }

    if (cmdEl) {
      cmdEl.classList.add("typing");
      await this.#type(cmdEl, step.command, 10, 45, token);
      cmdEl.classList.remove("typing");
    }
    if (outEl && token === this.#typingToken) {
      await this.#pause(450, token);
      if (token !== this.#typingToken) return;
      await this.#revealLines(outEl, step.output, token);
    }
  }

  #pause(ms, token) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (token !== this.#typingToken) return resolve();
        resolve();
      }, ms);
    });
  }

  #revealLines(element, text, token) {
    return new Promise((resolve) => {
      const lines = text.split("\n");
      let i = 0;
      element.textContent = "";
      const tick = () => {
        if (token !== this.#typingToken) return resolve();
        if (i >= lines.length) return resolve();
        element.textContent += (i === 0 ? "" : "\n") + lines[i++];
        setTimeout(tick, 35 + Math.random() * 45);
      };
      tick();
    });
  }

  #type(element, text, min, max, token) {
    return new Promise((resolve) => {
      let i = 0;
      element.textContent = "";
      const tick = () => {
        if (token !== this.#typingToken) return resolve();
        if (i >= text.length) return resolve();
        element.textContent += text[i++];
        const delay = min + Math.random() * (max - min);
        setTimeout(tick, delay);
      };
      tick();
    });
  }

  async #copy(text, button) {
    const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    try {
      await navigator.clipboard.writeText(text);
      button.innerHTML = checkIcon;
      button.classList.add("copied");
      setTimeout(() => {
        button.innerHTML = copyIcon;
        button.classList.remove("copied");
      }, 1500);
    } catch {
      button.innerHTML = checkIcon;
      setTimeout(() => (button.innerHTML = copyIcon), 1500);
    }
  }
}

customElements.define("command-viewer", CommandViewer);

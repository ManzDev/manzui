import styles from "./InputOTP.css" with { type: "css" };

class InputOTP extends HTMLElement {
  static formAssociated = true;
  static get observedAttributes() {
    return ["length", "type", "separator", "disabled", "placeholder", "value", "invalid", "mask"];
  }

  #shadow;
  #internals = null;
  #inputs = [];
  #length = 4;
  #type = "numeric";
  #separator = "-";
  #placeholder = "";
  #mask = false;
  #hasExplicitLength = false;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
    if (typeof this.attachInternals === "function") {
      this.#internals = this.attachInternals();
    }
  }

  connectedCallback() {
    this.#applyAttributes({ inferLength: true });
    this.#render();
    // hidrata desde atributo value si existe
    if (this.hasAttribute("value")) {
      this.#syncValueFromAttribute(this.getAttribute("value"));
    }
    this.#syncDisabled();
    this.#syncInvalid();
    // autofocus support
    if (this.hasAttribute("autofocus")) {
      queueMicrotask(() => this.focus());
    }
  }

  disconnectedCallback() {
    // listeners se limpian al destruir shadow
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    const wasRendered = this.#inputs.length > 0;
    this.#applyAttributes({ inferLength: false });

    if (!wasRendered) return;

    switch (name) {
      case "length":
      case "type":
      case "separator":
      case "placeholder":
      case "mask":
        this.#render();
        // rehidratar valor si existía
        if (this.hasAttribute("value")) {
          this.#syncValueFromAttribute(this.getAttribute("value"));
        }
        break;
      case "disabled":
        this.#syncDisabled();
        break;
      case "value":
        this.#syncValueFromAttribute(newVal);
        break;
      case "invalid":
        this.#syncInvalid();
        break;
    }
  }

  // ——— formAssociated callbacks ———
  formResetCallback() {
    this.clear();
  }

  formStateRestoreCallback(state) {
    if (typeof state === "string") this.value = state;
  }

  // ——— public API ———
  get value() {
    return this.#inputs.map((el) => el.value).join("");
  }

  set value(v) {
    const str = v == null ? "" : String(v);
    this.#distribute(str, 0);
    this.#updateFormValue();
    // reflejar atributo sin loop infinito (observedAttributes)
    if (this.getAttribute("value") !== str) {
      if (str === "") this.removeAttribute("value");
      else this.setAttribute("value", str);
    }
  }

  get length() {
    return this.#length;
  }

  set length(n) {
    const v = parseInt(n, 10);
    if (!isNaN(v) && v > 0) this.setAttribute("length", String(v));
  }

  get type() {
    return this.#type;
  }

  set type(v) {
    this.setAttribute("type", v);
  }

  get separator() {
    return this.#separator;
  }

  set separator(v) {
    this.setAttribute("separator", v);
  }

  focus() {
    this.#inputs[0]?.focus();
    this.#inputs[0]?.select?.();
  }

  clear() {
    this.#inputs.forEach((el) => (el.value = ""));
    this.#inputs[0]?.focus();
    this.#updateFormValue();
    this.#emit("input");
    this.#emit("change");
  }

  setInvalid(flag = true) {
    if (flag) this.setAttribute("invalid", "");
    else this.removeAttribute("invalid");
  }

  // ——— internals ———
  #applyAttributes({ inferLength } = {}) {
    // length
    const rawLen = this.getAttribute("length");
    if (rawLen !== null) {
      const n = parseInt(rawLen, 10);
      if (!Number.isNaN(n) && n > 0 && n <= 32) {
        this.#length = n;
        this.#hasExplicitLength = true;
      }
    } else if (inferLength) {
      const lightCount = this.querySelectorAll("input").length;
      if (lightCount > 0) {
        this.#length = lightCount;
        this.#hasExplicitLength = false;
      } else {
        this.#hasExplicitLength = false;
      }
    }

    // type
    const t = (this.getAttribute("type") || "numeric").toLowerCase();
    if (["numeric", "alphanumeric", "alpha", "number"].includes(t)) {
      this.#type = t === "number" ? "numeric" : t;
    } else {
      this.#type = "numeric";
    }

    // separator: si no hay atributo, usar "-" por defecto (configurable). Si attribute = "" => sin separador
    if (this.hasAttribute("separator")) {
      this.#separator = this.getAttribute("separator") ?? "";
    } else {
      // default "-" para cumplir la spec configurables; el HTML de ejemplo ya trae " - " pero aquí lo generamos
      this.#separator = "-";
    }

    this.#placeholder = this.getAttribute("placeholder") ?? "";
    this.#mask = this.hasAttribute("mask");
  }

  #render() {
    const prevValues = this.#inputs.map((i) => i.value);
    const prevFocusIndex = this.#inputs.findIndex((el) => el === this.#shadow.activeElement);

    this.#shadow.innerHTML = "";
    this.#inputs = [];

    // limpiar Light DOM (los inputs de ejemplo solo sirven para inferir length)
    // conservarlos no es útil con Shadow; los eliminamos para evitar duplicados en form
    if (this.querySelectorAll("input").length > 0) {
      // vaciamos el contenido light sin disparar MutationObserver externo
      this.innerHTML = "";
    }

    const container = document.createElement("div");
    container.className = "container";
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", "Código de verificación");

    const isNumeric = this.#type === "numeric";
    const inputMode = isNumeric ? "numeric" : "text";
    const pattern = isNumeric ? "[0-9]*" : undefined;

    for (let i = 0; i < this.#length; i++) {
      const input = document.createElement("input");
      input.type = this.#mask ? "password" : "text";
      input.inputMode = inputMode;
      if (pattern) input.pattern = pattern;
      input.autocomplete = "one-time-code";
      input.maxLength = 1;
      input.setAttribute("aria-label", `Dígito ${i + 1} de ${this.#length}`);
      if (this.#placeholder) input.placeholder = this.#placeholder;
      // restaurar valor previo si existía
      if (prevValues[i] !== undefined) input.value = this.#filterValue(prevValues[i]);

      // listeners
      input.addEventListener("input", (e) => this.#onInput(e));
      input.addEventListener("keydown", (e) => this.#onKeyDown(e));
      input.addEventListener("paste", (e) => this.#onPaste(e));
      input.addEventListener("focus", (e) => this.#onFocus(e));
      input.addEventListener("copy", (e) => this.#onCopy(e));
      // click triple? select al hacer click
      input.addEventListener("click", () => input.select());

      this.#inputs.push(input);
      container.appendChild(input);

      if (i < this.#length - 1 && this.#separator !== "") {
        const sep = document.createElement("span");
        sep.className = "separator";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = this.#separator;
        container.appendChild(sep);
      }
    }

    this.#shadow.appendChild(container);
    this.#syncDisabled();

    // restaurar foco si había
    if (prevFocusIndex >= 0 && this.#inputs[prevFocusIndex]) {
      this.#inputs[prevFocusIndex].focus();
      this.#inputs[prevFocusIndex].select();
    }

    this.#updateFormValue();
  }

  #syncDisabled() {
    const disabled = this.hasAttribute("disabled");
    this.#inputs.forEach((el) => (el.disabled = disabled));
    if (this.#internals) {
      if (disabled) this.#internals.states?.add?.("disabled");
      else this.#internals.states?.delete?.("disabled");
    }
  }

  #syncInvalid() {
    // solo para reflejar estilo; no necesita lógica extra
  }

  #syncValueFromAttribute(val) {
    if (val == null) {
      this.#inputs.forEach((el) => (el.value = ""));
      this.#updateFormValue();
      return;
    }
    this.#distribute(String(val), 0);
    this.#updateFormValue();
  }

  #filterValue(ch) {
    if (!ch) return "";
    const c = String(ch)[0] ?? "";
    return this.#isValidChar(c) ? c : "";
  }

  #isValidChar(c) {
    if (!c || c.length !== 1) return false;
    if (this.#type === "numeric") return /^[0-9]$/.test(c);
    if (this.#type === "alpha") return /^[a-zA-Z]$/.test(c);
    return /^[0-9a-zA-Z]$/.test(c); // alphanumeric
  }

  #filterString(str) {
    return [...String(str)].filter((c) => this.#isValidChar(c));
  }

  #distribute(str, startIndex) {
    const chars = this.#filterString(str);
    if (chars.length === 0 && str !== "") {
      // si str contiene solo inválidos, no hacer nada
      // pero si se llamó con "" para limpiar, ya está limpio
      return;
    }
    let idx = Math.max(0, Math.min(startIndex, this.#length - 1));
    for (const c of chars) {
      if (idx >= this.#length) break;
      this.#inputs[idx].value = c;
      idx++;
    }
    // si sobran inputs después del último escrito, no los borramos (paste parcial)
    // foco en el siguiente vacío o último
    const nextEmpty = this.#inputs.findIndex((el) => el.value === "");
    if (nextEmpty !== -1) {
      this.#inputs[nextEmpty].focus();
      this.#inputs[nextEmpty].select();
    } else if (idx < this.#length) {
      this.#inputs[idx]?.focus();
    } else {
      // todos llenos -> focus último
      const last = this.#inputs[this.#length - 1];
      last.focus();
      last.select();
    }
  }

  #onInput(e) {
    const input = e.target;
    const idx = this.#inputs.indexOf(input);
    let val = input.value;

    // autofill / IME puede meter >1 char
    if (val.length > 1) {
      const chars = this.#filterString(val);
      // limpiar actual y distribuir desde idx
      input.value = "";
      this.#distribute(chars.join(""), idx);
      this.#updateFormValue();
      this.#emit("input");
      this.#checkComplete();
      return;
    }

    if (val.length === 1) {
      if (!this.#isValidChar(val)) {
        input.value = "";
        return;
      }
      // válido: avanzar
      if (idx < this.#length - 1) {
        this.#inputs[idx + 1].focus();
        this.#inputs[idx + 1].select();
      } else {
        input.select();
      }
    } else if (val.length === 0) {
      // borrado, no avanzar
    }

    this.#updateFormValue();
    this.#emit("input");
    this.#checkComplete();
  }

  #onKeyDown(e) {
    const input = e.target;
    const idx = this.#inputs.indexOf(input);

    switch (e.key) {
      case "Backspace": {
        if (input.value === "") {
          if (idx > 0) {
            e.preventDefault();
            const prev = this.#inputs[idx - 1];
            prev.value = "";
            prev.focus();
            prev.select();
            this.#updateFormValue();
            this.#emit("input");
          }
        } else {
          // borrar actual y quedarse (comportamiento nativo) pero actualizar form
          // dejamos que input event lo maneje
          queueMicrotask(() => {
            this.#updateFormValue();
            this.#emit("input");
          });
        }
        break;
      }
      case "Delete": {
        if (input.value === "" && idx < this.#length - 1) {
          // opcional: borrar siguiente
        }
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (idx > 0) {
          this.#inputs[idx - 1].focus();
          this.#inputs[idx - 1].select();
        }
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        if (idx < this.#length - 1) {
          this.#inputs[idx + 1].focus();
          this.#inputs[idx + 1].select();
        }
        break;
      }
      case "Home": {
        e.preventDefault();
        this.#inputs[0]?.focus();
        this.#inputs[0]?.select();
        break;
      }
      case "End": {
        e.preventDefault();
        this.#inputs[this.#length - 1]?.focus();
        this.#inputs[this.#length - 1]?.select();
        break;
      }
      default:
        break;
    }
  }

  #onPaste(e) {
    e.preventDefault();
    const input = e.target;
    const idx = this.#inputs.indexOf(input);
    const text = (e.clipboardData || window.clipboardData)?.getData("text") ?? "";
    const chars = this.#filterString(text);
    if (chars.length === 0) return;
    // si el paste viene con separadores ya filtrados, distribuye perfecto
    // limpiar desde idx en adelante si es paste en medio? Solo sobrescribir hacia adelante
    this.#distribute(chars.join(""), idx);
    this.#updateFormValue();
    this.#emit("input");
    this.#emit("change");
    this.#checkComplete();
  }

  #onFocus(e) {
    e.target.select();
  }

  #onCopy(e) {
    // si el usuario copia desde un input pero el value completo existe, copiar todo el OTP
    const full = this.value;
    if (!full) return;
    const sel = window.getSelection()?.toString() ?? "";
    // si ya hay selección no interferir; si no, copiar full
    const inputSel = e.target.value?.substring(e.target.selectionStart ?? 0, e.target.selectionEnd ?? 0);
    if (inputSel && inputSel.length > 0) return;
    e.preventDefault();
    e.clipboardData?.setData("text/plain", full);
  }

  #updateFormValue() {
    const val = this.value;
    if (this.#internals?.setFormValue) {
      this.#internals.setFormValue(val);
    }
    // reflejar value attribute solo si ya está conectado y no estamos en medio de attributeChanged
    // (evita loop, pero mantenemos sincronizado para CSS)
  }

  #emit(name) {
    const detail = { value: this.value, length: this.#length, complete: this.value.length === this.#length && [...this.value].every(Boolean) && this.#inputs.every((i) => i.value !== "") };
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  #checkComplete() {
    const complete = this.#inputs.every((el) => el.value !== "");
    if (complete) {
      this.dispatchEvent(new CustomEvent("otp-complete", { bubbles: true, composed: true, detail: { value: this.value } }));
      this.dispatchEvent(new CustomEvent("otp-filled", { bubbles: true, composed: true, detail: { value: this.value } }));
      this.#emit("change");
      // quitar invalid si estaba
      if (this.hasAttribute("invalid")) this.removeAttribute("invalid");
    }
  }
}

customElements.define("input-otp", InputOTP);

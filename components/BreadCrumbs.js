import styles from "./BreadCrumbs.css" with { type: "css" };

class BreadCrumbs extends HTMLElement {
  static get observedAttributes() {
    return ["separator", "label"];
  }

  #shadow;
  #observer = null;
  #connected = false;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#connected = true;
    this.#render();

    this.#observer = new MutationObserver(() => this.#render());
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["href", "aria-current"],
    });
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.#connected || oldVal === newVal) return;
    if (name === "separator" || name === "label") this.#render();
  }

  #links() {
    return [...this.querySelectorAll(":scope > a")].map((a) => ({
      href: a.getAttribute("href") ?? "",
      text: a.textContent.trim(),
      current: a.hasAttribute("aria-current"),
      currentValue: a.getAttribute("aria-current"),
    }));
  }

  #render() {
    const links = this.#links();

    if (links.length === 0) {
      this.#shadow.innerHTML = `<div class="notice">Añade al menos un &lt;a&gt; dentro de &lt;bread-crumbs&gt;.</div>`;
      return;
    }

    const separator = this.getAttribute("separator") ?? "";
    const label = this.getAttribute("label") || "breadcrumb";
    const hasExplicitCurrent = links.some((link) => link.current);

    const nav = document.createElement("nav");
    nav.className = "breadcrumb";
    nav.setAttribute("aria-label", label);

    const ol = document.createElement("ol");

    links.forEach((link, index) => {
      const isLast = index === links.length - 1;
      const li = document.createElement("li");

      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.text;
      if (link.current) {
        a.setAttribute("aria-current", link.currentValue || "page");
      } else if (isLast && !hasExplicitCurrent) {
        a.setAttribute("aria-current", "page");
      }
      li.appendChild(a);

      if (!isLast && separator !== "") {
        const sep = document.createElement("span");
        sep.className = "separator";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        li.appendChild(sep);
      }

      ol.appendChild(li);
    });

    this.#shadow.innerHTML = "";
    this.#shadow.appendChild(nav);
    nav.appendChild(ol);
  }
}

customElements.define("bread-crumbs", BreadCrumbs);

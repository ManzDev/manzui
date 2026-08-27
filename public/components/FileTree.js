import styles from "./FileTree.css" with { type: "css" };

class FileTree extends HTMLElement {
  #shadow;
  #source = "";

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    if (!this.#source) {
      this.#source = this.textContent;
      this.textContent = "";
    }
    this.#render();
  }

  #expandTabs(line, tabWidth = 4) {
    let result = "";
    let col = 0;
    for (const char of line) {
      if (char === "\t") {
        const spaces = tabWidth - (col % tabWidth);
        result += " ".repeat(spaces);
        col += spaces;
      } else {
        result += char;
        col++;
      }
    }
    return result;
  }

  #parseTree(text) {
    const entries = [];

    for (const raw of text.split("\n")) {
      const line = this.#expandTabs(raw.replace(/\r$/, ""), 4);
      const trimmed = line.trim();
      if (!trimmed || trimmed.includes(",")) continue;

      const connector = line.match(/[├└]/);
      const connectorCol = connector ? connector.index : 0;
      const name = line.replace(/^[\s│├└─]+/, "").trim();

      entries.push({ connectorCol, name, hasConnector: Boolean(connector) });
    }

    const minCol = Math.min(...entries.filter((e) => e.hasConnector).map((e) => e.connectorCol));
    const base = Number.isFinite(minCol) ? minCol : 0;

    return entries.map((entry) => ({
      depth: entry.hasConnector ? Math.round((entry.connectorCol - base) / 4) + 1 : 0,
      name: entry.name,
    }));
  }

  #buildTree(nodes) {
    const root = { name: null, depth: -1, children: [] };
    const stack = [root];

    for (const node of nodes) {
      while (stack.length > 1 && stack[stack.length - 1].depth >= node.depth) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      const item = { ...node, children: [] };
      parent.children.push(item);
      stack.push(item);
    }

    this.#markTypes(root);
    return root;
  }

  #markTypes(node) {
    node.type = node.children.length > 0 || node.name.endsWith("/") ? "folder" : "file";
    node.children.forEach((child) => this.#markTypes(child));
  }

  #renderNode(node) {
    const isFolder = node.type === "folder";
    const hasChildren = node.children.length > 0;
    const isHighlight = node.name.endsWith("*");
    const name = node.name.replace(/\*$/, "").replace(/\/$/, "");
    const rowClass = `${isHighlight ? "highlight" : ""} ${isFolder ? "folder" : "file"}`.trim();

    if (isFolder && hasChildren) {
      const children = node.children.map((child) => this.#renderNode(child)).join("");
      return /* html */`
        <details open class="${isHighlight ? "highlight" : ""}">
          <summary>
            <svg class="icon folder" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span class="label">${name}</span>
          </summary>
          <div class="children">${children}</div>
        </details>
      `;
    }

    return /* html */`
      <div class="row ${rowClass}">
        <svg class="icon ${isFolder ? "folder" : "file"}" viewBox="0 0 20 20" fill="currentColor">
          ${isFolder
            ? `<path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />`
            : `<path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />`}
        </svg>
        <span class="label">${name}</span>
      </div>
    `;
  }

  #render() {
    const nodes = this.#parseTree(this.#source);
    const tree = this.#buildTree(nodes);
    const html = tree.children.map((child) => this.#renderNode(child)).join("");

    this.#shadow.innerHTML = /* html */`
      <div class="file-tree">${html}</div>
    `;
  }
}

customElements.define("file-tree", FileTree);

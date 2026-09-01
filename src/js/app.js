import { components } from "../data/components.js";

// Tabs
const tabCatalog = document.getElementById("tab-catalogo");
const tabSandbox = document.getElementById("tab-sandbox");
const panelCatalog = document.getElementById("panel-catalogo");
const panelSandbox = document.getElementById("panel-sandbox");

function activate(which) {
  const isCat = which === "catalogo";
  tabCatalog.setAttribute("aria-selected", String(isCat));
  tabSandbox.setAttribute("aria-selected", String(!isCat));
  tabCatalog.tabIndex = isCat ? 0 : -1;
  tabSandbox.tabIndex = isCat ? -1 : 0;
  panelCatalog.hidden = !isCat;
  panelSandbox.hidden = isCat;
  // lazy load iframe src only when sandbox activated (if not already)
  const iframe = panelSandbox.querySelector("iframe");
  if (!isCat && iframe && !iframe.src) {
    iframe.src = iframe.dataset.src;
  }
  location.hash = isCat ? "#catalogo" : "#sandbox";
}

tabCatalog.addEventListener("click", () => activate("catalogo"));
tabSandbox.addEventListener("click", () => activate("sandbox"));
tabCatalog.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") { e.preventDefault(); tabSandbox.focus(); activate("sandbox"); }
});
tabSandbox.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); tabCatalog.focus(); activate("catalogo"); }
});

// hash init
const hash = location.hash.replace("#", "");
if (hash === "sandbox") activate("sandbox");
else activate("catalogo");

// Catalog render
const grid = document.getElementById("catalog-grid");
const search = document.getElementById("catalog-search");
const count = document.getElementById("catalog-count");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = "¡Copiado!";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = prev; btn.classList.remove("copied"); }, 1400);
  }).catch(() => {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  });
}

function render(filter = "") {
  const q = filter.trim().toLowerCase();
  const filtered = !q ? components : components.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.tag.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q)
  );
  count.textContent = `${filtered.length} componente${filtered.length !== 1 ? "s" : ""}`;

  grid.innerHTML = filtered.map(c => {
    const attrs = c.attrs.map(a => `<code class="attr">${escapeHtml(a)}</code>`).join(" ");
    const safeExample = escapeHtml(c.example);
    return /* html */`
      <article class="card" data-tag="${c.tag}">
        <header class="card-head">
          <div>
            <h3 class="card-title">${escapeHtml(c.name)} <span class="card-tag">&lt;${escapeHtml(c.tag)}&gt;</span></h3>
            <p class="card-desc">${escapeHtml(c.description)}</p>
          </div>
          <span class="badge">${components.indexOf(c)+1}/${components.length}</span>
        </header>

        <div class="card-meta">
          <span class="meta-label">Atributos:</span> ${attrs || "<span class='muted'>—</span>"}
        </div>

        <div class="card-files">
          <a href="${c.js}" target="_blank" rel="noopener">📄 ${c.js}</a>
          <a href="${c.css}" target="_blank" rel="noopener">🎨 ${c.css}</a>
          <a href="${c.doc}" target="_blank" rel="noopener">📘 .md</a>
        </div>

        <div class="card-actions">
          <button class="btn btn-sm btn-copy" data-copy="${encodeURIComponent(c.example)}" type="button">Copiar HTML</button>
          <button class="btn btn-sm btn-preview" type="button" data-tag="${c.tag}">Ver preview</button>
          <a class="btn btn-sm btn-ghost" href="${c.doc}" target="_blank" rel="noopener">Abrir .md</a>
        </div>

        <div class="code-wrap">
          <pre class="code"><code class="language-html">${safeExample}</code></pre>
        </div>

        <div class="preview" hidden>
          <div class="preview-label">Preview</div>
          <div class="preview-stage"></div>
        </div>
      </article>
    `;
  }).join("");

  // wire copy buttons
  grid.querySelectorAll(".btn-copy").forEach(btn => {
    btn.addEventListener("click", () => {
      const raw = decodeURIComponent(btn.dataset.copy);
      copyText(raw, btn);
    });
  });

  // wire preview toggles (lazy import component)
  grid.querySelectorAll(".btn-preview").forEach(btn => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".card");
      const preview = card.querySelector(".preview");
      const stage = card.querySelector(".preview-stage");
      const tag = btn.dataset.tag;
      const comp = components.find(x => x.tag === tag);

      const isHidden = preview.hidden;
      // close others?
      if (isHidden) {
        // lazy load the component module (public dir => no bundle)
        try {
          await import(/* @vite-ignore */ comp.js);
        } catch (e) {
          stage.innerHTML = `<div class="notice">No se pudo cargar <code>${escapeHtml(comp.js)}</code>: ${escapeHtml(String(e.message||e))}</div>`;
        }
        // render example into stage — we create a wrapper and assign innerHTML
        // Use timeout to allow custom element upgrade
        stage.innerHTML = comp.example;
        preview.hidden = false;
        btn.textContent = "Ocultar preview";
      } else {
        preview.hidden = true;
        stage.innerHTML = "";
        btn.textContent = "Ver preview";
      }
    });
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty">Sin resultados para “${escapeHtml(filter)}”.</div>`;
  }
}

search.addEventListener("input", (e) => render(e.target.value));
render("");

// sandbox iframe controls
const iframe = document.querySelector("#panel-sandbox iframe");
const btnReload = document.getElementById("btn-reload-sandbox");
const btnOpen = document.getElementById("btn-open-sandbox");
if (btnReload && iframe) {
  btnReload.addEventListener("click", () => {
    // force reload
    const src = iframe.src || iframe.dataset.src;
    iframe.src = src;
  });
}

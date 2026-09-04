import MarkdownIt from "markdown-it";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import categoriesConfig from "../data/categories.json";

// Catálogo — fuente de verdad: public/components/*.md (Vite lo resuelve en build/dev)
const TAG_MAP = {
  CommandViewer: "command-viewer",
  ComparativeChart: "comparative-chart",
  CountDown: "count-down",
  FileTree: "file-tree",
  ImageMaskCompare: "image-mask-compare",
  ImagePins: "image-pins",
  ImageSliderCompare: "image-slider-compare",
  ImageValuesViewer: "image-values-viewer",
  InputOTP: "input-otp",
  InputKnob: "input-knob",
  TabContainer: "tab-container",
  BreadCrumbs: "bread-crumbs",
};

// CDN base para el HTML mostrado / copiado / CodePen
const CDN_BASE = "https://unpkg.com/manzui";

// Reescribe src="/components/X.js" o src="/manzui/components/X.js" -> src="https://unpkg.com/manzui/X.js"
function toCdnHtml(html) {
  return html.replace(/src=(["'])(?:\/manzui)?\/components\/([^"']+)\1/g, `src="${CDN_BASE}/$2"`);
}

// Vite glob — descubre automáticamente todos los .md de public/components
const mdModules = import.meta.glob("../../public/components/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const mdIt = new MarkdownIt({ html: true, linkify: true });

function updateCounts(n) {
  document.querySelectorAll("[data-component-count]").forEach((el) => {
    el.textContent = String(n);
  });
}

function deriveTag(name, body) {
  if (TAG_MAP[name]) return TAG_MAP[name];
  const m = body.match(/<([a-z][a-z0-9-]*)\b/);
  if (m) return m[1];
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function renderSidebar() {
  if (!sidebarNav) return;
  const byName = new Map(all.map((c) => [c.name, c]));
  const used = new Set();
  let html = "";
  for (const [cat, names] of Object.entries(categoriesConfig)) {
    const items = names.map((n) => byName.get(n)).filter(Boolean);
    if (items.length === 0) continue;
    items.forEach((c) => used.add(c.name));
    html += `<section class="sidebar-category"><h3 class="sidebar-category-title">${escapeHtml(cat)} <span style="color:var(--muted);font-weight:400">(${items.length})</span></h3><ul class="sidebar-list">${items.map((c) => `
      <li><button class="sidebar-item" data-sidebar-open="${c.name}" aria-label="Abrir ${escapeHtml(c.title)}"><span>${escapeHtml(c.title)}</span><span class="sidebar-item-tag">&lt;${escapeHtml(c.tag)}&gt;</span></button></li>
    `).join("")}</ul></section>`;
  }
  const remaining = all.filter((c) => !used.has(c.name));
  if (remaining.length) {
    html += `<section class="sidebar-category"><h3 class="sidebar-category-title">Otros <span style="color:var(--muted);font-weight:400">(${remaining.length})</span></h3><ul class="sidebar-list">${remaining.map((c) => `
      <li><button class="sidebar-item" data-sidebar-open="${c.name}" aria-label="Abrir ${escapeHtml(c.title)}"><span>${escapeHtml(c.title)}</span><span class="sidebar-item-tag">&lt;${escapeHtml(c.tag)}&gt;</span></button></li>
    `).join("")}</ul></section>`;
  }
  if (!html) html = `<p class="sidebar-empty">No hay componentes</p>`;
  sidebarNav.innerHTML = html;
  if (sidebarCount) sidebarCount.textContent = `${all.length} comps`;
  sidebarNav.querySelectorAll("[data-sidebar-open]").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.sidebarOpen));
  });
  syncSidebarActive();
}

function syncSidebarActive() {
  if (!sidebarNav) return;
  const name = currentDetail?.name;
  sidebarNav.querySelectorAll(".sidebar-item").forEach((btn) => {
    const isActive = btn.dataset.sidebarOpen === name;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
}

const grid = document.getElementById("catalog-grid");
const search = document.getElementById("catalog-search");
const countEl = document.getElementById("catalog-count");
const detail = document.getElementById("detail");
const detailTitle = document.getElementById("detail-title");
const detailDesc = document.getElementById("detail-desc");
const detailCode = document.getElementById("detail-code");
const detailStage = document.getElementById("detail-stage");
const detailCopy = document.getElementById("detail-copy");
const detailCodepen = document.getElementById("detail-codepen");
const detailBack = document.getElementById("detail-back");
const codeDetails = document.getElementById("code-details");
const sidebar = document.getElementById("sidebar");
const sidebarNav = document.getElementById("sidebar-nav");
const sidebarCount = document.getElementById("sidebar-count");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const randomBtn = document.getElementById("random-component");
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseMd(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { title: "", description: "", body: raw.trim(), frontmatter: {} };
  const fm = m[1];
  const body = m[2].trim();
  const title = (fm.match(/^title:\s*(.+)$/m) || ["", ""])[1].trim();
  const description = (fm.match(/^description:\s*(.+)$/m) || ["", ""])[1].trim();
  // Usa markdown-it para procesar el body si contiene markdown (mantiene HTML por html:true)
  // Para este proyecto el body es HTML puro, así que mdIt.render lo deja igual.
  // Lo mantenemos como ejemplo de uso de markdown-it:
  // const rendered = mdIt.render(body);
  return { title, description, body };
}

function ensureComponent(tag, src) {
  if (customElements.get(tag)) return Promise.resolve();
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    return new Promise((resolve) => {
      const check = () => {
        if (customElements.get(tag)) resolve();
        else setTimeout(check, 30);
      };
      check();
      setTimeout(resolve, 2000);
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = src;
    s.onload = () => {
      if (customElements.get(tag)) resolve();
      else setTimeout(() => resolve(), 50);
    };
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

function openSidebar() {
  sidebar?.classList.add("is-open");
  sidebarToggle?.setAttribute("aria-expanded", "true");
  if (sidebarOverlay) sidebarOverlay.hidden = false;
}
function closeSidebar() {
  sidebar?.classList.remove("is-open");
  sidebarToggle?.setAttribute("aria-expanded", "false");
  if (sidebarOverlay) sidebarOverlay.hidden = true;
}

let all = [];
let currentDetail = null;

async function loadAll() {
  const entries = Object.entries(mdModules);
  const results = entries.map(([path, raw]) => {
    const name = path.split("/").pop().replace(/\.md$/, "");
    const { title, description, body } = parseMd(raw);
    const tag = deriveTag(name, body);
    const js = `/manzui/components/${name}.js`;
    const css = `/manzui/components/${name}.css`;
    const doc = `/manzui/components/${name}.md`;
    if (typeof raw !== "string") {
      return { name, tag, title: name, description: `No se pudo cargar ${doc}`, js, css, doc, rawBody: "", error: true };
    }
    return { name, tag, title: title || name, description: description || "", js, css, doc, rawBody: body };
  }).sort((a, b) => a.name.localeCompare(b.name));

  all = results;
  updateCounts(all.length);
  renderSidebar();
  render("");
  handleHash();
  // Por defecto, FileTree seleccionado si no hay hash
  if (!location.hash || location.hash === "#catalogo") {
    const hasComponentHash = location.hash.startsWith("#component-");
    if (!hasComponentHash && !currentDetail) {
      const fallback = all.find((c) => c.name === "FileTree") || all[0];
      if (fallback) openDetail(fallback.name);
    }
  }
}

function render(filter = "") {
  const q = filter.trim().toLowerCase();
  const filtered = !q ? all : all.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.tag.toLowerCase().includes(q) ||
    c.title.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q)
  );
  if (countEl) countEl.textContent = `${filtered.length} componente${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty">Sin resultados para “${escapeHtml(filter)}”.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const safeTitle = escapeHtml(c.title);
    const safeDesc = escapeHtml(c.description);
    const safeTag = escapeHtml(c.tag);
    const selected = currentDetail?.name === c.name ? ' aria-selected="true"' : "";
    return /* html */`
      <article class="card" data-open="${c.name}" tabindex="0" role="button" aria-label="Abrir ${safeTitle}"${selected}>
        <h3 class="card-name">${safeTitle}</h3>
        <div class="card-tag">&lt;${safeTag}&gt;</div>
        <p class="card-desc">${safeDesc}</p>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".card[data-open]").forEach(card => {
    const name = card.dataset.open;
    const open = () => openDetail(name);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

async function openDetail(name) {
  const comp = all.find(c => c.name === name);
  if (!comp) return;
  currentDetail = comp;

  history.pushState(null, "", `#component-${name}`);

  detailTitle.innerHTML = `${escapeHtml(comp.title)} <span>&lt;${escapeHtml(comp.tag)}&gt;</span>`;
  detailDesc.textContent = comp.description;
  detailCode.textContent = toCdnHtml(comp.rawBody);
  detailCode.className = "language-html";
  Prism.highlightElement(detailCode);

  detail.hidden = false;
  if (codeDetails) codeDetails.open = false;
  grid.querySelectorAll(".card").forEach(c => {
    c.setAttribute("aria-selected", c.dataset.open === name ? "true" : "false");
  });
  syncSidebarActive();
  detail.scrollIntoView({ behavior: "smooth", block: "start" });
  if (window.innerWidth <= 860) closeSidebar();

  detailStage.innerHTML = "";
  try {
    await ensureComponent(comp.tag, comp.js);
  } catch (e) {
    detailStage.innerHTML = `<div style="color:var(--muted); font-size:0.85rem">No se pudo cargar <code>${escapeHtml(comp.js)}</code>: ${escapeHtml(String(e.message || e))}</div>`;
    return;
  }
  // Renderiza el HTML del .md usando markdown-it para asegurar compatibilidad con HTML + markdown
  // Como el body es HTML puro, lo inyectamos directamente tras quitar el script src (ya cargado)
  const withoutSrc = comp.rawBody.replace(/<script[^>]*src[^>]*><\/script>\s*/gi, "");
  // Opcional: pasar por markdown-it para normalizar (html:true conserva tags)
  // const rendered = mdIt.render(withoutSrc);
  // detailStage.innerHTML = rendered;
  detailStage.innerHTML = withoutSrc;

  // Ejecuta scripts inline del md (event listeners de ejemplo)
  const inlineScripts = [...comp.rawBody.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1].trim()).filter(Boolean);
  inlineScripts.forEach(code => {
    try {
      // eslint-disable-next-line no-new-func
      new Function(code)();
    } catch { }
  });
}

function closeDetail() {
  currentDetail = null;
  detail.hidden = true;
  grid.querySelectorAll(".card").forEach(c => c.setAttribute("aria-selected", "false"));
  syncSidebarActive();
  detailStage.innerHTML = "";
  history.pushState(null, "", "#catalogo");
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

function handleHash() {
  const h = location.hash;
  const m = h.match(/^#component-(.+)$/);
  if (m && all.length) {
    const name = m[1];
    if (all.some((c) => c.name === name)) openDetail(name);
  }
}

if (sidebarToggle) sidebarToggle.addEventListener("click", () => {
  const isOpen = sidebar?.classList.contains("is-open");
  if (isOpen) closeSidebar(); else openSidebar();
});
if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar?.classList.contains("is-open")) closeSidebar();
});

if (randomBtn) randomBtn.addEventListener("click", () => {
  if (!all.length) return;
  const pool = all.filter((c) => c.name !== currentDetail?.name);
  const candidates = pool.length ? pool : all;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  openDetail(pick.name);
});

if (search) search.addEventListener("input", (e) => {
  render(e.target.value);
  // filtra también sidebar (oculta categorías vacías)
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    renderSidebar();
    return;
  }
  // sidebar filtrado simple: reconstruir con filtrados
  const filteredNames = new Set(all.filter(c => c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)).map(c => c.name));
  if (!sidebarNav) return;
  // reutiliza categorías pero solo con items filtrados
  const byName = new Map(all.map(c => [c.name, c]));
  const used = new Set();
  let html = "";
  for (const [cat, names] of Object.entries(categoriesConfig)) {
    const items = names.map(n => byName.get(n)).filter(c => c && filteredNames.has(c.name));
    if (!items.length) continue;
    items.forEach(c => used.add(c.name));
    html += `<section class="sidebar-category"><h3 class="sidebar-category-title">${escapeHtml(cat)} <span style="color:var(--muted);font-weight:400">(${items.length})</span></h3><ul class="sidebar-list">${items.map(c => `<li><button class="sidebar-item" data-sidebar-open="${c.name}" aria-label="Abrir ${escapeHtml(c.title)}"><span>${escapeHtml(c.title)}</span><span class="sidebar-item-tag">&lt;${escapeHtml(c.tag)}&gt;</span></button></li>`).join("")}</ul></section>`;
  }
  const remaining = all.filter(c => !used.has(c.name) && filteredNames.has(c.name));
  if (remaining.length) {
    html += `<section class="sidebar-category"><h3 class="sidebar-category-title">Otros <span style="color:var(--muted);font-weight:400">(${remaining.length})</span></h3><ul class="sidebar-list">${remaining.map(c => `<li><button class="sidebar-item" data-sidebar-open="${c.name}"><span>${escapeHtml(c.title)}</span><span class="sidebar-item-tag">&lt;${escapeHtml(c.tag)}&gt;</span></button></li>`).join("")}</ul></section>`;
  }
  if (!html) html = `<p class="sidebar-empty">Sin resultados para “${escapeHtml(q)}”</p>`;
  sidebarNav.innerHTML = html;
  sidebarNav.querySelectorAll("[data-sidebar-open]").forEach(btn => btn.addEventListener("click", () => openDetail(btn.dataset.sidebarOpen)));
  syncSidebarActive();
});
if (detailBack) detailBack.addEventListener("click", closeDetail);
if (detailCopy) detailCopy.addEventListener("click", async () => {
  if (!currentDetail) return;
  const text = toCdnHtml(currentDetail.rawBody);
  try {
    await navigator.clipboard.writeText(text);
    const prev = detailCopy.textContent;
    detailCopy.textContent = "¡Copiado!";
    setTimeout(() => detailCopy.textContent = prev, 1400);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
});

function sendToCodePen() {
  if (!currentDetail) return;
  const html = toCdnHtml(currentDetail.rawBody);
  const data = {
    title: `${currentDetail.title} <${currentDetail.tag}> — ManzUI`,
    description: currentDetail.description,
    html,
    editors: "100",
  };
  const form = document.createElement("form");
  form.action = "https://codepen.io/pen/define/";
  form.method = "POST";
  form.target = "_blank";
  form.style.display = "none";
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "data";
  input.value = JSON.stringify(data);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  // Retirar el form con retardo para no cancelar el submit en algunos navegadores
  setTimeout(() => form.remove(), 1000);
}

if (detailCodepen) detailCodepen.addEventListener("click", sendToCodePen);

window.addEventListener("hashchange", handleHash);
window.addEventListener("popstate", () => {
  if (!location.hash.startsWith("#component-")) {
    detail.hidden = true;
    detailStage.innerHTML = "";
    grid.querySelectorAll(".card").forEach(c => c.setAttribute("aria-selected", "false"));
    syncSidebarActive();
  }
});

grid.innerHTML = `<div class="empty">Cargando componentes desde <code>public/components/*.md</code>…</div>`;
loadAll();

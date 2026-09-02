import MarkdownIt from "markdown-it";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";

// Catálogo desde public/components/*.md — cards simplificadas + vista detalle arriba
const FILES = [
  "CommandViewer",
  "ComparativeChart",
  "CountDown",
  "FileTree",
  "ImageMaskCompare",
  "ImageSliderCompare",
  "ImageValuesViewer",
  "InputOTP",
];

const TAG_MAP = {
  CommandViewer: "command-viewer",
  ComparativeChart: "comparative-chart",
  CountDown: "count-down",
  FileTree: "file-tree",
  ImageMaskCompare: "image-mask-compare",
  ImageSliderCompare: "image-slider-compare",
  ImageValuesViewer: "image-values-viewer",
  InputOTP: "input-otp",
};

const mdIt = new MarkdownIt({ html: true, linkify: true });

const grid = document.getElementById("catalog-grid");
const search = document.getElementById("catalog-search");
const countEl = document.getElementById("catalog-count");
const detail = document.getElementById("detail");
const detailTitle = document.getElementById("detail-title");
const detailDesc = document.getElementById("detail-desc");
const detailCode = document.getElementById("detail-code");
const detailStage = document.getElementById("detail-stage");
const detailCopy = document.getElementById("detail-copy");
const detailBack = document.getElementById("detail-back");
const tabPreview = document.getElementById("tab-preview");
const tabCode = document.getElementById("tab-code");
const panelPreview = document.getElementById("panel-preview");
const panelCode = document.getElementById("panel-code");

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

function setDetailTab(which) {
  const isPreview = which === "preview";
  tabPreview.classList.toggle("is-active", isPreview);
  tabCode.classList.toggle("is-active", !isPreview);
  tabPreview.setAttribute("aria-selected", String(isPreview));
  tabCode.setAttribute("aria-selected", String(!isPreview));
  panelPreview.hidden = !isPreview;
  panelCode.hidden = isPreview;
}

let all = [];
let currentDetail = null;

async function loadAll() {
  const results = await Promise.all(FILES.map(async (name) => {
    const tag = TAG_MAP[name];
    const js = `/components/${name}.js`;
    const css = `/components/${name}.css`;
    const doc = `/components/${name}.md`;
    try {
      const res = await fetch(doc);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      const { title, description, body } = parseMd(raw);
      return { name, tag, title: title || name, description: description || "", js, css, doc, rawBody: body };
    } catch (e) {
      return { name, tag, title: name, description: `No se pudo cargar ${doc}: ${e.message}`, js, css, doc, rawBody: "", error: true };
    }
  }));
  all = results;
  render("");
  handleHash();
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
  detailCode.textContent = comp.rawBody;
  detailCode.className = "language-html";
  Prism.highlightElement(detailCode);

  detail.hidden = false;
  setDetailTab("preview");
  // marca la card seleccionada
  grid.querySelectorAll(".card").forEach(c => {
    c.setAttribute("aria-selected", c.dataset.open === name ? "true" : "false");
  });
  detail.scrollIntoView({ behavior: "smooth", block: "start" });

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
    } catch {}
  });
}

function closeDetail() {
  currentDetail = null;
  detail.hidden = true;
  grid.querySelectorAll(".card").forEach(c => c.setAttribute("aria-selected", "false"));
  detailStage.innerHTML = "";
  history.pushState(null, "", "#catalogo");
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

function handleHash() {
  const h = location.hash;
  const m = h.match(/^#component-(.+)$/);
  if (m && all.length) {
    const name = m[1];
    if (FILES.includes(name)) openDetail(name);
  }
}

if (search) search.addEventListener("input", (e) => render(e.target.value));
if (tabPreview) tabPreview.addEventListener("click", () => setDetailTab("preview"));
if (tabCode) tabCode.addEventListener("click", () => setDetailTab("code"));
if (detailBack) detailBack.addEventListener("click", closeDetail);
if (detailCopy) detailCopy.addEventListener("click", async () => {
  if (!currentDetail) return;
  const text = currentDetail.rawBody;
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

window.addEventListener("hashchange", handleHash);
window.addEventListener("popstate", () => {
  if (!location.hash.startsWith("#component-")) {
    detail.hidden = true;
    detailStage.innerHTML = "";
    grid.querySelectorAll(".card").forEach(c => c.setAttribute("aria-selected", "false"));
  }
});

grid.innerHTML = `<div class="empty">Cargando componentes desde <code>public/components/*.md</code>…</div>`;
loadAll();

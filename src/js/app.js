// Catálogo desde public/components/*.md — cards simplificadas + vista detalle
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

const grid = document.getElementById("catalog-grid");
const search = document.getElementById("catalog-search");
const countEl = document.getElementById("catalog-count");
const catalogSection = document.getElementById("catalogo");
const detail = document.getElementById("detail");
const detailTitle = document.getElementById("detail-title");
const detailDesc = document.getElementById("detail-desc");
const detailCode = document.getElementById("detail-code");
const detailStage = document.getElementById("detail-stage");
const detailCopy = document.getElementById("detail-copy");
const detailBack = document.getElementById("detail-back");
const detailMdLink = document.getElementById("detail-md-link");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseMd(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { title: "", description: "", body: raw.trim() };
  const fm = m[1];
  const body = m[2].trim();
  const title = (fm.match(/^title:\s*(.+)$/m) || ["", ""])[1].trim();
  const description = (fm.match(/^description:\s*(.+)$/m) || ["", ""])[1].trim();
  return { title, description, body };
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
    return /* html */`
      <article class="card">
        <h3 class="card-name">${safeTitle}</h3>
        <div class="card-tag">&lt;${safeTag}&gt;</div>
        <p class="card-desc">${safeDesc}</p>
        <div class="card-foot">
          <span class="card-meta">${escapeHtml(c.name)} • .md</span>
          <button class="icon-btn" type="button" aria-label="Abrir ${safeTitle}" data-open="${c.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/><path d="M13 12H5"/><path d="M19 12a7 7 0 0 0-7-7"/></svg>
          </button>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openDetail(btn.dataset.open));
  });
}

async function openDetail(name) {
  const comp = all.find(c => c.name === name);
  if (!comp) return;
  currentDetail = comp;

  // Update hash without scrolling
  history.pushState(null, "", `#component-${name}`);

  // Fill detail
  detailTitle.innerHTML = `${escapeHtml(comp.title)} <span>&lt;${escapeHtml(comp.tag)}&gt;</span>`;
  detailDesc.textContent = comp.description;
  detailCode.textContent = comp.rawBody;
  detailMdLink.href = comp.doc;

  // Show detail, hide grid toolbar? Keep toolbar but hide grid? Simpler hide grid and show detail
  grid.hidden = true;
  document.querySelector(".catalog-toolbar").hidden = true;
  detail.hidden = false;
  detail.scrollIntoView({ behavior: "smooth", block: "start" });

  // Render preview
  detailStage.innerHTML = "";
  try {
    await import(/* @vite-ignore */ comp.js);
  } catch (e) {
    detailStage.innerHTML = `<div style="color:var(--muted); font-size:0.85rem">No se pudo cargar <code>${escapeHtml(comp.js)}</code>: ${escapeHtml(String(e.message || e))}</div>`;
    return;
  }
  const withoutSrc = comp.rawBody.replace(/<script[^>]*src[^>]*><\/script>\s*/gi, "");
  // Also remove outer script tags with src? Keep style and component
  detailStage.innerHTML = withoutSrc;
  // Execute inline scripts inside detailStage (if any) — they were stripped as text, need to re-create
  // Extract inline script bodies from original rawBody and run them
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
  grid.hidden = false;
  document.querySelector(".catalog-toolbar").hidden = false;
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
    grid.hidden = false;
    const tb = document.querySelector(".catalog-toolbar");
    if (tb) tb.hidden = false;
  }
});

grid.innerHTML = `<div class="empty">Cargando componentes desde <code>public/components/*.md</code>…</div>`;
loadAll();

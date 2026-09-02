// Catálogo generado desde public/components/*.md (title + description + HTML de uso)
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

const ATTRS_MAP = {
  CommandViewer: ["label", "prompt", "start"],
  ComparativeChart: ["label", "unit", "sort"],
  CountDown: ["date"],
  FileTree: ["sort"],
  ImageMaskCompare: ["path", "base", "mask", "result"],
  ImageSliderCompare: ["pos", "zoom"],
  ImageValuesViewer: ["path", "ref", "prefix", "min", "max"],
  InputOTP: ["length", "type", "separator", "placeholder", "value", "disabled", "invalid", "mask", "autofocus"],
};

const grid = document.getElementById("catalog-grid");
const search = document.getElementById("catalog-search");
const countEl = document.getElementById("catalog-count");
const statusEl = document.getElementById("catalog-status");

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
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  });
}

function parseMd(raw) {
  // Frontmatter between first two ---, rest is HTML content
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { title: "", description: "", body: raw.trim() };
  const fm = m[1];
  const body = m[2].trim();
  const title = (fm.match(/^title:\s*(.+)$/m) || ["", ""])[1].trim();
  const description = (fm.match(/^description:\s*(.+)$/m) || ["", ""])[1].trim();
  return { title, description, body };
}

let all = [];

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
      // body is HTML snippet (includes <script> + component)
      // For code display, use body as is
      // For preview, we need to strip script src that will be loaded via import
      return {
        name,
        tag,
        title: title || name,
        description: description || "",
        js,
        css,
        doc,
        attrs: ATTRS_MAP[name] || [],
        rawBody: body,
        example: body, // keep for preview injection (will be used after import)
      };
    } catch (e) {
      return {
        name,
        tag,
        title: name,
        description: `No se pudo cargar ${doc}: ${e.message}`,
        js,
        css,
        doc,
        attrs: ATTRS_MAP[name] || [],
        rawBody: "",
        example: "",
        error: true,
      };
    }
  }));

  // keep defined order
  all = results;
  render("");
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

  grid.innerHTML = filtered.map((c, i) => {
    const attrs = c.attrs.map(a => `<code class="attr">${escapeHtml(a)}</code>`).join(" ");
    const safeBody = escapeHtml(c.rawBody || "");
    const safeTitle = escapeHtml(c.title);
    const safeDesc = escapeHtml(c.description);
    const safeTag = escapeHtml(c.tag);
    return /* html */`
      <article class="card" data-tag="${safeTag}">
        <header class="card-head">
          <div>
            <h3 class="card-title">${safeTitle} <span class="card-tag">&lt;${safeTag}&gt;</span></h3>
            <p class="card-desc">${safeDesc}</p>
          </div>
          <span class="badge">${i + 1}/${filtered.length}</span>
        </header>
        <div class="card-meta"><span class="meta-label">Atributos:</span> ${attrs || "<span class='muted'>—</span>"}</div>
        <div class="card-files">
          <a href="${c.js}" target="_blank" rel="noopener">📄 ${c.js}</a>
          <a href="${c.css}" target="_blank" rel="noopener">🎨 ${c.css}</a>
          <a href="${c.doc}" target="_blank" rel="noopener">📘 .md</a>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-copy" data-copy="${encodeURIComponent(c.rawBody)}" type="button">Copiar HTML</button>
          <button class="btn btn-sm btn-preview" type="button" data-tag="${safeTag}">Ver preview</button>
          <a class="btn btn-sm btn-ghost" href="${c.doc}" target="_blank" rel="noopener">Abrir .md</a>
        </div>
        <div class="code-wrap"><pre class="code"><code class="language-html">${safeBody}</code></pre></div>
        <div class="preview" hidden>
          <div class="preview-label">Preview</div>
          <div class="preview-stage"></div>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".btn-copy").forEach(btn => {
    btn.addEventListener("click", () => {
      const raw = decodeURIComponent(btn.dataset.copy);
      copyText(raw, btn);
    });
  });

  grid.querySelectorAll(".btn-preview").forEach(btn => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".card");
      const preview = card.querySelector(".preview");
      const stage = card.querySelector(".preview-stage");
      const tag = btn.dataset.tag;
      const comp = all.find(x => x.tag === tag);
      const isHidden = preview.hidden;
      if (isHidden) {
        try {
          await import(/* @vite-ignore */ comp.js);
        } catch (e) {
          stage.innerHTML = `<div class="notice">No se pudo cargar <code>${escapeHtml(comp.js)}</code>: ${escapeHtml(String(e.message || e))}</div>`;
        }
        // Inject HTML without <script type="module" src> to avoid duplicate loads; keep style + component
        // Remove script tags with src, keep inline scripts/styles and component
        const withoutSrc = comp.example.replace(/<script[^>]*src[^>]*><\/script>\s*/gi, "");
        stage.innerHTML = withoutSrc;
        preview.hidden = false;
        btn.textContent = "Ocultar preview";
      } else {
        preview.hidden = true;
        stage.innerHTML = "";
        btn.textContent = "Ver preview";
      }
    });
  });
}

if (search) search.addEventListener("input", (e) => render(e.target.value));

// Sandbox reload
const iframe = document.querySelector("#sandbox iframe");
const btnReload = document.getElementById("btn-reload-sandbox");
if (btnReload && iframe) {
  btnReload.addEventListener("click", () => {
    iframe.src = iframe.src;
  });
}

// Init
grid.innerHTML = `<div class="empty">Cargando componentes desde <code>public/components/*.md</code>…</div>`;
loadAll().catch(err => {
  if (statusEl) {
    statusEl.hidden = false;
    statusEl.textContent = `Error cargando catálogo: ${err.message}`;
  }
});

// Smooth nav highlight on scroll
const navLinks = document.querySelectorAll(".nav a[href^='#']");
if (navLinks.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        const id = ent.target.id;
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px", threshold: 0.1 });
  document.querySelectorAll("section[id]").forEach(s => obs.observe(s));
}

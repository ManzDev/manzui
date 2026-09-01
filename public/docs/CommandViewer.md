# CommandViewer — `command-viewer`

Visor de comandos de terminal con animación typewriter, navegación por pasos y botón copiar.

**Tag:** `command-viewer` | **Atributos:** `label`, `prompt` (ej. `$`), `start` (índice inicial)

**Archivos:** `/components/CommandViewer.js` + `/components/CommandViewer.css`

## Uso básico

```html
<script type="module" src="/components/CommandViewer.js"></script>

<command-viewer label="Instalar Git en Debian/Ubuntu" prompt="$">
  <nav label="Actualizamos los repositorios">
    <code>sudo apt update</code>
    <samp>Hit:1 http://deb.debian.org/debian bookworm InRelease
Get:2 http://deb.debian.org/debian bookworm-updates InRelease [52.1 kB]
Reading package lists... Done</samp>
  </nav>
  <nav label="Instalamos git">
    <code>sudo apt install -y git</code>
    <samp>Reading package lists... Done
The following NEW packages will be installed:
  git git-man
Setting up git (1:2.39.2-1.1) ...</samp>
  </nav>
</command-viewer>
```

## Variantes

```html
<!-- Sin prompt -->
<command-viewer label="Pasos" prompt="">
  <nav><code>npm install</code></nav>
  <nav><code>npm run dev</code></nav>
</command-viewer>

<!-- Empezar en paso 1 -->
<command-viewer start="1" label="Demo">
  <nav label="Paso 1"><code>echo uno</code></nav>
  <nav label="Paso 2"><code>echo dos</code></nav>
  <nav label="Paso 3"><code>echo tres</code></nav>
</command-viewer>

<script>
  document.querySelector("command-viewer").addEventListener("command-step-change", e => {
    console.log(e.detail.index, e.detail.total);
  });
</script>
```

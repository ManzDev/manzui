// Manifest del catálogo — encaja 1:1 con public/components/*.js
// Para añadir un componente nuevo: añade entrada aquí + crea src/docs/<Nombre>.md
export const components = [
  {
    name: "FileTree",
    tag: "file-tree",
    title: "Árbol de archivos",
    description: "Estructura de carpetas tipo explorer con texto ASCII. Soporta sort, highlight y [-] colapsado.",
    js: "/components/FileTree.js",
    css: "/components/FileTree.css",
    doc: "./docs/FileTree.md",
    attrs: ["sort"],
    example: `<file-tree sort>
  manzui/
  ├── public/
  │   ├── components/
  │   │   ├── FileTree.js
  │   │   └── FileTree.css
  │   └── manz.png (Info)
  ├── src/
  │   └── index.html
  └── vite.config.js
</file-tree>`
  },
  {
    name: "InputOTP",
    tag: "input-otp",
    title: "OTP Input",
    description: "Inputs segmentados para códigos de verificación. Form-associated, paste, máscara y validación.",
    js: "/components/InputOTP.js",
    css: "/components/InputOTP.css",
    doc: "./docs/InputOTP.md",
    attrs: ["length", "type", "separator", "placeholder", "value", "disabled", "invalid", "mask", "autofocus"],
    example: `<input-otp length="4" separator="-" type="numeric"></input-otp>`
  },
  {
    name: "CommandViewer",
    tag: "command-viewer",
    title: "Visor de comandos",
    description: "Terminal animada con navegación por pasos,typewriter y copiar.",
    js: "/components/CommandViewer.js",
    css: "/components/CommandViewer.css",
    doc: "./docs/CommandViewer.md",
    attrs: ["label", "prompt", "start"],
    example: `<command-viewer label="Instalar Git" prompt="$">
  <nav label="Update"><code>sudo apt update</code><samp>Reading package lists... Done</samp></nav>
  <nav label="Install"><code>sudo apt install -y git</code><samp>Setting up git...</samp></nav>
</command-viewer>`
  },
  {
    name: "ComparativeChart",
    tag: "comparative-chart",
    title: "Gráfico comparativo",
    description: "Barras horizontales para benchmarks. Sort, unit y highlight selected vía ::part.",
    js: "/components/ComparativeChart.js",
    css: "/components/ComparativeChart.css",
    doc: "./docs/ComparativeChart.md",
    attrs: ["label", "unit", "sort"],
    example: `<comparative-chart label="heap per instance" unit="KB" sort>
  <data selected value="82.0">z.object(), 10 keys</data>
  <data value="17.5">z.union([...])</data>
  <data value="7.5">z.string()</data>
  <data value="4.4">z.number()</data>
</comparative-chart>`
  },
  {
    name: "CountDown",
    tag: "count-down",
    title: "Cuenta atrás",
    description: "Flip-clock con días/horas/min. Emite countdown-end al llegar a cero.",
    js: "/components/CountDown.js",
    css: "/components/CountDown.css",
    doc: "./docs/CountDown.md",
    attrs: ["date"],
    example: `<count-down date="2026-12-31T23:59:59.000"></count-down>`
  },
  {
    name: "ImageSliderCompare",
    tag: "image-slider-compare",
    title: "Slider de imágenes",
    description: "Comparador con divisor arrastrable, zoom con rueda y soportes multi-imagen.",
    js: "/components/ImageSliderCompare.js",
    css: "/components/ImageSliderCompare.css",
    doc: "./docs/ImageSliderCompare.md",
    attrs: ["pos", "zoom"],
    example: `<image-slider-compare>
  <img src="/manz.png" alt="Manz">
  <img src="/moai.png" alt="Moai">
</image-slider-compare>`
  },
  {
    name: "ImageMaskCompare",
    tag: "image-mask-compare",
    title: "Comparador de máscaras",
    description: "Superposición con controles de clip y opacidad para máscara/resultado.",
    js: "/components/ImageMaskCompare.js",
    css: "/components/ImageMaskCompare.css",
    doc: "./docs/ImageMaskCompare.md",
    attrs: ["path", "base", "mask", "result"],
    example: `<image-mask-compare path="/" base="manz.png" mask="moai.png" result="manz.png"></image-mask-compare>`
  },
  {
    name: "ImageValuesViewer",
    tag: "image-values-viewer",
    title: "Visor de valores",
    description: "Navega imágenes por strength (0-1) o por template option.",
    js: "/components/ImageValuesViewer.js",
    css: "/components/ImageValuesViewer.css",
    doc: "./docs/ImageValuesViewer.md",
    attrs: ["path", "ref", "prefix", "min", "max"],
    example: `<image-values-viewer path="/">
  <template>
    <option value="manz.png">Manz</option>
    <option value="moai.png">Moai</option>
  </template>
</image-values-viewer>`
  }
];

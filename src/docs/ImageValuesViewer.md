# ImageValuesViewer — `image-values-viewer`

Visor de imágenes por `strength` (0.00-1.00) o por lista de opciones `<template><option>`.

**Tag:** `image-values-viewer` | **Atributos:** `path`, `ref`, `prefix`, `min`, `max`

**Archivos:** `/components/ImageValuesViewer.js` + `/components/ImageValuesViewer.css`

## Uso básico

```html
<script type="module" src="/components/ImageValuesViewer.js"></script>

<!-- Modo strength: genera imágenes prefix + strength -->
<image-values-viewer
  path="/assets/images/"
  prefix="strength-"
  min="0"
  max="1">
</image-values-viewer>
<!-- Espera ficheros: /assets/images/strength-0.00.avif ... strength-1.00.avif -->

<!-- Modo opciones con template -->
<image-values-viewer path="/">
  <template>
    <option value="manz.png">Manz</option>
    <option value="moai.png">Moai</option>
  </template>
</image-values-viewer>

<!-- Con imagen de referencia overlay -->
<image-values-viewer
  path="/assets/images/"
  ref="reference.avif"
  prefix="img-"
  min="0"
  max="1">
</image-values-viewer>
```

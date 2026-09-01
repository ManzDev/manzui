# ImageSliderCompare — `image-slider-compare`

Comparador de imágenes con slider arrastrable, zoom (rueda) y selectores cuando hay >2 imágenes.

**Tag:** `image-slider-compare` | **Atributos:** `pos` (0-100), `zoom` (100-180)

**Archivos:** `/components/ImageSliderCompare.js` + `/components/ImageSliderCompare.css`

## Uso básico

```html
<script type="module" src="/components/ImageSliderCompare.js"></script>

<image-slider-compare pos="50" zoom="100">
  <img src="/manz.png" alt="Manz">
  <img src="/moai.png" alt="Moai">
</image-slider-compare>
```

## Variantes

```html
<!-- Pos inicial y zoom -->
<image-slider-compare pos="30" zoom="120">
  <img src="/manz.png" alt="Antes">
  <img src="/moai.png" alt="Después">
</image-slider-compare>

<!-- Múltiples imágenes (aparecen selects A/B) -->
<image-slider-compare>
  <img src="/manz.png" alt="Manz">
  <img src="/moai.png" alt="Moai">
  <img src="/otro.png" alt="Otro">
</image-slider-compare>

<!-- Interacción: arrastra el handle, rueda para zoom, flechas para mover -->
```

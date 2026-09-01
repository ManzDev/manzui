# ImageMaskCompare — `image-mask-compare`

Comparador de máscaras con dos sliders: recorte de `result` y opacidad de `mask`.

**Tag:** `image-mask-compare` | **Atributos:** `path`, `base`, `mask`, `result`

**Archivos:** `/components/ImageMaskCompare.js` + `/components/ImageMaskCompare.css`

## Uso básico

```html
<script type="module" src="/components/ImageMaskCompare.js"></script>

<image-mask-compare
  path="/assets/images/"
  base="original.avif"
  mask="mask.avif"
  result="generated.avif">
</image-mask-compare>
```

## Variantes

```html
<!-- Path por defecto es /assets/images/ -->
<image-mask-compare
  base="base.png"
  mask="mask.png"
  result="result.png">
</image-mask-compare>

<!-- Con path absoluto distinto -->
<image-mask-compare
  path="/manz/"
  base="manz.png"
  mask="moai.png"
  result="manz.png">
</image-mask-compare>
```

# ComparativeChart — `comparative-chart`

Gráfico de barras horizontales comparativo (benchmarks). Soporta `sort`, `selected` y escalado automático.

**Tag:** `comparative-chart` | **Atributos:** `label`, `unit` (ej. `KB`), `sort` (booleano o `asc`)

**Archivos:** `/components/ComparativeChart.js` + `/components/ComparativeChart.css`

**Part estilable:** `comparative-chart::part(selected)` — `--color-selected`

## Uso básico

```html
<script type="module" src="/components/ComparativeChart.js"></script>

<style>
  comparative-chart::part(selected) {
    --color-selected: steelblue;
    color: #888;
  }
</style>

<comparative-chart label="retained heap per instance" unit="KB" sort>
  <data selected value="82.0">z.object(), 10 keys</data>
  <data value="17.5">z.union([...])</data>
  <data value="16.7">z.string().min(1)</data>
  <data value="26.4">z.record(...)</data>
  <data selected value="12.6">z.string().optional()</data>
  <data value="41.2">z.array(z.string())</data>
  <data value="7.5">z.string()</data>
  <data value="4.4">z.number()</data>
</comparative-chart>
```

## Variantes

```html
<!-- Orden ascendente -->
<comparative-chart label="Tiempo" unit="ms" sort="asc">
  <data value="120">A</data>
  <data value="45">B</data>
  <data value="89">C</data>
</comparative-chart>

<!-- Sin sort (mantiene orden del DOM) -->
<comparative-chart label="Scores">
  <data value="10">Alpha</data>
  <data value="30">Beta</data>
  <data value="20">Gamma</data>
</comparative-chart>
```

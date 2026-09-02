---
title: ComparativeChart
description: Gráfico de barras horizontales comparativo para benchmarks con sort, selected y escalado automático
---

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

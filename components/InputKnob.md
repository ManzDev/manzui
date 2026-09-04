---
title: InputKnob
description: Control giratorio circular tipo range con drag horizontal, click, teclado y rueda
---

<script type="module" src="/components/InputKnob.js"></script>

<style>
  .knob-demo {
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .knob-demo .big {
    --knob-size: 160px;
    --knob-color: #8a2be2;
  }
</style>

<div class="knob-demo">
  <input-knob min="0" max="100" value="50" step="1"></input-knob>
  <input-knob min="0" max="10" value="7" step="0.5" size="96" color="#ff2a9d"></input-knob>
  <input-knob class="big" min="-50" max="50" value="0" step="5" gap="8"></input-knob>
</div>

<script>
  document.querySelectorAll("input-knob").forEach((knob) => {
    knob.addEventListener("input", (e) => console.log("input:", e.detail.value));
    knob.addEventListener("change", (e) => console.log("change:", e.detail.value));
  });
</script>

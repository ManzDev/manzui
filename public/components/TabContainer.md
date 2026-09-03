---
title: TabContainer
description: Pestañas accesibles con botones y paneles externos vinculados por value y data-tab
---

<script type="module" src="/components/TabContainer.js"></script>

<tab-container group="demo" selected="tab-1">
  <button value="tab-1">Primera</button>
  <button value="tab-2">Segunda</button>
  <button value="tab-3" disabled>Tercera</button>
</tab-container>

<div data-tab="tab-1" data-group="demo">
  Contenido de la tab 1
</div>

<div data-tab="tab-2" data-group="demo" hidden>
  Contenido de la tab 2
</div>

<div data-tab="tab-3" data-group="demo" hidden>
  Contenido de la tab 3
</div>

<script>
  document.querySelector('tab-container[group="demo"]').addEventListener("tab-change", (e) => {
    console.log("tab activa:", e.detail.value);
  });
</script>

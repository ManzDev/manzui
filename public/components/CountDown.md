---
title: CountDown
description: Cuenta atrás flip-clock con días, horas, minutos y segundos que emite countdown-end
---

<script type="module" src="/components/CountDown.js"></script>

<count-down date="2026-12-31T23:59:59.000"></count-down>

<script>
  document.querySelector("count-down").addEventListener("countdown-end", () => {
    console.log("¡Tiempo finalizado!");
  });
</script>

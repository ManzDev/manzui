# CountDown — `count-down`

Cuenta atrás flip-clock con días/horas/minutos/segundos. Emite `countdown-end`.

**Tag:** `count-down` | **Atributos:** `date` (ISO string, ej. `2026-08-30T23:39:00.000`)

**Archivos:** `/components/CountDown.js` + `/components/CountDown.css`

## Uso básico

```html
<script type="module" src="/components/CountDown.js"></script>

<count-down date="2026-12-31T23:59:59.000"></count-down>

<script>
  document.addEventListener("countdown-end", () => {
    console.log("¡Tiempo finalizado!");
  });
  // o sobre el elemento:
  document.querySelector("count-down").addEventListener("countdown-end", e => {
    console.log(e.detail.date);
  });
</script>
```

## Variantes

```html
<!-- Fecha futura dinámica -->
<count-down id="cd"></count-down>
<script>
  const d = new Date(); d.setHours(d.getHours() + 2);
  document.getElementById("cd").setAttribute("date", d.toISOString());
</script>

<!-- Fecha pasada muestra "Tiempo finalizado" -->
<count-down date="2020-01-01T00:00:00.000"></count-down>
```

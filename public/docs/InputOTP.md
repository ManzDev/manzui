# InputOTP — `input-otp`

Inputs segmentados para códigos OTP. Soporta `numeric`/`alphanumeric`/`alpha`, separadores, máscara y form-associated.

**Tag:** `input-otp` | **Atributos:** `length`, `type` (numeric|alphanumeric|alpha), `separator`, `placeholder`, `value`, `disabled`, `invalid`, `mask`, `autofocus`

**Archivos:** `/components/InputOTP.js` + `/components/InputOTP.css`

**CSS vars:** `--otp-bg`, `--otp-color`, `--otp-size`, `--otp-gap`, `--otp-radius`

## Uso básico

```html
<script type="module" src="/components/InputOTP.js"></script>

<style>
  input-otp {
    --otp-bg: white;
    --otp-color: black;
    --otp-size: 32px;
    --otp-gap: 4px;
    --otp-radius: 0;
  }
</style>

<input-otp length="4"></input-otp>
```

## Variantes

```html
<!-- 6 dígitos alfanuméricos con separador -->
<input-otp length="6" type="alphanumeric" separator="-"></input-otp>

<!-- Con placeholder y valor inicial -->
<input-otp length="4" placeholder="·" value="1234"></input-otp>

<!-- Máscara password -->
<input-otp length="4" mask></input-otp>

<!-- Inferir length desde light DOM -->
<input-otp separator="-" type="alphanumeric">
  <input>
  <input>
  <input>
</input-otp>

<!-- Form associated + eventos -->
<form>
  <input-otp name="code" length="6"></input-otp>
  <button>Enviar</button>
</form>
<script>
  document.querySelector("input-otp").addEventListener("otp-complete", e => {
    console.log("completo:", e.detail.value);
  });
</script>
```

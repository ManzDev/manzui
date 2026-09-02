---
title: InputOTP
description: Inputs segmentados para códigos OTP con soporte numeric, alfanumérico, máscara y form-associated
---

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

<input-otp length="4" separator="-" type="numeric"></input-otp>

<script>
  document.querySelector("input-otp").addEventListener("otp-complete", e => {
    console.log("completo:", e.detail.value);
  });
</script>

---
title: CommandViewer
description: Visor de comandos de terminal con animación typewriter, navegación por pasos y botón copiar
---

<script type="module" src="/components/CommandViewer.js"></script>

<command-viewer label="Instalar Git en Debian/Ubuntu" prompt="$">
  <nav label="Actualizamos los repositorios">
    <code>sudo apt update</code>
    <samp>
    Hit:1 http://deb.debian.org/debian bookworm InRelease
    Get:2 http://deb.debian.org/debian bookworm-updates InRelease [52.1 kB]
    Reading package lists... Done</samp>
  </nav>
  <nav label="Instalamos git">
    <code>sudo apt install -y git</code>
    <samp>Reading package lists... Done
    The following NEW packages will be installed:
      git git-man
    Setting up git (1:2.39.2-1.1) ...</samp>
  </nav>
</command-viewer>

<script>
  document.querySelector("command-viewer").addEventListener("command-step-change", e => {
    console.log(e.detail.index, e.detail.total);
  });
</script>

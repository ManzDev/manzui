# FileTree — `file-tree`

Muestra una estructura de carpetas/archivos tipo árbol. Convierte texto ASCII con `├──`/`└──`/`│` en un árbol navegable con `<details>`.

**Tag:** `file-tree` | **Atributos:** `sort` (booleano, ordena folders primero)

**Archivos:** `/components/FileTree.js` + `/components/FileTree.css`

## Uso básico

```html
<script type="module" src="/components/FileTree.js"></script>

<file-tree sort>
  manzui/
  ├── public/
  │   ├── components/
  │   │   ├── FileTree.js
  │   │   └── FileTree.css
  │   └── manz.png (Info adicional)
  ├── src/
  │   └── index.html
  └── vite.config.js
</file-tree>
```

## Variantes

```html
<!-- Colapsado: añade [-] al nombre de la carpeta -->
<file-tree>
  proyecto/
  ├── src/ [-]
  │   └── index.html
  └── README.md
</file-tree>

<!-- Highlight: añade * al final del nombre -->
<file-tree>
  manzui/
  ├── moai.png* (highlight)
  └── manz.png
</file-tree>

<!-- Parte estilable: file-tree::part(highlight) -->
<style>
  file-tree::part(highlight) {
    --file-tree-highlight-bg: #6b07a11e;
    --file-tree-highlight-color: #c238a9;
  }
</style>
```

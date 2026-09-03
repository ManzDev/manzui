- Usamos `pnpm`, no `npm`.
- No levantes servidores ni hagas builds, simplemente avisa, que lo hará el humano.
- Revisa @public/components/FileTree.js para entender el patrón habitual de los componentes que vamos a desarrollar. Si lo necesitas mira algún otro más.

## CSS

- Cuando escribas CSS, prioriza utilizar nesting CSS para las clases que dependan de su padre.

## Javascript

- Cuando escribas clases de Javascript, no uses convención `_` para variables privadas, usa `#`.

## WebComponents

- Separa el CSS de los WebComponents en un fichero .css a parte y cargalo utilizando `adoptedStyleSheet` e `import with { type: "css" }`

import { readdir, copyFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SRC_DIR = "public/components";
const OUT_DIR = "dist/lib";

const jsFiles = (await readdir(SRC_DIR)).filter(f => f.endsWith(".js")).sort();

await mkdir(OUT_DIR, { recursive: true });

for (const js of jsFiles) {
  const base = js.replace(/\.js$/, "");
  await copyFile(join(SRC_DIR, js), join(OUT_DIR, js));
  // copia css si existe
  try {
    await copyFile(join(SRC_DIR, `${base}.css`), join(OUT_DIR, `${base}.css`));
  } catch {}
}

// genera manzui.js barrel ESM auto
const imports = jsFiles.map(js => `import "./${js}";`).join("\n");
const content = `// Auto-generado desde ${SRC_DIR} — no editar manualmente
${imports}
export {};
`;

await writeFile(join(OUT_DIR, "manzui.js"), content, "utf8");

console.log(`✓ ${jsFiles.length} componentes copiados a ${OUT_DIR}/`);
console.log(`✓ ${OUT_DIR}/manzui.js generado con ${jsFiles.length} imports`);

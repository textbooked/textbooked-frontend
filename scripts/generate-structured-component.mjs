import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
const explicitName = process.argv[3];
const clientMode = process.argv.includes("--client");
const structuredMode = process.argv.includes("--structured");

if (!inputPath) {
  console.error("Usage: yarn g:component <path> [ComponentName] [--client] [--structured]");
  process.exit(1);
}

const cwd = process.cwd();
const absoluteDir = path.isAbsolute(inputPath)
  ? inputPath
  : path.join(cwd, inputPath);
const dirName = path.basename(absoluteDir);
const componentName = explicitName ?? toPascalCase(dirName);

if (fs.existsSync(absoluteDir)) {
  console.error(`Path already exists: ${path.relative(cwd, absoluteDir)}`);
  process.exit(1);
}

fs.mkdirSync(absoluteDir, { recursive: true });

if (structuredMode) {
  writeStructured(absoluteDir, componentName, clientMode);
} else {
  writeMinimal(absoluteDir, componentName, clientMode);
}

console.log(`Created component: ${path.relative(cwd, absoluteDir)}`);

function writeMinimal(dir, name, client) {
  const clientDirective = client ? '"use client"\n\n' : "";
  const source = `${clientDirective}type ${name}Props = {\n  className?: string;\n};\n\nexport default function ${name}({ className }: ${name}Props) {\n  return <div className={className} />;\n}\n`;
  write(path.join(dir, "index.tsx"), source);
}

function writeStructured(dir, name, client) {
  const clientDirective = client ? '"use client"\n\n' : "";

  write(
    path.join(dir, "types.ts"),
    `export type Props = {\n  className?: string;\n};\n`,
  );

  write(
    path.join(dir, "logic.ts"),
    `${clientDirective}import type { Props } from "./types";\n\nexport function useLogic(_props: Props) {\n  return {};\n}\n`,
  );

  write(
    path.join(dir, "style.ts"),
    `export function useStyle() {\n  return {\n    root: "",\n  };\n}\n`,
  );

  write(
    path.join(dir, "render.tsx"),
    `${clientDirective}import { cn } from "@/lib/utils";\n\nimport type { Props } from "./types";\n\ntype RenderStyle = {\n  root: string;\n};\n\ntype RenderParams = {\n  props: Props;\n  style: RenderStyle;\n};\n\nexport function render({ props, style }: RenderParams) {\n  return <div className={cn(style.root, props.className)} />;\n}\n`,
  );

  write(
    path.join(dir, "index.tsx"),
    `${clientDirective}import { createComponent } from "react-component-structure";\n\nimport { useLogic } from "./logic";\nimport { render } from "./render";\nimport { useStyle } from "./style";\n\nconst ${name} = createComponent({\n  useLogic,\n  useRender: (props, logic, style) => render({ props, style }),\n  useStyle,\n});\n\nexport default ${name};\n`,
  );
}

function write(filePath, source) {
  fs.writeFileSync(filePath, source, "utf8");
}

function toPascalCase(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

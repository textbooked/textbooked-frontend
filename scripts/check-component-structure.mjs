import fs from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components", "providers", "scripts"];
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const failures = [];

for (const root of ROOTS) {
  const absoluteRoot = path.join(process.cwd(), root);
  if (!fs.existsSync(absoluteRoot)) {
    continue;
  }

  walk(absoluteRoot);
}

if (failures.length > 0) {
  console.error("\nStructure check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Structure check passed.");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), absolutePath);

    if (entry.isDirectory()) {
      if (entry.name === "_screen" || entry.name === "_layout") {
        failures.push(`${relativePath}: forbidden route wrapper directory`);
      }
      walk(absolutePath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      continue;
    }

    if (entry.name === "legacy.tsx" || entry.name === "legacy.ts") {
      failures.push(`${relativePath}: legacy compatibility file is forbidden`);
    }

    const source = fs.readFileSync(absolutePath, "utf8");
    if (source.includes("createComponent<")) {
      failures.push(`${relativePath}: explicit createComponent generics are forbidden`);
    }
  }
}

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

function readEnvFile(contents) {
  return Object.fromEntries(contents
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      return [key, value];
    }));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : target;
  }));
  return files.flat();
}

function mimeType(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "image/jpeg";
}

const root = process.cwd();
const env = readEnvFile(await readFile(path.join(root, ".env.local"), "utf8"));
const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!cloudName || !uploadPreset) {
  throw new Error("Cloudinary cloud name or unsigned upload preset is missing from .env.local.");
}

const sourceDirectories = [path.join(root, "public", "bumpa-products"), path.join(root, "public", "stock")];
const candidates = (await Promise.all(sourceDirectories.map(async (directory) => {
  try {
    return (await stat(directory)).isDirectory() ? walk(directory) : [];
  } catch {
    return [];
  }
}))).flat();

const imageFiles = candidates.filter((filename) => /\.(jpe?g|png|webp|gif)$/i.test(filename));
const mappings = [];

for (const filename of imageFiles) {
  const bytes = await readFile(filename);
  const relativeUrl = `/${path.relative(path.join(root, "public"), filename).replaceAll("\\", "/")}`;
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType(filename) }), path.basename(filename));
  form.append("upload_preset", uploadPreset);
  form.append("folder", "fits/products/migrated");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
  const payload = await response.json();
  if (!response.ok || !payload.secure_url) {
    throw new Error(`Upload failed for ${relativeUrl}: ${payload.error?.message || response.statusText}`);
  }
  mappings.push({ from: relativeUrl, to: payload.secure_url });
  process.stderr.write(`Uploaded ${relativeUrl}\n`);
}

process.stdout.write(JSON.stringify(mappings));

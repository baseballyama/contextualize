import * as fs from "node:fs";
import * as path from "node:path";
import { useFileLoader } from "./language";

// Recursively list files
function listFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(listFilesRecursive(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

// Build and format a tree structure
function formatFileTree(files: string[], basePath: string): string {
  const tree: { [key: string]: any } = {};
  files.forEach((filePath) => {
    const relativePath = path.relative(basePath, filePath);
    const parts = relativePath.split(path.sep);
    let current = tree;
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      current = current[part];
    });
  });
  function renderTree(tree: { [key: string]: any }, indent = ""): string {
    return Object.keys(tree)
      .map((key) => {
        const isFile = tree[key] === null;
        const line = `${indent}|- ${key}`;
        return isFile
          ? line
          : `${line}\n${renderTree(tree[key], indent + "    ")}`;
      })
      .join("\n");
  }
  return renderTree(tree);
}

// Generate a file tree and file contents
export function collectFiles(directoryPath: string): string {
  const allFiles = listFilesRecursive(directoryPath);
  const fileTree = formatFileTree(allFiles, directoryPath);
  const loadFile = useFileLoader(directoryPath);
  const fileTexts = allFiles.map(loadFile).join("\n");
  return `#File Tree\n${fileTree}\n\n${fileTexts}`;
}

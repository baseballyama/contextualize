import * as fs from "node:fs";
import * as nodePath from "node:path";
import { resolveAllImportsInFile } from "./resolve";

type File = string;

export interface FileTree {
  [key: string]: File | FileTree;
}

// ----------------------------------------------------------------------
// Builder
// ----------------------------------------------------------------------

function listFilesRecursive(
  dir: string,
  isGitIgnored: (path: string) => boolean
): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = nodePath.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(listFilesRecursive(filePath, isGitIgnored));
    } else if (!isGitIgnored(filePath)) {
      results.push(filePath);
    }
  }
  return results;
}

function getBasePath(fileTree: FileTree): {
  basePath: string;
  current: FileTree;
} {
  let prevBasePath = "";
  let basePath = "";
  let prevCurrent: FileTree = fileTree;
  let current: FileTree = fileTree;
  while (true) {
    const keys = Object.keys(current);
    if (keys.length === 1) {
      prevBasePath = basePath;
      basePath = nodePath.join(basePath, keys[0]);
      prevCurrent = current;
      current = current[keys[0]] as FileTree;
    } else {
      break;
    }
  }

  if (typeof current === "string") {
    return { basePath: prevBasePath, current: prevCurrent };
  }

  return { basePath, current };
}

export async function buildFileTree(
  paths: string[],
  isGitIgnored: (path: string) => boolean,
  withDependencies: boolean
): Promise<{
  fileTree: FileTree;
  basePath: string;
}> {
  const fileTree: FileTree = {};

  for (const pPath of paths) {
    const files: string[] = fs.statSync(pPath).isFile()
      ? [pPath]
      : listFilesRecursive(pPath, isGitIgnored);

    for (const path of files) {
      const parts = path.split(nodePath.sep);
      let current: FileTree = fileTree;

      for (const [index, part] of parts.entries()) {
        if (index === parts.length - 1) {
          if (!isGitIgnored(path)) {
            current[part] = path;
            if (withDependencies) {
              const resolvedPaths = await resolveAllImportsInFile(
                path,
                isGitIgnored
              );
              for (const resolvedPath of resolvedPaths) {
                const parts2 = resolvedPath.split(nodePath.sep);
                let current2: FileTree = fileTree;
                for (const [index2, part2] of parts2.entries()) {
                  if (index2 === parts2.length - 1) {
                    current2[part2] = resolvedPath;
                  } else {
                    if (!current2[part2]) {
                      current2[part2] = {};
                    }
                    current2 = current2[part2] as FileTree;
                  }
                }
              }
            }
          }
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part] as FileTree;
        }
      }
    }
  }

  const { basePath, current } = getBasePath(fileTree);
  return { fileTree: current, basePath };
}

// ----------------------------------------------------------------------
// Render
// ----------------------------------------------------------------------

export function renderFileTree(tree: FileTree, basePath: string = ""): string {
  return renderFileTreeInternal(tree, basePath, "").join("\n");
}

function renderFileTreeInternal(
  tree: FileTree,
  basePath: string,
  indent: string
): string[] {
  const lines: string[] = [];
  for (const key of Object.keys(tree).sort()) {
    const value = tree[key];
    const isFile = typeof value === "string";
    const line = `${indent}|- ${key}`;
    lines.push(line);
    if (!isFile) {
      const subLines = renderFileTreeInternal(
        value,
        nodePath.join(basePath, key),
        indent + "\t"
      );
      lines.push(...subLines);
    }
  }
  return lines;
}

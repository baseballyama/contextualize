import * as fs from "node:fs";
import * as nodePath from "node:path";
import { useFileLoader } from "./language";

// ----------------------------------------------------------------------
// File tree
// ----------------------------------------------------------------------
type File = string;

interface FileTree {
  [key: string]: File | FileTree;
}

function getNonSubPaths(paths: string[]): string[] {
  const sortedPaths = paths.sort((a, b) => a.length - b.length);
  const result: string[] = [];
  for (const currentPath of sortedPaths) {
    const isSubPath = result.some(
      (topPath) =>
        currentPath.startsWith(`${topPath}/`) || currentPath === topPath
    );

    if (!isSubPath) {
      result.push(currentPath);
    }
  }

  return result;
}

function getCommonBasePath(paths: string[]): string {
  if (paths.length === 0) {
    return "";
  }
  if (paths.length === 1) {
    return paths[0];
  }

  const splitPaths = paths.map((path) => path.split("/"));
  const basePath: string[] = [];

  for (let i = 0; i < splitPaths[0].length; i++) {
    const segment = splitPaths[0][i];
    if (splitPaths.every((pathParts) => pathParts[i] === segment)) {
      basePath.push(segment);
    } else {
      break;
    }
  }

  return basePath.join("/");
}

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

export function buildFileTree(
  paths: string[],
  isGitIgnored: (path: string) => boolean
): {
  fileTree: FileTree;
  basePath: string;
} {
  const fsPaths = getNonSubPaths(paths);
  const basePath = getCommonBasePath(fsPaths);

  const fileTree: FileTree = {};

  for (const pPath of paths) {
    const files: string[] = fs.statSync(pPath).isFile()
      ? [pPath]
      : listFilesRecursive(pPath, isGitIgnored);

    for (const file of files) {
      const path = nodePath.relative(basePath, file);
      const parts = path.split(nodePath.sep);
      let current: FileTree = fileTree;

      for (const [index, part] of parts.entries()) {
        if (index === parts.length - 1) {
          if (!isGitIgnored(path)) {
            current[part] = path;
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

  return { fileTree, basePath };
}

export function renderFileTree(tree: FileTree, basePath: string = ""): string {
  return renderFileTreeInternal(tree, basePath, "").join("\n");
}

function renderFileTreeInternal(
  tree: FileTree,
  basePath: string,
  indent: string
): string[] {
  const lines: string[] = [];
  for (const key in tree) {
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

// ----------------------------------------------------------------------
// Render Files
// ----------------------------------------------------------------------

export function renderFileTreeContents(
  fileTree: FileTree,
  basePath: string
): string[] {
  const fileLoader = useFileLoader(basePath);
  return renderFileTreeContentsInternal(fileTree, fileLoader, basePath);
}

function renderFileTreeContentsInternal(
  fileTree: FileTree,
  fileLoader: ReturnType<typeof useFileLoader>,
  basePath: string
): string[] {
  const lines: string[] = [];
  for (const key in fileTree) {
    const value = fileTree[key];
    const isFile = typeof value === "string";
    if (isFile) {
      const content = fileLoader(nodePath.join(basePath, key));
      lines.push(content);
    } else {
      lines.push(
        ...renderFileTreeContentsInternal(
          value,
          fileLoader,
          nodePath.join(basePath, key)
        )
      );
    }
  }
  return lines;
}

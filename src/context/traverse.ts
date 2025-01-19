import * as nodePath from "node:path";
import { useFileLoader } from "./language";
import type { FileTree } from "./file-tree";

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

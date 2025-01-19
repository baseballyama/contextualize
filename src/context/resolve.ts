import * as vscode from "vscode";

export async function resolveAllImportsInFile(
  filePath: string,
  isGitIgnored: (path: string) => boolean
): Promise<string[]> {
  const resolvedPaths: Set<string> = new Set();
  const queue: string[] = [filePath];
  const processedPaths: Set<string> = new Set();

  while (queue.length > 0) {
    const currentFilePath = queue.shift()!;

    if (processedPaths.has(currentFilePath)) {
      continue;
    }

    processedPaths.add(currentFilePath);

    const imports = await resolveAllImportsInFileInternal(
      currentFilePath,
      isGitIgnored,
      Array.from(processedPaths)
    );

    for (const importPath of imports) {
      if (!resolvedPaths.has(importPath)) {
        resolvedPaths.add(importPath);
        queue.push(importPath);
      }
    }
  }

  console.log(Array.from(resolvedPaths));

  return Array.from(resolvedPaths);
}

export async function resolveAllImportsInFileInternal(
  filePath: string,
  isGitIgnored: (path: string) => boolean,
  processedPaths: string[]
): Promise<string[]> {
  const document = await vscode.workspace.openTextDocument(filePath);
  const text = document.getText();
  const matches = [
    ...text.matchAll(/import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"];?/gm),
  ];

  if (matches.length === 0) {
    return [];
  }

  const resolvedPaths: string[] = [];

  for (const match of matches) {
    const startIndex = match.index ?? 0;
    const importMatch = /(import[\s\S]+?["'])(.*)?["']/gm.exec(match[0]);
    const importPathStartIndex =
      startIndex + (importMatch?.[1]?.length ?? 0) + 1;
    const position = document.positionAt(importPathStartIndex);
    const locations = await vscode.commands.executeCommand<
      vscode.LocationLink[]
    >("vscode.executeDefinitionProvider", document.uri, position);
    if (locations) {
      for (const location of locations) {
        const targetPath = location.targetUri.fsPath;
        if (isGitIgnored(targetPath) || processedPaths.includes(targetPath)) {
          continue;
        }
        processedPaths.push(targetPath);
        resolvedPaths.push(targetPath);
      }
    }
  }

  return resolvedPaths;
}

import * as vscode from "vscode";
import { renderFileTreeContents } from "../context/traverse";
import { buildFileTree, renderFileTree } from "../context/file-tree";
import { findGitignoresForPaths, getIsGitIgnored } from "../context/gitignore";

async function postProcess(content: string) {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: "plaintext",
  });
  await vscode.window.showTextDocument(document);
}

export function activate(withDependencies: boolean) {
  return vscode.commands.registerCommand(
    "contextualize.generateLLMContext" +
      (withDependencies ? "WithDependencies" : ""),
    async (_: vscode.Uri | undefined, selectedUris: vscode.Uri[]) => {
      try {
        const fsPaths = selectedUris.map((uri) => uri.fsPath);
        const gitignorePaths = findGitignoresForPaths(fsPaths);
        const isGitIgnored = getIsGitIgnored(gitignorePaths);
        const { fileTree, basePath } = await buildFileTree(
          fsPaths,
          isGitIgnored,
          withDependencies
        );
        const treeString = renderFileTree(fileTree);
        const fileContents = renderFileTreeContents(fileTree, basePath);
        await postProcess(
          "# File Tree\n" +
            treeString +
            "\n\n# SourceCode\n" +
            fileContents.join("\n")
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          "Failed to generate LLM context: " + error
        );
      }
    }
  );
}

import * as vscode from "vscode";
import {
  buildFileTree,
  renderFileTree,
  renderFileTreeContents,
} from "../context/traverse";
import { findGitignoresForPaths, getIsGitIgnored } from "../context/gitignore";

async function postProcess(content: string) {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: "plaintext",
  });
  await vscode.window.showTextDocument(document);
}

export function activate() {
  return vscode.commands.registerCommand(
    "contextualize.generateLLMContext",
    async (_: vscode.Uri | undefined, selectedUris: vscode.Uri[]) => {
      try {
        const fsPaths = selectedUris.map((uri) => uri.fsPath);
        const gitignorePaths = findGitignoresForPaths(fsPaths);
        const isGitIgnored = getIsGitIgnored(gitignorePaths);
        const { fileTree, basePath } = buildFileTree(fsPaths, isGitIgnored);
        const treeString = renderFileTree(fileTree);
        const fileContents = renderFileTreeContents(fileTree, basePath);
        await postProcess(treeString + "\n\n" + fileContents);
      } catch (error) {
        vscode.window.showErrorMessage(
          "Failed to generate LLM context: " + error
        );
      }
    }
  );
}

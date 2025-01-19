import * as vscode from "vscode";
import {
  buildFileTree,
  renderFileTree,
  renderFileTreeContents,
} from "../context/folder-traverse";

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
      const { fileTree, basePath } = buildFileTree(
        selectedUris.map((uri) => uri.fsPath)
      );
      const treeString = renderFileTree(fileTree);
      const fileContents = renderFileTreeContents(fileTree, basePath);
      await postProcess(treeString + "\n\n" + fileContents);
    }
  );
}

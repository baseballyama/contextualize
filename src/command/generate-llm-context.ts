import * as vscode from "vscode";
import { collectFiles, collectFile } from "../context/folder-traverse";
import * as fs from "node:fs";

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
    async (uri: vscode.Uri | undefined) => {
      if (uri === undefined) {
        vscode.window.showErrorMessage("No directory selected.");
        return;
      }

      const { fsPath } = uri;

      if (fs.statSync(fsPath).isFile()) {
        const content = collectFile(uri.fsPath);
        await postProcess(content);
        return;
      }

      const content = collectFiles(uri.fsPath);
      await postProcess(content);
    }
  );
}

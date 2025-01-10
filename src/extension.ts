import * as vscode from "vscode";
import { collectFiles } from "./context/folder-traverse";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "contextualize.generateLLMContext",
    async (uri: vscode.Uri | undefined) => {
      if (uri === undefined) {
        vscode.window.showErrorMessage("No directory selected.");
        return;
      }

      const content = collectFiles(uri.fsPath);
      const document = await vscode.workspace.openTextDocument({
        content,
        language: "plaintext", // プレーンテキストとして表示
      });
      await vscode.window.showTextDocument(document);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

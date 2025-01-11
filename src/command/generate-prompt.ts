import * as vscode from "vscode";
import { collectFiles } from "../context/folder-traverse";
import { generatePrompt } from "../prompt/index";
import { getPrompts } from "../config/index";

export function activate() {
  return vscode.commands.registerCommand(
    "contextualize.generatePrompt",
    async (uri: vscode.Uri | undefined) => {
      if (uri === undefined) {
        vscode.window.showErrorMessage("No directory selected.");
        return;
      }

      const prompts = getPrompts();

      if (prompts.length === 0) {
        vscode.window.showErrorMessage(
          "No prompts configured. Please configure prompts in settings."
        );
        return;
      }

      const quickPick = vscode.window.createQuickPick();
      quickPick.items = prompts.map((prompt) => ({
        label: prompt.title,
      }));

      quickPick.onDidChangeSelection(async (selection) => {
        if (selection[0]) {
          const prompt = prompts.find((p) => p.title === selection[0].label);
          if (prompt) {
            quickPick.hide();
            const generatedPrompt = generatePrompt(
              prompt.prompt,
              collectFiles(uri.fsPath)
            );

            await vscode.workspace.applyEdit(new vscode.WorkspaceEdit());
            await vscode.commands.executeCommand(
              "workbench.action.revertAndCloseActiveEditor"
            );

            const document2 = await vscode.workspace.openTextDocument({
              content: generatedPrompt,
              language: "plaintext",
            });
            await vscode.window.showTextDocument(document2);
          }
        }
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    }
  );
}

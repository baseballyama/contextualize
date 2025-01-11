import * as vscode from "vscode";
import { applyMergeConflictToWorkspace } from "../apply/apply-merge-conflict";

export function activate() {
  return vscode.commands.registerCommand(
    "contextualize.apply",
    async (uri: vscode.Uri | undefined) => {
      if (uri === undefined) {
        vscode.window.showErrorMessage("No directory selected.");
        return;
      }

      const editor = await vscode.workspace.openTextDocument({
        content: diffPlaceholder,
        language: "diff",
      });

      const document = await vscode.window.showTextDocument(editor);

      const apply = await vscode.window.showInformationMessage(
        "You have entered some diff. Do you want to apply the diff and proceed?",
        "Apply Changes",
        "Discard Changes"
      );

      if (apply === "Apply Changes") {
        const diff = document.document.getText();
        await vscode.workspace.applyEdit(new vscode.WorkspaceEdit());
        await vscode.commands.executeCommand(
          "workbench.action.revertAndCloseActiveEditor"
        );
        applyMergeConflictToWorkspace(diff, uri.fsPath);
      }
    }
  );
}

const diffPlaceholder = `\
// -----------------------------------------------------------------------------
// Please remove this placeholder and paste your conflict markers here.
// -----------------------------------------------------------------------------

example.ts
<<<<<<< ORIGINAL
import fs from "fs";
=======
import * as fs from "node:fs";
>>>>>>> UPDATED`;

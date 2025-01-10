import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "contextualize.generateLLMContext",
    (uri: vscode.Uri) => {
      console.log(uri.fsPath);
      // 選択されたディレクトリのパスを取得
      const directoryPath = uri.fsPath;

      vscode.window.showInformationMessage(
        `Selected Directory: ${directoryPath}`
      );

      // カスタム処理をここに追加
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

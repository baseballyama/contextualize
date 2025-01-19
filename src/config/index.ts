import * as vscode from "vscode";

let addTypeScriptTypes = false;

function getAddTypeScriptTypes() {
  return addTypeScriptTypes;
}

function getConfiguration() {
  const config = vscode.workspace.getConfiguration("contextualize");
  addTypeScriptTypes = config.get<boolean>("addTypeScriptTypes") ?? false;
}

vscode.workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration("contextualize")) {
    getConfiguration();
  }
});

function onActivate() {
  getConfiguration();
}

export { onActivate, getAddTypeScriptTypes };

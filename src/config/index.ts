import * as vscode from "vscode";

interface Prompt {
  title: string;
  prompt: string;
}

let prompts: Prompt[] = [];
let addTypeScriptTypes = false;

function getPrompts() {
  return prompts;
}

function getAddTypeScriptTypes() {
  return addTypeScriptTypes;
}

function getConfiguration() {
  const config = vscode.workspace.getConfiguration("contextualize");
  prompts = config.get<Prompt[]>("prompts") ?? [];
  console.log({ prompts });
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

export { onActivate, getPrompts, getAddTypeScriptTypes };

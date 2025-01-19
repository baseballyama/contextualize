import * as vscode from "vscode";
import { onActivate as configOnActivate } from "./config/index";
import { activate as generateLLMContextActivate } from "./command/generate-llm-context";

const onActivates = [configOnActivate];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(generateLLMContextActivate(false));
  context.subscriptions.push(generateLLMContextActivate(true));

  onActivates.forEach((onActivate) => onActivate());
}

export function deactivate() {}

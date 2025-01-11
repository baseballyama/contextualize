import * as vscode from "vscode";
import { onActivate as configOnActivate } from "./config/index";
import { activate as generateLLMContextActivate } from "./command/generate-llm-context";
import { activate as generatePromptActivate } from "./command/generate-prompt";
import { activate as applyConflictMarkerStyleActivate } from "./command/apply-conflict-marker-style";

const onActivates = [configOnActivate];

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(generateLLMContextActivate());
  context.subscriptions.push(generatePromptActivate());
  context.subscriptions.push(applyConflictMarkerStyleActivate());

  onActivates.forEach((onActivate) => onActivate());
}

export function deactivate() {}

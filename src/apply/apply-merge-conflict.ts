import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

/**
 * e.g.
 * example.ts
 * <<<<<<< ORIGINAL
 * foo
 * =======
 * bar
 * >>>>>>> UPDATED
 */
interface MergeConflict {
  fileName: string;
  original: string[];
  updated: string[];
  sep: string;
}

function parseMergeConflict(mergeConflict: string): MergeConflict[] {
  const sep = mergeConflict.includes("\r\n") ? "\r\n" : "\n";
  const lines = mergeConflict.split(sep);
  const conflicts: MergeConflict[] = [];

  let currentFileName: string | null = null;
  let originalLines: string[] = [];
  let updatedLines: string[] = [];
  let readingMode: "none" | "original" | "updated" = "none";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "<<<<<<< ORIGINAL" && i > 0) {
      currentFileName = lines[i - 1].trim();
      readingMode = "original";
      continue;
    }

    if (line.trim() === "=======") {
      readingMode = "updated";
      continue;
    }

    if (line.trim() === ">>>>>>> UPDATED") {
      readingMode = "none";
      if (currentFileName) {
        conflicts.push({
          fileName: currentFileName,
          original: originalLines,
          updated: updatedLines,
          sep,
        });
        currentFileName = null;
        originalLines = [];
        updatedLines = [];
      }
      continue;
    }

    if (readingMode === "original") {
      originalLines.push(line);
    } else if (readingMode === "updated") {
      updatedLines.push(line);
    }
  }

  console.log({ conflicts });

  return conflicts;
}

function replaceOriginalWithUpdated(
  filePath: string,
  original: string[],
  updated: string[],
  sep: string
) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const fileContent = fs.readFileSync(filePath, "utf8");
  const originalText = original.join(sep);
  const updatedText = updated.join(sep);
  const newContent = fileContent.replace(originalText, updatedText);
  fs.writeFileSync(filePath, newContent, "utf8");
}

export async function applyMergeConflictToWorkspace(
  mergeConflict: string,
  rootPath: string
) {
  const conflicts = parseMergeConflict(mergeConflict);

  for (const conflict of conflicts) {
    const targetFilePath = path.join(rootPath, conflict.fileName);
    replaceOriginalWithUpdated(
      targetFilePath,
      conflict.original,
      conflict.updated,
      conflict.sep
    );
  }

  vscode.window.showInformationMessage("Merge conflict applied successfully!");
}

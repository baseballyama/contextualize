import { useTypescriptLoader } from "./typescript";
import * as path from "node:path";
import * as fs from "node:fs";

export function useFileLoader(baseDir: string) {
  const loadTypescript = useTypescriptLoader(baseDir);
  return (filePath: string) => {
    let fileString = "";
    if (filePath.endsWith(".ts")) {
      fileString = loadTypescript(filePath);
    } else {
      fileString = fs.readFileSync(filePath, "utf-8");
    }
    return loadDefaultFile(filePath, baseDir, fileString);
  };
}

function loadDefaultFile(
  filePath: string,
  baseDir: string,
  fileString: string
): string {
  return `\
//#region ${path.relative(baseDir, filePath)}
${fileString.trim()}
//#endregion`;
}

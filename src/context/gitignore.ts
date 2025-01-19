import * as fs from "node:fs";
import * as nodePath from "node:path";
import ignore from "ignore";

function findGitignoreForPath(targetPath: string): Set<string> {
  const result: Set<string> = new Set();
  let dir = fs.statSync(targetPath).isDirectory()
    ? targetPath
    : nodePath.dirname(targetPath);

  while (dir !== nodePath.dirname(dir)) {
    const gitignorePath = nodePath.join(dir, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      result.add(gitignorePath);
    }
    dir = nodePath.dirname(dir);
  }

  return result;
}

export function findGitignoresForPaths(paths: string[]): Set<string> {
  const result: Set<string> = new Set();

  for (const targetPath of paths) {
    for (const gitignorePath of findGitignoreForPath(targetPath)) {
      result.add(gitignorePath);
    }
  }

  return result;
}

function isChildPath(child: string, parent: string): boolean {
  const absoluteA = nodePath.resolve(child);
  const absoluteB = nodePath.resolve(parent);
  return absoluteA.startsWith(absoluteB + nodePath.sep);
}

export function getIsGitIgnored(
  gitignorePaths: Set<string>
): (path: string) => boolean {
  const filePathToGitIgnore = new Map<string, ignore.Ignore>();
  for (const gitignorePath of gitignorePaths) {
    const gitIgnoreFiles = fs.readFileSync(gitignorePath, "utf-8");
    const gitIgnore = ignore().add(gitIgnoreFiles);
    filePathToGitIgnore.set(gitignorePath, gitIgnore);
  }

  return (path: string) => {
    for (const key of filePathToGitIgnore.keys()) {
      const gitIgnore = filePathToGitIgnore.get(key)!;
      const gitIgnoreDir = nodePath.dirname(key);
      if (isChildPath(path, gitIgnoreDir)) {
        const relativePath = nodePath.relative(gitIgnoreDir, path);
        if (gitIgnore.ignores(relativePath)) {
          return true;
        }
      }
    }
    return false;
  };
}

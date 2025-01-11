import * as fs from "node:fs";
import * as path from "node:path";
import type ts from "typescript";

type TsApi = typeof ts;
type Program = ReturnType<typeof ts.createProgram>;
type TypeChecker = ReturnType<Program["getTypeChecker"]>;
type TransformerFactory = ts.TransformerFactory<ts.SourceFile>;

// Find the project root by searching for package.json upwards
function findProjectRoot(startDir: string): string {
  let currentDir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }
    currentDir = parentDir;
  }
}

// Try to load the user's local TypeScript; return null if not found
function tryLoadUserTypescript(baseDir: string): TsApi | null {
  const projectRoot = findProjectRoot(baseDir);
  const candidatePaths = [baseDir, projectRoot];
  for (const p of candidatePaths) {
    try {
      const tsPath = require.resolve("typescript", { paths: [p] });
      return require(tsPath);
    } catch {}
  }
  return null;
}

// Find tsconfig.json by traversing upwards
function findTsConfigPath(startFilePath: string): string | null {
  let currentDir = path.dirname(startFilePath);
  while (true) {
    const tsconfig = path.join(currentDir, "tsconfig.json");
    if (fs.existsSync(tsconfig)) {
      return tsconfig;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return null;
}

// Create a Program and TypeChecker from tsconfig.json
function createProgramAndChecker(tsconfigPath: string, ts: TsApi) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const config = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  const program = ts.createProgram(config.fileNames, config.options);
  const checker = program.getTypeChecker();
  return { program, checker };
}

// Transform import declarations by adding type info comments
function transformImportCommentsInFile(
  baseDir: string,
  filePath: string,
  ts: TsApi,
  program: Program,
  checker: TypeChecker
): string {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    return fs.readFileSync(path.join(baseDir, filePath), "utf-8");
  }
  const transformer = createImportTypeCommentTransformer(ts, checker);
  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0] as typeof sourceFile;
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const newCode = printer.printFile(transformedSourceFile);
  result.dispose();
  return newCode;
}

function createImportTypeCommentTransformer(
  ts: TsApi,
  checker: TypeChecker
): TransformerFactory {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        const commentText = getFormattedImportComment(ts, node, checker);
        if (commentText) {
          ts.addSyntheticLeadingComment(
            node,
            ts.SyntaxKind.MultiLineCommentTrivia,
            commentText,
            true
          );
        }
        return node;
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };
}

function getFormattedImportComment(
  ts: TsApi,
  importDecl: ts.ImportDeclaration,
  checker: TypeChecker
): string | null {
  if (!importDecl.importClause) {
    return null;
  }
  const { importClause } = importDecl;

  let defaultImportInfo: string | null = null;
  if (importClause.name) {
    defaultImportInfo = getIdentifierTypeString(ts, importClause.name, checker);
  }

  let namedImportsInfo: Array<{ name: string; type: string }> = [];
  let namespaceImportsInfo: Array<{ name: string; type: string }> = [];

  const namedBindings = importClause.namedBindings;
  if (namedBindings) {
    if (ts.isNamedImports(namedBindings)) {
      namedImportsInfo = namedBindings.elements.map((el) => ({
        name: el.name.text,
        type: getIdentifierTypeString(ts, el.name, checker),
      }));
    } else if (ts.isNamespaceImport(namedBindings)) {
      namespaceImportsInfo.push({
        name: namedBindings.name.text,
        type: getIdentifierTypeString(ts, namedBindings.name, checker),
      });
    }
  }

  if (
    !defaultImportInfo &&
    !namedImportsInfo.length &&
    !namespaceImportsInfo.length
  ) {
    return null;
  }

  return formatCommentText({
    defaultImport: defaultImportInfo
      ? { name: importClause.name!.text, type: defaultImportInfo }
      : null,
    namedImports: namedImportsInfo,
    namespaceImports: namespaceImportsInfo,
  });
}

// Get type string for a symbol
function getIdentifierTypeString(
  ts: TsApi,
  ident: ts.Identifier,
  checker: TypeChecker
): string {
  let symbol = checker.getSymbolAtLocation(ident);
  if (!symbol) {
    return "(no symbol)";
  }
  if (symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  if (!symbol.valueDeclaration) {
    return "(no valueDeclaration)";
  }
  const type = checker.getTypeOfSymbolAtLocation(
    symbol,
    symbol.valueDeclaration
  );
  return checker.typeToString(type);
}

// Format final comment text
function formatCommentText(info: {
  defaultImport: { name: string; type: string } | null;
  namedImports: Array<{ name: string; type: string }>;
  namespaceImports: Array<{ name: string; type: string }>;
}): string {
  const lines: string[] = [];
  lines.push("Type information:");
  if (info.defaultImport) {
    lines.push(
      `Default Import: ${info.defaultImport.name} => ${info.defaultImport.type}`
    );
  }
  if (info.namespaceImports.length) {
    lines.push("Namespace Imports:");
    for (const ns of info.namespaceImports) {
      lines.push(`  - ${ns.name} => ${ns.type}`);
    }
  }
  if (info.namedImports.length) {
    lines.push("Named Imports:");
    for (const named of info.namedImports) {
      lines.push(`  - ${named.name} => ${named.type}`);
    }
  }
  return `\n${lines.map((l) => ` * ${l}`).join("\n")}\n `;
}

// Main loader function
export function useTypescriptLoader(baseDir: string) {
  const ts = tryLoadUserTypescript(baseDir);
  if (!ts) {
    return (someFilePath: string) => {
      return fs.readFileSync(path.join(baseDir, someFilePath), "utf-8");
    };
  }
  const tsconfigPath = findTsConfigPath(baseDir);
  if (!tsconfigPath) {
    return (someFilePath: string) => {
      return fs.readFileSync(path.join(baseDir, someFilePath), "utf-8");
    };
  }
  const { program, checker } = createProgramAndChecker(tsconfigPath, ts);
  return (someFilePath: string) => {
    return transformImportCommentsInFile(
      baseDir,
      someFilePath,
      ts,
      program,
      checker
    );
  };
}

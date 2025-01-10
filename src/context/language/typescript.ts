import * as ts from "typescript";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * 指定したファイルパスから上位階層を遡り、tsconfig.json を探す
 */
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

/**
 * tsconfig.json を読み込み、Program と TypeChecker を作成
 */
function createProgramAndChecker(tsconfigPath: string): {
  program: ts.Program;
  checker: ts.TypeChecker;
} {
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

/**
 * 指定した filePath のソースコードに対し、
 * Import 文に「型情報をコメントで補記」するトランスフォームを行い、
 * 変換後のコード文字列を返す
 */
function transformImportCommentsInFile(
  baseDir: string,
  filePath: string,
  program: ts.Program,
  checker: ts.TypeChecker
): string {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    return fs.readFileSync(path.join(baseDir, filePath), "utf-8");
  }

  const transformer = createImportTypeCommentTransformer(checker);
  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0] as ts.SourceFile;

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const newCode = printer.printFile(transformedSourceFile);

  result.dispose();
  return newCode;
}

/**
 * マルチラインコメントを付与するトランスフォーマー
 */
function createImportTypeCommentTransformer(
  checker: ts.TypeChecker
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isImportDeclaration(node)) {
        const commentText = getFormattedImportComment(node, checker);
        if (commentText) {
          // MultiLineCommentTrivia -> /* ... */
          // commentText は中身のみ渡す
          ts.addSyntheticLeadingComment(
            node,
            ts.SyntaxKind.MultiLineCommentTrivia,
            commentText,
            /* hasTrailingNewLine */ true
          );
        }
        return node;
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (sf: ts.SourceFile) => ts.visitNode(sf, visit) as ts.SourceFile;
  };
}

/**
 * ImportDeclaration からコメント用テキストを生成
 */
function getFormattedImportComment(
  importDecl: ts.ImportDeclaration,
  checker: ts.TypeChecker
): string | null {
  if (!importDecl.importClause) {
    return null;
  }
  const importClause = importDecl.importClause;

  let defaultImportInfo: string | null = null;
  if (importClause.name) {
    defaultImportInfo = getIdentifierTypeString(importClause.name, checker);
  }

  let namedImportsInfo: Array<{ name: string; type: string }> = [];
  let namespaceImportsInfo: Array<{ name: string; type: string }> = [];

  const namedBindings = importClause.namedBindings;
  if (namedBindings) {
    if (ts.isNamedImports(namedBindings)) {
      namedImportsInfo = namedBindings.elements.map((element) => ({
        name: element.name.text,
        type: getIdentifierTypeString(element.name, checker),
      }));
    } else if (ts.isNamespaceImport(namedBindings)) {
      namespaceImportsInfo.push({
        name: namedBindings.name.text,
        type: getIdentifierTypeString(namedBindings.name, checker),
      });
    }
  }

  if (
    !defaultImportInfo &&
    namedImportsInfo.length === 0 &&
    namespaceImportsInfo.length === 0
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

/**
 * シンボルから型情報を取得するヘルパー
 */
function getIdentifierTypeString(
  ident: ts.Identifier,
  checker: ts.TypeChecker
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

/**
 * コメント文字列を組み立てる
 * ここで改行をしっかり入れて見やすく調整する
 */
function formatCommentText(info: {
  defaultImport: { name: string; type: string } | null;
  namedImports: Array<{ name: string; type: string }>;
  namespaceImports: Array<{ name: string; type: string }>;
}): string {
  const lines: string[] = [];

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

  // ここで先頭・末尾を含め、整形
  // 実際にソースコードに出力されるのは: /* ... */ （両端は TS Compiler が付加）
  // なので、中身だけ下記のように

  // 例:
  //  * Namespace Imports:
  //  *   - vscode => ...
  //  *
  // 最後に空行を入れることで区切りがきれいになる
  const content = lines.map((l) => ` * ${l}`).join("\n");
  return `\n${content}\n `;
}

export function useTypescriptLoader(baseDir: string) {
  const tsconfigPath = findTsConfigPath(baseDir);
  if (!tsconfigPath) {
    return (someFilePath: string) => {
      return fs.readFileSync(path.join(baseDir, someFilePath), "utf-8");
    };
  }

  const { program, checker } = createProgramAndChecker(tsconfigPath);

  return (someFilePath: string) => {
    return transformImportCommentsInFile(
      baseDir,
      someFilePath,
      program,
      checker
    );
  };
}

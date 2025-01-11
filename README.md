# Contextualize: Generate LLM Context

This extension generates a consolidated document that includes a **file tree, source code, and (TypeScript type information)** for a selected directory.  
It's particularly useful for scenarios like providing code context to Large Language Models (LLMs) or gaining an overview of project dependencies.

## Features

1. **Recursive Directory Traversal**  
   Scans all files within the selected directory and subdirectories, displaying their hierarchy as a tree structure along with the file contents.

2. **TypeScript Type Information**  
   For TypeScript files, comments with symbol type information are automatically added to `import` statements.  
   Example:

   ```ts
   /*
    * Default Import: something => SomeType
    * Named Imports:
    *   - foo => FooType
    */
   import something, { foo } from "some-module";
   ```

   This makes it easy to understand the types being imported and provides valuable context for LLMs or code reviews.

---

## Installation

1. Search for **`Contextualize`** in the Visual Studio Code Extensions panel and install it,  
   or visit [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=baseballyama.contextualize) to download and install it directly.
2. Restart Visual Studio Code to activate the extension.

---

## Usage

1. In the VSCode Explorer, **right-click the directory** you want to summarize.
2. From the context menu, select **`Generate LLM Context`**.
3. Once executed, the extension will recursively scan all files in the selected directory and open a document in the editor containing:
   1. A directory tree structure.
   2. File contents (TypeScript files will have type information comments added to `import` statements).

### Example Output

```
#File Tree
|- src
    |- index.ts
    |- utils
        |- helper.ts

//#region src/index.ts
(file contents)
//#endregion

//#region src/utils/helper.ts
(file contents)
//#endregion
```

---

## Recommended Use Cases

- **Providing Context to LLMs**  
  Generate a single document summarizing all files, making it easy to provide code context to LLMs for tasks like code reviews or AI-assisted development.
- **Understanding Type Information**  
  Type annotations for TypeScript `import` statements make it easier to review dependencies and their types.

---

## Notes

- Files other than TypeScript (e.g., `.js`, `.json`, `.md`) are included as-is, without additional comments or transformations.
- For large projects with deep directory structures or many files, processing and document generation may take some time.
- Please ensure your system has sufficient resources when using this extension on large-scale projects.

---

## License

This extension is released under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

We look forward to your feedback and suggestions!  
Please report issues or contribute via the [GitHub Repository](https://github.com/username/repository).

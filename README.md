# Contextualize

**Contextualize** is a VS Code extension that generates context information for Large Language Models (LLMs) by analyzing selected files or folders. This includes a structured file tree and the source code content, making it ideal for sharing code context with AI tools like ChatGPT. It also supports automatic dependency resolution and TypeScript type annotations for imports.

---

## Installation

Install the extension from the Visual Studio Marketplace:

- [**Contextualize** on Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=baseballyama.contextualize)

---

## Features

1. **Generate LLM Context:**

- Create a document with a file tree and source code from selected files or folders.
- The output includes `# File Tree` and `# SourceCode` sections, ready to share with LLMs.

1. **Dependency Resolution (Optional):**

- Use the `Generate LLM Context With Dependencies` command to recursively resolve and include dependency files (e.g., imports or `require` statements).
- Automatically excludes files and folders ignored by `.gitignore`.

1. **TypeScript Type Information (Optional):**

- When enabled via settings, TypeScript type information is added as comments above import statements in the generated context.
- Example:
  ```typescript
  /*
   * Type information:
   *   - importName => SomeType
   */
  import { importName } from "./module";
  ```

---

## Usage

1. **Select Files or Folders:**

- In VS Code, select files or folders from the Explorer view.
- Multiple selections are supported.

1. **Review the Output:**

- After the command executes, a new document opens with:
  - `# File Tree`: A tree structure of the selected files.
  - `# SourceCode`: The content of the files.

1. **Copy and Share:**

- Copy the output and share it with LLMs or use it for documentation.

---

## Settings

You can customize the extension using the following settings:

- **`contextualize.addTypeScriptTypes`:**  
  Enables or disables TypeScript type annotations in the output.
  - Example:
    ```typescript
    /*
     * Type information:
     *   - importName => SomeType
     */
    ```
    Set to `true` to include comments with type information for imports.

To configure, open VS Code settings and search for `contextualize`.

---

## Notes

- Files and folders listed in `.gitignore` are automatically excluded.
- TypeScript type annotations require a valid `tsconfig.json` file and a locally installed TypeScript package.
- Dependency resolution relies on VS Code's "Go to Definition" functionality and may not work perfectly in some cases.

---

Thank you for using Contextualize! If you encounter any issues or have suggestions, please share your feedback.

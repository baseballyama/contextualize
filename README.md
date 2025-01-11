# Contextualize: Generate LLM Context & More

This VSCode extension provides several features to help you understand your codebase and integrate with Large Language Models (LLMs):

1. **Scans directories** to generate a document that includes a file tree, source code, and (optional) TypeScript type information.
2. **Generates custom prompts** by injecting your code into user-defined templates.
3. **Applies merge conflict markers** directly to your workspace.

---

## Table of Contents

- [Contextualize: Generate LLM Context \& More](#contextualize-generate-llm-context--more)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Generate LLM Context](#generate-llm-context)
    - [Generate Prompt](#generate-prompt)
    - [Apply Conflict Markers](#apply-conflict-markers)
  - [Configuration](#configuration)
  - [Notes](#notes)
  - [License](#license)

---

## Features

1. **Recursive Directory Traversal**  
   Recursively scans all files within the selected directory and its subdirectories, displaying a file tree along with file contents.

2. **TypeScript Type Information (Optional)**  
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

3. **Custom Prompt Generation**  
   Define your own prompts (questions, instructions, etc.) in VSCode settings. The extension then injects your **entire code** (for a selected directory) into the chosen prompt template.

4. **Apply Merge Conflict Markers**  
   Paste your conflict/diff code (with markers like `<<<<<<< ORIGINAL` and `>>>>>>> UPDATED`) into a diff document and automatically apply the changes to the corresponding files in your workspace.

---

## Installation

1. Search for **`Contextualize`** in the Visual Studio Code Extensions panel and install it.  
   Alternatively, visit [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=baseballyama.contextualize) to download and install it directly.
2. Restart Visual Studio Code to activate the extension.

---

## Usage

### Generate LLM Context

1. In the VSCode Explorer, **right-click the directory** you want to summarize and select **`Generate LLM Context`**.
2. The extension scans the selected directory recursively and opens a document containing:
   - A file tree structure.
   - File contents (TypeScript files include optional type information in comments, if configured).

**Example Output**:

```
#### File Tree
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

### Generate Prompt

1. In the VSCode Explorer, **right-click the directory** you want to summarize and select **`Generate Prompt`**.
2. A **Quick Pick** menu will display all configured prompts (see [Configuration](#configuration) for details on defining prompts).
3. Select a prompt, and the extension will:
   - Recursively collect all files in the selected directory.
   - Insert the code into the chosen prompt template (replacing `{code}`).
   - Open a new untitled document containing the **generated prompt**.

Use this feature to quickly create context-rich prompts for LLMs or AI tools.

---

### Apply Conflict Markers

You can use this extension to **apply merge conflict markers** from a diff directly to your workspace:

1. In the VSCode Explorer, **right-click the directory** where you want to apply conflicts and select **`Apply Conflict Markers`**.
2. A new diff document will open with a placeholder.  
   Remove the placeholder and **paste your diff** or conflict markers (e.g., `<<<<<<< ORIGINAL … ======= … >>>>>>> UPDATED`).
3. When prompted to **Apply Changes**, the extension will parse your diff and replace the conflict lines in the corresponding files.

This feature is particularly useful when applying partial diffs or conflicts received from code reviews or external sources.

---

## Configuration

Open your VSCode settings (`File > Preferences > Settings`) and search for `contextualize`. The extension supports the following settings:

- **`contextualize.addTypeScriptTypes`** (boolean)

  - **Default**: `true`
  - When enabled, the extension attempts to add type information to TypeScript `import` statements.
  - Requires a valid local installation of TypeScript and a `tsconfig.json` to provide accurate type data.

- **`contextualize.prompts`** (array)
  - An array of custom prompts you can use with **`Generate Prompt`**.
  - Each prompt object has the following shape:
    ```jsonc
    {
      "title": "Example Prompt Title",
      "prompt": "Please analyze the following code:\n{code}\nWhat do you think?"
    }
    ```
  - Within your `prompt` string, **use `{code}`** where you want the collected code to be inserted.

**Example Settings** (`settings.json`):

```jsonc
{
  "contextualize.addTypeScriptTypes": true,
  "contextualize.prompts": [
    {
      "title": "Refactor Suggestions",
      "prompt": "Analyze the following code for any refactoring opportunities:\n{code}"
    },
    {
      "title": "Bug Investigation",
      "prompt": "Please look at this code and list potential bugs:\n{code}"
    }
  ]
}
```

---

## Notes

- **Non-TypeScript Files**  
  Files such as `.js`, `.json`, and `.md` are included as-is, without additional comments or transformations.

- **Large Projects**  
  For projects with many files or deep directory structures, processing might take time. Ensure your system has sufficient resources.

- **Applying Merge Conflicts**  
  The conflict parser expects a standard Git-like format. Ensure lines like `<<<<<<< ORIGINAL`, `=======`, `>>>>>>> UPDATED`, and the file name above `<<<<<<< ORIGINAL` are properly formatted for accurate parsing.

- **Local TypeScript**  
  If `contextualize.addTypeScriptTypes` is `true` but no local TypeScript installation or valid `tsconfig.json` is found, type information will not be added.

---

## License

This extension is released under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

We hope this extension enhances your development workflow!  
Feel free to report issues or contribute via the [GitHub Repository](https://github.com/username/repository).

Happy coding!

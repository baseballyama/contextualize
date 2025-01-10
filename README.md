# contextualize

🚀 Seamlessly generate and manage contextual setups for ChatGPT in VSCode.

## Features

`contextualize` is a VSCode extension designed to enhance your development workflow by allowing you to quickly generate context-sensitive setups for ChatGPT. It provides intuitive options directly in the file explorer for creating, managing, and using contextual prompts.

### Key Features:

- **Folder-Specific Contexts**: Right-click on a folder to generate contextual prompts tailored to its contents.
- **Customizable Prompts**: Modify generated prompts to better fit your use case.
- **Streamlined Workflow**: Quickly access context generation tools without leaving your editor.

## Installation

1. Open VSCode.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. Search for "contextualize".
4. Click **Install**.

## Usage

### Right-Click Context Menu

1. Open the VSCode file explorer.
2. **Right-click** on a folder or file.
3. Select `Generate LLM Context` from the context menu.
4. A notification will display the selected path, and a context setup will be generated.

### Command Palette

You can also use the Command Palette to run the extension’s commands:

1. Press `Ctrl+Shift+P` or `Cmd+Shift+P` to open the Command Palette.
2. Type `Generate LLM Context`.
3. Select the command and follow the instructions.

## Extension Settings

This extension does not currently have customizable settings. Future updates will include:

- Default prompt templates.
- Integration with external tools or APIs.

## Known Issues

- The command might not appear in the context menu if the extension is not activated. Ensure the folder or file is selected properly.
- For files larger than a certain size, generation may take longer than expected.

## Release Notes

### 0.0.1

- Initial release.
- Added folder-specific context generation.
- Included right-click menu integration.

## Contributing

We welcome contributions! Feel free to open an issue or submit a pull request on [GitHub](https://github.com/your-repo/contextualize).

## License

This project is licensed under the MIT License. See the LICENSE file for details.

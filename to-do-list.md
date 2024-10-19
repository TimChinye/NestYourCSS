# To-do List

## Next up:
- List up all the settings that can be done quickly, and design the settings panel.

## To-do now:
- Change indentation setting
- Show the file size of both CSS outputs
- Add button to include samples of CSS
- Show list of errors, and a button to jump to them
- Implement ability to send a link of a CSS file
- Mention it's recommended to use `diff` and add in the old CSS selectors to the new (since this tool also reformats code and removes comments)

## List of (potential) parts to add to the site:
- History of all conversions to Nested CSS
  - Auto-save every minute? Or just "Nest" button (probably both, with a toggleable auto-save)
- Button to use the previous selector instead (a.k.a. previous `diff`, but only for selectors) edit: not sure why this is only for selectors
- Paredit may be useful
- Keyboard Shortcuts extension has a lot of useful stuff
- Will have to re-develop to limit features and re-design.
- Add a minimap (might need to DIY)
- Sticky Scroll – Official Ace Extensions (DIY)
- Add a Table of Contents page within settings section (similar to Figma's Layers component) for all nested selectors within the code editor
- Add an anti-adblock background, along with a border

## Later:
- Full revamp
- Design the nesting editors, similar to Google Docs (centered editors, toolbar at the top)
- Make the nesting settings area have a fixed width and center the editors within the nesting area
- Implement locomotive scroll or another momentum scroll plugin (e.g., [locomotive-scroll](https://github.com/locomotivemtl/locomotive-scroll))
- Provide information on how to manually nest your CSS
- Add AceDiff
- Add light/dark mode toggle
- Allow input for both HTML and CSS code, and display the Nested CSS output
- Add support for comments (may require a code revamp)
- Enable nesting multiple CSS files simultaneously
- Option to allow Emmet

## Code to go to a specific line in Ace Editor:

```javascript
// Assuming 'editor' is your Ace Editor instance
var lineNumber = 10; // Replace with your desired line number

// Get the content of the line
var lineContent = editor.session.getLine(lineNumber - 1); // Ace Editor uses 0-based index

// Scroll to the line
editor.scrollToLine(lineNumber, true, true, function () {});

// Optionally, highlight the line
editor.gotoLine(lineNumber, 0, true);

console.log("Line Content: ", lineContent);
```
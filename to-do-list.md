# To-do List

## Next up:
- List up all the settings that can be done quickly, and design the settings panel.

## To-do now, before [release]:
- Allow the `input.css` file can be clicked on, when it’s clicked on it turns into an input field with the placeholder text “Insert url...”, if you un-focus it or press enter goes back to “input.css”, if you provide a url and then un-focus it or press enter, it’ll inject the css to into the editor, and change the file name from “input.css” to the provided file’s name (or if it’s too long or doesn’t end with .css: “provided.css”, “linked.css” or “external.css”)
- Provide functionality for the 5 buttons on the hero section (link to github, view history, view settings, report bugs, share feedback) 
- Mobile version - design & develop

## List of (potential) parts to add to the site:
- History of all conversions to Nested CSS
- Auto-save every minute? Or just "Nest" button (probably both, with a toggleable auto-save)
- Button to use the previous selector instead (a.k.a. previous `diff`, but only for selectors) edit: not sure why this is only for selectors
- Paredit may be useful
- Keyboard Shortcuts extension has a lot of useful stuff
- Will have to re-develop to limit features and re-design.
- Add a minimap (might need to DIY)
- Show minimap checkbox (and scroll using it?)
- Sticky Scroll – Official Ace Extensions (DIY)
Button to enable diffs (and a note of sorts to recommend use it as this tool re-formats code & removes comments
- List Keyboard shortcuts + allow the creation of custom ones
- Allow Editor Customization [Demo](https://ace.c9.io/demo/keyboard_shortcuts.html)
- Add a Table of Contents page within settings section (similar to Figma's Layers component) for all nested selectors within the code editor
- Add an anti-adblock background, along with a border

## Much later:
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
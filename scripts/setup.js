async function setupEditors() {
  await waitForVar('cssSamples');
  let sample = cssSamples[window.cssSample] ?? cssSamples["unnestedShowcase"];

  await waitForVar('LanguageProvider');
  const provider = LanguageProvider.fromCdn("https://www.unpkg.com/ace-linters@1.2.3/build/");

  inputEditorInstance = initEditor("inputEditor", "The editor to input CSS code that will be minified/nested/denested.", sample || '/* Your input CSS should go here */');
  outputEditorInstance = initEditor("outputEditor", "The editor that outputs the CSS code that will be minified/nested/denested.", '/* Your output CSS will appear here */');

  // Auto Nest
  let codeChanged = false;
  let isProcessing = false;

  inputEditorInstance.getSession().on('change', () => ((typeof window.appIsInitializing !== 'undefined' && !window.appIsInitializing) && (window.processAuto ?? true)) && (codeChanged = true));

  inputEditorInstance.getSession().on('changeAnnotation', () => {
    if ((!window.appIsInitializing) && (window.processAuto ?? true) && !isProcessing) {
      isProcessing = true;

      setTimeout(() => {
        if (codeChanged) {
          nestCode();
          codeChanged = false;
        }

        isProcessing = false;
      }, 0);
    }
  });

  /**
   * Initializes an Ace editor
   * 
   * @param {string} editorId The DOM ID of the element to turn into an editor.
   * @param {string} labelDescription The DOM ID of the <label> element for the editor.
   * @param {string} value The initial code/text to place in the editor.
   * @returns {ace.Editor} The configured Ace editor instance.
   */
  function initEditor(editorId, labelDescription, value) {
    const editor = ace.edit(editorId, {
      // --- Accessibility & Usability Options ---
      mode: "ace/mode/css",
      showPrintMargin: false,
    });
  
    // --- Core Accessibility: Focus Management ---
  
    // 1. Allow tabbing out of the editor
    // By default, Tab inserts a tab character. We override this.
    // Returning 'false' tells Ace to let the browser handle the event.
    editor.commands.addCommand({
      name: "tabOutForward",
      bindKey: { win: "Tab", mac: "Tab" },
      exec: () => false, // Let the browser handle focus change
    });
  
    editor.commands.addCommand({
      name: "tabOutBack",
      bindKey: { win: "Shift-Tab", mac: "Shift-Tab" },
      exec: () => false, // Let the browser handle focus change
    });
  
    // 2. Use Escape to blur the editor (exit typing mode)
    editor.commands.addCommand({
      name: "blurEditor",
      bindKey: { win: "Esc", mac: "Esc" },
      exec: (editor) => editor.blur(),
    });
    
    // 3. Provide an alternate way to indent/outdent
    // Since Tab is for navigation, we need a new keybinding for indentation.
    // Ctrl+] and Ctrl+[ is a common and intuitive convention.
    editor.commands.addCommand({
      name: "indentWithCtrl",
      bindKey: { win: "Ctrl-]", mac: "Command-]" },
      exec: (editor) => editor.indent(),
    });
    
    editor.commands.addCommand({
      name: "outdentWithCtrl",
      bindKey: { win: "Ctrl-[", mac: "Command-[" },
      exec: (editor) => editor.blockOutdent(),
    });
  
    // --- Core Accessibility: Screen Reader Support (ARIA) ---
  
    // 1. Get the actual <textarea> that Ace uses internally.
    const textarea = editor.textInput.getElement();
    textarea.setAttribute("aria-labelledby", labelDescription);
  
  
    // --- Your Original Functionality (Preserved) ---
    editor.setValue(value, -1); // -1 moves cursor to the start
    editor.setAnimatedScroll(true);
  
    // This is a clever trick for custom styling, keeping it.
    editor.renderer.on('afterRender', () => {
      const gutter = editor.container.querySelector('.ace_gutter');
      const scrollbarH = editor.container.querySelector('.ace_scrollbar-h');
      if (gutter && scrollbarH) {
        scrollbarH.style.setProperty('--gutter-width', gutter.style.width);
      }
    });

    editor.session.selection.on('changeCursor', () => updateCoordinateDisplay(editor));
  
    provider.registerEditor(editor);
    return editor;
  }

  let inputEditorElem = inputEditorInstance.container;
  let outputEditorElem = inputEditorElem.parentElement.lastElementChild;

  const shadowCount = 3;

  function createButton(idSuffix, className, isShadowEditor, accessibleLabel) {
    const button = document.createElement("button");
    button.id = idSuffix;
    button.classList.add(className);
    if (isShadowEditor) button.setAttribute('aria-hidden', 'true');
    else {
      button.setAttribute('aria-label', accessibleLabel);
      button.addEventListener("click", tabButtonHandler);
    }
    return button;
  }

  function createEditorTab(editor, isInputEditor, isShadowEditor) {
    const editorName = editor.id.slice(0, -"Editor".length);

    const editorTab = document.createElement("div");
    editorTab.classList.add('editorTab');

    const fileName = document.createElement("div");
    fileName.classList.add('fileName');
    fileName.textContent = `${editorName}.css`;

    const tabButtons = document.createElement("div");
    tabButtons.classList.add('tabButtons');

    // Add buttons to the tab
    tabButtons.appendChild(createButton(`${editorName}TabCopyAll`, 'tabCopyAll', isShadowEditor, 'Copy all input code'));

    if (isInputEditor) {
      if (!isShadowEditor) {
        let fileReader = new FileReader();
        let fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".css";

        // Set up an event listener for file selection
        fileInput.addEventListener("change", (event) => {
          if (file = event.target.files[0]) {
            fileReader.onload = (e) => inputEditorInstance.setValue(e.target.result);
            fileReader.readAsText(file);
          };
        });

        // Add event listeners for drag-and-drop functionality
        setupDragAndDrop(editor);
        
        window.insertCSSFileInput = fileInput;
      }
      
      tabButtons.appendChild(createButton(`${editorName}TabInsertCSS`, 'tabInsertCSS', isShadowEditor, 'Insert sample CSS into input'));
    } else {
      tabButtons.appendChild(createButton(`${editorName}TabOpenRaw`, 'tabOpenRaw', isShadowEditor, 'Open CSS as Raw'));
    }

    tabButtons.appendChild(createButton(`${editorName}TabDeleteAll`, 'tabDeleteAll', isShadowEditor, 'Delete all input code'));

    // Add file name and buttons to the tab
    editorTab.appendChild(fileName);
    editorTab.appendChild(tabButtons);

    return editorTab;
  }

  function wrapEditorWithGroup(editor, editorTab) {
    const wrapperElement = document.createElement("div");
    wrapperElement.id = `${editor.id}Wrapper`;
    wrapperElement.classList.add('editorWrapper');

    // Find the fileName div inside the tab you passed in
    const fileNameDiv = editorTab.querySelector('.fileName');
    if (fileNameDiv) {
      // Give the filename div a unique ID so we can reference it
      const labelId = `${editor.id}-label`;
      fileNameDiv.id = labelId;

      // 1. Make the wrapper a landmark "region"
      wrapperElement.setAttribute('role', 'region');
      // 2. Label this entire region with the filename
      wrapperElement.setAttribute('aria-labelledby', labelId);
    }

    const editorGroup = document.createElement("div");
    editorGroup.classList.add('editorGroup');

    // Replace the editor with its wrapper
    editor.replaceWith(wrapperElement);
    editor.classList.add('editor');

    // Append tab and editor to the group, then to the wrapper
    editorGroup.appendChild(editorTab);
    editorGroup.appendChild(editor);
    wrapperElement.appendChild(editorGroup);
  }

  // Wrap both input and output editors
  [inputEditorElem, outputEditorElem].forEach((editor) => {
    const editorTab = createEditorTab(editor, editor === inputEditorElem, false);
    wrapEditorWithGroup(editor, editorTab);
    updateCoordinateDisplay(ace.edit(editor));
  });

  // Shadow editor creation
  const shadowWrapperElement = document.createElement("div");
  shadowWrapperElement.id = "shadowEditorsWrapper";
  shadowWrapperElement.inert = true;
  shadowWrapperElement.ariaHidden = true;
  inputEditorElem.parentElement.after(shadowWrapperElement);

  const shadowEditors = Array.from({ length: shadowCount }, () => {
    const shadowEditorGroup = document.createElement("div");
    shadowEditorGroup.classList.add('editorGroup');

    const shadowEditorTab = createEditorTab(inputEditorElem, true, true);
    shadowEditorGroup.appendChild(shadowEditorTab);

    const shadowEditor = document.createElement("div");
    shadowEditor.className = `${inputEditorElem.className} shadowEditor`;
    shadowEditor.innerHTML = inputEditorElem.innerHTML;
    shadowEditorGroup.appendChild(shadowEditor);

    shadowWrapperElement.appendChild(shadowEditorGroup);
    return shadowEditor;
  });

  // Resize and reposition shadow editors
  function styleShadowEditors() {
    const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const convertPxToRem = (px) => px / remInPixels;
    
    const shadowHeightDiff = inputEditorElem.offsetHeight / 10;
    const baseShadowOpacity = 0.5;
    const baseShadowBlur = 2;
    const maxWidth = inputEditorElem.offsetWidth * 2;
    let baseShadowWidth = inputEditorElem.offsetWidth / 4;
    let shadowWidthDiff = baseShadowWidth / 15;
    let previousShadowTranslation = 0;


    // if (((2 * baseShadowWidth) + (shadowWidthDiff / 7.5)) > maxWidth + 50) { /* The first part simplifies to 32/15 */
    if (((32 / 15) * baseShadowWidth) > maxWidth) {
      baseShadowWidth = maxWidth * (5/12); /* 5/12 because the shadow widths are split into: 3/6 4/5 5/6 of inputEditorElem, the biggest/base one is 5/6, and maxWidth is 2x of the inputEditorElem, therefore 5/12 */
      shadowWidthDiff = baseShadowWidth / 15;
    }

    shadowEditors.forEach((shadowEditor, index) => {
      const shadowEditorWrapper = document.createElement("div");
      shadowEditorWrapper.classList.add("shadowEditorWrapper", "editorWrapper");
      shadowEditor.parentElement.replaceWith(shadowEditorWrapper);
      shadowEditorWrapper.appendChild(shadowEditor.parentElement);

      let scaleValue = ((inputEditorElem.offsetHeight * 0.8) - (shadowHeightDiff * (index + 1))) / inputEditorElem.offsetHeight;
      shadowEditor.parentElement.style.transform = `scale(${scaleValue})`;

      let shadowWidth = baseShadowWidth - ((shadowWidthDiff * 2.5) * (index + 1));
      shadowEditorWrapper.style.width = `${convertPxToRem(shadowWidth)}rem`;
      
      previousShadowTranslation += shadowWidth + (2 * shadowWidthDiff);
      shadowEditorWrapper.style.translate = `-${convertPxToRem(previousShadowTranslation)}rem`;

      shadowEditorWrapper.style.opacity = baseShadowOpacity - index / 10;
      shadowEditor.parentElement.style.filter = `blur(${Math.pow(baseShadowBlur, index + 1)}px)`;
      shadowEditorWrapper.style.backgroundColor = `rgb(from white r g b / ${(2 - index)}%)`;
    });
  }

  styleShadowEditors();

  // A flag to track the paused/resumed state of the content observer.
  let isContentObserverPaused = false;

  // We need a stable reference to the main element and the wrapper for our checks.
  const shadowEditorsWrapper = shadowEditors[0].closest('#shadowEditorsWrapper');

  // --- Observer 1: Updates shadow editors (your original observer, but modified) ---
  const contentObserver = new MutationObserver(() => {
    // If the observer is "paused", do nothing.
    if (isContentObserverPaused) return;

    requestAnimationFrame(() => {
      // 1. Copy content to shadow editors (this logic is unchanged).
      shadowEditors.forEach((shadowEditor) => {
        shadowEditor.innerHTML = inputEditorElem.innerHTML;
      });

      // 2. Check if we need to "pause" the observer.
      // This happens when the element is hidden.
      const isHidden = mainElement.classList.contains('nesting') && parseInt(window.getComputedStyle(shadowEditorsWrapper.parentElement.parentElement).opacity) == 0;

      if (isHidden) {
        // "Pause" the observer by disconnecting it and updating our flag.
        // We no longer remove any elements.
        contentObserver.disconnect();
        isContentObserverPaused = true;
      }
    });
  });

  // --- Observer 2: Resumes the content observer when visibility is restored ---
  const visibilityObserver = new MutationObserver(() => {
    // Only proceed if the content observer is currently paused.
    if (!isContentObserverPaused) return;

    // Check if the element has become visible again.
    const isVisible = !mainElement.classList.contains('nesting') || parseInt(window.getComputedStyle(shadowEditorsWrapper.parentElement.parentElement).opacity) > 0;

    if (isVisible) {
      // "Resume" the observer by calling .observe() again with the original settings.
      contentObserver.observe(inputEditorElem, {
        childList: true,
        subtree: true,
        characterData: true
      });
      isContentObserverPaused = false;
    }
  });

  // --- Initial Start of Observers ---

  // 1. Start the content observer.
  contentObserver.observe(inputEditorElem, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // 2. Start the visibility observer to watch for class changes on the <main> element.
  // This is what will trigger our "resume" check.
  visibilityObserver.observe(mainElement, {
    attributes: true, // We specifically care about attribute changes (like the 'class' attribute).
    attributeFilter: ['class'] // Optional: More efficient, only fire for class changes.
  });
}

setupEditors();

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('#strechingText, #visibleText > u > strong');

  elements.forEach(element => {
    splitTextForAnimation(element);
  });
});

function updateCoordinateDisplay(editor) {
  let { row, column } = editor.getCursorPosition();

  let cursorText = "";
  switch (window.coordDisplayMode ??= 3) {
    case 0:
      cursorText = ` | Ln ${++row}, Col ${column}`;
      break;
    case 1:
      cursorText = ` | Ln ${++row}`;
      break;
    case 2:
      cursorText = ` | Col ${column}`;
      break;
    case 3:
    default:
      cursorText = "";
  }

  editor.container.previousElementSibling.firstElementChild.setAttribute('cursor', cursorText);
}


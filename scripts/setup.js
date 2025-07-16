async function setupEditors() {
  await waitForVar('cssSamples');
  let sample = cssSamples[window.cssSample] ?? cssSamples["unnestedShowcase"];

  await waitForVar('LanguageProvider');
  const provider = LanguageProvider.fromCdn("https://www.unpkg.com/ace-linters@1.2.3/build/");

  inputEditorInstance = initEditor("inputEditor", sample || '/* Your input CSS should go here */');
  outputEditorInstance = initEditor("outputEditor", '/* Your output CSS will appear here */');

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

  function initEditor(editorId, value) {
    const editor = ace.edit(editorId, {
      mode: "ace/mode/css",
      showPrintMargin: false
    });

    editor.setValue(value, -1);
    provider.registerEditor(editor);
    editor.setAnimatedScroll(true);

    editor.renderer.on('afterRender', () => {
        editor.container.getElementsByClassName('ace_scrollbar-h')[0].style.setProperty('--gutter-width', editor.container.getElementsByClassName('ace_gutter')[0].style.width);
    });

    editor.session.selection.on('changeCursor', () => updateCoordinateDisplay(editor));
    
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
  inputEditorElem.parentElement.after(shadowWrapperElement);

  const shadowEditors = Array.from({ length: shadowCount }, (_, i) => {
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
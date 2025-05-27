const setupEditors = () => {
  let sample = cssSamples[window.cssSample] ?? cssSamples["unnestedShowcase"];

  const provider = LanguageProvider.fromCdn("https://www.unpkg.com/ace-linters@1.2.3/build/");

  window.inputEditor = initializeEditor("inputEditor", sample || '/* Your input CSS should go here */');
  window.outputEditor = initializeEditor("outputEditor", '/* Your output CSS will appear here */');

  // Auto Nest
  let codeChanged = false;
  let isProcessing = false;

  window.inputEditor.getSession().on('change', () => (window.processAuto ?? true) && (codeChanged = true));

  window.inputEditor.getSession().on('changeAnnotation', () => {
    if ((window.processAuto ?? true) && !isProcessing) {
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

  function initializeEditor(editorId, value) {
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

  let inputEditor = window.inputEditor.container;
  let outputEditor = inputEditor.parentElement.lastElementChild;

  const shadowCount = 3;

  function createButton(idSuffix, className, isShadowEditor) {
    const button = document.createElement("button");
    button.id = idSuffix;
    button.classList.add(className);
    if (!isShadowEditor) button.addEventListener("click", tabButtonHandler);
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
    tabButtons.appendChild(createButton(`${editorName}TabCopyAll`, 'tabCopyAll', isShadowEditor));

    if (isInputEditor) {
      if (!isShadowEditor) {
        let fileReader = new FileReader();
        let fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".css";

        // Set up an event listener for file selection
        fileInput.addEventListener("change", (event) => {
          if (file = event.target.files[0]) {
            fileReader.onload = (e) => window.inputEditor.setValue(e.target.result);
            fileReader.readAsText(file);
          };
        });

        // Add event listeners for drag-and-drop functionality
        setupDragAndDrop(editor);
        
        window.insertCSSFileInput = fileInput;
      }
      
      tabButtons.appendChild(createButton(`${editorName}TabInsertCSS`, 'tabInsertCSS', isShadowEditor));
    } else {
      tabButtons.appendChild(createButton(`${editorName}TabOpenRaw`, 'tabOpenRaw', isShadowEditor));
    }

    tabButtons.appendChild(createButton(`${editorName}TabDeleteAll`, 'tabDeleteAll', isShadowEditor));

    // Add file name and buttons to the tab
    editorTab.appendChild(fileName);
    editorTab.appendChild(tabButtons);

    return editorTab;
  }

  function wrapEditorWithGroup(editor, editorTab) {
    const wrapperElement = document.createElement("div");
    wrapperElement.id = `${editor.id}Wrapper`;
    wrapperElement.classList.add('editorWrapper');

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
  [inputEditor, outputEditor].forEach((editor) => {
    const editorTab = createEditorTab(editor, editor === inputEditor, false);
    wrapEditorWithGroup(editor, editorTab);
    updateCoordinateDisplay(ace.edit(editor));
  });

  // Shadow editor creation
  const shadowWrapperElement = document.createElement("div");
  shadowWrapperElement.id = "shadowEditorsWrapper";
  inputEditor.parentElement.after(shadowWrapperElement);

  const shadowEditors = Array.from({ length: shadowCount }, (_, i) => {
    const shadowEditorGroup = document.createElement("div");
    shadowEditorGroup.classList.add('editorGroup');

    const shadowEditorTab = createEditorTab(inputEditor, true, true);
    shadowEditorGroup.appendChild(shadowEditorTab);

    const shadowEditor = document.createElement("div");
    shadowEditor.className = `${inputEditor.className} shadowEditor`;
    shadowEditor.innerHTML = inputEditor.innerHTML;
    shadowEditorGroup.appendChild(shadowEditor);

    shadowWrapperElement.appendChild(shadowEditorGroup);
    return shadowEditor;
  });

  // Resize and reposition shadow editors
  function styleShadowEditors() {
    const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const convertPxToRch = (px) => (px * (16 / remInPixels)) / (16 * 0.65);
    
    const shadowHeightDiff = inputEditor.offsetHeight / 10;
    const baseShadowOpacity = 0.5;
    const baseShadowBlur = 2;
    const maxWidth = parseFloat(document.getElementById('textSide').offsetWidth) + (remInPixels / 0.35); /* I don't know why remInPixels * "0.35" works, but it does */
    let baseShadowWidth = inputEditor.offsetWidth / 3;
    let shadowWidthDiff = baseShadowWidth / 15;
    let previousShadowTranslation = 0;

    // if (((2 * baseShadowWidth) + (shadowWidthDiff / 7.5)) > maxWidth + 50) { /* The first part simplifies to 32/15 */
    if (((32 / 15) * baseShadowWidth) > maxWidth) {
      baseShadowWidth = maxWidth * (5/12); /* 5/12 because the shadow widths are split into: 3/6 4/5 5/6 of inputEditor, the biggest/base one is 5/6, and maxWidth is 2x of the inputEditor, therefore 5/12 */
      shadowWidthDiff = baseShadowWidth / 15;
    }

    shadowEditors.forEach((shadowEditor, index) => {
      const shadowEditorWrapper = document.createElement("div");
      shadowEditorWrapper.classList.add("shadowEditorWrapper", "editorWrapper");
      shadowEditor.parentElement.replaceWith(shadowEditorWrapper);
      shadowEditorWrapper.appendChild(shadowEditor.parentElement);

      let scaleValue = ((inputEditor.offsetHeight * 0.8) - (shadowHeightDiff * (index + 1))) / inputEditor.offsetHeight;
      shadowEditor.parentElement.style.transform = `scale(${scaleValue})`;

      let shadowWidth = baseShadowWidth - ((shadowWidthDiff * 2.5) * (index + 1));
      shadowEditorWrapper.style.width = `${convertPxToRch(shadowWidth)}rch`;
      
      previousShadowTranslation += shadowWidth + (2 * shadowWidthDiff);
      shadowEditorWrapper.style.translate = `-${convertPxToRch(previousShadowTranslation)}rch`;

      shadowEditorWrapper.style.opacity = baseShadowOpacity - index / 10;
      shadowEditor.parentElement.style.filter = `blur(${Math.pow(baseShadowBlur, index + 1)}px)`;
      shadowEditorWrapper.style.backgroundColor = `rgb(from white r g b / ${(2 - index)}%)`;
    });
  }

  styleShadowEditors();

  // Observer to update shadow editors
  let observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      shadowEditors.forEach((shadowEditor) => {
        shadowEditor.innerHTML = inputEditor.innerHTML;
      });

      if (document.getElementsByTagName('main')[0].classList.contains('nesting') && parseInt(window.getComputedStyle(shadowEditors[0].parentElement.parentElement).opacity) == 0)
        return observer.disconnect(), shadowEditors[0].closest('#shadowEditorsWrapper').remove();
    });
  });

  observer.observe(inputEditor, {
    childList: true,
    subtree: true,
    characterData: true
  });
}
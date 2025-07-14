async function setupEditors() {
  await waitForVar('LanguageProvider');
  let provider = LanguageProvider.fromCdn("https://www.unpkg.com/ace-linters@1.2.3/build/");
      
  function initializeEditor(editorId, value) {
    const editor = ace.edit(editorId, {
      mode: "ace/mode/css",
      showPrintMargin: false
    });

    editor.setValue(value, -1);
    provider.registerEditor(editor);

    return editor;
  }

  let sample;
  sample = `
@media (max-aspect-ratio:1.097 / 1) {
    body {
    	> div {
    		background: green;
    		height: 100vh;
    	}
    	
    	> figure {
    		background: green;
    		height: 100vh;
    	}
	}
}

@media only screen and (-webkit-min-device-pixel-ratio: 2),only screen and (min--moz-device-pixel-ratio:2),only screen and (-o-min-device-pixel-ratio:2 / 1),only screen and (min-device-pixel-ratio:2),only screen and (min-resolution:192dpi),only screen and (min-resolution:2dppx) {
    .icp-flag-2,.icp-flag-3,.icp-nav-flag,.icp-nav-globe-img-2,.icp-radio,.nav-arrow.icp-up-down-arrow {
        background-image:url(https://m.media-amazon.com/images/S/sash/EZ7BoVI$-KcNmTV.png);
        background-size: 194px 295px
    }
}
  `;
  sample = Object.values(cssSamples)[0]; // First one
  // sample = Object.values(cssSamples)[0]; // Specific one 
  // sample = cssSamples["hopefullyTheEnd"]; // Specific one
  // sample = Object.values(cssSamples).slice(0, 2).join(''); // Range
  // sample = Object.values(cssSamples).join(''); // All - It would be stupid to do this

  window.inputEditor = initializeEditor("inputEditor", sample || '/* Your input CSS should go here */');
  window.outputEditor = initializeEditor("outputEditor", '/* Your output CSS will appear here */');

  let editors = [inputEditor, outputEditor];

  // Auto Nest
  let codeChanged = false;
  let isProcessing = false;

  inputEditor.getSession().on('change', () => {
    codeChanged = true;
  });

  inputEditor.getSession().on('changeAnnotation', () => {
    if (!isProcessing) {
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

  // Initial Nest
  inputEditor.getSession()._emit('change', {
    start: { row: 0, column: 0 },
    end: { row: 0, column: 0 },
    action: 'insert',
    lines: []
  });

  // Add tab buttons
  editors.forEach(editor => {
    const isInputEditor = editor.container.id === inputEditor.container.id;
    const editorTab = createEditorTab(editor.container, isInputEditor, false);
    wrapEditorWithGroup(editor.container, editorTab);
  });
        
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
    const editorGroup = document.createElement("div");
    editorGroup.classList.add('editorGroup');

    // Replace editor with the group
    editor.replaceWith(editorGroup);

    // Add editor and the tab into the group
    editorGroup.appendChild(editorTab);
    editorGroup.appendChild(editor);
  }
};

setupEditors();
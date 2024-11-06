let editorId = 'codeEditor';
let sample = cssSamples[window.cssSample] ?? cssSamples["unnestedShowcase"];

const provider = LanguageProvider.fromCdn("https://www.unpkg.com/ace-linters@1.2.3/build/");

window.inputEditor = initializeEditor("inputEditor", sample || '/* Your input CSS should go here */');
window.outputEditor = initializeEditor("outputEditor", '/* Your output CSS will appear here */');

// Auto Nest
let codeChanged = false;
let isProcessing = false;

inputEditor.getSession().on('change', () => (window.processAuto ?? true) && (codeChanged = true));

inputEditor.getSession().on('changeAnnotation', () => {
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

  editor.renderer.on('afterRender', () => {
      editor.container.getElementsByClassName('ace_scrollbar-h')[0].style.setProperty('--gutter-width', editor.container.getElementsByClassName('ace_gutter')[0].style.width);
  });

  editor.session.selection.on('changeCursor', () => updateCoordinateDisplay(editor));
  
  return editor;
}

setupEditors(inputEditor.container);
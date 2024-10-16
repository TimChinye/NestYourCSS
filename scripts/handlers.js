document.body.addEventListener('mousemove', (e) => {
  requestAnimationFrame(() => {
    window.cursorX = e.clientX;
    window.cursorY = e.clientY;

    const target = e.target;

    const navButton = target.classList.contains('navButton') ? target : target.closest('.navButton');
    if (navButton) {
      repositionButtonBG(navButton);
    };
    
    if (target === splashTextElem) {
      attemptSplashTextUpdate();
    }
    
    if (target === lineNumbers.parentElement) {
      onFirstView(e);
    }
    
    let editorSection = document.getElementById('groupingStylesTogether');
    if (e.pageY > editorSection.offsetTop - editorSection.offsetHeight && e.pageY < editorSection.offsetTop + (editorSection.offsetHeight * 2)) {
      updateActiveLine();
    }
    
    let mainSection = document.getElementsByTagName('main')[0];
    if (e.pageY > 0 && e.pageY < mainSection.offsetTop + ((mainSection.offsetHeight * (1 / 0.96)) * 2)) {
      moveMainBackground();
    }
    
    let nycssBadge = document.getElementById('nycssBadge');
    if (nycssBadge.className == 'hover-animation') {
      debounce(moveCursorBackground, 100)();
    }
  });
});

window.addEventListener('scroll', (e) => {
  requestAnimationFrame(() => {
    window.smoothScrollX = window.scrollX || window.pageXOffset;
    window.smoothScrollY = window.scrollY || window.pageYOffset;

    updateLogoState();
  });
});

function tabButtonHandler(e) {
  let tabButton = e.currentTarget;
  let editor = (tabButton.closest('.editorWrapper')?.id.startsWith("input")) ? inputEditor : outputEditor;

  switch (tabButton.className) {
    case "tabCopyAll":
      let copiedText = editor.getValue(); 
      navigator.clipboard.writeText(copiedText);
      break;
    case "tabInsertCSS":
      window.insertCSSFileInput.click();
      break;
    case "tabOpenRaw":
      // Get the raw text from the editor
      let content = editor.getValue();

      // Open a new blank window
      let rawFileWindow = window.open("", "_blank");
      rawFileWindow.document.write(`
        <html style="color-scheme: dark;">
            <body style="
              margin: 0;
              padding: 2rem;
              font-family: monospace;
              background: linear-gradient(to right, #12121280, #09253380), black;
            ">

              <pre style="
              background: url(../assets/images/nycss-bg-pattern.png) 0 0.1dvh / 5dvh repeat, linear-gradient(to right, #121212, #092533);
                margin: 0;
                padding: 2rem;
                overflow: auto;
                height: 100%;
                width: 100%;
                box-sizing: border-box;
                border-radius: 2rem 0 0;
                clip-path: inset(0 round 0.5rem);
              ">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
            </body>
        </html>
      `);
      
      rawFileWindow.document.close(); // Complete the writing stream

      break;
    case "tabDeleteAll":
      editor.setValue("");
      break;
  }
};
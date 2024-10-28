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

function setupDragAndDrop(editor) {
  // Handle drag events and prevent default behavior
  const handleDrag = (e) => {
      e.preventDefault();

      // Highlight editor during dragenter/dragover, remove on dragleave
      if (['dragenter', 'dragover'].includes(e.type)) {
          editor.classList.add('drag-hover');
      } else if (['dragleave', 'drop'].includes(e.type)) {
          editor.classList.remove('drag-hover');
      }
  };

  // Attach only one listener for all drag events except 'drop'
  ['dragenter', 'dragover', 'dragleave'].forEach(eventName => {
      editor.addEventListener(eventName, handleDrag);
  });

  // Handle the 'drop' event for both class removal and file processing
  editor.addEventListener('drop', (e) => {
      handleDrag(e);

      const file = e.dataTransfer.files[0];

      if (file && (file.type === "text/css" || file.name.endsWith('.css'))) { // css file
          const reader = new FileReader();
          reader.onload = (event) => window.inputEditor.setValue(event.target.result);
          reader.readAsText(file);
      }
      else if (e.dataTransfer.getData('text/plain'));
      else {
          alert("Only .css files or text are allowed!");
      }
  });
}

function selectHandler(optionElem, close) {
  let labelElem = optionElem.closest('label');
  
  if (close) labelElem.control.checked = false;
  labelElem.control.value = labelElem.control.nextElementSibling.innerHTML = optionElem.innerHTML;
  
  switch (labelElem.id) {
    case "typefaces": {
      outputEditor.container.style.fontFamily = inputEditor.container.style.fontFamily = labelElem.control.value + ', monospace';
      break;
    }
    case "fontsizes": {
      outputEditor.container.style.fontSize = inputEditor.container.style.fontSize = labelElem.control.value;
      document.querySelectorAll('.ace_tooltip').forEach((elem) => elem.style.fontSize = `${parseFloat(outputEditor.container.style.fontSize) * 0.8}rem`);
      break;
    }
  }
}

function numberHandler(inputElem, event) {
  let displayElem = inputElem.closest('.number').querySelector('span');

  function updateNumber(updateDirection) {
    if (updateDirection) displayElem.textContent = +displayElem.textContent + 1; // Increment
    else if (+displayElem.textContent >= 1) displayElem.textContent -= 1; // Decrement
  }

  switch (event.type) {
    case "keydown": if (!event.key) break;
    case "click": {
      let isKeyEvent = event.type === "keydown";
      let isClickEvent = event.type === "click";
      
      let upArrowCheck = (isKeyEvent && event.key === "ArrowUp") || (isClickEvent && !inputElem.previousElementSibling);
      let downArrowCheck = (isKeyEvent && event.key === "ArrowDown") || (isClickEvent && inputElem.previousElementSibling);
      
      if (upArrowCheck || downArrowCheck) updateNumber(upArrowCheck || !downArrowCheck);

      break;
    }
    case "touchstart":
    case "mousedown": {
      console.log(event.type);
      let updateDirection = !inputElem.previousElementSibling;

      // Set the initial timeout and the interval after a delay
      displayElem.holdInitial = setTimeout(() => {
        updateNumber(updateDirection);
        displayElem.holdDelay = setTimeout(() => {
          displayElem.holdInterval = setInterval(() => updateNumber(updateDirection), 33.4);
        }, 500);
      }, 100);

      break;
    }
    case "touchend":
    case "mouseup": {
      // Clear timeouts and intervals safely
      clearTimeout(displayElem.holdInitial);
      clearTimeout(displayElem.holdDelay);
      clearInterval(displayElem.holdInterval);
      
      // Reset hold state
      displayElem.holdInitial = undefined;
      displayElem.holdDelay = undefined;
      displayElem.holdInterval = undefined;
      break;
    }
  }

  let labelElem = inputElem.closest('label');
  switch (labelElem.id) {
    case "indentationSize": {
      console.log("test");
      break;
    }
  }
}
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

              <script>
                document.addEventListener('copy', function(e) {
                  const text_only = document.getSelection().toString();
                  const clipdata = e.clipboardData || window.clipboardData;  
                  clipdata.setData('text/plain', text_only);
                  clipdata.setData('text/html', text_only);
                  e.preventDefault();
                });
              </script>
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

/* Component Handler */

function selectHandler(inputElem, close) {
  let labelElem = inputElem.closest('label[id]');
  
  if (close) labelElem.control.checked = false;
  labelElem.control.value = labelElem.control.nextElementSibling.innerHTML = inputElem.innerHTML;
  
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
    case "samples": {
      window.cssSample = inputElem.value;

      window.inputEditor.setValue(cssSamples[window.cssSample]);
      nestCode();
      break;
    }
  }
}

function numberHandler(inputElem, event) {
  let labelElem = inputElem.closest('label[id]');
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
      let updateDirection = !inputElem.previousElementSibling;

      labelElem.holds ??= [];

      // Initialize hold values
      let holdInitial, holdDelay, holdInterval = null;
      
      // Use a Proxy to keep an updated view of the hold states
      labelElem.holds.push(new Proxy({
        get holdInitial() { return holdInitial; },
        get holdDelay() { return holdDelay; },
        get holdInterval() { return holdInterval; }
      }, {
        get(target, prop) {
          return target[prop];
        }
      }));
      
      // Set the initial timeout and the interval after a delay
      holdInitial = setTimeout(() => {
        updateNumber(updateDirection);
        
        holdDelay = setTimeout(() => {
          holdInterval = setInterval(() => updateNumber(updateDirection), 33.4);
        }, 300);
      }, 200);

      break;
    }
    case "touchend":
    case "mouseup":
    case "mouseleave": {
      if (!labelElem.holds) return;

      // Clear timeouts and intervals safely
      labelElem.holds.forEach((hold) => {
        clearTimeout(hold.holdInitial);
        clearTimeout(hold.holdDelay);
        clearInterval(hold.holdInterval);
      });
      
      labelElem.holds = [];
      break;
    }
  }
 
  // if (event.type != "mouseup") return;
  switch (labelElem.id) {
    case "indentationSize": {
      inputEditor.getSession().setTabSize(+displayElem.textContent);
      outputEditor.getSession().setTabSize(+displayElem.textContent);

      if (window.editorIndentChar?.startsWith(' ')) {
        window.editorIndentChar = ' '.repeat(+displayElem.textContent);
        nestCode();
      }
      break;
    }
  }
}

function checkboxHandler(inputElem) {
  let labelElem = inputElem.closest('label[id]');
  switch (labelElem.id) {
    case "indentationType": {
      inputEditor.getSession().setUseSoftTabs(!inputElem.checked);
      outputEditor.getSession().setUseSoftTabs(!inputElem.checked);

      window.editorIndentChar = (!inputElem.checked) ? ' '.repeat(inputEditor.getSession().getTabSize()) : '\t';
      nestCode();
      break;
    }
    case "auto": {
      let modeLabelElem = inputElem.closest('ul').querySelector('#mode');

      window.processAuto = inputElem.checked;
      modeLabelElem.classList.toggle('button', !window.processAuto);
      
      if (window.processAuto) nestCode();
    }
  }
}

function radioHandler(inputElem) {
  let labelElem = inputElem.closest('label[id]');
  let radioIndex = Array.from(labelElem.children).indexOf(inputElem.parentElement);
  
  switch (labelElem.id) {
    case "coordinates": {
      window.coordDisplayMode = radioIndex;
      
      updateCoordinateDisplay(inputEditor);
      updateCoordinateDisplay(outputEditor);
      break;
    }
    case "mode": {
      window.processMode = radioIndex;

      if (window.processAuto ?? true) nestCode();
      break;
    }
  }
}
function comboHandler(inputElem, close) {
  let labelElem = inputElem.closest('label[id]');
  
  if (close) labelElem.control.checked = false;
  labelElem.control.value = labelElem.control.nextElementSibling.firstElementChild.innerHTML = inputElem.innerHTML;
  
  switch (labelElem.id) {
    case "externalCss": {
      fetch(inputElem.innerHTML).then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }

          // Check if the Content-Type is CSS
          const contentType = response.headers.get('Content-Type');
          if (!contentType || !contentType.includes('text/css')) {
              throw new Error("Fetched a non-CSS file");
          }

          return response.text();
      })
      .then(cssContent => {
          window.inputEditor.setValue(cssContent);
                
          let menuElem = inputElem.parentElement.nextElementSibling;
          const existingOption = Array.from(menuElem.children).find(option => option.textContent === inputElem.textContent);
          if (!existingOption) {
            if (menuElem.children.length >= 5) menuElem.lastElementChild.remove();
            menuElem.insertAdjacentHTML('afterbegin', `<option onclick="comboHandler(this)" onkeydown="(event.code === 'Space') && comboHandler(this, true)" tabindex="0">${inputElem.textContent}</option>`);
          }
      })
      .catch(error => {
        window.currentError = error;

        switch (error.message) {
          case "Failed to fetch":
            alert("Couldn't fetch any file. Please check the URL and ensure it's publicly fetchable.");
            break;
          case "Fetched a non-CSS file":
            alert("Successfully fetched the external file, but it wasn't a CSS file.");
            break;
          default:
            alert("An error occurred while fetching the external file - please see the console.");
            console.error('Error fetching the external CSS file:', error);
        }
      });

      break;
    }
  }
}
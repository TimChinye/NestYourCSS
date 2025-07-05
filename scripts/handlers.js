const mainContent = document.getElementById('mainContent');
mainContent.querySelectorAll('menu > button').forEach((btn) => {
	['transitionrun', 'transitionstart', 'transitioncancel', 'transitionend'].forEach(event => btn.lastElementChild.addEventListener(event, repositionButtonBG));

	function repositionButtonBG(e) {
		let { top, left } = e.target.getBoundingClientRect();
		e.target.style.backgroundPosition = `top -${top}px left -${left}px`;
	}
});

const mainContentBackgroundString = (horizValue) => `
url("../assets/images/nycss-bg-pattern.png") 0 0.1dvh / 5dvh repeat,
linear-gradient(to right, rgb(from var(--shades-black) r g b / var(--opacity-medium)), rgb(from var(--pri-colour-em-darker) r g b / var(--opacity-medium))) 0 0 / 100dvw 100dvh,
linear-gradient(45deg, transparent, rgb(from var(--pri-colour-m-darker) r g b / var(--opacity-medium)) ${horizValue}, transparent) 0 0 / 100dvw 100dvh,
var(--shades-black)
`;

const scrollWrapper = document.getElementById('siteWrapper');
const mainSection = scrollWrapper.firstElementChild;
const editorSection = document.getElementById('groupingStylesTogether');

document.body.addEventListener('mousemove', (e) => {
  if (typeof splashTextElem === 'undefined' || splashTextElem === null || !mainSection) return;
  
  window.cursorX = e.clientX;
  window.cursorY = e.clientY;
  
  requestAnimationFrame(() => {
    const horizValue = roundNumber((e.clientX / document.body.clientWidth) * 100) + '%';
    if (window.isNesting || scrollWrapper.scrollTop < mainSection.offsetHeight)
      mainContent.style.background = mainContentBackgroundString(horizValue);

    if (window.isNesting) {
      const nestedMenuButtons = mainSettings.lastElementChild;
      nestedMenuButtons.style.setProperty('--cursor-x-pos', e.clientX + 'px');
      nestedMenuButtons.style.setProperty('--cursor-y-pos', e.clientY + 'px');
    }
    else {
      if (e.target === splashTextElem) attemptSplashTextUpdate();
      
      const scrollTop = scrollWrapper.scrollTop;
      const editorTop = editorSection.offsetTop;
      const editorHeight = editorSection.offsetHeight;
      
      const isEditorTopScrolledPassed = scrollTop > (editorTop - editorHeight);
      const isEditorBottomNotScrolledPassed = (editorTop + editorHeight) > scrollTop;

      const isEditorInView = isEditorTopScrolledPassed && isEditorBottomNotScrolledPassed;
      if (isEditorInView) updateActiveLine(e.clientX, e.clientY);
    }
  });
});

document.addEventListener('visibilitychange', () => document.body.classList.toggle('hidden', document.hidden));

const elements = [
  '#nestBtn',
  '#mainSettings > menu button > figure.inner-cursor',
  '#repeatingText span.repeat',
  '#changingText s',
  '#groupedText',
  '#nyssCursor',
  '#splittingText',
  '#nycssBadge'
];
const intersectionObserver = new IntersectionObserver((entries) => entries.forEach(entry => entry.target.classList.toggle('hidden', !entry.isIntersecting)), { threshold: 0.01 });
elements.flatMap(s => [...document.querySelectorAll(s)]).filter(Boolean).forEach(el => intersectionObserver.observe(el));

scrollWrapper.addEventListener('scroll', (e) => requestAnimationFrame(() => (typeof splashTextElem !== 'undefined' && splashTextElem !== null) && updateLogoState()));

function tabButtonHandler(e) {
  let tabButton = e.currentTarget;
  let editor = (tabButton.closest('.editorWrapper')?.id.startsWith("input")) ? inputEditorInstance : outputEditorInstance;

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
          reader.onload = (event) => inputEditorInstance.setValue(event.target.result);
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
      outputEditorInstance.container.style.fontFamily = inputEditorElem.style.fontFamily = labelElem.control.value + ', monospace';
      break;
    }
    case "fontsizes": {
      outputEditorInstance.container.style.fontSize = inputEditorElem.style.fontSize = labelElem.control.value;
      document.querySelectorAll('.ace_tooltip').forEach((elem) => elem.style.fontSize = `${parseFloat(outputEditorInstance.container.style.fontSize) * 0.8}rem`);
      break;
    }
    case "samples": {
      window.cssSample = inputElem.value;

      inputEditorInstance.setValue(cssSamples[window.cssSample]);
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
      inputEditorInstance.getSession().setTabSize(+displayElem.textContent);
      outputEditorInstance.getSession().setTabSize(+displayElem.textContent);

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
      inputEditorInstance.getSession().setUseSoftTabs(!inputElem.checked);
      outputEditorInstance.getSession().setUseSoftTabs(!inputElem.checked);

      window.editorIndentChar = (!inputElem.checked) ? ' '.repeat(inputEditorInstance.getSession().getTabSize()) : '\t';
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
      
      updateCoordinateDisplay(inputEditorInstance);
      updateCoordinateDisplay(outputEditorInstance);
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
          inputEditorInstance.setValue(cssContent);
                
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

/* Custom Inputs */

document.querySelectorAll('[data-input="dropdown"]').forEach(dropdownOption => {
  dropdownOption.addEventListener('click', () => selectHandler(dropdownOption));
  dropdownOption.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
          event.preventDefault(); // Prevent scrolling
          selectHandler(dropdownOption, true);
      }
  });
});

document.querySelectorAll('[data-input="number-stepper"]').forEach(numberStepper => {
    const eventTypes = ['click', 'mousedown', 'mouseup', 'mouseleave', 'touchstart', 'touchend'];
    eventTypes.forEach(eventType => {
        numberStepper.addEventListener(eventType, function(event) {
            // 'this' refers to the stepperSVG element
            // The 'event' object is automatically passed
            if (typeof numberHandler === 'function') {
                numberHandler(this, event);
            }
        });
    });
});

document.querySelectorAll('[data-input="number-display"]').forEach(numberDisplay => {
    // Replicating: oninput="(this.textContent = +this.textContent.replace(/(\D)+/g, '')) && numberHandler(this, event)"
    numberDisplay.addEventListener('input', function(event) {
        event.preventDefault();
        // Sanitize input to be numeric
        this.textContent = (+(this.textContent.replace(/(\D)+/g, '')));
        // Call numberHandler after sanitization
        if (typeof numberHandler === 'function') {
            numberHandler(this, event); // 'event' here is the input event
        }
    });

    // Replicating: onkeydown="numberHandler(this, event)"
    numberDisplay.addEventListener('keydown', function(event) {
        if (typeof numberHandler === 'function') {
            numberHandler(this, event);
        }
    });
});

document.querySelectorAll('[data-input="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        // 'this' refers to the checkbox element
        if (typeof checkboxHandler === 'function') {
            checkboxHandler(this);
        }
    });
});

document.querySelectorAll('[data-input="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
        // 'this' refers to the radio button element
        if (typeof radioHandler === 'function') {
            radioHandler(this);
        }
    });
});

document.querySelectorAll('[data-input="combo-dropdown"]').forEach(dropdownOption => {
    dropdownOption.addEventListener('click', function() {
        // 'this' refers to the option element
        if (typeof comboHandler === 'function') {
            comboHandler(this);
        }
    });
    dropdownOption.addEventListener('keydown', function(event) {
        // 'this' refers to the option element
        if (event.code === 'Space') {
            event.preventDefault(); // Prevent default space action (e.g; scrolling)
            if (typeof comboHandler === 'function') {
                comboHandler(this, true);
            }
        }
    });
});

document.querySelectorAll('[data-input="combo-text"]').forEach(textInput => {
  textInput.addEventListener('keydown', function(event) {
      if (event.code === 'Enter') {
          event.preventDefault();
          if (typeof comboHandler === 'function') {
              comboHandler(this, true);
          }
      }
  });

  // Replicating: onpaste="event.preventDefault(); document.execCommand('insertText', false, (event.clipboardData || window.clipboardData).getData('text'));"
  textInput.addEventListener('paste', function(event) {
      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData('text');
      document.execCommand('insertText', false, text);
  });

  textInput.addEventListener('input', function() {
      if (this.innerText.includes('\n')) {
          this.textContent = this.textContent.replace(/\n/g, '');
          // After removing newline, collapse selection to the end of the current content
          const selection = window.getSelection();
          if (selection && this.lastChild) {
              selection.collapse(this.lastChild, this.lastChild.length || 0);
          }
      }
      // Note: The original inline oninput also called numberHandler.
      // If comboHandler needs to be called on input (e.g; for filtering options), add it here:
      // if (typeof comboHandler === 'function') {
      //     comboHandler(this, false); // or based on some logic
      // }
  });

  // Replicating: onblur="this.scrollLeft = 0;"
  textInput.addEventListener('blur', function() {
      this.scrollLeft = 0;
  });
});
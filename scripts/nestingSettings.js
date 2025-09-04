document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       1. SETTINGS CONFIGURATION
       ========================================================================== */
  
    // Central configuration object for all settings.
    // To add a new setting, just add a new entry here.
    const settingsConfig = {
        samples: {
            type: 'dropdown',
            defaultValue: 'unnestedShowcase',
            action: (value, isInitialLoad) => {
                // These global variables are assumed to be defined elsewhere
                if (typeof cssSamples === 'undefined' || typeof inputEditorInstance === 'undefined' || typeof nestCode === 'undefined') return;
  
                window.cssSample = value;
                inputEditorInstance.setValue(cssSamples[window.cssSample] || '', -1);
                if (!isInitialLoad) {
                    nestCode();
                }
            }
        },
        externalCss: {
            type: 'combobox',
            defaultValue: '',
            recentCount: 5, // How many recent entries to keep
            action: (value, isInitialLoad, inputElem) => {
                if (!value || isInitialLoad) return;
  
                fetch(value).then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const contentType = response.headers.get('Content-Type');
                    if (!contentType || !contentType.includes('text/css')) {
                        throw new Error("Fetched a non-CSS file");
                    }
                    return response.text();
                })
                .then(cssContent => {
                    if (typeof inputEditorInstance !== 'undefined') {
                        inputEditorInstance.setValue(cssContent, -1);
                    }
                    // Add to recent list
                    const ulElem = inputElem.closest('label[id]').querySelector('ul');
                    const existingLi = Array.from(ulElem.children).find(li => li.textContent === value);

                    if (!existingLi) {
                        if (ulElem.children.length >= settingsConfig.externalCss.recentCount) {
                            ulElem.lastElementChild.remove();
                        }
                        
                        const newLi = document.createElement('li');
                        newLi.dataset.input = 'combo-dropdown';
                        newLi.tabIndex = 0;
                        newLi.textContent = value;

                        ulElem.insertAdjacentElement('afterbegin', newLi);

                        // Re-attach listeners to the new element
                        attachEventListeners(newLi);
                    }
                })
                .catch(error => {
                    window.currentError = error;
                    switch (error.message) {
                        case "Failed to fetch":
                            alert("Couldn't fetch the file. Please check the URL, and ensure it's accessible via your CORS proxy.");
                            break;
                        case "Fetched a non-CSS file":
                            alert("Successfully fetched the file, but it wasn't a CSS file.");
                            break;
                        default:
                            alert("An error occurred while fetching the external file - please see the console.");
                            console.error('Error fetching the external CSS file:', error);
                    }
                });
            }
        },
        typefaces: {
            type: 'dropdown',
            defaultValue: 'Fira Code', // Fira Code for 'Font Family Fira Code'
            action: (value) => {
                if (typeof outputEditorInstance === 'undefined' || typeof inputEditorInstance === 'undefined') return;

                const fontFamily = `${value}, monospace`;
                outputEditorInstance.container.style.fontFamily = fontFamily;
                inputEditorInstance.container.style.fontFamily = fontFamily;
            }
        },
        fontsizes: {
            type: 'dropdown',
            defaultValue: '1.25rem', // 1.25rem for 'Font Size 1.25'
            action: (value) => {
                 if (typeof outputEditorInstance === 'undefined' || typeof inputEditorInstance === 'undefined') return;

                outputEditorInstance.container.style.fontSize = value;
                inputEditorInstance.container.style.fontSize = value;

                document.querySelectorAll('.ace_tooltip').forEach((elem) => {
                    elem.style.fontSize = `${parseFloat(value) * 0.8}rem`;
                });
            }
        },
        indentationType: {
            type: 'checkbox',
            defaultValue: true, // true for 'soft' (checked)
            action: (value, isInitialLoad) => {
                if (typeof inputEditorInstance === 'undefined' || typeof outputEditorInstance === 'undefined' || typeof nestCode === 'undefined') return;

                const useSoftTabs = value;
                inputEditorInstance.getSession().setUseSoftTabs(useSoftTabs);
                outputEditorInstance.getSession().setUseSoftTabs(useSoftTabs);
                window.editorIndentChar = useSoftTabs ? ' '.repeat(inputEditorInstance.getSession().getTabSize()) : '\t';

                if (!isInitialLoad) {
                    nestCode();
                }
            }
        },
        indentationSize: {
            type: 'number',
            defaultValue: 4, // 4 for 'Indentation Level 4'
            action: (value, isInitialLoad) => {
                if (typeof inputEditorInstance === 'undefined' || typeof outputEditorInstance === 'undefined' || typeof nestCode === 'undefined') return;

                const size = +value;
                inputEditorInstance.getSession().setTabSize(size);
                outputEditorInstance.getSession().setTabSize(size);

                if (window.editorIndentChar?.startsWith(' ') || window.editorIndentChar == '') {
                    window.editorIndentChar = ' '.repeat(size);

                     if (!isInitialLoad) {
                        nestCode();
                    }
                }
            }
        },
        wordWrap: {
            type: 'checkbox',
            defaultValue: false, // false for 'Off' (unchecked)
            action: (value, isInitialLoad) => {
                // Ensure the editor instances are loaded before trying to apply settings
                if (typeof inputEditorInstance === 'undefined' || typeof outputEditorInstance === 'undefined') return;

                // Apply the word wrap setting to both editor instances
                const useWordWrap = value;
                inputEditorInstance.getSession().setUseWrapMode(useWordWrap);
                outputEditorInstance.getSession().setUseWrapMode(useWordWrap);

                if (!isInitialLoad) {
                    nestCode();
                }
            }
        },
        coordinates: {
            type: 'radio-group',
            defaultValue: 2, // index for 'Col'
            action: (value) => {
                if (typeof updateCoordinateDisplay === 'undefined' || typeof inputEditorInstance === 'undefined' || typeof outputEditorInstance === 'undefined') return;
                
                window.coordDisplayMode = value;
                updateCoordinateDisplay(inputEditorInstance);
                updateCoordinateDisplay(outputEditorInstance);
            }
        },
        mode: {
            type: 'radio-group',
            defaultValue: 3, // index for 'Nest'
            action: (value, isInitialLoad) => {
                window.processMode = value;
                if ((window.processAuto ?? true) && !isInitialLoad && typeof nestCode === 'function') {
                    nestCode();
                }
            }
        },
        auto: {
            type: 'checkbox',
            defaultValue: true, // true for 'Auto On'
            action: (value, isInitialLoad) => {
                window.processAuto = value;
                const modeLabelElem = document.querySelector('#mode');

                if (modeLabelElem) {
                    modeLabelElem.classList.toggle('button', !window.processAuto);
                }

                if (window.processAuto && !isInitialLoad && typeof nestCode === 'function') {
                    nestCode();
                }
            }
        },
        preserveComments: {
            type: 'checkbox',
            defaultValue: false, // true for 'Keep Comments'
            action: (value, isInitialLoad) => {
                window.preserveComments = !value;
                const preserveCommentsLabelElem = document.querySelector('#preserveComments');
                if (preserveCommentsLabelElem) {
                    preserveCommentsLabelElem.classList.toggle('button', !window.preserveComments);
                }
                if (window.processAuto && !isInitialLoad && typeof nestCode === 'function') {
                    nestCode();
                }
            }
        }
    };
  
  
    /* ==========================================================================
       2. STATE MANAGEMENT (localStorage)
       ========================================================================== */
    const settings = {};
    const STORAGE_KEY = 'nestingToolSettings';
  
    function getDefaults() {
        const defaults = {};
        for (const key in settingsConfig) {
            defaults[key] = settingsConfig[key].defaultValue;
        }
        return defaults;
    }
  
    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  
    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY));
        // Merge saved settings with defaults to ensure all keys are present
        Object.assign(settings, getDefaults(), savedSettings);
    }
  
  
    /* ==========================================================================
       3. UI UPDATE LOGIC
       ========================================================================== */

    /**
     * Updates the ARIA selection state for a list of items.
     * @param {HTMLElement} newSelectedItem - The newly selected element.
     * @param {HTMLElement} controllingElement - The element that controls the active descendant (e.g., the output or input).
     */
    function updateAriaSelection(newSelectedItem, controllingElement) {
        // Guard clause: If there's no new item to select, do nothing.
        if (!newSelectedItem) {
        return;
        }
    
        // Set the active descendant on the controlling element (e.g., the output/combobox)
        controllingElement.setAttribute('aria-activedescendant', newSelectedItem.id);
    
        // Find the previously selected item *within the same list*
        const listContainer = newSelectedItem.parentElement;
        if (!listContainer) return; // Exit if the item has no parent
    
        const prevSelectedItem = listContainer.querySelector('[aria-selected="true"]');
        
        // Make it robust: Only remove the attribute if a previously selected item exists
        if (prevSelectedItem) {
            prevSelectedItem.removeAttribute('aria-selected');
        }
    
        // Set the new item as selected
        newSelectedItem.setAttribute('aria-selected', 'true');
    }
  
    function adjustInputWidth(displayElem) {
      // Create a temporary span to measure the text width
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.whiteSpace = 'pre';
      tempSpan.style.font = window.getComputedStyle(displayElem).font;
      tempSpan.textContent = displayElem.value || displayElem.placeholder || '0';
      
      document.body.appendChild(tempSpan);
      const width = tempSpan.getBoundingClientRect().width;
      document.body.removeChild(tempSpan);
      
      // Add some padding to the calculated width
      displayElem.style.width = `calc(1ch + ${width}px)`;
    };
  
    function applySetting(id, value) {
        const config = settingsConfig[id];
        const elem = document.getElementById(id);
        if (!elem || !config) return;
  
        switch (config.type) {
            case 'dropdown':
            case 'combobox': {
                const listElem = elem.querySelector('ul');
                const liItems = Array.from(listElem.children);
                const getItemByText = (elem) => elem.textContent.trim() === value;
                const inputElem = elem.querySelector(`[value="${value}"]`) || liItems.find(getItemByText) || liItems[0];
                let outputElem = elem.querySelector('output > div[role="textbox"]');

                if (config.type == 'dropdown') {
                    outputElem = elem.querySelector('output');
                    value = inputElem.textContent;
                }

                if (outputElem && inputElem) {
                    outputElem.innerHTML = value;
                    updateAriaSelection(inputElem, outputElem);
                }

                break;
            }
            case 'number': {
                const displayElem = elem.querySelector('[type="text"]');
                if (displayElem) {
                    displayElem.value = value;
                    adjustInputWidth(displayElem);
                }
                break;
            }
            case 'checkbox': {
                elem.control.checked = value;
                break;
            }
            case 'radio-group': {
                const radioButtons = elem.querySelectorAll('[type="radio"]');
                if (radioButtons[value]) {
                    radioButtons[value].checked = true;
                }
                break;
            }
        }
    }
    
    function updateAndCommit(id, value, isInitialLoad = false, sourceElement) {
        if (settings[id] === value && !isInitialLoad) {
            // For radio buttons, clicking the same one should still trigger the action
            const config = settingsConfig[id];
            if (config.type === 'number' || (config.type === 'radio-group' && id === 'mode' && !(window.processAuto ?? true)));
            else return; // No change
        }
        
        settings[id] = value;
        applySetting(id, value);
        
        // Run the associated action
        const config = settingsConfig[id];
        if (config.action) {
            config.action(value, isInitialLoad, sourceElement);
        }
  
        if (!isInitialLoad) {
            saveSettings();
        }
    }
  
  
    /* ==========================================================================
       4. GENERIC EVENT HANDLERS
       ========================================================================== */
       
    function handleSelect(inputElem) {
        const labelElem = inputElem.closest('label[id]');
        const id = labelElem.id;
        const value = inputElem.getAttribute('value') || inputElem.textContent;
  
        updateAndCommit(id, value, false, inputElem);
    }
  
    function handleCombo(inputElem) {
        const labelElem = inputElem.closest('label[id]');
        const id = labelElem.id;
        const isTextInput = inputElem.hasAttribute('contenteditable');
        const value = isTextInput ? inputElem.textContent.trim() : inputElem.textContent;
  
        // When a dropdown item is clicked, update the text input's value
        if (!isTextInput) {
             labelElem.querySelector('output > div[role="textbox"]').textContent = value;
        }
  
        updateAndCommit(id, value, false, inputElem);
    }
  
    function handleKeyNavigation(e, listElem) {
        const labelElem = listElem.closest('label[id]');
        const inputElem = labelElem.querySelector('input');
        const outputElem = labelElem.classList.contains('dropdown') ? labelElem.querySelector('output') : labelElem.querySelector('output > div[role="textbox"]');

        const items = Array.from(listElem.querySelectorAll('[role="option"]'));
        if (items.length === 0) return;
    
        const activeIndex = items.findIndex(item => item === document.activeElement);
    
        let nextIndex = -1;
    
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = activeIndex >= 0 ? (activeIndex + 1) % items.length : 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();

            if (activeIndex == 0) return outputElem.focus();
            else nextIndex = activeIndex - 1;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            nextIndex = items.length - 1;
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (labelElem) labelElem.control.checked = false;
        } else if (e.key === ' ' || e.keyCode === 32 || e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                if (inputElem.checked) inputElem.checked = 0;

                const item = items[activeIndex];
                if (labelElem.classList.contains('dropdown')) {
                    handleSelect(item);
                } else if (labelElem.classList.contains('combobox')) {
                    handleCombo(item);
                }
            }
        }
    
        if (nextIndex >= 0) {
            const item = items[nextIndex];
            item.focus();
            outputElem.setAttribute('aria-activedescendant', item.id);

            const prevSelectedInputElem = item.parentElement.querySelector('[aria-selected="true"]');
            prevSelectedInputElem.removeAttribute('aria-selected');
            item.setAttribute('aria-selected', 'true');
        }
    }
  
    const activeHold = {
        _beforeCLickDelay: 400, // The delay before differentiating the 'click' from the 'hold'.
        _afterClickDelay: 500, // The delay before repeating begins.
        _repeatClickInterval: 50, // The interval for the rapid-fire updates.

        // A cache to store a unique throttled function for each number input's keydown handler.
        throttlerCache: new WeakMap(),

        timerInitial: null,
        timerDelay: null,
        interval: null,

        clear() {
            clearTimeout(this.timerInitial);
            clearTimeout(this.timerDelay);
            clearInterval(this.interval);
            this.timerInitial = this.timerDelay = this.interval = null;
        }
    };
    
    function handleNumber(inputElem, event) {
        const labelElem = inputElem.closest('label[id]');
        const id = labelElem.id;
        const displayElem = labelElem.querySelector('[type="text"]');

        function updateNumber(updateDirection) {
            let currentValue = +displayElem.value;
            
            if (updateDirection) currentValue++;
            else currentValue--;

            // Clamp the value
            currentValue = Math.max(0, Math.min(currentValue, 99999));
            
            updateAndCommit(id, currentValue);
        }
  
        switch (event.type) {
            case 'input': {
                let displayNum = Math.max(0, Math.min(+displayElem.value || 0, 99999));
                event.preventDefault();
                
                updateAndCommit(id, displayNum);

                break;
            }
        
            case 'click': { // From stepper arrows
                updateNumber(!inputElem.previousElementSibling);

                break;
            }
  
            case 'keydown': {
                // Check if we have a throttled function for this input; if not, create one.
                if (!activeHold.throttlerCache.has(labelElem)) {
                    activeHold.throttlerCache.set(labelElem, throttle(updateNumber, activeHold._repeatClickInterval));
                }

                // Get the latest throttled function.
                const updateNumberWithThrottle = activeHold.throttlerCache.get(labelElem);

                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    updateNumberWithThrottle(true);
                }
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    updateNumberWithThrottle(false);
                }
                break;
            }
  
            case 'pointerdown': {
                const updateDirection = !inputElem.previousElementSibling;
                
                activeHold.clear(); // Stop rapid-acceleration, if it hasn't already been done.
                activeHold.timerInitial = setTimeout(() => { // If user hasn't stopped holding, transition from just a "click" to a rapid-acceleration.
                    updateNumber(updateDirection); // First click

                    activeHold.timerDelay = setTimeout(() => { // After first click, delay again before initiating the rapid-acceleration.
                        activeHold.interval = setInterval(() => { // Rapid-acceleration has started.
                            updateNumber(updateDirection);
                        }, activeHold._repeatClickInterval);
                    }, activeHold._afterClickDelay);
                }, activeHold._beforeCLickDelay);

                break;
            }
  
            case 'pointerup':
            case 'pointerleave':
            case 'pointercancel': {
                activeHold.clear(); // When user stops holding, stop rapid-acceleration.

                break;
            }
        }
    }
    
    function handleCheckbox(inputElem) {
        const id = inputElem.closest('label[id]').id;
        updateAndCommit(id, inputElem.checked);
    }
    
    function handleRadio(inputElem) {
        const labelElem = inputElem.closest('label[id]');
        const id = labelElem.id;
        const radioIndex = Array.from(labelElem.querySelectorAll('[type="radio"]')).indexOf(inputElem);
        updateAndCommit(id, radioIndex);
    }
  
    // Special case from original HTML for non-auto mode button
    function handleModeClick(inputElem) {
        if (!(window.processAuto ?? true)) {
             const labelElem = inputElem.closest('label[id]');
             const radioIndex = Array.from(labelElem.querySelectorAll('[type="radio"]')).indexOf(inputElem);
             if (radioIndex == window.processMode && typeof nestCode === 'function') {
                nestCode();
             }
        }
    }

    /* ==========================================================================
       5. INITIALIZATION
       ========================================================================== */
  
    function attachEventListeners(scope = document) {
        const openDropdown = (outputElem, e) => {
            const labelElem = outputElem?.closest('label[id]');
            const inputElem = labelElem?.querySelector('input');
            const listElem = labelElem?.querySelector('ul');

            if (!outputElem || !labelElem || !inputElem || !listElem) return;

            if (e.type == 'change') {
                const isOpened = inputElem.checked;
                const isDropdown = labelElem.classList.contains('dropdown');
                const isCombobox = labelElem.classList.contains('combobox');

                if (isDropdown) outputElem.setAttribute('aria-expanded', isOpened);
                else if (isCombobox) labelElem.setAttribute('aria-expanded', isOpened);

                if (isOpened) {
                    const selectedItem = listElem.querySelector('[aria-selected="true"]') || listElem.children[0];
                    if (selectedItem) {
                        if (isDropdown) selectedItem.focus();
                        else if (isCombobox) outputElem.focus();
                        
                        outputElem.setAttribute('aria-activedescendant', selectedItem.id);
                    }
                }
            } else {
                const oldFocusedElem = e?.relatedTarget;
                const oldLabelElem = oldFocusedElem?.closest('label[id]');
                const oldInputElem = oldLabelElem?.querySelector('input');

                if (!oldInputElem && inputElem.checked) inputElem.checked = 0;
            }
        };

        const closeDropdown = (getLabelElem, e) => {
            if (!e.relatedTarget) return;

            const oldInput = getLabelElem(e.target)?.querySelector('input');
            const newLabel = getLabelElem(e.relatedTarget);

            if (!oldInput) return;

            // If user tabs away to a different component
            if (!newLabel?.contains(oldInput) && oldInput.checked) oldInput.checked = 0;
            else if (newLabel?.contains(oldInput) && !oldInput.checked);
            else {
                setTimeout(() => {
                    if (oldInput.checked && oldInput == e.relatedTarget) {
                        oldInput.checked = 0;
                        focusPreviousElement();
                    }
                }, 0);
            }
        };

        // Dropdowns
        scope.querySelectorAll('.dropdown').forEach(labelElem => {
            const inputElem = labelElem.querySelector('input');
            const listElem = labelElem.querySelector('ul');
            const outputElem = labelElem.querySelector('output');

            if (inputElem && listElem && outputElem) {
                listElem.addEventListener('keydown', (e) => handleKeyNavigation(e, listElem));

                inputElem.addEventListener('change', (e) => (openDropdown(outputElem, e)));
                inputElem.addEventListener('focus', (e) => (e.preventDefault(), openDropdown(outputElem, e)));
            }
        });
  
        scope.querySelectorAll('.dropdown [role="option"]').forEach(elem => {
            const getLabelElem = (elem) => elem?.closest('label[id]');

            elem.addEventListener('click', () => handleSelect(elem));
            elem.addEventListener('blur', (e) => closeDropdown(getLabelElem, e));
        });
  
        // Combo Box (Dropdown List)
        scope.querySelectorAll('.combobox').forEach(labelElem => {
            const listElem = labelElem.querySelector('ul');
            const inputElem = labelElem.querySelector('input');
            const outputElem = labelElem.querySelector('output > div[role="textbox"]');

            if (inputElem && listElem && outputElem) {
                listElem.addEventListener('keydown', (e) => handleKeyNavigation(e, listElem));

                inputElem.addEventListener('change', (e) => (openDropdown(outputElem, e)));
                inputElem.addEventListener('focus', (e) => (e.preventDefault(), openDropdown(outputElem, e)));
            }
        });
  
        scope.querySelectorAll('.combobox [role="option"]').forEach(elem => {
            const getLabelElem = (elem) => elem?.closest('label[id]');

            elem.addEventListener('click', () => handleCombo(elem));
            elem.addEventListener('blur', (e) => closeDropdown(getLabelElem, e));
        });
  
        // Combo Box (Text Input)
        scope.querySelectorAll('.combobox [role="textbox"]').forEach(outputElem => {
            outputElem.addEventListener('keydown', e => {
                const labelElem = outputElem.closest('label[id]');
                const inputElem = labelElem.querySelector('input');
                const listElem = labelElem.querySelector('ul');

                if (['ArrowUp', 'ArrowDown'].includes(e.key) && inputElem.checked) {
                    e.preventDefault();

                    const selectedItem = listElem.querySelector('[aria-selected="true"]') || listElem.children[0];
                    if (selectedItem) {
                        selectedItem.focus();

                        outputElem.setAttribute('aria-activedescendant', selectedItem.id);
                    }
                }

                if (e.key === ' ' || e.keyCode === 32) {
                    inputElem.checked = 0;
                    inputElem.focus();
                }

                if (e.code === 'Enter') {
                    handleCombo(outputElem);
                    inputElem.focus();
                }
            });
            outputElem.addEventListener('paste', e => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                document.execCommand('insertText', false, text);
            });
            outputElem.addEventListener('input', () => {
                if (outputElem.innerText.includes('\n')) {
                    outputElem.textContent = outputElem.textContent.replace(/\n/g, '');
                    const selection = window.getSelection();
                    if (selection && outputElem.lastChild) {
                        selection.collapse(outputElem.lastChild, outputElem.lastChild.length || 0);
                    }
                }
            });

            const getLabelElem = (elem) => elem?.closest('label[id]');
            outputElem.addEventListener('blur', (e) => (outputElem.scrollLeft = 0, closeDropdown(getLabelElem, e)));
        });
  
        // Number Steppers
        ['click', 'pointerdown', 'pointerup', 'pointerleave', 'pointercancel'].forEach(type => {
            scope.querySelectorAll('.number [role="button"]').forEach(elem => {
                elem.addEventListener(type, e => handleNumber(elem, e));
            });
        });
        
        // Number Display
        scope.querySelectorAll('.number [type="text"]').forEach(elem => {
            elem.addEventListener('input', e => handleNumber(elem, e));
            elem.addEventListener('keydown', e => handleNumber(elem, e));
        });
  
        // Checkboxes
        scope.querySelectorAll('.checkbox [role="switch"]').forEach(elem => {
            elem.addEventListener('change', () => handleCheckbox(elem));
            elem.parentElement.addEventListener('keydown', e => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    elem.checked = !elem.checked;
                    handleCheckbox(elem);
                }
            });
        });
  
        // Radios
        scope.querySelectorAll('.radio-group').forEach(elem => {
            elem.addEventListener('keydown', e => {
                const radios = Array.from(elem.querySelectorAll('[type="radio"]'));
                const currentIndex = radios.findIndex(radio => radio.checked);
                let nextIndex;

                if (e.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % radios.length;
                } else if (e.key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + radios.length) % radios.length;
                }

                if (nextIndex !== undefined) {
                    radios[nextIndex].checked = true;
                    handleRadio(radios[nextIndex]);
                }
            });
        });

        scope.querySelectorAll('.radio-group [role="radio"]').forEach(elem => {
            elem.addEventListener('change', () => handleRadio(elem));
            if (elem.name === 'mode') {
                elem.addEventListener('click', () => handleModeClick(elem));
            }
        });
    }
  
    async function initializeApp() {
        // 0. Set the global initialization flag
        window.appIsInitializing = true;
  
        // 1. Load settings from storage or use defaults
        loadSettings();
        
        // 2. Attach all event listeners
        attachEventListeners();
  
        // 3. Global listener to close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.dropdown > [type="checkbox"], .combobox > [type="checkbox"]').forEach(checkboxElem => {
                if (checkboxElem.checked && !checkboxElem.parentElement.contains(e.target)) {
                    checkboxElem.checked = false;
                }
            });
        });
  
        // 4. Apply settings to UI and execute initial actions
        const waitForEditors = [waitForVar('inputEditorInstance'), waitForVar('outputEditorInstance')];
        for (const id in settings) {
            // Apply UI state without triggering saves or processing
            applySetting(id, settings[id]);
  
            // Run the action logic for initial setup (e.g., set font size)
            const config = settingsConfig[id];
            if (config.action) {
                Promise.all(waitForEditors).then(() => {
                    config.action(settings[id], true); // Pass true for isInitialLoad
                });
            }
        }
  
        // 5. Unset the global initialization flag
        Promise.all(waitForEditors).then(() => window.appIsInitializing = false);
    }
  
    initializeApp();
});
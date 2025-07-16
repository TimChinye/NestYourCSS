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
            action: (value, isInitialLoad, elem) => {
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
                    const ulElem = elem.closest('label').querySelector('ul');
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
                if (window.editorIndentChar?.startsWith(' ')) {
                    window.editorIndentChar = ' '.repeat(size);
                     if (!isInitialLoad) {
                        nestCode();
                    }
                }
            }
        },
        coordinates: {
            type: 'radio-group',
            defaultValue: 3, // index for 'None'
            action: (value) => {
                if (typeof updateCoordinateDisplay === 'undefined' || typeof inputEditorInstance === 'undefined' || typeof outputEditorInstance === 'undefined') return;
                window.coordDisplayMode = value;
                updateCoordinateDisplay(inputEditorInstance);
                updateCoordinateDisplay(outputEditorInstance);
            }
        },
        mode: {
            type: 'radio-group',
            defaultValue: 1, // index for 'Nest'
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
  
    function applySetting(id, value) {
        const config = settingsConfig[id];
        const elem = document.getElementById(id);
        if (!elem || !config) return;
  
        switch (config.type) {
            case 'dropdown': {
                const outputElem = elem.querySelector('output');
                value = elem.querySelector(`[value="${value}"]`)?.textContent || value;
                if (outputElem) {
                    outputElem.innerHTML = value;
                }
                break;
            }
            case 'combobox': {
                 const outputElem = elem.querySelector('output div[contenteditable]');
                 if (outputElem) {
                    outputElem.innerHTML = value;
                 }
                 break;
            }
            case 'number': {
                const displayElem = elem.querySelector('span[role="textbox"]');
                if (displayElem) {
                    displayElem.textContent = value;
                }
                break;
            }
            case 'checkbox': {
                elem.control.checked = value;
                break;
            }
            case 'radio-group': {
                const radioButtons = elem.querySelectorAll('input[type="radio"]');
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
            if (config.type === 'radio-group' && id === 'mode' && !(window.processAuto ?? true)) {
                 // Special case from original code
            } else {
                return; // No change
            }
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
       
    function handleSelect(inputElem, close = false) {
        const labelElem = inputElem.closest('label[id]');
        const id = labelElem.id;
        const value = inputElem.getAttribute('value') || inputElem.textContent;
  
        updateAndCommit(id, value);
  
        if (close) {
            labelElem.control.checked = false;
        }
    }
  
    function handleKeyNavigation(e, listElem) {
        const items = Array.from(listElem.querySelectorAll('[role="option"]'));
        if (items.length === 0) return;
    
        const activeIndex = items.findIndex(item => item === document.activeElement);
    
        let nextIndex = -1;
    
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = activeIndex >= 0 ? (activeIndex + 1) % items.length : 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = activeIndex > 0 ? (activeIndex - 1) : items.length - 1;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            nextIndex = items.length - 1;
        } else if (e.key === 'Escape') {
            e.preventDefault();
            const labelElem = listElem.closest('label');
            if (labelElem) {
                labelElem.control.checked = false;
                labelElem.querySelector('output').focus();
            }
        } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                const item = items[activeIndex];
                if (listElem.closest('.dropdown')) {
                    handleSelect(item, true);
                } else if (listElem.closest('.combobox')) {
                    handleCombo(item, true);
                }
            }
        }
    
        if (nextIndex !== -1) {
            items[nextIndex].focus();
            listElem.closest('label').querySelector('output').setAttribute('aria-activedescendant', items[nextIndex].id);
        }
    }
  
    function handleCombo(inputElem, close = false) {
        const labelElem = inputElem.closest('label[id]');
        const id = labelElem.id;
        const isTextInput = inputElem.hasAttribute('contenteditable');
        const value = isTextInput ? inputElem.textContent.trim() : inputElem.textContent;
  
        // When a dropdown item is clicked, update the text input's value
        if (!isTextInput) {
             labelElem.querySelector('div[contenteditable]').textContent = value;
        }
  
        updateAndCommit(id, value, false, inputElem);
  
        if (close) {
            labelElem.control.checked = false;
        }
    }
  
    const activeHold = {
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
        const displayElem = labelElem.querySelector('span[role="textbox"]');
  
        function updateNumber(updateDirection) {
            let currentValue = +displayElem.textContent;
            if (updateDirection) {
                currentValue++;
            } else if (currentValue > 0) { // Assuming 0 is the minimum
                currentValue--;
            }
            updateAndCommit(id, currentValue);
        }
  
        switch (event.type) {
            case 'input': // From contenteditable span
                updateAndCommit(id, +inputElem.textContent.replace(/(\D)+/g, ''));
                break;
            
            case 'click': // From stepper arrows
                updateNumber(!inputElem.previousElementSibling);
                break;
  
            case 'keydown': {
                if (inputElem.hasAttribute('contenteditable')) { // Number display
                    if (event.key === 'ArrowUp') { event.preventDefault(); updateNumber(true); }
                    if (event.key === 'ArrowDown') { event.preventDefault(); updateNumber(false); }
                }
                break;
            }
  
            case 'mousedown':
            case 'touchstart': {
                activeHold.clear(); // Clear any previous hold
                const updateDirection = !inputElem.previousElementSibling;
                
                activeHold.timerInitial = setTimeout(() => {
                    updateNumber(updateDirection);
                    activeHold.timerDelay = setTimeout(() => {
                        activeHold.interval = setInterval(() => updateNumber(updateDirection), 50);
                    }, 300);
                }, 400);
                break;
            }
  
            case 'mouseup':
            case 'mouseleave':
            case 'touchend': {
                activeHold.clear();
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
        const radioIndex = Array.from(labelElem.querySelectorAll('input[type="radio"]')).indexOf(inputElem);
        updateAndCommit(id, radioIndex);
    }
  
    // Special case from original HTML for non-auto mode button
    function handleModeClick(inputElem) {
        if (!(window.processAuto ?? true)) {
             const labelElem = inputElem.closest('label[id]');
             const radioIndex = Array.from(labelElem.querySelectorAll('input[type="radio"]')).indexOf(inputElem);
             if (radioIndex == window.processMode && typeof nestCode === 'function') {
                nestCode();
             }
        }
    }
  
  
    /* ==========================================================================
       5. INITIALIZATION
       ========================================================================== */
  
    function attachEventListeners(scope = document) {
        // Dropdowns
        scope.querySelectorAll('.dropdown').forEach(elem => {
            const listElem = elem.querySelector('ul');
            const outputElem = elem.querySelector('output');
            if (listElem && outputElem) {
                listElem.addEventListener('keydown', e => handleKeyNavigation(e, listElem));
                outputElem.addEventListener('keydown', e => {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    elem.control.checked = !elem.control.checked;
                    if (elem.control.checked) {
                        setTimeout(() => {
                            const firstItem = listElem.querySelector('[role="option"]');
                            if (firstItem) {
                                firstItem.focus();
                                    outputElem.setAttribute('aria-activedescendant', firstItem.id);
                                }
                            }, 0);
                        }
                    }
                });
                outputElem.addEventListener('click', () => {
                    elem.control.checked = !elem.control.checked;
                    if (elem.control.checked) {
                        setTimeout(() => {
                            const firstItem = listElem.querySelector('[role="option"]');
                            if (firstItem) {
                                firstItem.focus();
                                outputElem.setAttribute('aria-activedescendant', firstItem.id);
                            }
                        }, 0);
                    }
                });
            }
        });
  
        scope.querySelectorAll('.dropdown [role="option"]').forEach(elem => {
            elem.addEventListener('click', () => handleSelect(elem, true));
            // elem.addEventListener('keydown', e => (e.code === 'Space' || e.code === 'Enter') && (e.preventDefault(), handleSelect(elem, true)));
        });
  
        // Combo Box (Dropdown List)
        scope.querySelectorAll('.combobox').forEach(elem => {
            const listElem = elem.querySelector('ul');
            if (listElem) {
                listElem.addEventListener('keydown', e => handleKeyNavigation(e, listElem));
            }
        });
  
        scope.querySelectorAll('.combobox [role="option"]').forEach(elem => {
            elem.addEventListener('click', () => handleCombo(elem, true));
            // elem.addEventListener('keydown', e => (e.code === 'Space' || e.code === 'Enter') && (e.preventDefault(), handleCombo(elem, true)));
        });
  
        // Combo Box (Text Input)
        scope.querySelectorAll('.combobox [role="textbox"]').forEach(elem => {
            elem.addEventListener('keydown', e => {
                if (e.code === 'Enter') {
                    e.preventDefault();
                    handleCombo(elem, true);
                }
            });
            elem.addEventListener('paste', e => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                document.execCommand('insertText', false, text);
            });
            elem.addEventListener('input', () => {
                if (elem.innerText.includes('\n')) {
                    elem.textContent = elem.textContent.replace(/\n/g, '');
                    const selection = window.getSelection();
                    if (selection && elem.lastChild) {
                        selection.collapse(elem.lastChild, elem.lastChild.length || 0);
                    }
                }
            });
            elem.addEventListener('blur', () => elem.scrollLeft = 0);
        });
  
        // Number Steppers
        ['click', 'mousedown', 'mouseup', 'mouseleave', 'touchstart', 'touchend'].forEach(type => {
            scope.querySelectorAll('.number [role="button"]').forEach(elem => {
                elem.addEventListener(type, e => handleNumber(elem, e));
            });
        });
        
        // Number Display
        scope.querySelectorAll('.number [role="textbox"]').forEach(elem => {
            elem.addEventListener('input', e => handleNumber(elem, e));
            elem.addEventListener('keydown', e => handleNumber(elem, e));
        });
  
        // Checkboxes
        scope.querySelectorAll('.checkbox [role="switch"]').forEach(elem => {
            elem.addEventListener('change', () => handleCheckbox(elem));
        });
  
        // Radios
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
  
        await waitForVar('inputEditorInstance');
        await waitForVar('outputEditorInstance');
  
        // 1. Load settings from storage or use defaults
        loadSettings();
  
        // 2. Apply settings to UI and execute initial actions
        for (const id in settings) {
            // Apply UI state without triggering saves or processing
            applySetting(id, settings[id]);
  
            // Run the action logic for initial setup (e.g., set font size)
            const config = settingsConfig[id];
            if (config.action) {
                config.action(settings[id], true); // Pass true for isInitialLoad
            }
        }
        
        // 3. Attach all event listeners
        attachEventListeners();
  
        // 4. Global listener to close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.dropdown > input[type="checkbox"], .combobox > input[type="checkbox"]').forEach(chk => {
                if (chk.checked && !chk.parentElement.contains(e.target)) {
                    chk.checked = false;
                }
            });
        });
  
        // 5. Unset the global initialization flag
        // setTimeout(() => window.appIsInitializing = false, 0);
        window.appIsInitializing = false;
    }
  
    initializeApp();
  });
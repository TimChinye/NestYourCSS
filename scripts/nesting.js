/**
 * Updates the error table based on Ace Editor annotations.
 * This function is accessible to screen reader and keyboard users.
 *
 * @param {Array} annotations The array of error objects from Ace.
 * @param {HTMLTableSectionElement} tableBodyElem The <tbody> element of the error table.
 * @param {ace.Editor} inputEditorInstance The editor to navigate on click/enter.
 * @param {ace.Editor} outputEditorInstance The editor to display a generic message in.
 */
function updateAccessibleErrorTable(annotations, tableBodyElem, inputEditorInstance, outputEditorInstance) {
    // 1. Clear the previous contents of the table body.
    tableBodyElem.innerHTML = '';
  
    if (annotations.length === 0) {
      // --- POSITIVE FEEDBACK: Announce that errors are gone ---
      outputEditorInstance.getSession().setValue('/* CSS is valid! */');
      
      // Create a single, reassuring row for screen reader users.
      const successRow = tableBodyElem.insertRow();
      const successCell = successRow.insertCell();
      successCell.textContent = "No errors found.";
      successCell.colSpan = 3; // Span across all columns.
      
      // No need to scroll into view if there are no errors.
      return;
    }
  
    // --- NEGATIVE FEEDBACK: Announce errors exist and populate the table ---
    outputEditorInstance.getSession().setValue('/* Your input CSS contains errors. See table below. */');
  
    // 2. Loop through annotations and create an ACCESSIBLE row for each.
    annotations.forEach(({ column, row, text }) => {
      const errorRow = tableBodyElem.insertRow();
      
      // 3. MAKE IT KEYBOARD ACCESSIBLE:
      // Allow the row to be focused and make it act like a button.
      errorRow.tabIndex = 0;
      errorRow.role = 'button'; // Explicitly define it as a button for screen readers.
  
      const handleGoToLine = () => inputEditorInstance.gotoLine(row, column - 1, true);
  
      errorRow.onclick = handleGoToLine;
      errorRow.onkeydown = (event) => {
        // Trigger the action on Enter or Space, just like a real button.
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); // Prevent space from scrolling the page
          handleGoToLine();
        }
      };
      
      // 4. MAKE IT SEMANTIC: Use <th> for the error message (the row header).
      const headerCell = document.createElement('th');
      headerCell.scope = 'row';
      headerCell.textContent = text;
      errorRow.appendChild(headerCell);
  
      // Use <td> for the other data cells.
      const rowCell = errorRow.insertCell();
      rowCell.textContent = row;
  
      const colCell = errorRow.insertCell();
      colCell.textContent = column;
    });
  
    // 5. Scroll the error section into view for sighted users.
    tableBodyElem.closest('section').scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
};
  
function nestCode(onClick = false) {
    if (nestBtn.hasAttribute('disabled')) return;

    mainElement.classList.toggle('nesting', !(onClick && window.isNesting));

    if (onClick) {
        if (window.isNesting) return;
        else scrollWrapper.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (typeof outputEditorInstance === 'undefined' || !inputEditorInstance) return;

    let tableBodyElem = errorTable.tBodies[0];
	const annotations = inputEditorInstance.getSession().getAnnotations().filter((a) => a.type == 'error');
	if (annotations.length == 0) {
		outputEditorInstance.getSession().setValue(convertToNestedCSS(inputEditorInstance.getValue()) || '/* Your output CSS will appear here */');
        
        if (tableBodyElem.rows.length) tableBodyElem.innerHTML = '';
	} else {
		outputEditorInstance.getSession().setValue('/* Your input CSS contains errors */');
		console.log('Code Errors:', annotations);
		
        updateAccessibleErrorTable(
          annotations,
          tableBodyElem,
          inputEditorInstance,
          outputEditorInstance
        );
	}
};

function convertToNestedCSS(cssProvided, htmlString) {
	window.processMode ??= 1;

    cssProvided = minimizeCSS(cssProvided);
    if (window.processMode == 0) return cssProvided;

    cssProvided = splitCSS(cssProvided);
    cssProvided = flattenCSS(cssProvided);
    if (window.processMode == 2) return denestCSS(cssProvided);

    cssProvided = renestCSS(cssProvided, htmlString);
    if (window.processMode == 1) return beautifyCSS(cssProvided);
};

/**
 * Minimizes CSS by removing only comments and unnecessary whitespace.
 *
 * This function is inspired by the robust "extract, process, restore" pattern
 * found in the provided PHP Minify library. It ensures that string content
 * and significant selector whitespace (like descendant combinators) are
 * never accidentally modified.
 *
 * @param {string} cssProvided The raw CSS string.
 * @returns {string} The minified CSS string.
 */
function minimizeCSS(cssProvided) {
    const extracted = [];
    const placeholderPrefix = "__MINIMIZE_CSS_EXTRACTED_";
    const placeholderSuffix = "__";

    // 1. Extract strings and remove comments in a single pass.
    cssProvided = cssProvided.replace(
        /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(\/\*[\s\S]*?\*\/)/g,
        (match, doubleQuotedString, _g2, singleQuotedString) => {
            if (doubleQuotedString || singleQuotedString) {
                const placeholder = `${placeholderPrefix}${extracted.length}${placeholderSuffix}`;
                extracted.push(match);
                return placeholder;
            }
            return ''; // It's a comment, so remove it.
        }
    );

    // 2. Perform careful whitespace minification.
    cssProvided = cssProvided
        // Collapse all whitespace sequences to a single space, then trim.
        .replace(/\s+/g, ' ')
        .trim()
        // Remove space around unambiguous delimiters and combinators.
        // NOTE: The colon ':' is intentionally excluded from this expression.
        .replace(/\s*([>~+,;{}])\s*/g, '$1')
        // Remove space AFTER any colon. This is always safe.
        // e.g., `color: red` => `color:red`, `a: hover` => `a:hover`
        .replace(/:\s+/g, ':')
        // Remove space BEFORE a colon, but ONLY if it's a property-value
        // colon inside a declaration block. This is the key to preserving
        // descendant combinators like `#id :focus`.
        // The negative lookahead `(?![^}]*\{)` ensures the colon is not
        // part of a selector block.
        .replace(/\s+:(?![^}]*\{)/g, ':')
        // Remove the last semicolon in a rule block.
        .replace(/;}/g, '}');

    // 3. Restore the extracted string literals.
    if (extracted.length) {
        for (let i = 0; i < extracted.length; i++) {
            const placeholder = new RegExp(`${placeholderPrefix}${i}${placeholderSuffix}`, 'g');
            cssProvided = cssProvided.replace(placeholder, extracted[i]);
        }
    }

    return cssProvided;
};

function splitCSS(cssProvided) {
    function hasNestableConstruct(declarationString) {
        let tempParenDepth = 0;
        let tempBracketDepth = 0;
        let tempInSingleQuotes = false;
        let tempInDoubleQuotes = false;
        for (let i = 0; i < declarationString.length; i++) {
            const char = declarationString[i];
            if (char === '{' && !tempInSingleQuotes && !tempInDoubleQuotes && tempParenDepth === 0 && tempBracketDepth === 0) {
                return true;
            }
            // Update state for quote/paren/bracket context
            switch (char) {
                case '(': if (!tempInSingleQuotes && !tempInDoubleQuotes) tempParenDepth++; break;
                case ')': if (!tempInSingleQuotes && !tempInDoubleQuotes) tempParenDepth--; break;
                case '[': if (!tempInSingleQuotes && !tempInDoubleQuotes) tempBracketDepth++; break;
                case ']': if (!tempInSingleQuotes && !tempInDoubleQuotes) tempBracketDepth--; break;
                case '"':
                    { // Block scope for k and backslashCount
                        let k = i - 1;
                        let backslashCount = 0;
                        while (k >= 0 && declarationString[k] === '\\') {
                            backslashCount++;
                            k--;
                        }
                        if (backslashCount % 2 === 0) { // If not escaped (even number of backslashes)
                            if (!tempInSingleQuotes) { // And not inside single quotes
                                tempInDoubleQuotes = !tempInDoubleQuotes;
                            }
                        }
                    }
                    break;
                case "'":
                    { // Block scope for k_single and backslashCount_single
                        let k_single = i - 1;
                        let backslashCount_single = 0;
                        while (k_single >= 0 && declarationString[k_single] === '\\') {
                            backslashCount_single++;
                            k_single--;
                        }
                        if (backslashCount_single % 2 === 0) { // If not escaped
                            if (!tempInDoubleQuotes) { // And not inside double quotes
                                tempInSingleQuotes = !tempInSingleQuotes;
                            }
                        }
                    }
                    break;
            }
        }
        return false;
    }

    const parsedCSS = [];

    let unknown = '';
    let selector = '';
    let topLevelDeclaration = '';
    let blockContent = '';

    let curlyBracketCount = 0;
    let insideCurlyBrackets = false;
    let parenthesisDepth = 0;
    let bracketDepth = 0;
    let isInSingleQuotes = false;
    let isInDoubleQuotes = false;

    for (let i = 0; i < cssProvided.length; i++) {
        const char = cssProvided[i];

        if (insideCurlyBrackets) {
            blockContent += char;

            if (char === '{' && !isInSingleQuotes && !isInDoubleQuotes && parenthesisDepth === 0 && bracketDepth === 0) {
                curlyBracketCount++;
            } else if (char === '}' && !isInSingleQuotes && !isInDoubleQuotes && parenthesisDepth === 0 && bracketDepth === 0) {
                curlyBracketCount--;

                if (curlyBracketCount === 0) {
                    blockContent = blockContent.slice(0, -1).trim();
                    let finalContent = blockContent;

                    if (hasNestableConstruct(blockContent)) {
                        const parsedBlockContent = splitCSS(blockContent);
                        const hasNestedRuleArray = parsedBlockContent.some(item =>
                            Array.isArray(item) && item.length === 2 && typeof item[0] === 'string'
                        );
                        if (hasNestedRuleArray) {
                            finalContent = parsedBlockContent;
                        }
                    }
                    
                    parsedCSS.push([selector.trim(), finalContent]);
                    selector = '';
                    blockContent = '';
                    insideCurlyBrackets = false;
                }
            }
        } else { // Not inside curly brackets
            
            if (char === ';' && !isInSingleQuotes && !isInDoubleQuotes && parenthesisDepth === 0 && bracketDepth === 0) {
                topLevelDeclaration += unknown + char;
                // Push immediately if it's a distinct top-level declaration
                if (topLevelDeclaration.trim() !== '') {
                     parsedCSS.push(topLevelDeclaration.trim());
                     topLevelDeclaration = ''; // Reset for next potential top-level declaration
                }
                unknown = ''; // Reset unknown
            } 
            else if (char === '{' && !isInSingleQuotes && !isInDoubleQuotes && parenthesisDepth === 0 && bracketDepth === 0) {
                selector = unknown;
                unknown = ''; 

                if (topLevelDeclaration.trim() !== '') {
                    parsedCSS.push(topLevelDeclaration.trim());
                    topLevelDeclaration = '';
                }

                insideCurlyBrackets = true;
                curlyBracketCount++;
                blockContent = '';
            } 
            else {
                unknown += char;
            }
            
            // Update context state (quotes, parentheses, brackets)
            switch (char) {
                case '(':
                    if (!isInSingleQuotes && !isInDoubleQuotes) parenthesisDepth++;
                    break;
                case ')':
                    if (!isInSingleQuotes && !isInDoubleQuotes) parenthesisDepth--;
                    break;
                case '[':
                    if (!isInSingleQuotes && !isInDoubleQuotes) bracketDepth++;
                    break;
                case ']':
                    if (!isInSingleQuotes && !isInDoubleQuotes) bracketDepth--;
                    break;
                case '"':
                    { // Block scope for k and backslashCount
                        let k = i - 1;
                        let backslashCount = 0;
                        while (k >= 0 && cssProvided[k] === '\\') {
                            backslashCount++;
                            k--;
                        }
                        if (backslashCount % 2 === 0) { // If not escaped
                            if (!isInSingleQuotes) { // And not inside single quotes
                                isInDoubleQuotes = !isInDoubleQuotes;
                            }
                        }
                    }
                    break;
                case "'":
                    { // Block scope for k_single and backslashCount_single
                        let k_single = i - 1;
                        let backslashCount_single = 0;
                        while (k_single >= 0 && cssProvided[k_single] === '\\') {
                            backslashCount_single++;
                            k_single--;
                        }
                        if (backslashCount_single % 2 === 0) { // If not escaped
                            if (!isInDoubleQuotes) { // And not inside double quotes
                                isInSingleQuotes = !isInSingleQuotes;
                            }
                        }
                    }
                    break;
            }
        }
    }

    if (unknown.trim() !== '') {
        topLevelDeclaration += unknown.trim(); 
    }
    if (topLevelDeclaration.trim() !== '') {
        parsedCSS.push(topLevelDeclaration.trim());
    }

    return parsedCSS;
};

function flattenCSS(cssProvided, prefix = '') {
    /**
     * Combines an array of CSS selectors into a compact string using the :is() pseudo-class.
     * It intelligently groups selectors that start with '&' separately from the others.
     *
     * @param {string[]} selectors The array of selector strings to combine.
     * @returns {string} The combined and formatted selector string.
     */
    function _combineCssSelectors(selectors) {
        const combinators = ['>', '+', '~'];
        
        // Return an empty string if the input is not a valid array or is empty.
        if (!Array.isArray(selectors) || selectors.length === 0) {
        return "";
        }
    
        // 1. Categorize selectors into two groups.
        let ampersandSelectors = [];
        let otherSelectors = [];
    
        for (const selector of selectors) {
        // Use trim() to be robust against accidental whitespace.
        const trimmedSelector = selector.trim();
        if (trimmedSelector.startsWith('&')) {
            // Add the selector to the list, but *without* its leading '&'.
            ampersandSelectors.push(trimmedSelector.substring(1));
        } else {
            otherSelectors.push(trimmedSelector);
        }
        }
    
        // 2. Build the string parts for each group if they contain any selectors.
        const finalParts = [];
    
        if (ampersandSelectors.length > 0) {
            // Join the selectors and wrap them with &:is()
            finalParts.push(`&:is(${ampersandSelectors.join(', ')})`);
        }
    
        if (otherSelectors.length > 0) {
            // Join the selectors and wrap them with :is()
            if (ampersandSelectors.length > 0) otherSelectors = otherSelectors.map((selector) => ((combinators.includes(selector[0])) ? '& ' : '') + selector);
            let wrapped = otherSelectors.join(', ');
            if (ampersandSelectors.length > 0) wrapped = `:is(${wrapped})`;
            finalParts.push(wrapped);
        }
    
        // 3. Join the final parts with a comma and space.
        // This gracefully handles cases where one of the groups was empty.
        return finalParts.join(', ');
    }

    /**
     * Splits a CSS selector group or at-rule string into an array of individual components.
     *
     * This function is more robust than a simple `string.split(',')` because it correctly
     * handles commas within parentheses (e.g., `:is(a, b)`), attribute selectors
     * (e.g., `[attr="foo,bar"]`), and quoted strings. It also treats CSS at-rules
     * (e.g., `@media ...;` or `@media ... { ... }`) as single, unsplittable units.
     *
     * @param {string} selectorGroup - The CSS string to split, which can contain selector groups and at-rules.
     * @returns {string[]} An array of individual, trimmed CSS selectors or at-rules.
     * @example
     * const selector = 'h1, p:is(.foo, .bar), [data-content="a, b"], .final';
     * const result = _splitCssSelectorGroup(selector);
     * // result is ['h1', 'p:is(.foo, .bar)', '[data-content="a, b"]', '.final']
     *
     * @example
     * const mediaQuery = '@media (min-width: 600px), (orientation: landscape);, body';
     * const result = _splitCssSelectorGroup(mediaQuery);
     * // result is ['@media (min-width: 600px), (orientation: landscape);', 'body']
     */
    function _splitCssSelectorGroup(selectorGroup) {
        if (!selectorGroup || typeof selectorGroup !== 'string') {
            return [];
        }

        const selectors = [];
        let currentSelector = '';
        let parenthesisDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0; // To handle at-rule blocks like @media { ... }
        let isInSingleQuotes = false;
        let isInDoubleQuotes = false;
        let inAtRule = false; // To track if we are inside an @-rule

        for (let i = 0; i < selectorGroup.length; i++) {
            const char = selectorGroup[i];
            const prevChar = i > 0 ? selectorGroup[i - 1] : '';

            // A new segment starts if currentSelector is empty or only whitespace.
            // If it starts with '@', we enter an at-rule.
            if (currentSelector.trim() === '' && char === '@') {
                inAtRule = true;
            }

            currentSelector += char;

            // Don't process the character as special if it's escaped
            if (prevChar === '\\') {
                continue;
            }

            switch (char) {
                case '(':
                    if (!isInSingleQuotes && !isInDoubleQuotes) parenthesisDepth++;
                    break;
                case ')':
                    if (!isInSingleQuotes && !isInDoubleQuotes) parenthesisDepth--;
                    break;
                case '[':
                    if (!isInSingleQuotes && !isInDoubleQuotes) bracketDepth++;
                    break;
                case ']':
                    if (!isInSingleQuotes && !isInDoubleQuotes) bracketDepth--;
                    break;
                case '{':
                    if (!isInSingleQuotes && !isInDoubleQuotes) braceDepth++;
                    break;
                case '}':
                    if (!isInSingleQuotes && !isInDoubleQuotes) {
                        braceDepth--;
                        // If we were in an at-rule and its main block just closed, exit at-rule mode.
                        if (inAtRule && braceDepth === 0) {
                            inAtRule = false;
                        }
                    }
                    break;
                case '"':
                    if (!isInSingleQuotes) isInDoubleQuotes = !isInDoubleQuotes;
                    break;
                case "'":
                    if (!isInDoubleQuotes) isInSingleQuotes = !isInSingleQuotes;
                    break;
                case ';':
                    // A semicolon at the top level of nesting can terminate an at-rule (like @import).
                    if (inAtRule && parenthesisDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
                        inAtRule = false;
                    }
                    break;
            }

            // Split if the comma is a top-level separator and not inside an at-rule
            if (char === ',' && !inAtRule && parenthesisDepth === 0 && bracketDepth === 0 && braceDepth === 0 && !isInSingleQuotes && !isInDoubleQuotes) {
                // Push the selector without the trailing comma
                selectors.push(currentSelector.slice(0, -1).trim());
                currentSelector = '';
                inAtRule = false; // Reset for the new segment
            }
        }

        // Add the last selector to the array if it's not empty
        const trimmedLastSelector = currentSelector.trim();
        if (trimmedLastSelector) {
            selectors.push(trimmedLastSelector);
        }

        return selectors;
    }

    /**
         * Splits a string by a delimiter (defaulting to a comma), but ignores
         * delimiters found inside matching pairs of brackets, braces, quotes, or within
         * CSS at-rules (e.g., `@media ...`).
         *
         * Supported brackets: (), [], {}
         * Supported quotes: '', ""
         *
         * @param {string} str The string to split.
         * @returns {string[]} An array of substrings.
         */
    function _splitRespectingBrackets(str) {
        if (!str || typeof str !== 'string') {
            return [];
        }

        const results = [];
        let lastSplitIndex = 0;
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;
        let inSingleQuotes = false;
        let inDoubleQuotes = false;
        let inAtRule = false;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const prevChar = i > 0 ? str[i - 1] : '';

            // Check for the start of an at-rule.
            if (char === '@' && str.substring(lastSplitIndex, i).trim() === '') {
                inAtRule = true;
            }

            // Don't process the character as special if it's escaped
            if (prevChar === '\\') {
                continue;
            }

            switch (char) {
                case '(':
                    if (!inSingleQuotes && !inDoubleQuotes) parenDepth++;
                    break;
                case ')':
                    if (!inSingleQuotes && !inDoubleQuotes) parenDepth--;
                    break;
                case '[':
                    if (!inSingleQuotes && !inDoubleQuotes) bracketDepth++;
                    break;
                case ']':
                    if (!inSingleQuotes && !inDoubleQuotes) bracketDepth--;
                    break;
                case '{':
                    if (!inSingleQuotes && !inDoubleQuotes) braceDepth++;
                    break;
                case '}':
                    if (!inSingleQuotes && !inDoubleQuotes) {
                        braceDepth--;
                        if (inAtRule && braceDepth === 0) {
                            inAtRule = false;
                        }
                    }
                    break;
                case "'":
                    if (!inDoubleQuotes) inSingleQuotes = !inSingleQuotes;
                    break;
                case '"':
                    if (!inSingleQuotes) inDoubleQuotes = !inDoubleQuotes;
                    break;
                case ';':
                    if (inAtRule && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
                        inAtRule = false;
                    }
                    break;
            }

            // Check if we should split at the current position
            if (
                char === ',' &&
                !inAtRule &&
                parenDepth === 0 &&
                bracketDepth === 0 &&
                braceDepth === 0 &&
                !inSingleQuotes &&
                !inDoubleQuotes
            ) {
                results.push(str.substring(lastSplitIndex, i).trim());
                lastSplitIndex = i + 1;
                inAtRule = false; // Reset for the new segment
            }
        }

        // Add the final segment of the string after the last comma
        results.push(str.substring(lastSplitIndex).trim());

        return results;
    }

    function _formatSelectorString(selectorStr) {
        if (!selectorStr) return "";
    
        let result = "";
        let length = selectorStr.length;
        let i = 0;
        let isInQuotes = null;
        let parenthesisDepth = 0;
        let bracketDepth = 0;
    
        // Combinators that need spaces around them
        const combinators = ['>', '+', '~'];
        // Characters that might need a space *before* them if not preceded by a space or combinator
        const spaceBeforeChars = ['*', '[', '#', '.']; // And also after combinators
    
        while (i < length) {
            let char = selectorStr[i];
            let prevChar = result.length > 0 ? result[result.length - 1] : null;
            let nextChar = (i + 1 < length) ? selectorStr[i + 1] : null;
    
            // Handle quotes
            if ((char === '"' || char === "'") && (i === 0 || selectorStr[i-1] !== '\\')) {
                if (isInQuotes === char) {
                    isInQuotes = null;
                } else if (!isInQuotes) {
                    isInQuotes = char;
                }
                result += char;
                i++;
                continue;
            }
    
            if (isInQuotes) {
                result += char;
                i++;
                continue;
            }
    
            // Handle parentheses and brackets (for attribute selectors)
            if (char === '(') parenthesisDepth++;
            else if (char === ')') parenthesisDepth--;
            else if (char === '[') bracketDepth++;
            else if (char === ']') bracketDepth--;
    
            // --- Spacing Logic ---
    
            // 1. Space around combinators (>, +, ~)
            if (combinators.includes(char) && parenthesisDepth === 0 && bracketDepth === 0) {
                if (prevChar && prevChar !== ' ' && !combinators.includes(prevChar)) {
                    result += ' ';
                }
                result += char;
                if (nextChar && nextChar !== ' ' && !combinators.includes(nextChar)) {
                    result += ' ';
                }
                i++;
                continue;
            }
    
            // 2. Space before certain characters (*, [, #, .) if not already spaced and not inside () or []
            //    and not immediately after another combinator or start of string.
            if (spaceBeforeChars.includes(char) && parenthesisDepth === 0 && bracketDepth === 0) {
                if (prevChar && prevChar !== ' ' && !combinators.includes(prevChar) && prevChar !== '(' && prevChar !== ',') {
                    // Check if the previous character is one that can be directly attached
                    // to a class, id, or attribute selector without a space.
                    const isPartOfCompoundSelector =
                        // e.g., div.class, h1#main
                        /[a-zA-Z0-9]/.test(prevChar) ||
                        // e.g., *.class, *[lang]
                        prevChar === '*' ||
                        // e.g., [type="text"].input
                        prevChar === ']' ||
                        // e.g., :hover.active
                        prevChar === ':' ||
                        // e.g., :not(...).active
                        prevChar === ')' ||
                        // e.g., &.active
                        prevChar === '&';
            
                    if (!isPartOfCompoundSelector) {
                        // The previous character is not part of a compound selector,
                        // so we are starting a new descendant selector. Add a space.
                        result += ' ';
                    }
                }
            }
    
            result += char;
    
            if (char === ',' && parenthesisDepth > 0) { 
                if (nextChar && nextChar !== ' ') {
                    result += ' ';
                }
            }
            else if (char === ',' && parenthesisDepth === 0 && bracketDepth === 0) {
                 if (nextChar && nextChar !== ' ') {
                    result += ' ';
                }
            }
    
            i++;
        }
    
        return result
            .replace(/\s+/g, ' ')                            
            .replace(/([>+~])(?![=\s])/g, '$1 ')            
            .replace(/(?<![\s>+~])([>+~])/g, ' $1')         
            .replace(/,\s*/g, ', ')                         
            .trim();
    }

    /**
     * Splits a complex CSS selector string into an array of its constituent parts.
     *
     * This function parses a string containing mixed standard selectors and at-rules,
     * splitting them at logical boundaries (`;` for at-rules, the start of a new
     * at-rule for standard selectors). It preserves the original order of the parts.
     *
     * @param {string} selectorString The raw CSS selector string to parse.
     *   e.g., "body @media (min-width: 768px); nav > ul"
     * @returns {string[]} An array containing the separated parts in their original order.
     *   e.g., ['body', '@media (min-width: 768px)', 'nav > ul']
     *
     * @example
     * // Returns parts in the order they appear
     * const parts = extractCssSelectorParts("body @media (min-width: 768px); nav > ul");
     * // parts is: ['body', '@media (min-width: 768px)', 'nav > ul']
     */
    function _extractCssSelectorParts(selectorString) {
        const parts = [];
        let remainingSelector = selectorString.trim();

        while (remainingSelector.length > 0) {
            remainingSelector = remainingSelector.trim();
            if (remainingSelector.length === 0) break;

            if (remainingSelector.startsWith('@')) {
                // It's an at-rule. It ends at the next semicolon.
                let semicolonIndex = remainingSelector.indexOf(';');
                if (semicolonIndex === -1) {
                    // No semicolon, so the at-rule is the rest of the string.
                    parts.push(remainingSelector);
                    remainingSelector = "";
                } else {
                    parts.push(remainingSelector.substring(0, semicolonIndex).trim());
                    remainingSelector = remainingSelector.substring(semicolonIndex + 1);
                }
            } else {
                // It's a standard selector. It ends at the next at-rule or the end of the string.
                let nextAtSymbolIndex = remainingSelector.indexOf('@');
                if (nextAtSymbolIndex === -1) {
                    parts.push(remainingSelector.trim());
                    remainingSelector = "";
                } else {
                    let selectorPart = remainingSelector.substring(0, nextAtSymbolIndex).trim();
                    if (selectorPart) {
                        parts.push(selectorPart);
                    }
                    remainingSelector = remainingSelector.substring(nextAtSymbolIndex);
                }
            }
        }
        return parts;
    }

    // Loop through each rule in the provided CSS
    // Initialize the parsed CSS array
    let parsedCSS = [];
    const combinators = ["+", ">", "~"];
    for (const rule of cssProvided) {
        // If the current rule is an array, it's a nested rule
        if (Array.isArray(rule)) {
            let [relativeSelector, declarations] = rule;

            // If the relative selector starts with '@', append a semicolon to it

            if (relativeSelector.startsWith('@')) {
                relativeSelector += ';';

                if (relativeSelector.includes(':')) {
                    let tempSelector = '';
                    let parenthesisDepth = 0;
                    let bracketDepth = 0;
                    let isInSingleQuotes = false;
                    let isInDoubleQuotes = false;

                    // Loop through each character in the declarations
                    // Changed from for...of to a standard for loop to get index 'i'
                    for (let i = 0; i < relativeSelector.length; i++) {
                        let char = relativeSelector[i];
                        // Handle semicolons, colons, quotes, and escape characters
                        let isInside = isInSingleQuotes || isInDoubleQuotes || bracketDepth != 0 || parenthesisDepth != 0; // Is inside quotes/brackets

                        let isPseudoSelectorContextColon = false;
                        if (char === ':') {
                            let nextChar = (i + 1 < relativeSelector.length) ? relativeSelector[i+1] : null;
                            let prevCharWasColon = (i > 0 && relativeSelector[i-1] === ':');

                            // Check if it's part of '::'
                            if (nextChar === ':' || prevCharWasColon) {
                                isPseudoSelectorContextColon = true;
                            }
                            // Check if it's like ':pseudo-class' (e.g., :hover, :nth-child)
                            // i.e., colon followed by a non-whitespace character that isn't another colon
                            else if (nextChar && nextChar.trim() !== '') {
                                isPseudoSelectorContextColon = true;
                            }
                        }

                        if (char === ':' && isInside && !isPseudoSelectorContextColon) {
                            tempSelector += char + ' ';
                        } else {
                            switch (char) {
                                case '(':
                                    parenthesisDepth++;
                                    break;
                                case ')':
                                    parenthesisDepth--;
                                    break;
                                case '[':
                                    bracketDepth++;
                                    break;
                                case ']':
                                    bracketDepth--;
                                    break;
                                case '"':
                                    isInDoubleQuotes ^= 1;
                                    break;
                                case "'":
                                    isInSingleQuotes ^= 1;
                                    break;
                            }
    
                            tempSelector += char;
                        }
                    }
    
                    relativeSelector = tempSelector;
                }
            }

            relativeSelector = _formatSelectorString(relativeSelector);

            // Transform the relative selector to handle all `&` cases.
            if (relativeSelector.includes('&') && prefix) {
                const partitionedAbsoluteSelector = _extractCssSelectorParts(prefix);
                const extractedAtRules = partitionedAbsoluteSelector.filter((part) => part[0] != '@').join(' ');

                const replacement = `:is(${extractedAtRules})`;
                const selectorParts = _splitRespectingBrackets(relativeSelector);
                const transformedParts = selectorParts.map(part => {
                    return part.replace(/&/g, (match, offset) => {
                        if (offset === 0) return '&';
                        return replacement;
                    });
                });
                relativeSelector = transformedParts.join(', ');
            }

            const relativeParts = _splitRespectingBrackets(relativeSelector);

            const absoluteParts = relativeParts.map(part => {
                const isNestingSelector = part == '&';
                const isAnchor = part.startsWith('&');
                const needsSpace = !!prefix;
                
                if (isNestingSelector) {
                    return prefix + ' ' + part;
                } else if (isAnchor) {
                    // For `&.class`, concatenate `prefix` with the part (minus `&`).
                    return prefix + part.substring(1);
                } else {
                    // For `div`, `> div`, etc., combine with a space if needed.
                    return prefix + (needsSpace ? ' ' : '') + part;
                }
            });

            // Join the fully-formed parts back into a final selector string.
            let absoluteSelector = absoluteParts.join(', ');
                
            // Split selector groups and duplicate the nested rules:
            let splitSelectorGroup = _splitCssSelectorGroup(absoluteSelector);

            if (Array.isArray(declarations)) {
                // If not all declarations are arrays, add them to the parsed CSS
                if (!declarations.every(Array.isArray)) {
                    let getRuleOfDeclarations = (innerAbsoluteSelector) => [innerAbsoluteSelector, declarations.filter((d) => typeof d === 'string').join(';')];

                    const newRule = splitSelectorGroup.map((innerAbsoluteSelector) => getRuleOfDeclarations(innerAbsoluteSelector))
                    parsedCSS.push(...newRule);
                }
                
                // Recursively call the function to denest the nested rules, and concatenate the result to the parsed CSS
                const nestedRules = declarations.filter(Array.isArray);

                const newRule = splitSelectorGroup.map((innerAbsoluteSelector) => flattenCSS(nestedRules, innerAbsoluteSelector));
                parsedCSS = parsedCSS.concat(...newRule);
            } else {
                const newRule = splitSelectorGroup.map((newSelector) => [newSelector, declarations]);
                parsedCSS.push(...newRule);
            }
        } else {
            // If the current rule is not an array, add it to the parsed CS
            parsedCSS.push([rule])
        }
    }

    return parsedCSS;
};

function denestCSS(cssProvided) {
    let parsedCSS = [];

    // Helper function to achieve the equivalent of: str.replace(/\s*&/g, '')
    // It processes a string to remove ampersands and any preceding SASS-like whitespace.
    function _processInternalAmpersands(str) {
        // Quick optimization: if no '&' is present, return the original string.
        if (str.indexOf('&') === -1) return str;
    
        let resultChars = []; // Accumulate characters of the new string in an array for performance.
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '&') {
                while (resultChars.length > 0) {
                    let lastAccumulatedChar = resultChars[resultChars.length - 1];
                    if (lastAccumulatedChar === ' ' || lastAccumulatedChar === '\t' || lastAccumulatedChar === '\n' || lastAccumulatedChar === '\r') {
                        resultChars.pop();
                    } else {
                        break; // Stop if a non-whitespace character is encountered
                    }
                }
                // The ampersand itself is skipped (not added to resultChars).
            } else resultChars.push(char); // Add current character to our list.
        }
        return resultChars.join(''); // Combine all collected characters into the final string.
    }

    /**
     * Splits a complex CSS selector string into an array of its constituent parts.
     *
     * This function parses a string containing mixed standard selectors and at-rules,
     * splitting them at logical boundaries (`;` for at-rules, the start of a new
     * at-rule for standard selectors). It preserves the original order of the parts.
     *
     * @param {string} selectorString The raw CSS selector string to parse.
     *   e.g., "body @media (min-width: 768px); nav > ul"
     * @returns {string[]} An array containing the separated parts in their original order.
     *   e.g., ['body', '@media (min-width: 768px)', 'nav > ul']
     *
     * @example
     * // Returns parts in the order they appear
     * const parts = extractCssSelectorParts("body @media (min-width: 768px); nav > ul");
     * // parts is: ['body', '@media (min-width: 768px)', 'nav > ul']
     */
    function _extractCssSelectorParts(selectorString) {
        const parts = [];
        let remainingSelector = selectorString.trim();

        while (remainingSelector.length > 0) {
            remainingSelector = remainingSelector.trim();
            if (remainingSelector.length === 0) break;

            if (remainingSelector.startsWith('@')) {
                // It's an at-rule. It ends at the next semicolon.
                let semicolonIndex = remainingSelector.indexOf(';');
                if (semicolonIndex === -1) {
                    // No semicolon, so the at-rule is the rest of the string.
                    parts.push(remainingSelector);
                    remainingSelector = "";
                } else {
                    parts.push(remainingSelector.substring(0, semicolonIndex).trim());
                    remainingSelector = remainingSelector.substring(semicolonIndex + 1);
                }
            } else {
                // It's a standard selector. It ends at the next at-rule or the end of the string.
                let nextAtSymbolIndex = remainingSelector.indexOf('@');
                if (nextAtSymbolIndex === -1) {
                    parts.push(remainingSelector.trim());
                    remainingSelector = "";
                } else {
                    let selectorPart = remainingSelector.substring(0, nextAtSymbolIndex).trim();
                    if (selectorPart) {
                        parts.push(selectorPart);
                    }
                    remainingSelector = remainingSelector.substring(nextAtSymbolIndex);
                }
            }
        }
        return parts;
    }

    /**
     * Reorders an array of CSS selector parts, grouping at-rules and combining standard selectors.
     *
     * This function takes an array of selector parts (as produced by `extractCssSelectorParts`),
     * separates them into at-rules and standard selectors, and returns a new array.
     * The returned array contains all at-rules first, followed by a single string
     * representing all standard selectors joined together as descendants. It also handles
     * the SASS-style nesting selector `&` by removing it during combination.
     *
     * @param {string[]} selectorParts An array of selector strings, some potentially at-rules.
     *   e.g., ['body', '@media (min-width: 768px)', 'nav > ul']
     * @returns {string[]} A new, ordered array for creating nested CSS structures.
     *   e.g., ['@media (min-width: 768px)', 'body nav > ul']
     *
     * @example
     * const ordered = orderCssSelectorParts(['body', '@media (min-width: 768px)', 'nav > ul']);
     * // ordered is: ['@media (min-width: 768px)', 'body nav > ul']
     *
     * @example
     * // Handles the nesting selector '&'
     * const ordered2 = orderCssSelectorParts(['.parent', '&:hover', '@media (pointer: fine)']);
     * // ordered2 is: ['@media (pointer: fine)', '.parent:hover']
     */
    function _orderCssSelectorParts(selectorParts) {
        // Helper to correctly combine selectors containing the nesting ampersand.
        function _processInternalAmpersands(str) {
            if (str.indexOf('&') === -1) return str;
            // Replaces '&' and any surrounding whitespace, effectively concatenating parts.
            // e.g., "parent & :hover" becomes "parent:hover"
            return str.replace(/\s*&\s*/g, '').trim();
        }

        const atRules = [];
        let combinedSelector = "";

        for (const part of selectorParts) {
            if (part.startsWith('@')) {
                atRules.push(part);
            } else {

                const processedPart = _processInternalAmpersands(part);
                if (!processedPart) continue;

                if (combinedSelector === "") {
                    combinedSelector = processedPart;
                } else {
                    // If the part was meant for concatenation (started with '&'),
                    // _processInternalAmpersands has already handled it.
                    // Otherwise, join with a descendant space.
                    combinedSelector += ' ' + processedPart;
                }
            }
        }
        
        // Clean up potential double spaces created during combination.
        combinedSelector = combinedSelector.replace(/\s\s+/g, ' ').trim();

        const finalResult = [...atRules];
        if (combinedSelector) {
            finalResult.push(combinedSelector);
        }

        return finalResult;
    }

    cssProvided.forEach(([selector, declarations]) => { // declarations parameter is not used in this selector parsing logic

        // Step 1: Extract the parts from the string.
        const extractedParts = _extractCssSelectorParts(selector);
        
        // Step 2: Order the extracted parts for nesting.
        const selectorParts = _orderCssSelectorParts(extractedParts);

        // Actually nest the CSS
        let currentLevel = parsedCSS;

        function addSpaceAfterComma(declarations) {
            if (!declarations) return declarations;

            // Split the declarations by comma
            let parts = declarations.split(',');
        
            // Don't add space after comma.. if it's within a url()
            let urlDepth = 0;
            let result = parts.map((part, index, array) => {
                // Calculate how far within a url() that the part is in
                if (part.includes('url(')) {
                    const openBrackets = part.split('(').length - 1; // Count '('
                    const closeBrackets = part.split(')').length - 1; // Count ')'

                    urlDepth = openBrackets - closeBrackets;
                }

                // Check if we're within a url()
                if (urlDepth > 0) {
                    // Combine the current part with the next part
                    array[index + 1] = part + ',' + array[index + 1];
                    return null; // Remove current item of the array
                }
                return part;
            }).filter(Boolean); // Remove null values ^^
        
            // Add the space after comma
            return result.join(', ');
        }

        selectorParts.forEach((part, i) => {
            let existingIndex = currentLevel.findIndex(([s]) => s === part);

            if (existingIndex == -1) {
                let newPart = [part, []];

                if (i === selectorParts.length - 1) {
                    if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);
                    newPart[1].push([addSpaceAfterComma(declarations)]);
                }

                currentLevel.push(newPart);
                currentLevel = newPart[1];
            } else {
                let currentDeclarations = currentLevel[existingIndex][1][0];

                if (i === selectorParts.length - 1) {
                    if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);


                    if (currentDeclarations.length > 1)  {
                        currentLevel[existingIndex][1].unshift([addSpaceAfterComma(declarations)]);
                    } else {
                        if (declarations) currentLevel[existingIndex][1][0] = [currentDeclarations[0] + ';' + addSpaceAfterComma(declarations)];
                    }

                }
                currentLevel = currentLevel[existingIndex][1];
            }
        });
    });

    // Return the parsed CSS
    return beautifyCSS(parsedCSS);
};

function renestCSS(cssProvided, withHtml) {
    // Define regular CSS at-rules
    let parsedCSS = [];
    
    // Process the segment containing tag, classes, IDs, attributes, and potentially pseudos
    function _transformSelectorSegment(segmentStr) {
        if (!segmentStr) return "";

        let leadingColons = "";
        let mainPartStartIndex = 0;
        // Isolate leading pseudo-class/element colons (e.g; :root, ::before)
        // This is for when _transformSelectorSegment receives a string already starting with ':' or '::'
        if (segmentStr.startsWith("::")) {
            leadingColons = "::";
            mainPartStartIndex = 2;
        } else if (segmentStr.startsWith(":")) {
            leadingColons = ":";
            mainPartStartIndex = 1;
        }
        
        let baseStr = segmentStr.substring(mainPartStartIndex);
        // If only colons were passed (e.g; ":") or empty after colons, return original segmentStr
        if (!baseStr && leadingColons) return segmentStr; 
        // If segmentStr was empty or only colons that made baseStr empty, but no leadingColons captured (e.g; "" input)
        if (!baseStr && !leadingColons) return "";


        let R = []; // Stores parts: tag, .class, #id, [attr], pseudo-name (if baseStr is 'name.class')
        let pos = 0;
        
        // Extract tag name or first part of a pseudo like "hover" from "hover.class"
        let firstPartEnd = 0;
        if (baseStr.length > 0 && baseStr[0] !== '.' && baseStr[0] !== '#' && baseStr[0] !== '[') {
            // Consume until a delimiter or parenthesis (for pseudo-classes like nth-child)
            let parenBalance = 0;
            while (firstPartEnd < baseStr.length) {
                let char = baseStr[firstPartEnd];
                if (char === '(') parenBalance++;
                else if (char === ')') parenBalance--;
                else if (parenBalance === 0 && (char === '.' || char === '#' || char === '[')) {
                    break;
                }
                firstPartEnd++;
            }
            R.push(baseStr.substring(pos, firstPartEnd));
            pos = firstPartEnd;
        }

        // Extract .class, #id, [attr] parts
        while (pos < baseStr.length) {
            let char = baseStr[pos];
            let segmentStartPos = pos;

            if (char === '.' || char === '#') {
                pos++; 
                while (pos < baseStr.length &&
                    baseStr[pos] !== '.' &&
                    baseStr[pos] !== '#' &&
                    baseStr[pos] !== '[') {
                    pos++;
                }
                R.push(baseStr.substring(segmentStartPos, pos));
            } else if (char === '[') { 
                pos++; 
                let balance = 1; 
                let quotes = null; 
                while (pos < baseStr.length) {
                    let c = baseStr[pos];
                    if (quotes) { 
                        if (c === quotes) quotes = null; 
                        else if (c === '\\' && pos + 1 < baseStr.length) pos++; 
                    } else { 
                        if (c === '"' || c === "'") quotes = c; 
                        else if (c === '[') balance++;
                        else if (c === ']') {
                            balance--;
                            if (balance === 0) { 
                                pos++; 
                                break;
                            }
                        }
                    }
                    pos++;
                }
                R.push(baseStr.substring(segmentStartPos, pos)); 
            } else {
                // Should not happen if firstPartEnd logic is correct and input is valid
                // As a fallback, push the rest and stop.
                R.push(baseStr.substring(segmentStartPos));
                break; 
            }
        }

        let finalStr = "";
        if (R.length > 0) {
            // If R[0] is "&" (e.g; from input "&.class"), or
            // if R[0] ends with "&" and there are subsequent parts (e.g; from input "tag&.class" -> R=["tag&", ".class"])
            // then join R parts directly without adding " &".
            if (R[0] === "&" || (R[0].endsWith("&") && R.length > 1) ) {
                finalStr = R.join("");
            } else {
                // Standard case: "tag.class" -> R=["tag", ".class"] -> "tag &.class"
                // or single part like "tag" or "tag&foo" (if R.length is 1)
                finalStr = R[0];
                for (let k = 1; k < R.length; k++) { 
                    finalStr += " &" + R[k];
                }
            }
        }
        return leadingColons + finalStr;
    }

    if (withHtml);
    else {
        // For each CSS rule provided
        cssProvided.forEach(([selector, declarations]) => {
            // Split the selector into parts
            let selectorParts = selector.split(' ');

            let isInside = [];
            for (let i = 0; i < selectorParts.length; i++) {
                if (selectorParts[i].includes(':is(') || selectorParts[i].includes(')')) {
                    if (selectorParts[i].includes(':is(')) isInside.push(i);
                    
                    if (selectorParts[i].includes(')')) {
                        if (isInside.length == 1) {
                            selectorParts.splice(isInside[0], 1 + (i - isInside[0]), selectorParts.slice(isInside[0], i + 1).join(' '));
                        }
                        else if (isInside.length > 1) isInside.pop();
                    }
                }
            }

            if (selector.includes('@')) {
                let newSelectorParts = [];
                let tempPart = '';

                // First loop: Re-joining parts for @-rules (from original code, slightly adjusted)
                for (let i = 0; i < selectorParts.length; i++) {
                    if (selectorParts[i].endsWith(';')) {
                        tempPart += selectorParts[i].slice(0, -1);
                        newSelectorParts.push(tempPart);
                        tempPart = '';
                    } else if (selectorParts[i].startsWith('@')) {
                        if (tempPart.trim() !== '') { // Push any existing tempPart before starting a new @-rule
                            newSelectorParts.push(tempPart.trimEnd()); // Use trimEnd to keep leading spaces if any
                        }
                        tempPart = selectorParts[i] + ' '; // Start new tempPart with @-rule and a space
                    } else if (tempPart !== '') {
                        tempPart += selectorParts[i] + ' ';
                    } else {
                        newSelectorParts.push(selectorParts[i]);
                    }
                }
                
                if (tempPart.trim() !== '') // Add any remaining tempPart after the loop
                    newSelectorParts.push(tempPart.trimEnd());

                selectorParts = newSelectorParts;

                // Second loop: Apply transformation
                // This loop iterates over the potentially re-joined parts from the step above.
                // It applies the detailed transformation only to non-@-rule parts.
                for (let i = 0; i < selectorParts.length; i++) {
                    let currentSelectorString = selectorParts[i];

                    if (!currentSelectorString.trim().startsWith('@')) {
                        // This part is a selector string. Apply the new transformation logic.
                        // (The following is your new logic block, applied to currentSelectorString)

                        let openBracketCount = 0; // For managing parenthesis depth across colon-separated parts

                        let nestedSelectorOriginal = currentSelectorString;

                        let tempSelector = nestedSelectorOriginal;
                        const placeholderAmpDoubleColon = "___PLACEHOLDER_AMP_DOUBLE_COLON___";
                        const placeholderAmpSingleColon = "___PLACEHOLDER_AMP_SINGLE_COLON___";

                        // Replace &:: first, then &: to avoid &:: being partially replaced by &: rule
                        tempSelector = tempSelector.split('&::').join(placeholderAmpDoubleColon);
                        tempSelector = tempSelector.split('&:') .join(placeholderAmpSingleColon);

                        let parts = tempSelector.split(':').map(p =>
                            p.split(placeholderAmpDoubleColon).join('&::')
                            .split(placeholderAmpSingleColon).join('&:')
                        );

                        // Handle cases where selector starts with ':' or '::'
                        if (parts.length > 0 && parts[0] === '' && nestedSelectorOriginal.startsWith(':')) {
                            if (nestedSelectorOriginal.startsWith("::")) { // Starts with ::
                                if (parts.length > 2) { // e.g; ::foo:bar -> ['', '', 'foo', 'bar'] -> splice to ['::foo', 'bar']
                                    parts.splice(0, 3, '::' + parts[2]);
                                } else if (parts.length === 2 && parts[1] === '') { // e.g; :: -> ['', ''] -> splice to ['::']
                                    parts.splice(0, 2, '::');
                                }
                                // Case for "::foo" (parts.length will be 3: ['', '', 'foo']) is covered by parts.length > 2
                            } else { // Starts with :
                                if (parts.length > 1) { // e.g; :foo:bar -> ['', 'foo', 'bar'] -> splice to [':foo', 'bar']
                                    parts.splice(0, 2, ':' + parts[1]);
                                } else if (parts.length === 1 && parts[0] === '') { // Only ":"
                                    parts.splice(0, 1, ':');
                                }
                            }
                        }

                        let resultParts = [];
                        for (let j = 0; j < parts.length; j++) {
                            let currentSegment = parts[j];
                            let transformedSegment = "";
                            let segmentForParenCount = currentSegment; // Use original segment for paren counting

                            if (openBracketCount === 0) { // Not inside parentheses of a functional pseudo
                                if (j === 0) {
                                    // First segment (e.g; "tag.class", ":root", "::before.active")
                                    transformedSegment = _transformSelectorSegment(currentSegment);
                                } else {
                                    // Subsequent segments (these were separated by a top-level ':')
                                    if (currentSegment === '' && j > 0 && j + 1 < parts.length &&
                                        parts[j-1] && !parts[j-1].endsWith(':') &&
                                        !(parts[j-1].startsWith('&:') && parts[j-1].length === 2) &&
                                        !(parts[j-1].startsWith('&::') && parts[j-1].length === 3)
                                    ) {
                                        let pseudoElementName = parts[j+1];
                                        transformedSegment = ' &::' + _transformSelectorSegment(pseudoElementName);
                                        segmentForParenCount += (pseudoElementName || ""); // for paren counting
                                        j++; // Consume the pseudo-element name part
                                    } else if (currentSegment !== '') {
                                        // Regular pseudo-class/element name part
                                        transformedSegment = ' &:' + _transformSelectorSegment(currentSegment);
                                    }
                                }
                            } else { // Inside parentheses (openBracketCount > 0)
                                let needsColonPrefix = false;
                                // Check if the previous result part requires a colon before this segment
                                if (resultParts.length > 0) {
                                    const lastResult = resultParts[resultParts.length - 1];
                                    if (lastResult && !lastResult.endsWith('(') && !lastResult.endsWith(':')) {
                                        needsColonPrefix = true;
                                    }
                                } else if (j > 0) { 
                                    // If not the first part overall (j > 0) and inside parens, it implies a preceding part existed.
                                    // This condition might need refinement based on how `parts` are structured for complex :has() etc.
                                    // For simple cases like :has(div:hover), if parts = ["div", "hover"], this is fine.
                                    needsColonPrefix = true;
                                }
                                transformedSegment = (needsColonPrefix ? ':' : '') + currentSegment;
                            }

                            if (transformedSegment) { // Add only if something was transformed/created
                                resultParts.push(transformedSegment);
                            }

                            // Update openBracketCount based on the segment processed for parenthesis counting
                            if (segmentForParenCount.includes('('))
                                openBracketCount += segmentForParenCount.split('(').length - 1;
                            if (segmentForParenCount.includes(')'))
                                openBracketCount -= segmentForParenCount.split(')').length - 1;

                            openBracketCount = Math.max(openBracketCount, 0); // Ensure it doesn't go negative
                        }
                        selectorParts[i] = resultParts.join(''); // Update the part in the main array
                    }
                }

                // Third part: Final flatMap operation (from original code, added trim() for safety)
                selectorParts = selectorParts.flatMap((part) => ((part.trim().startsWith('@') || part.trim().startsWith(':is(')) ? part : part.split(' ').map((pseudoPart) => pseudoPart.split(',').join(', '))));
                
                // Re-joins combinators (like '>') with their targets (like 'div'),
                // preventing them from being nested incorrectly.
                const combinators = ["+", ">", "~"];
                let nestedSelectorDepth = 0;
                let startIndex = -1;

                for (let i = 0; i < selectorParts.length; i++) {
                    let nestedSelector = selectorParts[i];

                    if (nestedSelector.includes('(')) {
                        if (nestedSelectorDepth === 0) startIndex = i;
                        nestedSelectorDepth += nestedSelector.split("(").length - 1;
                    }

                    if (nestedSelector.includes(')')) {
                        nestedSelectorDepth -= nestedSelector.split(")").length - 1;

                        if (nestedSelectorDepth === 0 && startIndex !== -1) {
                            selectorParts.splice(startIndex, i - startIndex + 1, selectorParts.slice(startIndex, i + 1).join(' '));
                            i = startIndex;
                        }
                    }
                    
                    if (combinators.includes(nestedSelector) && i + 1 < selectorParts.length) {
                        selectorParts.splice(i, 2, nestedSelector + ' ' + selectorParts[i + 1]);
                        i--; 
                    }
                }
            } else {
                // Handle pseudo selectors
                let openBracketCount = 0;

                for (let i = 0; i < selectorParts.length; i++) {
                    // let openBracketCount = 0; // Reset for each top-level selector part (Note: current openBracketCount is outside this loop)

                    let nestedSelectorOriginal = selectorParts[i];
                    
                    // New split logic: Protect '&::' and '&:' before splitting by general ':'
                    let tempSelector = nestedSelectorOriginal;
                    const placeholderAmpDoubleColon = "___PLACEHOLDER_AMP_DOUBLE_COLON___";
                    const placeholderAmpSingleColon = "___PLACEHOLDER_AMP_SINGLE_COLON___";

                    // Replace &:: first, then &: to avoid &:: being partially replaced by &: rule
                    tempSelector = tempSelector.split('&::').join(placeholderAmpDoubleColon);
                    tempSelector = tempSelector.split('&:') .join(placeholderAmpSingleColon);

                    let parts = tempSelector.split(':').map(p =>
                        p.split(placeholderAmpDoubleColon).join('&::')
                         .split(placeholderAmpSingleColon).join('&:')
                    );

                    // Handle cases where selector starts with ':' or '::'
                    // This logic applies *after* the above split, to correctly form the first part if it's a pseudo.
                    if (parts.length > 0 && parts[0] === '' && nestedSelectorOriginal.startsWith(':')) {
                        if (nestedSelectorOriginal.startsWith("::")) { // Starts with :: (e.g; ::before)
                            if (parts.length > 2) { // e.g; ::foo:bar -> ['', '', 'foo', 'bar'] -> splice to ['::foo', 'bar']
                                parts.splice(0, 3, '::' + parts[2]);
                            } else if (parts.length === 2 && parts[1] === '') { // e.g; :: -> ['', ''] -> splice to ['::']
                                parts.splice(0, 2, '::'); 
                            }
                             // If original was just "::foo", parts = ['', '', 'foo'], splice to ["::foo"]
                        } else { // Starts with : (e.g; :hover)
                            if (parts.length > 1) { // e.g; :foo:bar -> ['', 'foo', 'bar'] -> splice to [':foo', 'bar']
                                parts.splice(0, 2, ':' + parts[1]);
                            } else if (parts.length === 1 && parts[0] === '') { // e.g; : -> [''] -> splice to [':']
                                parts.splice(0, 1, ':');
                            }
                            // If original was just ":foo", parts = ['', 'foo'], splice to [":foo"]
                        }
                    }
                    
                    let resultParts = [];
                    
                    for (let j = 0; j < parts.length; j++) {
                        let currentSegment = parts[j];
                        let transformedSegment = "";
                        let segmentForParenCount = currentSegment; // Use original for paren counting

                        if (openBracketCount === 0) {
                            if (j === 0) {
                                // First segment (e.g; "tag.class", ":root", "::before.active", "tag&:pseudo-class")
                                transformedSegment = _transformSelectorSegment(currentSegment);
                            } else {
                                // Subsequent segments (these were separated by a top-level ':')
                                // Check if the split indicates a '::' (empty part between two non-empty parts not ending in ':')
                                if (currentSegment === '' && j > 0 && j + 1 < parts.length && 
                                    parts[j-1] && !parts[j-1].endsWith(':') && 
                                    !(parts[j-1].startsWith('&:') && parts[j-1].length === 2) && // Avoid &::: -> &:: &::
                                    !(parts[j-1].startsWith('&::') && parts[j-1].length === 3) // Avoid &:::: -> &::: &::
                                   ) { 
                                    let pseudoElementName = parts[j+1];
                                    transformedSegment = ' &::' + _transformSelectorSegment(pseudoElementName);
                                    segmentForParenCount += (pseudoElementName || ""); // for paren counting, consider name part too
                                    j++; // Consume the pseudo-element name part as well
                                } else if (currentSegment !== '') { 
                                    // Regular pseudo-class/element name part, e.g; "hover", "nth-child(2n).active"
                                    transformedSegment = ' &:' + _transformSelectorSegment(currentSegment);
                                } else {
                                    // currentSegment is empty, but not matching the '::' condition above.
                                    // This will likely result in an empty transformedSegment and be skipped.
                                }
                            }
                        } else { // Inside parentheses, openBracketCount > 0
                            let needsColonPrefix = false;
                            if (resultParts.length > 0) {
                                const lastResult = resultParts[resultParts.length - 1];
                                if (lastResult && !lastResult.endsWith(':')) {
                                    needsColonPrefix = true;
                                }
                            } else if (j > 0) { 
                                needsColonPrefix = true;
                            }
                            
                            transformedSegment = (needsColonPrefix ? ':' : '') + currentSegment;
                        }
                        
                        if (transformedSegment) { 
                            resultParts.push(transformedSegment);
                        }

                        if (segmentForParenCount.includes('('))
                            openBracketCount += segmentForParenCount.split('(').length - 1;
                        if (segmentForParenCount.includes(')'))
                            openBracketCount -= segmentForParenCount.split(')').length - 1;

                        openBracketCount = Math.max(openBracketCount, 0);
                    }
                    
                    selectorParts[i] = resultParts.join('');
                }

                function endsWithCSSEscape(str) {
                    if (str.length === 0) return false;
                
                    if (str.endsWith('\\')) return false; 
                    if (str.endsWith('\\0') || str.endsWith('\\00')) return true; 
                    if (str.endsWith('\\9') || str.endsWith('\\09')) return true; 
                
                    const hexDigits = '0123456789abcdefABCDEF';
                    let i = str.length - 1;
                    let count = 0;
                
                    while (i >= 0 && hexDigits.includes(str[i])) {
                        count++;
                        i--;
                    }
                
                    if (count > 0 && str[i] === '\\') {
                        return true;
                    }
                
                    const specialChars = ['\\n', '\\r', '\\f', '\\v', '\\t', '\\b'];
                    for (let char of specialChars) {
                        if (str.endsWith(char)) {
                            return true;
                        }
                    }
                
                    return false;
                }

                selector = selectorParts.join(' ');
                selectorParts = selector.split(' ').reverse().filter((item, i, arr) => {
                    if (arr[i + 1] && endsWithCSSEscape(arr[i + 1])) {
                        arr[i + 1] += ' ' + item;
                        return false;
                    } else return true;
                }).reverse().map((part) => part.at(-1) == ' ' ? part.split(',').join(', ') : part);

                const combinators = ["+", ">", /*"||",*/ "~"];
                let nestedSelectorDepth = 0;
                let startIndex = -1;

                for (let i = 0; i < selectorParts.length; i++) {
                    let nestedSelector = selectorParts[i];

                    if (nestedSelector.includes('(')) {
                        if (nestedSelectorDepth === 0) startIndex = i;
                        nestedSelectorDepth += nestedSelector.split("(").length - 1;
                    }

                    if (nestedSelector.includes(')')) {
                        nestedSelectorDepth -= nestedSelector.split(")").length - 1;

                        if (nestedSelectorDepth === 0 && startIndex !== -1) { // Ensure startIndex was set
                            selectorParts.splice(startIndex, i - startIndex + 1, selectorParts.slice(startIndex, i + 1).join(' '));
                            i = startIndex;
                        }
                    }
                    
                    // Check if selectorParts[i+1] exists before accessing it
                    if (combinators.includes(nestedSelector) && i + 1 < selectorParts.length) {
                        selectorParts.splice(i, 2, nestedSelector + ' ' + selectorParts[i + 1]);
                        i--; // Adjust i due to splice, to re-evaluate the new combined part if needed or prevent skipping
                    }
                }
            }

            // Actually nest the CSS
            function _addSpaceAfterComma(declarations) {
                if (!declarations) return declarations;

                // Split the declarations by comma
                let parts = declarations.split(',');
            
                // Don't add space after comma.. if it's within a url()
                let urlDepth = 0;
                let result = parts.map((part, index, array) => {
                    // Calculate how far within a url() that the part is in
                    if (part.includes('url(')) {
                        const openBrackets = part.split('(').length - 1; // Count '('
                        const closeBrackets = part.split(')').length - 1; // Count ')'

                        urlDepth = openBrackets - closeBrackets;
                    }

                    // Check if we're within a url()
                    if (urlDepth > 0) {
                        // Combine the current part with the next part
                        array[index + 1] = part + ',' + array[index + 1];
                        return null; // Remove current item of the array
                    }
                    return part;
                }).filter(Boolean); // Remove null values ^^
            
                // Add the space after comma
                return result.join(', ');
            }
            
            // `currentLevel` acts as a pointer to the current nesting level in the `parsedCSS` tree.
            // It starts at the root and descends as the selector path is processed.
            let currentLevel = parsedCSS;

            // Iterate over each segment of the selector path (e.g., ['nav', '>', 'ul'])
            // to build or traverse the nested structure.
            selectorParts.forEach((part, i) => {
                // Check if a node for the current selector part already exists at this level.
                let existingIndex = currentLevel.findIndex(([s]) => s === part);

                // If the node doesn't exist, create it.
                if (existingIndex == -1) {
                    // A new node is a [selector, children] tuple.
                    let newPart = [part, []];

                    // If this is the last part of the path, it's a leaf node; add its declarations.
                    if (i === selectorParts.length - 1) {
                        if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);
                        newPart[1].push([_addSpaceAfterComma(declarations)]);
                    }

                    // Add the new node to the current level of the tree.
                    currentLevel.push(newPart);
                    // Descend into the new node's children array for the next iteration.
                    currentLevel = newPart[1];
                
                // If the node already exists, traverse into it.
                } else {
                    // If this is the last part of the path, merge declarations into the existing node.
                    if (i === selectorParts.length - 1) {
                        let currentDeclarations = currentLevel[existingIndex][1][0];
                        if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);

                        // Merge new declarations with existing ones.
                        if (currentDeclarations.length > 1)  {
                            currentLevel[existingIndex][1].unshift([_addSpaceAfterComma(declarations)]);
                        } else {
                            if (declarations) currentLevel[existingIndex][1][0] = [currentDeclarations[0] + ';' + _addSpaceAfterComma(declarations)];
                        }
                    }

                    // Descend into the existing node's children array for the next iteration.
                    currentLevel = currentLevel[existingIndex][1];
                }
            });
        });

        // Return the parsed CSS
        return parsedCSS;
    }
};

function beautifyCSS(cssProvided, indent = '') {
    // Initialize the parsed CSS string
    let parsedCSS = '';
	window.editorIndentChar ??= '\t';

    // Loop through each declaration
    for (let i = 0; i < cssProvided.length; i++) {        
        // If the declaration has a selector and nested declarations
        if (cssProvided[i].length == 2) {
            // If no declarations, combined current selector and nested declaration's selectors
            let [selector, nestedDeclarations] = cssProvided[i];

            while (!selector.startsWith('@') && nestedDeclarations.length === 1 && nestedDeclarations[0].length === 2 && !nestedDeclarations[0][0].startsWith('@')) {
                let [childSelector, childDeclarations] = nestedDeclarations[0];

                if (childSelector.startsWith('&') && childSelector[1]) childSelector = childSelector.slice(1);
                else childSelector = ' ' + childSelector;

                selector += childSelector;
                nestedDeclarations = childDeclarations;

                cssProvided[i] = [selector, nestedDeclarations];
            }

            let declarationsForSelector = nestedDeclarations[0];

            // If the selector has no declarations, add it to the parsed CSS string
            if (typeof declarationsForSelector[0] === "undefined") {
                parsedCSS += ((cssProvided[0][0] == selector) ? '' : '\n\n') + indent + selector + ';';
                continue; // Move on to the next mested declaration
            }

            // Add the selector to the parsed CSS string
            parsedCSS += ((cssProvided[0][0] == selector) ? '' : '\n\n') + indent + selector + ' {\n';

            // If the selector has declarations
            if (declarationsForSelector.length == 1) {
                const properties = declarationsForSelector[0].match(/[^;:()]+(?:\([^()]*\))?[^;:()]*:[^;:()]+(?:\([^()]*\))?[^;:]*/g) || [];
                const uniqueProperties = new Map();
            
                properties.forEach(property => {
                    const [key, value] = property.split(/:(.+)/).map(item => item.trim());
                    uniqueProperties.set(key, value);
                });

                declarationsForSelector[0] = Array.from(uniqueProperties).map(([key, value]) => `${key}:${value}`).join(';');

                let declarationsString = '';
                let currentDeclaration = '';
                let parenthesisDepth = 0;
                let bracketDepth = 0;
                let isInSingleQuotes = false;
                let isInDoubleQuotes = false;

                // Loop through each character in the declarations
                for (let char of nestedDeclarations[0][0]) {
                    // Handle semicolons, colons, quotes, and escape characters
                    if (char === ';' && !isInSingleQuotes && !isInDoubleQuotes && bracketDepth == 0 && parenthesisDepth == 0) {
                        declarationsString += currentDeclaration.trim() + ';\n';
                        currentDeclaration = '';
                    } else if (char === ':' && !isInSingleQuotes && !isInDoubleQuotes && bracketDepth == 0 && parenthesisDepth == 0) {
                        if (declarationsString.slice(-1)[0] == '\n' || typeof declarationsString.slice(-1)[0] == "undefined") {
                            declarationsString += indent + window.editorIndentChar + currentDeclaration.trim() + ': ';
                            currentDeclaration = '';
                        }
                    } else {
                        switch (char) {
                            case '(':
                                parenthesisDepth++;
                                break;
                            case ')':
                                parenthesisDepth--;
                                break;
                            case '[':
                                bracketDepth++;
                                break;
                            case ']':
                                bracketDepth--;
                                break;
                            case '"':
                                isInDoubleQuotes ^= 1;
                                break;
                            case "'":
                                isInSingleQuotes ^= 1;
                                break;
                        }

                        currentDeclaration += char;
                    }
                }

                // Add the remaining declaration to the parsed CSS string
                if (currentDeclaration.trim()) declarationsString += currentDeclaration.trim() + ';' + ((nestedDeclarations.length > 1) ? '\n\n' : '');

                nestedDeclarations.shift();
                parsedCSS += declarationsString;
            }

            // If there are nested declarations, recursively call beautifyCSS
            if (nestedDeclarations.length > 0 && Array.isArray(nestedDeclarations[0])) {
                parsedCSS += beautifyCSS(nestedDeclarations, indent + window.editorIndentChar);
            }

            // Close the selector
            parsedCSS += '\n' + indent + '}';
        }
    }

    // Return the beautified CSS
    return parsedCSS;
};
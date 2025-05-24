function nestCode() {
    const annotations = inputEditor.getSession().getAnnotations().filter((a) => a.type == 'error');
    if (annotations.length == 0) {
        outputEditor.getSession().setValue(convertToNestedCSS(inputEditor.getValue()) || '/* Your output CSS will appear here */');
        return true;
    } else {
        console.log('Code Errors:', annotations);
        outputEditor.getSession().setValue('/* Your input CSS contains errors */');
        return false;
        
        // Show a list of the errors if any.
        
        // "Your code doesn't seem to be valid, do you want to try nesting anyways?"
        // "It may not work properly."
    }
};

document.getElementsByTagName('button')[0].addEventListener('click', nestCode);

function convertToNestedCSS(cssProvided, htmlString) {
	window.processMode ??= 2;

    cssProvided = minimizeCSS(cssProvided);
    if (window.processMode == 0) return cssProvided;

    cssProvided = splitCSS(cssProvided);
    cssProvided = flattenCSS(cssProvided);
    if (window.processMode == 2) return denestCSS(cssProvided);

    cssProvided = renestCSS(cssProvided, htmlString);
    if (window.processMode == 1) return beautifyCSS(cssProvided);
};

function minimizeCSS(cssProvided) {
    // 1. Remove all comments, respecting strings
    // This regex matches either a double-quoted string (g1), a single-quoted string (g3), or a comment (g5).
    // If a string is matched, it's kept. If a comment is matched, it's replaced with an empty string.
    cssProvided = cssProvided.replace(
        /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(\/\*[\s\S]*?\*\/)/g,
        (match, doubleQuotedString, _g2, singleQuotedString, _g4, comment) => {
            if (doubleQuotedString) return doubleQuotedString; // Keep double-quoted string
            if (singleQuotedString) return singleQuotedString; // Keep single-quoted string
            if (comment) return ''; // Remove comment
            return match; // Should not be reached if regex is comprehensive
        }
    );

    // 2. Extract string literals
    const strings = [];
    const placeholderPrefix = "__MINIMIZECSS_STRING_LITERAL_";
    const placeholderSuffix = "__";

    // This regex matches either a double-quoted string or a single-quoted string.
    // It's used to find strings to replace them with placeholders.
    cssProvided = cssProvided.replace(
        /("([^"\\]|\\.)*")|('([^'\\]|\\.)*')/g,
        (match) => {
            strings.push(match);
            return `${placeholderPrefix}${strings.length - 1}${placeholderSuffix}`;
        }
    );

    // 3. Perform original minification operations on the CSS with placeholders
    cssProvided = cssProvided
        // .split('/*').map(part => part.split('*/').pop()).join('') // Comment removal already done

        // Join gaps together
        .replace(/\s+/g, ' ')

        // Close gaps between css property names, property values and rules
        .replace(/([,;:{}])\s/g, '$1')

        // Close gaps between prop name and open braces
        .replace(/\s\{/g, '{') // Note: \s{ means a space followed by literal '{'. Same as \s\{

        // Ensure proper spacing around @rules
        .replace(/\s*@/g, '@');

    // The commented-out @rule formatting (if you decide to use it)
    // .replace(/@(?!import)\w+\s*/g, (match) => {
    //  return match.trim() + ' ';
    // });

    // 4. Restore string literals
    for (let i = 0; i < strings.length; i++) {
        // Use a RegExp for replacement to avoid issues if placeholder string contains special regex characters
        // (though unlikely with the chosen placeholder format)
        const placeholder = new RegExp(`${placeholderPrefix}${i}${placeholderSuffix}`, 'g');
        cssProvided = cssProvided.replace(placeholder, strings[i]);
    }

    return cssProvided;
}

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
             // Quote/paren/bracket tracking inside declaration blocks might be needed for complex cases,
             // but the problem description implies the main issue is at the selector/block boundary.
             // For this specific problem, the fix to quote handling in the outer parsing loop
             // and in hasNestableConstruct should be sufficient. The curly bracket counting
             // within a block relies on the context established by the outer loop.
             // If properties themselves could contain complex structures needing quote/paren/bracket
             // protection for their *internal* braces, then the state variables (isInSingleQuotes, etc.)
             // would need to be updated within this `if (insideCurlyBrackets)` block as well.
             // However, for CSS structure, the provided logic for `curlyBracketCount` is typical
             // once a block is entered. The key is *correctly* entering and exiting blocks.

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
}

function flattenCSS(cssProvided, prefix = '') {
    // Initialize the parsed CSS array
    let parsedCSS = [];

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
                // MODIFIED CONDITION:
                if (prevChar && prevChar !== ' ' && !combinators.includes(prevChar) && prevChar !== '(' &&
                    // --- Start of new conditions ---
                    // Do NOT add a space if prevChar is '&' and current char is a class/id/pseudo selector start
                    !(prevChar === '&' && (char === '.' || char === '#' || char === ':')) &&
                    // Do NOT add a space if prevChar is alphanumeric and current char is a class/id selector start
                    !(/[a-zA-Z0-9]/.test(prevChar) && (char === '.' || char === '#')) &&
                    // Do NOT add a space if prevChar is a closing bracket/paren or '*' and current char is class/id
                    !((prevChar === ']' || prevChar === ')' || prevChar === '*') && (char === '.' || char === '#'))
                    // --- End of new conditions ---
                ) {
                    result += ' ';
                }
            }
            
            // 3. Special handling for universal selector '*'
            if (char === '*' && parenthesisDepth === 0 && bracketDepth === 0) {
                result += char;
                if (nextChar && (nextChar === '[' || nextChar === '#' || nextChar === '.' || /^[a-zA-Z]/.test(nextChar))) {
                    if (nextChar !== ' ') {
                         if (nextChar === '[') { 
                            result += ' ';
                         }
                    }
                }
                i++;
                continue;
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

    // Loop through each rule in the provided CSS
    for (let i = 0; i < cssProvided.length; i++) {

        // If the current rule is an array, it's a nested rule
        if (Array.isArray(cssProvided[i])) {
            // Extract the relative selector and declarations from the current rule
            let [relativeSelector, declarations] = cssProvided[i];

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
                    for (let char of relativeSelector) {
                        // Handle semicolons, colons, quotes, and escape characters
                        let isInside = isInSingleQuotes || isInDoubleQuotes || bracketDepth != 0 || parenthesisDepth != 0;
                        if (char === ':' && isInside) tempSelector += char + ' ';
                        else {
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

            // If the declarations are an array, there are nested rules within the current rule
            if (Array.isArray(declarations)) {
                let absoluteSelector = prefix + ((!prefix) ? '' : ' ') + relativeSelector;
                
                // If not all declarations are arrays, add them to the parsed CSS
                if (!declarations.every(Array.isArray)) {
                    parsedCSS.push([absoluteSelector, declarations.filter((d) => typeof d === 'string').join(';')]);
                }

                // Recursively call the function to denest the nested rules, and concatenate the result to the parsed CSS
                parsedCSS = parsedCSS.concat(flattenCSS(declarations.filter(Array.isArray).map(([nestedSelector, nestedDeclarations]) => [nestedSelector, nestedDeclarations]), absoluteSelector));
            } else {
                // If the declarations are not an array, add them to the parsed CSS

                // Split selector groups:
                let splitSelectors = [];
                let currentSelector = '';
                let parenthesisDepth = 0;
                let bracketDepth = 0;
                let isInSingleQuotes = false;
                let isInDoubleQuotes = false;

                for (let j = 0; j < relativeSelector.length; j++) {
                    const char = relativeSelector[j];

                    currentSelector += char;
                    
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
                            if (j === 0 || relativeSelector[j-1] !== '\\') isInDoubleQuotes ^= 1; // Handle escaped quotes
                            break;
                        case "'":
                            if (j === 0 || relativeSelector[j-1] !== '\\') isInSingleQuotes ^= 1; // Handle escaped quotes
                            break;
                    }

                    // If current character is a comma, and it's not within brackets/quotes... and not apart of an @at-rule
                    if (!currentSelector.startsWith('@') && char == ',' && parenthesisDepth == 0 && bracketDepth == 0 && !isInSingleQuotes && !isInDoubleQuotes) {
                        splitSelectors.push(currentSelector.slice(0, -1).trim());
                        currentSelector = '';
                    }

                    // If last character of the relativeSelector string
                    if ((j + 1) == relativeSelector.length) {
                        if (currentSelector.trim() !== '')
                            splitSelectors.push(currentSelector.trim());

                        currentSelector = '';
                    }
                }

                // If currentSelector has content left after loop (e.g; no comma at end), it was handled by (j+1) == relativeSelector.length
                let splitSelectorsWithPrefix = splitSelectors.map((newSelector) => prefix + ((!prefix) ? '' : ' ') + newSelector);
                parsedCSS.push(...splitSelectorsWithPrefix.map((newSelector) => [newSelector, declarations]));
            }
        } else {
            // If the current rule is not an array, add it to the parsed CSS
            parsedCSS.push([cssProvided[i]])
        }
    }

    // Return the parsed CSS
    return parsedCSS;
}

function denestCSS(cssProvided) {
    let parsedCSS = [];
    console.logNow(cssProvided);

    cssProvided.forEach(([selector, declarations]) => { // declarations parameter is not used in this selector parsing logic
        let selectorParts = [];
        let remainingSelector = selector.trim(); // Initial trim of the whole selector string

        while (remainingSelector.length > 0) {
            // Trim whitespace from the current start of remainingSelector before processing
            remainingSelector = remainingSelector.trim();
            if (remainingSelector.length === 0) {
                break; // Nothing left to process
            }

            if (remainingSelector.startsWith('@')) {
                // Current segment is an At-rule
                let semicolonIndex = remainingSelector.indexOf(';');
                
                if (semicolonIndex === -1) {
                    // No semicolon, this @-rule is the last part of the selector string
                    // (e.g; "@keyframes animName" or "@font-face" if it's the end of the input string)
                    selectorParts.push(remainingSelector); // Push the whole remaining string
                    remainingSelector = ""; // Consumed
                } else {
                    // Semicolon found. This at-rule declaration (e.g; @media query, @import, @supports condition) ends here.
                    selectorParts.push(remainingSelector.substring(0, semicolonIndex).trim()); // Trim the extracted at-rule part
                    remainingSelector = remainingSelector.substring(semicolonIndex + 1);
                }
            } else {
                // Current segment is a standard selector group (does not start with '@')
                // This selector group ends either at the end of the string, or just before the next @-rule.
                // We find the next '@' symbol. If it exists, the selector part is everything before it.
                // If no '@' is found, the entire remaining string is the selector part.
                
                let nextAtSymbolIndex = remainingSelector.indexOf('@');
                
                if (nextAtSymbolIndex === -1) {
                    // No more '@' symbols, the rest of the string is this selector group
                    selectorParts.push(remainingSelector.trim()); // Trim the final selector part
                    remainingSelector = ""; // Consumed
                } else {
                    // Found an '@' symbol. Assume it starts a new @-rule.
                    // The current selector group is everything before this '@'.
                    // Example: "body @media..." -> "body" is selector, "@media..." is the start of the next segment.
                    let selectorPart = remainingSelector.substring(0, nextAtSymbolIndex);
                    selectorParts.push(selectorPart.trim()); // Trim the extracted selector part
                    // The remainder starts with '@', and will be processed in the next iteration of the loop.
                    remainingSelector = remainingSelector.substring(nextAtSymbolIndex); 
                }
            }
        }

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

        // Post-process segments: handle SASS-like '&' concatenation.
        // In flattened selectors like "element&:hover" or "element&::before",
        // the '&' symbol refers to the parent part it's appended to.
        // Removing '&' achieves the direct concatenation: "element:hover", "element::before".
        if (selectorParts.some((part) => part.includes('&'))) {
            let result = [];
        
            if (selectorParts.length > 0) {
                // Process the first part:
                let firstElement = _processInternalAmpersands(selectorParts[0]);
                result.push(firstElement);
        
                // Process remaining parts
                for (let i = 1; i < selectorParts.length; i++) {
                    let currentPart = selectorParts[i];
        
                    if (currentPart.startsWith('&')) {
                        // This part starts with '&', so it should be concatenated with the
                        // previous part already processed and stored in 'result'.
        
                        // 1. Remove the leading '&' from currentPart to get the suffix.
                        let suffixRaw = currentPart.substring(1); // .slice(1) also works
        
                        // 2. Process this suffix for any internal ampersands it might contain.
                        let suffixProcessed = _processInternalAmpersands(suffixRaw);
                        
                        // Append the processed suffix to the last element in 'result'.
                        result[result.length - 1] += suffixProcessed;
                    } else {
                        // This part does not start with '&'. It's a new, separate segment.
                        // Process it for internal ampersands, similar to the firstElement.
                        result.push(_processInternalAmpersands(currentPart));
                    }
                }
            }
            // Update selectorParts with the transformed array
            selectorParts = result;
        }

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
    console.logNow(parsedCSS);
    return beautifyCSS(parsedCSS);
}

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
                selectorParts = selectorParts.flatMap((part) => ((part.trim().startsWith('@')) ? part : part.split(' ').map((pseudoPart) => pseudoPart.split(',').join(', '))));
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
                                if (lastResult && !lastResult.endsWith('(') && !lastResult.endsWith(':')) {
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
                }).reverse().map((part) => part.split(',').join(', '));

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
        return parsedCSS;
    }
}

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
                
                if (childSelector.startsWith('&')) childSelector = childSelector.slice(1);
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
}
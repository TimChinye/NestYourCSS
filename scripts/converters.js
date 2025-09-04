/**
 * The new structure for a parsed selector.
 * @typedef {object} SelectorGroup
 * @property {string[]} parts - The tokenized parts of the selector group (e.g; ['#id', '>', 'p']).
 * @property {number} newlinesBefore - The number of newlines counted before this group.
 * @property {string} [commentAfter] - An optional comment that appears after this group's comma.
 */

/**
 * Parses a selector string into a structured array of its parts, preserving newlines and comments between groups.
 *
 * @param {string} selectorText The raw selector string.
 * @returns {SelectorGroup[]} An array of selector group objects.
 */
function parseSelector(selectorText) {
    const groups = [{ parts: [], newlinesBefore: 0 }];
    let buffer = '';
    let pos = 0;
    const len = selectorText.length;
    const combinators = ['>', '+', '~'];

    let parenDepth = 0;
    let attributeDepth = 0;

    while (pos < len) {
        const char = selectorText[pos];

        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === '[') attributeDepth++;
        else if (char === ']') attributeDepth--;

        if (parenDepth === 0 && attributeDepth === 0) {
            if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
                if (buffer) {
                    groups[groups.length - 1].parts.push(buffer);
                    buffer = '';
                }

                const lastGroup = groups[groups.length - 1];
                if (lastGroup.parts.length > 0) {
                    const lastPart = lastGroup.parts.at(-1);
                    if (lastPart !== ' ' && !combinators.includes(lastPart)) {
                        lastGroup.parts.push(' ');
                    }
                }
                
                pos++;
                continue;
            }

            if (combinators.includes(char) || char === ',') {
                if (buffer) {
                    groups[groups.length - 1].parts.push(buffer);
                    buffer = '';
                }
                
                const lastGroup = groups[groups.length - 1];
                if (lastGroup.parts.length > 0 && lastGroup.parts.at(-1) === ' ') {
                    lastGroup.parts.pop();
                }

                if (char === ',') {
                    pos++; // Consume the comma
                    let newlines = 0;
                    let commentBuffer = '';
                    // Look ahead for comments, newlines and whitespace
                    while (pos < len) {
                        const nextChar = selectorText[pos];
                        if (nextChar === '\n') {
                            newlines++;
                            pos++;
                        } else if (nextChar === ' ' || nextChar === '\t' || nextChar === '\r') {
                            pos++;
                        } else if (nextChar === '/' && selectorText[pos + 1] === '*') {
                            const commentStart = pos;
                            pos += 2; // Skip /*
                            while (pos < len && !(selectorText[pos] === '*' && selectorText[pos + 1] === '/')) {
                                pos++;
                            }
                            if (pos < len) pos += 2; // Skip */
                            
                            if (commentBuffer) commentBuffer += ' ';
                            commentBuffer += selectorText.substring(commentStart, pos);
                        } else {
                            break; // Found a start of next selector part
                        }
                    }
                    
                    // Attach the found comment to the group we just finished.
                    if (commentBuffer) {
                        lastGroup.commentAfter = commentBuffer.trim();
                    }

                    groups.push({ parts: [], newlinesBefore: Math.min(newlines, 1) });
                    continue; // Continue outer loop from the new position
                } else {
                    lastGroup.parts.push(char);
                }
                pos++;
                continue;
            }
        }

        buffer += char;
        pos++;
    }

    if (buffer) {
        groups[groups.length - 1].parts.push(buffer);
    }

    return groups.map(g => {
        if (g.parts.length > 0 && g.parts.at(-1) === ' ') {
            g.parts.pop();
        }
        return g;
    }).filter(g => g.parts.length > 0);
}

/**
 * The structure for a parsed Declaration value.
 * @typedef {string[]} ValueTokens
 */

/**
 * Parses a declaration value string into an array of tokens.
 *
 * @param {string} valueText The raw declaration value string.
 * @returns {ValueTokens} An array of value tokens.
 */
function parseValue(valueText) {
    const tokens = [];
    let buffer = '';
    let pos = 0;
    const len = valueText.length;
    let inString = null;
    let parenDepth = 0;

    const flushBuffer = () => {
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer) {
            tokens.push(trimmedBuffer);
        }
        buffer = '';
    };

    while (pos < len) {
        const char = valueText[pos];
        const prevChar = pos > 0 ? valueText[pos - 1] : null;

        // Check for block comments first.
        if (char === '/' && valueText[pos + 1] === '*') {
            flushBuffer();
            const commentStart = pos;
            pos += 2; // Skip /*
            while (pos < len && !(valueText[pos] === '*' && valueText[pos + 1] === '/')) {
                pos++;
            }
            if (pos < len) {
                pos += 2; // Skip */
            }
            tokens.push(valueText.substring(commentStart, pos));
            continue; // Continue to next iteration, as pos is already advanced
        }

        if (inString) {
            buffer += char;
            if (char === inString && prevChar !== '\\') {
                inString = null;
            }
        } else if (char === '"' || char === "'") {
            buffer += char;
            inString = char;
        } else if (char === '(') {
            parenDepth++;
            buffer += char;
        } else if (char === ')') {
            parenDepth--;
            buffer += char;
            if (parenDepth === 0) {
                flushBuffer();
            }
        } else if ((char === '/' || char === ',') && parenDepth === 0) {
            flushBuffer();
            tokens.push(char);
        } else if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
            if (parenDepth === 0) {
                flushBuffer();
            } else {
                if (buffer.length > 0 && !buffer.endsWith(' ')) {
                   buffer += ' ';
                }
            }
        } else {
            buffer += char;
        }
        pos++;
    }

    flushBuffer();
    return tokens;
}
 
/**
 * The parseCSS function remains exactly the same, as its logic is correct.
 * It will now just produce Rule nodes with the new selector structure.
 * @param {string} cssString 
 * @returns 
 */
export function parseCSS(cssString) {
    let pos = 0;
    const len = cssString.length;
    const root = { type: 'Stylesheet', body: [] };
    const stack = [root];
    const preserveComments = typeof window !== 'undefined' && window.preserveComments === true;

    while (pos < len) {
        const context = stack[stack.length - 1];
        const initSpacesAbove = -1;
        let spacesAbove = initSpacesAbove;

        // Consume whitespace and comments within selectors/declarations.
        while (pos < len) {
            const currentChar = cssString[pos];

            if (currentChar === ' ' || currentChar === '\t' || currentChar === '\r') {
                pos++;
                continue;
            } else if (currentChar === '\n') {
                spacesAbove++;
                pos++;
                continue;
            } else if (currentChar === '/' && cssString[pos + 1] === '*') {
                pos += 2; // Skip '/*'
                const commentStart = pos;
                while (pos < len && (cssString[pos] !== '*' || cssString[pos + 1] !== '/')) {
                    pos++;
                }

                if (preserveComments) {
                    const lastNode = context.body.at(-1);
                    const commentNode = {
                        type: 'Comment',
                        value: cssString.substring(commentStart, pos).trim(),
                        spacesAbove: ((typeof lastNode === 'undefined' || lastNode?.type === 'Declaration') && spacesAbove === initSpacesAbove) ? -1 : Math.max(0, Math.min(spacesAbove, 1))
                    };
                    context.body.push(commentNode);
                }

                if (pos < len) pos += 2; // Skip '*/'
                spacesAbove = initSpacesAbove; // Reset for next node
            } else {
                break;
            }
        }
        
        if (pos >= len) break;
        if (cssString[pos] === '}') {
            stack.pop();
            pos++;
            continue;
        }

        // Scan for the end of the current statement ({ or ; or }),
        let curlyFound = false;
        let parenDepth = 0;
        let inString = null;
        let segmentBuilder = '';

        while (pos < len) {
            const char = cssString[pos];

            if (inString) {
                if (char === inString && cssString[pos - 1] !== '\\') {
                    inString = null;
                }
            } else if (char === '"' || char === "'") {
                inString = char;
            } else if (char === '/' && cssString[pos + 1] === '*') {
                const commentStart = pos;
                pos += 2; 
                while (pos < len && (cssString[pos] !== '*' || cssString[pos + 1] !== '/')) {
                    pos++;
                }
                if (pos < len) pos += 2;

                if (preserveComments) {
                    segmentBuilder += cssString.substring(commentStart, pos);
                }
                continue;
            } else if (char === '(') {
                parenDepth++;
            } else if (char === ')') {
                parenDepth--;
            } else if (parenDepth === 0) {
                if (char === '{') {
                    curlyFound = true;
                    break;
                }
                if (char === ';' || (char === '}' && context.type !== 'Stylesheet')) {
                    break;
                }
            }
            
            segmentBuilder += char;
            pos++;
        }
        
        const lastNode = context.body.at(-1);
        const segment = segmentBuilder.trim();

        const declarationSpacesAbove = Math.max(0, Math.min(spacesAbove, 1));
        if (typeof lastNode === 'undefined') spacesAbove = 0;
        else if (['Rule', 'AtRule'].includes(lastNode?.type)) spacesAbove = 1;
        else spacesAbove = Math.max(0, Math.min(spacesAbove, 1));

        const newNode = { spacesAbove };

        // Decide what to do with the captured segment.
        if (curlyFound) {
            newNode.body = [];
            
            if (segment.startsWith('@')) {
                const firstSpace = segment.indexOf(' ');

                newNode.type = 'AtRule';
                newNode.name = segment.substring(1, firstSpace === -1 ? segment.length : firstSpace);
                newNode.params = firstSpace === -1 ? '' : segment.substring(firstSpace + 1).trim();
            } else {
                newNode.type = 'Rule';
                newNode.selector = parseSelector(segment);
            }
            
            context.body.push(newNode);
            stack.push(newNode);
            pos++; // consume '{'
        } else { 
            if (segment.includes(':') && context.type !== 'Stylesheet') {
                const colonIndex = segment.indexOf(':');
                const property = segment.substring(0, colonIndex).trim();
                const value = segment.substring(colonIndex + 1).trim();
                
                newNode.type = 'Declaration';
                newNode.property = property;
                newNode.value = parseValue(value);
                newNode.spacesAbove = declarationSpacesAbove;
                
                context.body.push(newNode);
            } else if (segment.startsWith('@')) {
                const firstSpace = segment.indexOf(' ');

                newNode.type = 'AtRule';
                newNode.name = segment.substring(1, firstSpace === -1 ? segment.length : firstSpace);
                newNode.params = firstSpace === -1 ? '' : segment.substring(firstSpace + 1).trim();
                newNode.body = null;

                context.body.push(newNode);
            }
            
            if (pos < len && cssString[pos] === ';') {
                pos++;
            }
        }
    }

    return root;
}

/**
 * Converts a parsed selector structure back into a minified string.
 * @param {SelectorGroup[]} groups The parsed selector groups.
 * @returns {string} The minified selector string.
 */
function minifySelector(groups) {
    // Access the .parts property of each group object and join them.
    return groups.map(group => group.parts.join('')).join(',');
}

/**
 * Converts a tokenized declaration value back into a minified string.
 * @param {ValueTokens} tokens The tokenized value parts.
 * @returns {string} The minified value string.
 */
function minifyValue(tokens) {
    if (!tokens || tokens.length === 0) {
        return '';
    }

    let result = tokens[0];

    for (let i = 1; i < tokens.length; i++) {
        const prevToken = tokens[i - 1];
        const token = tokens[i];

        const lastCharPrev = prevToken.slice(-1);
        const firstCharToken = token[0];

        let spaceNeeded = false;

        // Case 1: The most common requirement for a space is between two alphanumeric
        // characters that would otherwise merge into a single identifier.
        // e.g; "1px" and "solid" -> "1px solid"
        // e.g; "border-box" and "important" -> "border-box !important" (after '!' is handled)
        if (/[a-zA-Z0-9]/.test(lastCharPrev) && /[a-zA-Z0-9]/.test(firstCharToken)) {
            spaceNeeded = true;
        }

        // Case 2: A space is needed after a closing parenthesis if it's followed by
        // an identifier that doesn't start with an operator.
        // e.g; "rgba(0,0,0)" and "solid" -> "rgba(0,0,0) solid"
        else if (lastCharPrev === ')' && /[a-zA-Z0-9]/.test(firstCharToken)) {
            spaceNeeded = true;
        }
        
        // In all other cases, no space is needed. This correctly handles:
        // - Joining `!` and `important`: `!` is not alphanumeric.
        // - Attaching values to `!`: `10px` and `!` are joined to `10px!`.
        // - Operators and commas: `10px/1.5` or `shadow(0,0,0)`.
        // - Unary minus: `10px -5px` becomes `10px-5px`, which is valid.
        // - Functions: `rgb` and `(...)` become `rgb(...)`.

        if (spaceNeeded) {
            result += ' ';
        }
        result += token;
    }

    return result;
}

/**
 * Converts a CSS AST into a minified string.
 *
 * @param {object} ast The Abstract Syntax Tree generated by parseCSS.
 * @returns {string} The minified CSS string.
 */
export function minifyCSS(ast) {
    function _minify(node) {
        if (!node || !node.body) return '';
        return node.body.map(child => {
            switch (child.type) {
                case 'Comment':
                    return `/*${child.value}*/`;
                case 'Declaration':
                    return `${child.property}:${minifyValue(child.value)};`;
                case 'AtRule':
                    const atRuleString = `@${child.name}${child.params ? ' ' + child.params : ''}`;
                    if (child.body) {
                        let bodyContent = _minify(child);
                        if (bodyContent.at(-1) === ';') bodyContent = bodyContent.slice(0, -1);
                        return bodyContent ? `${atRuleString}{${bodyContent}}` : '';
                    } else {
                        return `${atRuleString};`;
                    }
                case 'Rule':
                    let bodyContent = _minify(child);
                    if (bodyContent.at(-1) === ';') bodyContent = bodyContent.slice(0, -1);
                    return bodyContent ? `${minifySelector(child.selector)}{${bodyContent}}` : '';
                default:
                    return '';
            }
        }).join('');
    }

    return _minify(ast);
}

function beautifyMathContent(content) {
    let result = '';
    let buffer = '';
    let pos = 0;
    const len = content.length;
    let parenDepth = 0;
    const operators = ['+', '-', '*', '/'];

    const flush = () => {
        if (buffer) {
            result += buffer;
            buffer = '';
        }
    };

    while (pos < len) {
        const char = content[pos];

        if (char === '(') {
            parenDepth++;
            buffer += char;
        } else if (char === ')') {
            parenDepth--;
            buffer += char;
        } else if (operators.includes(char) && parenDepth === 0) {
            flush();
            const lastChar = result.trim().at(-1);
            const isUnary = char === '-' && (!lastChar || ['(', '*', '/', '+', '-'].includes(lastChar));
            
            if (!isUnary) result = result.trimEnd() + ' ';
            result += char;
            if (!isUnary) result += ' ';

        } else {
            buffer += char;
        }
        pos++;
    }
    flush();
    return result.replace(/\s+/g, ' ').trim();
}

/**
 * Converts a parsed selector structure back into a beautified string, preserving newlines and comments.
 * @param {SelectorGroup[]} groups The parsed selector groups.
 * @param {string} indent The current indentation string for multi-line selectors.
 * @returns {string} The formatted selector string.
 */
function beautifySelector(groups, indent) {
    let result = '';
    
    /**
     * Converts a single selector group's parts into a string.
     * @param {string[]} parts The tokenized parts of the selector.
     * @returns {string} The stringified selector group.
     */
    function stringifyGroup(parts) {
        const combinators = ['>', '+', '~'];
        let result = '';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const prevPart = i > 0 ? parts[i - 1] : null;

            if (i > 0) {
                if (part === ' ' || combinators.includes(part) || (prevPart && combinators.includes(prevPart))) {
                    result += ' ';
                }
            }
            if (part !== ' ') {
                result += part;
            }
        }
        return result;
    }

    groups.forEach((group, index) => {
        // First, add the content of the current group.
        result += stringifyGroup(group.parts);
        
        // Then, add its associated comment, if any.
        if (group.commentAfter) {
            result += ' ' + group.commentAfter;
        }

        // Finally, add the separator (comma, space, or newline) for the *next* group.
        if (index < groups.length - 1) {
            const nextGroup = groups[index + 1];
            result += ',';
            if (nextGroup.newlinesBefore === 1) {
                result += '\n'; // Only one newline, repeat is not needed based on new parser
                result += indent;
            } else {
                result += ' ';
            }
        }
    });
    return result;
}

/**
 * Converts a tokenized declaration value back into a beautified string.
 * @param {ValueTokens} valueTokens The tokenized value parts.
 * @returns {string} The beautified value string.
 */
function beautifyValue(valueTokens) {
    if (!valueTokens || valueTokens.length === 0) return '';
    
    const processedTokens = valueTokens.map(token => {
        const parenIndex = token.indexOf('(');
        if (parenIndex !== -1 && token.endsWith(')')) {
            const functionName = token.substring(0, parenIndex).toLowerCase().trim();
            const prefix = token.substring(0, parenIndex + 1);
            const content = token.substring(parenIndex + 1, token.length - 1);
            const suffix = ')';
            
            if (functionName === 'calc' || (functionName === '' && token.startsWith('(('))) {
                return prefix + beautifyMathContent(content) + suffix;
            }
            if (functionName === 'url') {
                return prefix + content.trim() + suffix;
            }
            // Recursive step: beautify the content of any other function
            // by treating its content as a new value.
            return prefix + beautifyValue(parseValue(content)) + suffix;
        }
        return token;
    });

    // Join the master tokens with spaces, then clean up commas. The slash is handled
    // by the tokenizer, so a global replace is no longer needed and would be harmful.
    return processedTokens.join(' ').replace(/\s*,\s*/g, ', ');
}

/**
 * Converts a CSS AST back into a well-formatted, human-readable string.
 *
 * @param {object} ast The Abstract Syntax Tree generated by parseCSS.
 * @param {string} [initialIndent=''] The initial indentation string.
 * @returns {string} The formatted CSS string.
 */
export function beautifyCSS(ast, initialIndent = '') {
    const indentChar = typeof window !== 'undefined' && window.editorIndentChar ? window.editorIndentChar : '\t';
    
    function _beautify(node, indent) {
        if (!node || !node.body) return '';
        let css = '';
        node.body.forEach((child) => {
            if (child.spacesAbove === -1) {
                css += ' ';
            } else {
                css += '\n'.repeat(child.spacesAbove + 1);
            }
            
            if (child.spacesAbove > -1) css += indent;

            switch (child.type) {
                case 'Comment':
                    css += `/* ${child.value} */`;
                    break;
                case 'Declaration':
                    css += `${child.property}: ${beautifyValue(child.value)};`;
                    break;
                case 'AtRule':
                    css += `@${child.name}${child.params ? ' ' + child.params : ''}`;
                    if (child.body) {
                        if (child.body.length > 0) {
                            css += ' {';
                            css += _beautify(child, indent + indentChar);
                            css += '\n' + indent + '}';
                        } else {
                            css += ' {}';
                        }
                    } else {
                        css += ';';
                    }
                    break;
                case 'Rule':
                    // Pass the current indent to handle multi-line selector alignment.
                    css += `${beautifySelector(child.selector, indent)}`;
                    if (child.body.length > 0) {
                        css += ' {';
                        css += _beautify(child, indent + indentChar);
                        css += '\n' + indent + '}';
                    } else {
                        css += ' {}';
                    }
                    break;
            }
        });
        return css;
    }

    return _beautify(ast, initialIndent).trim();
}

/**
 * Creates a deep clone of a CSS AST node.
 * @param {object} node The AST node to clone.
 * @returns {object} The cloned AST node.
 */
function cloneASTNode(node) {
    return JSON.parse(JSON.stringify(node));
}

/**
 * Stringifies a selector group array back into a string for use within :is().
 * This is a simplified version of beautify/minify for this specific purpose.
 * @param {SelectorGroup[]} groups The parsed selector groups.
 * @returns {string} The stringified selector.
 */
function stringifySelectorForIs(groups) {
    // This is a simplified stringifier that doesn't add extra spaces around combinators.
    return groups.map(group => group.parts.join('')).join(',');
}

/**
 * Checks if a selector part is a combinator.
 * @param {string} part The selector part string.
 * @returns {boolean} True if the part is a combinator.
 */
function isCombinator(part) {
    return part === '>' || part === '+' || part === '~' || part === ' ';
}

/**
 * Combines a parent selector with a child selector according to CSS nesting rules.
 *
 * @param {SelectorGroup[] | null} parentGroups The parent selector groups.
 * @param {SelectorGroup[]} childGroups The child selector groups.
 * @returns {SelectorGroup[]} The new, combined selector groups.
 */
function combineSelectors(parentGroups, childGroups) {
    // Case 1: No parent context (top-level rules).
    if (!parentGroups || parentGroups.length === 0) {
        // According to the spec, a top-level '&' refers to the scoping root.
        // We'll represent this with `:root` for a sensible default in global CSS.
        return childGroups.map(group => {
            const newParts = group.parts.map(p => p.includes('&') ? p.replace(/&/g, ':root') : p);
            return { ...group, parts: newParts };
        });
    }

    const newSelectorGroups = [];
    
    // The spec mandates that a selector list in the parent context is wrapped in :is().
    // This simplifies combination logic significantly, as we can treat the entire
    // parent list as a single conceptual unit.
    const parentIsList = parentGroups.length > 1;
    const parentSelectorString = stringifySelectorForIs(parentGroups);
    
    // This is the base string for replacing '&' when it appears at the start of a selector.
    const parentContextAsSelector = parentIsList ? `:is(${parentSelectorString})` : parentSelectorString;
    
    // For concatenation cases (like `&&`), a type selector must be wrapped in `:is()`
    // to avoid invalid selectors (e.g., `main` + `main` -> `mainmain`).
    const parentStartsWithType = !parentIsList && parentGroups[0].parts.length > 0 && /^[a-zA-Z]/.test(parentGroups[0].parts[0]);
    const safeParentForConcat = parentStartsWithType ? `:is(${parentSelectorString})` : parentContextAsSelector;

    for (const childGroup of childGroups) {
        const hasAmpersand = childGroup.parts.some(p => p.includes('&'));

        // Case 2: No '&' found. This is a simple descendant selector.
        // e.g., .parent { .child {} } -> .parent .child {}
        if (!hasAmpersand) {
            const parentParts = parseSelector(parentContextAsSelector)[0].parts;
            const newParts = [...parentParts, ' ', ...childGroup.parts];
            newSelectorGroups.push({ ...childGroup, parts: newParts });
            continue;
        }

        // Case 3: '&' is present. Perform substitution.
        let combinedParts = [];
        for (const part of childGroup.parts) {
            if (!part.includes('&')) {
                combinedParts.push(part);
                continue;
            }

            // A part can contain multiple ampersands, e.g., `&&&` or `&.foo&`.
            // We split the part by '&' and insert the parent context accordingly.
            const subParts = part.split('&');
            
            subParts.forEach((subPart, index) => {
                // An ampersand existed before this subPart (unless it's the first empty string from a leading &)
                if (index > 0) {
                    const lastPart = combinedParts.length > 0 ? combinedParts[combinedParts.length - 1] : null;
                    const isConcatenating = lastPart && !isCombinator(lastPart);
                    
                    const replacementString = isConcatenating ? safeParentForConcat : parentContextAsSelector;
                    const replacementParts = parseSelector(replacementString)[0].parts;
                    combinedParts.push(...replacementParts);
                }

                if (subPart) {
                    combinedParts.push(subPart);
                }
            });
        }
        
        // The resulting combination might itself be a list or have complex structures,
        // so we re-parse it to normalize the structure into valid SelectorGroups.
        const normalizedGroups = parseSelector(combinedParts.join(''));
        newSelectorGroups.push(...normalizedGroups.map(g => ({
            ...childGroup, // Preserve original comment/newline info
            ...g
        })));
    }

    return newSelectorGroups;
}

/**
 * Traverses a CSS AST and returns a new AST with all nesting resolved ("denested").
 * This produces a flat structure equivalent to what a browser would interpret.
 *
 * @param {object} ast The Abstract Syntax Tree generated by parseCSS.
 * @returns {object} A new AST with nesting removed.
 */
export function denestCSS(ast) {
    /**
     * The recursive worker function that processes nodes.
     * @param {object[]} nodes - The array of nodes to process.
     * @param {object} context - The current nesting context.
     * @param {SelectorGroup[] | null} context.selector - The selector of the current parent rule.
     * @param {object | null} context.atRule - The info of the current parent at-rule.
     * @returns {object[]} A new array of denested nodes.
     */
    function _denest(nodes, context) {
        if (!Array.isArray(nodes)) {
            return []; // Guard against non-iterable bodies (e.g., from @import)
        }

        const denestedNodes = [];
        let pendingDeclarations = [];

        const flushDeclarations = () => {
            if (pendingDeclarations.length > 0) {
                if (context.selector) {
                    // Hoist declarations into a new rule with the parent context's selector.
                    const rule = {
                        type: 'Rule',
                        selector: cloneASTNode(context.selector),
                        body: pendingDeclarations,
                        spacesAbove: denestedNodes.length === 0 ? 0 : 1
                    };
                    denestedNodes.push(rule);
                } else {
                    // If there's no selector (e.g., directly inside @layer),
                    // preserve comments and handle declarations as invalid (or just keep comments).
                    denestedNodes.push(...pendingDeclarations.filter(n => n.type === 'Comment'));
                }
            }
            pendingDeclarations = [];
        };

        for (const node of nodes) {
            if (node.type === 'Declaration' || node.type === 'Comment') {
                pendingDeclarations.push(cloneASTNode(node));
                continue;
            }
            
            // Any rule or at-rule forces pending declarations to be flushed.
            flushDeclarations();

            if (node.type === 'Rule') {
                const newSelector = combineSelectors(context.selector, node.selector);
                const newContext = { ...context, selector: newSelector };
                const childNodes = _denest(node.body, newContext);
                
                if (childNodes.length > 0) {
                    if (denestedNodes.length > 0 && ['Rule', 'AtRule'].includes(denestedNodes.at(-1)?.type)) {
                         // Ensure a newline between consecutive rules/at-rules.
                        if (childNodes[0].spacesAbove === 0) childNodes[0].spacesAbove = 1;
                    }
                    denestedNodes.push(...childNodes);
                }
            }

            if (node.type === 'AtRule') {
                 // Check if we need to combine nested @media rules.
                let combinedAtRuleParams = node.params;
                if (context.atRule && context.atRule.name === 'media' && node.name === 'media') {
                     combinedAtRuleParams = `${context.atRule.params} and (${node.params})`;
                }
                
                const newAtRuleContext = { name: node.name, params: combinedAtRuleParams };
                
                // Pass the selector context down, but use the new combined at-rule context.
                const childContext = {
                    selector: context.selector,
                    atRule: newAtRuleContext,
                };
                
                const childNodes = _denest(node.body, childContext);

                if (childNodes.length > 0) {
                    const atRuleWrapper = cloneASTNode(node);
                    atRuleWrapper.params = combinedAtRuleParams;
                    atRuleWrapper.body = childNodes;
                    if (denestedNodes.length > 0) atRuleWrapper.spacesAbove = 1;
                    denestedNodes.push(atRuleWrapper);
                } else if (node.body === null) {
                    // Preserve at-rules with no body, like @import or @charset.
                    denestedNodes.push(cloneASTNode(node));
                }
            }
        }

        flushDeclarations();

        return denestedNodes;
    }

    const newRoot = cloneASTNode(ast);
    newRoot.body = _denest(ast.body, { selector: null, atRule: null });
    return newRoot;
}
/**
 * The new structure for a parsed selector.
 * @typedef {object} SelectorGroup
 * @property {string[]} parts - The tokenized parts of the selector group (e.g., ['#id', '>', 'p']).
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

// The parseCSS function remains exactly the same, as its logic is correct.
// It will now just produce Rule nodes with the new selector structure.
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
                const value = parseValue(segment.substring(colonIndex + 1).trim());
                
                newNode.type = 'Declaration';
                newNode.property = property;
                newNode.value = value;
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
        // e.g., "1px" and "solid" -> "1px solid"
        // e.g., "border-box" and "important" -> "border-box !important" (after '!' is handled)
        if (/[a-zA-Z0-9]/.test(lastCharPrev) && /[a-zA-Z0-9]/.test(firstCharToken)) {
            spaceNeeded = true;
        }

        // Case 2: A space is needed after a closing parenthesis if it's followed by
        // an identifier that doesn't start with an operator.
        // e.g., "rgba(0,0,0)" and "solid" -> "rgba(0,0,0) solid"
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
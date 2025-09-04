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

                    const isFirstNodeInBlock = typeof lastNode === 'undefined';
                    const isAfterDeclaration = lastNode?.type === 'Declaration';
                    const isInSpecialPosition = isFirstNodeInBlock || isAfterDeclaration;
                    const isInline = spacesAbove === initSpacesAbove;
                    
                    const shouldUseDefaultFormatterBehavior = isInSpecialPosition && isInline;
                    const clampedSpacesAbove = Math.max(0, Math.min(spacesAbove, 1));
                    
                    const commentNode = {
                        type: 'Comment',
                        value: cssString.substring(commentStart, pos).trim(),
                        spacesAbove: shouldUseDefaultFormatterBehavior ? initSpacesAbove : (['Rule', 'AtRule'].includes(lastNode?.type) ? 1 : clampedSpacesAbove)
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
 * Combines a parent selector with a child selector according to CSS nesting rules.
 *
 * @param {SelectorGroup[] | null} parentGroups The parent selector groups.
 * @param {SelectorGroup[]} childGroups The child selector groups.
 * @returns {SelectorGroup[]} The new, combined selector groups.
 */
function combineSelectors(parentGroups, childGroups) {
    if (!parentGroups || parentGroups.length === 0) {
        // Handle top-level '&', which represents the scoping root, e.g., :root or a shadow host.
        // For simplicity in a general context, we can treat it like :root.
        return childGroups.map(g => {
            const newParts = g.parts.map(p => p.replace(/&/g, ':root'));
            return { ...g, parts: newParts };
        });
    }

    const newSelectorGroups = [];
    const parentIsList = parentGroups.length > 1;

    // The replacement for '&' is either the single parent selector or the parent list wrapped in :is()
    const parentReplacementStr = stringifySelectorForIs(parentGroups);
    const parentHasTypeSelector = parentGroups.some(g => g.parts.some(p => /^[a-zA-Z]/.test(p) && p !== ' ' && p !== '>' && p !== '+' && p !== '~'));
    
    // The wrapper for subsequent ampersands
    const subsequentWrapper = (str) => parentHasTypeSelector ? `:is(${str})` : str;

    for (const childGroup of childGroups) {
        const hasAmpersand = childGroup.parts.some(p => p.includes('&'));

        if (!hasAmpersand) {
            // Rule: No '&' implies a descendant selector.
            // .parent { .child {} } -> .parent .child {}
            const parentParts = parentIsList ? [`:is(${parentReplacementStr})`] : parentGroups[0].parts;
            const newGroup = {
                parts: [...parentParts, ' ', ...childGroup.parts],
                newlinesBefore: 0,
                commentAfter: childGroup.commentAfter
            };
            newSelectorGroups.push(newGroup);
            continue;
        }

        // Rule: '&' is present, perform replacement.
        let combinedString = '';
        for (const part of childGroup.parts) {
            if (part.includes('&')) {
                let isFirstAmpersand = true;
                const replacedPart = part.replace(/&/g, () => {
                    if (isFirstAmpersand) {
                        isFirstAmpersand = false;
                        return parentReplacementStr;
                    }
                    return subsequentWrapper(parentReplacementStr);
                });
                combinedString += replacedPart;
            } else {
                combinedString += part;
            }
        }
        
        // Reparse the combined string to normalize it correctly.
        // This handles context reversal and complex substitutions gracefully.
        const reparsedGroups = parseSelector(combinedString);
        reparsedGroups.forEach(g => {
            g.commentAfter = childGroup.commentAfter; // Preserve original comment
        });
        newSelectorGroups.push(...reparsedGroups);
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

/**
 * A helper to stringify selector groups for comparison.
 * @param {SelectorGroup[]} groups 
 * @returns {string}
 */
function stringifySelector(groups) {
    return groups.map(g => g.parts.join('')).join(',');
}

/**
 * Finds the nesting relationship between two selectors.
 * @param {SelectorGroup[]} parentGroups 
 * @param {SelectorGroup[]} childGroups 
 * @returns {{type: 'MERGE' | 'NEST' | 'REVERSE_NEST', newSelector: SelectorGroup[]} | null}
 */
function findNestingRelationship(parentGroups, childGroups) {
    // For simplicity and to produce the most readable output,
    // this implementation focuses on nesting single-group selectors.
    if (parentGroups.length > 1 || childGroups.length > 1) {
        return null;
    }

    const parentStr = stringifySelector(parentGroups);
    const childStr = stringifySelector(childGroups);

    // Case 1: Merge identical selectors
    if (parentStr === childStr) {
        return { type: 'MERGE', newSelector: parentGroups };
    }

    // Case 2: Standard Nesting (descendant or compound)
    // e.g., .parent .child OR .parent:hover
    const isDescendant = childStr.startsWith(parentStr + ' ') || childStr.startsWith(parentStr + '>') || childStr.startsWith(parentStr + '+') || childStr.startsWith(parentStr + '~');
    const isCompound = childStr.startsWith(parentStr) && !isDescendant;

    if (isDescendant) {
        const newSelectorStr = childStr.substring(parentStr.length);
        return { type: 'NEST', newSelector: parseSelector(newSelectorStr) };
    }
    if (isCompound) {
        const newSelectorStr = '&' + childStr.substring(parentStr.length);
        return { type: 'NEST', newSelector: parseSelector(newSelectorStr) };
    }

    // Case 3: Reverse Context Nesting
    // e.g., .featured .parent
    const reverseMatch = new RegExp(`(\\s|\\>|\\+|\\~)${parentStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    if (reverseMatch.test(childStr)) {
        const newSelectorStr = childStr.replace(reverseMatch, '$1&');
        return { type: 'REVERSE_NEST', newSelector: parseSelector(newSelectorStr) };
    }

    return null;
}

/**
 * Traverses a flat CSS AST and returns a new AST with rules nested
 * according to native CSS Nesting syntax.
 *
 * @param {object} ast The Abstract Syntax Tree (should be flat, e.g., from denestCSS).
 * @returns {object} A new AST with rules nested.
 */
export function renestCSS(ast) {
    function _renest(node) {
        if (!node.body || node.body.length === 0) {
            return;
        }
        
        const newBody = [];
        let nodesToProcess = [...node.body];

        while (nodesToProcess.length > 0) {
            const parentNode = nodesToProcess.shift();
            
            // Only rules can be parents for nesting.
            if (parentNode.type === 'Rule') {
                parentNode.body = parentNode.body || [];
                const remainingNodes = [];

                for (const potentialChild of nodesToProcess) {
                    let consumed = false;
                    if (potentialChild.type === 'Rule') {
                        const relationship = findNestingRelationship(parentNode.selector, potentialChild.selector);

                        if (relationship) {
                            if (relationship.type === 'MERGE') {
                                /* Add nesting setting to remove duplicates, or leave them as fallback - for now: leave as fallback */

                                // Merge declarations into parent
                                const topMostRule = potentialChild.body.find((node) => ['Rule', 'AtRule'].includes(node.type));
                                if (parentNode.body.length > 0 && topMostRule) topMostRule.spacesAbove = 1;
                                parentNode.body.push(...potentialChild.body);
                                consumed = true;
                            } else { // 'NEST' or 'REVERSE_NEST'
                                const nestedChild = cloneASTNode(potentialChild);
                                nestedChild.selector = relationship.newSelector;
                                parentNode.body.push(nestedChild);
                                consumed = true;
                            }
                        }
                    }
                    if (!consumed) {
                        remainingNodes.push(potentialChild);
                    }
                }
                nodesToProcess = remainingNodes;

                // Recurse to nest the children we just added
                _renest(parentNode);
            }
            
            // Recurse into at-rules
            if (parentNode.type === 'AtRule' && parentNode.body) {
                _renest(parentNode);
            }

            newBody.push(parentNode);
        }
        node.body = newBody;
    }

    const nestedAST = cloneASTNode(ast);
    _renest(nestedAST);
    return nestedAST;
}
/**
 * The main entry point for parsing CSS.
 * It tokenizes the input string and then builds an AST from the tokens.
 *
 * @param {string} cssString The raw CSS string to parse.
 * @returns {object} The Abstract Syntax Tree (AST) representation of the CSS.
 */
export function parseCSS(cssString) {

    /**
     * Scans the input string character-by-character to produce a flat array of tokens.
     * This manual approach is typically faster than using regular expressions for
     * this kind of lexical analysis.
     *
     * @param {string} input The raw CSS string.
     * @returns {Array<object>} An array of token objects.
     */
    function tokenize(input) {
        const tokens = [];
        let pos = 0;

        // Helper functions for character checks
        const isWhitespace = char => /\s/.test(char);
        const isLetter = char => /[a-zA-Z]/.test(char);
        const isIdentifierChar = char => /[a-zA-Z0-9_\-]/.test(char);

        while (pos < input.length) {
            let char = input[pos];

            // 1. Whitespace
            if (isWhitespace(char)) {
                let value = '';
                while (pos < input.length && isWhitespace(input[pos])) {
                    value += input[pos];
                    pos++;
                }
                tokens.push({ type: 'WHITESPACE', value });
                continue; // Continue to next iteration of the main loop
            }

            // 2. Single-character tokens
            const singleCharTokens = {
                '{': 'L_BRACE', '}': 'R_BRACE', '(': 'L_PAREN', ')': 'R_PAREN',
                ';': 'SEMICOLON', ':': 'COLON', ',': 'COMMA'
            };
            if (singleCharTokens[char]) {
                tokens.push({ type: singleCharTokens[char], value: char });
                pos++;
                continue;
            }

            // 3. Comments (/* ... */)
            if (char === '/' && input[pos + 1] === '*') {
                let value = '/*';
                pos += 2;
                while (pos < input.length && !(input[pos] === '*' && input[pos + 1] === '/')) {
                    value += input[pos];
                    pos++;
                }
                // Consume the closing */
                if (pos < input.length) {
                    value += '*/';
                    pos += 2;
                }
                tokens.push({ type: 'COMMENT', value });
                continue;
            }

            // 4. Strings
            if (char === '"' || char === "'") {
                const quoteType = char;
                let value = quoteType;
                pos++;
                while (pos < input.length && input[pos] !== quoteType) {
                    // Handle escaped quotes
                    if (input[pos] === '\\') {
                        value += input[pos] + input[pos + 1];
                        pos += 2;
                    } else {
                        value += input[pos];
                        pos++;
                    }
                }
                // Consume the closing quote
                if (pos < input.length) {
                    value += input[pos];
                    pos++;
                }
                tokens.push({ type: 'STRING', value });
                continue;
            }
            
            // 5. At-Keywords (@media, @import)
            if (char === '@') {
                let value = '@';
                pos++;
                while (pos < input.length && isIdentifierChar(input[pos])) {
                    value += input[pos];
                    pos++;
                }
                tokens.push({ type: 'AT_KEYWORD', value });
                continue;
            }

            // 6. Identifiers and other values
            // This is the "catch-all" for selectors, properties, values, etc.
            let value = '';
            // An identifier can contain many characters, so we consume until we hit
            // a character that we know starts a different token.
            const isDelimiter = c => (/\s|{|}|\(|\)|;|:|,/.test(c));
            while (pos < input.length && !isDelimiter(input[pos])) {
                 // Special check for comment start to break the identifier
                if (input[pos] === '/' && input[pos + 1] === '*') {
                    break;
                }
                value += input[pos];
                pos++;
            }
            tokens.push({ type: 'IDENTIFIER', value });
            continue;
        }

        return tokens;
    }

    class Parser {
        constructor(tokens) {
            this.tokens = tokens;
            this.pos = 0;
            this.lastSignificantToken = null; 
        }

        parse() {
            const stylesheet = { type: 'Stylesheet', body: [] };
            while (!this.eof()) {
                const node = this.parseTopLevel();
                if (node) {
                    stylesheet.body.push(node);
                }
            }
            return stylesheet;
        }

        parseTopLevel() {
            const token = this.peek();
            if (!token) return null;

            switch (token.type) {
                case 'COMMENT':
                    return this.parseComment();
                case 'AT_KEYWORD':
                    return this.parseAtRule();
                case 'IDENTIFIER':
                case 'L_BRACE': 
                    return this.parseRule();
                case 'WHITESPACE': 
                    this.consume();
                    return this.parseTopLevel();
                default:
                    this.consume(); 
                    return null;
            }
        }

        parseComment() {
            const formatting = this.captureFormatting();
            
            const isInline = formatting.leadingNewlines === 0 &&
            this.lastSignificantToken &&
            ['L_BRACE', 'R_BRACE', 'SEMICOLON'].includes(this.lastSignificantToken.type);
            
            formatting.type = isInline ? 'inline' : 'block';
            
            const token = this.consume('COMMENT');

            return {
                type: 'Comment',
                value: token.value.slice(2, -2).trim(),
                formatting
            };
        }

        parseAtRule() {
            const formatting = this.captureFormatting();
            const nameToken = this.consume('AT_KEYWORD');
            
            let params = '';
            while (!this.eof() && !this.match('SEMICOLON') && !this.match('L_BRACE')) {
                params += this.consume().value;
            }
            
            const node = {
                type: 'AtRule',
                name: nameToken.value,
                params: params.trim(),
                formatting,
                body: []
            };

            if (this.match('L_BRACE')) {
                node.body = this.parseBlockBody();
            } else {
                this.match('SEMICOLON') && this.consume();
                delete node.body;
            }
            return node;
        }
        
        parseRule() {
            const formatting = this.captureFormatting();
            let selector = '';

            while (!this.eof() && !this.match('L_BRACE')) {
                selector += this.consume().value;
            }

            return {
                type: 'Rule',
                selector: selector.trim(),
                formatting,
                body: this.parseBlockBody()
            };
        }
        
        parseBlockBody() {
            const body = [];
            this.consume('L_BRACE');

            while (!this.eof() && !this.match('R_BRACE')) {
                const token = this.peek();
                switch (token.type) {
                    case 'COMMENT':
                        body.push(this.parseComment());
                        break;
                    case 'AT_KEYWORD':
                        body.push(this.parseAtRule());
                        break;
                    case 'IDENTIFIER':
                        if (this.isDeclaration()) {
                            body.push(this.parseDeclaration());
                        } else {
                            body.push(this.parseRule());
                        }
                        break;
                    case 'WHITESPACE':
                        this.consume();
                        break;
                    default:
                        body.push(this.parseRule());
                        break;
                }
            }
            
            this.consume('R_BRACE');
            return body;
        }

        parseDeclaration() {
            const formatting = this.captureFormatting();
            let property = '';
            let value = '';

            while (!this.eof() && !this.match('COLON')) {
                property += this.consume().value;
            }
            this.consume('COLON');

            let parenDepth = 0;
            while (!this.eof()) {
                if (parenDepth === 0 && (this.match('SEMICOLON') || this.match('R_BRACE'))) {
                    break;
                }
                const token = this.consume();
                if (token.type === 'L_PAREN') parenDepth++;
                if (token.type === 'R_PAREN') parenDepth--;
                value += token.value;
            }
            
            this.match('SEMICOLON') && this.consume();

            return {
                type: 'Declaration',
                property: property.trim(),
                value: value.trim(),
                formatting
            };
        }

        // --- HELPER METHODS ---

        isDeclaration() {
            let tempPos = this.pos;
            while (tempPos < this.tokens.length) {
                const tokenType = this.tokens[tempPos].type;
                if (tokenType === 'COLON') return true;
                if (tokenType === 'L_BRACE' || tokenType === 'SEMICOLON') return false;
                tempPos++;
            }
            return false;
        }

        captureFormatting() {
            let newlines = 0;
            while (this.peek() && this.peek().type === 'WHITESPACE') {
                const whitespaceToken = this.consume();
                newlines += (whitespaceToken.value.match(/\n/g) || []).length;
            }
            return { leadingNewlines: newlines };
        }

        peek() { return this.tokens[this.pos]; }
        eof() { return this.pos >= this.tokens.length; }
        match(type) { return !this.eof() && this.peek().type === type; }

        consume(expectedType) {
            const token = this.peek();
            if (expectedType && token.type !== expectedType) {
                console.warn(`Parser Warning: Expected token type '${expectedType}' but got '${token.type}'.`);
            }
            this.pos++;
            
            if (token.type !== 'WHITESPACE') {
                this.lastSignificantToken = token;
            }
            return token;
        }
    }


    // -------------------------------------------------------------------------
    // --- EXECUTION ---
    // -------------------------------------------------------------------------

    const tokens = tokenize(cssString);
    const parser = new Parser(tokens);
    return parser.parse();
}

/**
 * Beautifies a CSS object (AST) into a formatted CSS string.
 *
 * @param {object} cssObject The CSS object to format.
 * @param {object} [options] - Configuration options.
 * @param {string} [options.indentString='  '] - The string to use for one level of indentation.
 * @returns {string} The formatted CSS string.
 */
export function beautifyCSS(cssObject, options = {}) {
    const indentString = options.indentString || '    ';
    let output = [];
  
    /**
     * Recursively processes each node in the CSS AST.
     * @param {object} node - The current node to process.
     * @param {number} level - The current indentation level.
     */
    function processNode(node, level) {
      const indent = indentString.repeat(level);
  
      switch (node.type) {
        case 'Stylesheet':
          // Process each top-level item in the stylesheet
          node.body.forEach((child, index) => {
            processNode(child, level);
            // Add a blank line between top-level rules for readability
            if (index < node.body.length - 1 && child.type === 'Rule') {
              output.push('');
            }
          });
          break;
  
        case 'Rule':
          // Format a rule: selector { ... }
          output.push(`${indent}${node.selector} {`);
          node.body.forEach(child => processNode(child, level + 1));
          output.push(`${indent}}`);
          break;
  
        case 'Declaration':
          // Format a declaration: property: value;
          output.push(`${indent}${node.property}: ${node.value};`);
          break;
  
        case 'Comment':
          // Format a block comment: /* ... */
          if (node.formatting) {
            if (node.formatting.type === 'block') {
                output.push(`${indent}/* ${node.value} */`);
            } else if (node.formatting.type === 'inline') {
                const test = ` /* ${node.value} */`;
                output[output.length - 1] += test;
            }
          }
        
          break;
  
        default:
          // Silently ignore unknown node types
          break;
      }
    }
  
    processNode(cssObject, 0); // Start processing from the root at level 0
    return output.join('\n');
  }
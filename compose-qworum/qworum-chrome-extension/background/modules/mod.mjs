// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class DataValue {
    static registry = [];
    toString() {
        throw new Error('not implemented');
    }
    static fromXmlElement(element, namespaceStack) {
        let errorMessage = 'Not valid data';
        for (const dataType of this.registry){
            try {
                const data = dataType.fromXmlElement(element, namespaceStack);
                return data;
            } catch (error) {
                errorMessage = `${error}`;
            }
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        throw new Error('not implemented');
    }
    static fromIndexedDb(encodedData) {
        let errorMessage = 'Not valid data';
        for (const dataType of this.registry){
            try {
                const data = dataType.fromIndexedDb(encodedData);
                return data;
            } catch (error) {}
        }
        throw new Error(errorMessage);
    }
    toIndexedDb() {
        throw new Error('not implemented');
    }
}
class GenericData extends DataValue {
    static namespace = new URL('https://qworum.net/ns/v1/data/');
    toString() {
        throw new Error('not implemented');
    }
    static fromXmlElement(element, namespaceStack) {
        let errorMessage = 'Not valid data';
        for (const dataType of this.registry){
            try {
                const data = dataType.fromXmlElement(element, namespaceStack);
                return data;
            } catch (error) {}
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        throw new Error('not implemented');
    }
    static fromIndexedDb(encodedData) {
        let errorMessage = 'Not valid data';
        for (const dataType of this.registry){
            try {
                const data = dataType.fromIndexedDb(encodedData);
                return data;
            } catch (error) {}
        }
        throw new Error(errorMessage);
    }
    toIndexedDb() {
        throw new Error('not implemented');
    }
}
'use strict';
const syntax = Object.create(null);
const predefinedEntities = Object.freeze(Object.assign(Object.create(null), {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"'
}));
syntax['predefinedEntities'] = predefinedEntities;
function isNameChar(__char) {
    if (isNameStartChar(__char)) {
        return true;
    }
    let cp = getCodePoint(__char);
    return cp === 0x2D || cp === 0x2E || cp >= 0x30 && cp <= 0x39 || cp === 0xB7 || cp >= 0x300 && cp <= 0x36F || cp >= 0x203F && cp <= 0x2040;
}
syntax['isNameChar'] = isNameChar;
function isNameStartChar(__char) {
    let cp = getCodePoint(__char);
    return cp === 0x3A || cp === 0x5F || cp >= 0x41 && cp <= 0x5A || cp >= 0x61 && cp <= 0x7A || cp >= 0xC0 && cp <= 0xD6 || cp >= 0xD8 && cp <= 0xF6 || cp >= 0xF8 && cp <= 0x2FF || cp >= 0x370 && cp <= 0x37D || cp >= 0x37F && cp <= 0x1FFF || cp >= 0x200C && cp <= 0x200D || cp >= 0x2070 && cp <= 0x218F || cp >= 0x2C00 && cp <= 0x2FEF || cp >= 0x3001 && cp <= 0xD7FF || cp >= 0xF900 && cp <= 0xFDCF || cp >= 0xFDF0 && cp <= 0xFFFD || cp >= 0x10000 && cp <= 0xEFFFF;
}
syntax['isNameStartChar'] = isNameStartChar;
function isNotXmlChar(__char) {
    return !isXmlChar(__char);
}
syntax['isNotXmlChar'] = isNotXmlChar;
function isReferenceChar(__char) {
    return __char === '#' || isNameChar(__char);
}
syntax['isReferenceChar'] = isReferenceChar;
function isWhitespace(__char) {
    let cp = getCodePoint(__char);
    return cp === 0x20 || cp === 0x9 || cp === 0xA || cp === 0xD;
}
syntax['isWhitespace'] = isWhitespace;
function isXmlChar(__char) {
    let cp = getCodePoint(__char);
    return cp === 0x9 || cp === 0xA || cp === 0xD || cp >= 0x20 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFD || cp >= 0x10000 && cp <= 0x10FFFF;
}
syntax['isXmlChar'] = isXmlChar;
function getCodePoint(__char) {
    return __char.codePointAt(0) || -1;
}
const emptyString = '';
class StringScanner {
    constructor(string){
        this.chars = [
            ...string
        ];
        this.charCount = this.chars.length;
        this.charIndex = 0;
        this.charsToBytes = new Array(this.charCount);
        this.multiByteMode = false;
        this.string = string;
        let { chars , charCount , charsToBytes  } = this;
        if (charCount === string.length) {
            for(let i = 0; i < charCount; ++i){
                charsToBytes[i] = i;
            }
        } else {
            for(let byteIndex = 0, charIndex = 0; charIndex < charCount; ++charIndex){
                charsToBytes[charIndex] = byteIndex;
                byteIndex += chars[charIndex].length;
            }
            this.multiByteMode = true;
        }
    }
    get isEnd() {
        return this.charIndex >= this.charCount;
    }
    _charLength(string) {
        let { length  } = string;
        if (length < 2 || !this.multiByteMode) {
            return length;
        }
        return string.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length;
    }
    advance(count = 1) {
        this.charIndex = Math.min(this.charCount, this.charIndex + count);
    }
    consume(count = 1) {
        let chars = this.peek(count);
        this.advance(count);
        return chars;
    }
    consumeMatch(regex) {
        if (!regex.sticky) {
            throw new Error('`regex` must have a sticky flag ("y")');
        }
        regex.lastIndex = this.charsToBytes[this.charIndex];
        let result = regex.exec(this.string);
        if (result === null) {
            return emptyString;
        }
        let match = result[0];
        this.advance(this._charLength(match));
        return match;
    }
    consumeMatchFn(fn) {
        let startIndex = this.charIndex;
        while(!this.isEnd && fn(this.peek())){
            this.advance();
        }
        return this.charIndex > startIndex ? this.string.slice(this.charsToBytes[startIndex], this.charsToBytes[this.charIndex]) : emptyString;
    }
    consumeString(stringToConsume) {
        if (this.consumeStringFast(stringToConsume)) {
            return stringToConsume;
        }
        if (!this.multiByteMode) {
            return emptyString;
        }
        let { length  } = stringToConsume;
        let charLengthToMatch = this._charLength(stringToConsume);
        if (charLengthToMatch !== length && stringToConsume === this.peek(charLengthToMatch)) {
            this.advance(charLengthToMatch);
            return stringToConsume;
        }
        return emptyString;
    }
    consumeStringFast(stringToConsume) {
        if (this.peek() === stringToConsume[0]) {
            let { length  } = stringToConsume;
            if (length === 1) {
                this.advance();
                return stringToConsume;
            }
            if (this.peek(length) === stringToConsume) {
                this.advance(length);
                return stringToConsume;
            }
        }
        return emptyString;
    }
    consumeUntilMatch(regex) {
        if (!regex.global) {
            throw new Error('`regex` must have a global flag ("g")');
        }
        let byteIndex = this.charsToBytes[this.charIndex];
        regex.lastIndex = byteIndex;
        let match = regex.exec(this.string);
        if (match === null || match.index === byteIndex) {
            return emptyString;
        }
        let result = this.string.slice(byteIndex, match.index);
        this.advance(this._charLength(result));
        return result;
    }
    consumeUntilString(searchString) {
        let { charIndex , charsToBytes , string  } = this;
        let byteIndex = charsToBytes[charIndex];
        let matchByteIndex = string.indexOf(searchString, byteIndex);
        if (matchByteIndex <= 0) {
            return emptyString;
        }
        let result = string.slice(byteIndex, matchByteIndex);
        this.advance(this._charLength(result));
        return result;
    }
    peek(count = 1) {
        if (this.charIndex >= this.charCount) {
            return emptyString;
        }
        if (count === 1) {
            return this.chars[this.charIndex];
        }
        let { charsToBytes , charIndex  } = this;
        return this.string.slice(charsToBytes[charIndex], charsToBytes[charIndex + count]);
    }
    reset(index = 0) {
        this.charIndex = index >= 0 ? Math.min(this.charCount, index) : Math.max(0, this.charIndex + index);
    }
}
class XmlNode {
    constructor(){
        this.parent = null;
    }
    get document() {
        return this.parent ? this.parent.document : null;
    }
    get isRootNode() {
        return this.parent ? this.parent === this.document : false;
    }
    get preserveWhitespace() {
        return Boolean(this.parent && this.parent.preserveWhitespace);
    }
    get type() {
        return '';
    }
    toJSON() {
        let json = {
            type: this.type
        };
        if (this.isRootNode) {
            json.isRootNode = true;
        }
        if (this.preserveWhitespace) {
            json.preserveWhitespace = true;
        }
        return json;
    }
}
XmlNode.TYPE_CDATA = 'cdata';
XmlNode.TYPE_COMMENT = 'comment';
XmlNode.TYPE_DOCUMENT = 'document';
XmlNode.TYPE_ELEMENT = 'element';
XmlNode.TYPE_PROCESSING_INSTRUCTION = 'pi';
XmlNode.TYPE_TEXT = 'text';
class XmlText extends XmlNode {
    constructor(text = ''){
        super();
        this.text = text;
    }
    get type() {
        return XmlNode.TYPE_TEXT;
    }
    toJSON() {
        return Object.assign(XmlNode.prototype.toJSON.call(this), {
            text: this.text
        });
    }
}
class XmlComment extends XmlNode {
    constructor(content = ''){
        super();
        this.content = content;
    }
    get type() {
        return XmlNode.TYPE_COMMENT;
    }
    toJSON() {
        return Object.assign(XmlNode.prototype.toJSON.call(this), {
            content: this.content
        });
    }
}
class XmlCdata extends XmlText {
    get type() {
        return XmlNode.TYPE_CDATA;
    }
}
class XmlProcessingInstruction extends XmlNode {
    constructor(name, content = ''){
        super();
        this.name = name;
        this.content = content;
    }
    get type() {
        return XmlNode.TYPE_PROCESSING_INSTRUCTION;
    }
    toJSON() {
        return Object.assign(XmlNode.prototype.toJSON.call(this), {
            name: this.name,
            content: this.content
        });
    }
}
class XmlElement extends XmlNode {
    constructor(name, attributes = Object.create(null), children = []){
        super();
        this.name = name;
        this.attributes = attributes;
        this.children = children;
    }
    get isEmpty() {
        return this.children.length === 0;
    }
    get preserveWhitespace() {
        let node = this;
        while(node instanceof XmlElement){
            if ('xml:space' in node.attributes) {
                return node.attributes['xml:space'] === 'preserve';
            }
            node = node.parent;
        }
        return false;
    }
    get text() {
        return this.children.map((child)=>'text' in child ? child.text : '').join('');
    }
    get type() {
        return XmlNode.TYPE_ELEMENT;
    }
    toJSON() {
        return Object.assign(XmlNode.prototype.toJSON.call(this), {
            name: this.name,
            attributes: this.attributes,
            children: this.children.map((child)=>child.toJSON())
        });
    }
}
class XmlDocument extends XmlNode {
    constructor(children = []){
        super();
        this.children = children;
    }
    get document() {
        return this;
    }
    get root() {
        return this.children.find((child)=>child instanceof XmlElement) || null;
    }
    get text() {
        return this.children.map((child)=>'text' in child ? child.text : '').join('');
    }
    get type() {
        return XmlNode.TYPE_DOCUMENT;
    }
    toJSON() {
        return Object.assign(XmlNode.prototype.toJSON.call(this), {
            children: this.children.map((child)=>child.toJSON())
        });
    }
}
class Parser {
    constructor(xml, options = Object.create(null)){
        this.document = new XmlDocument();
        this.currentNode = this.document;
        this.options = options;
        this.scanner = new StringScanner(normalizeXmlString(xml));
        this.consumeProlog();
        if (!this.consumeElement()) {
            this.error('Root element is missing or invalid');
        }
        while(this.consumeMisc()){}
        if (!this.scanner.isEnd) {
            this.error('Extra content at the end of the document');
        }
    }
    addNode(node) {
        node.parent = this.currentNode;
        this.currentNode.children.push(node);
    }
    addText(text) {
        let { children  } = this.currentNode;
        if (children.length > 0) {
            let prevNode = children[children.length - 1];
            if (prevNode instanceof XmlText) {
                prevNode.text += text;
                return;
            }
        }
        this.addNode(new XmlText(text));
    }
    consumeAttributeValue() {
        let { scanner  } = this;
        let quote = scanner.peek();
        if (quote !== '"' && quote !== "'") {
            return false;
        }
        scanner.advance();
        let chars;
        let isClosed = false;
        let value = emptyString;
        let regex = quote === '"' ? /[^"&<]+/y : /[^'&<]+/y;
        matchLoop: while(!scanner.isEnd){
            chars = scanner.consumeMatch(regex);
            if (chars) {
                this.validateChars(chars);
                value += chars.replace(/[\t\r\n]/g, ' ');
            }
            let nextChar = scanner.peek();
            switch(nextChar){
                case quote:
                    isClosed = true;
                    break matchLoop;
                case '&':
                    value += this.consumeReference();
                    continue;
                case '<':
                    this.error('Unescaped `<` is not allowed in an attribute value');
                    break;
                case emptyString:
                    this.error('Unclosed attribute');
                    break;
            }
        }
        if (!isClosed) {
            this.error('Unclosed attribute');
        }
        scanner.advance();
        return value;
    }
    consumeCdataSection() {
        let { scanner  } = this;
        if (!scanner.consumeStringFast('<![CDATA[')) {
            return false;
        }
        let text = scanner.consumeUntilString(']]>');
        this.validateChars(text);
        if (!scanner.consumeStringFast(']]>')) {
            this.error('Unclosed CDATA section');
        }
        if (this.options.preserveCdata) {
            this.addNode(new XmlCdata(text));
        } else {
            this.addText(text);
        }
        return true;
    }
    consumeCharData() {
        let { scanner  } = this;
        let charData = scanner.consumeUntilMatch(/<|&|]]>/g);
        if (!charData) {
            return false;
        }
        this.validateChars(charData);
        if (scanner.peek() === ']' && scanner.peek(3) === ']]>') {
            this.error('Element content may not contain the CDATA section close delimiter `]]>`');
        }
        this.addText(charData);
        return true;
    }
    consumeComment() {
        let { scanner  } = this;
        if (!scanner.consumeStringFast('<!--')) {
            return false;
        }
        let content = scanner.consumeUntilString('--');
        this.validateChars(content);
        if (!scanner.consumeStringFast('-->')) {
            if (scanner.peek(2) === '--') {
                this.error("The string `--` isn't allowed inside a comment");
            } else {
                this.error('Unclosed comment');
            }
        }
        if (this.options.preserveComments) {
            this.addNode(new XmlComment(content.trim()));
        }
        return true;
    }
    consumeContentReference() {
        let ref = this.consumeReference();
        if (ref) {
            this.addText(ref);
            return true;
        }
        return false;
    }
    consumeDoctypeDeclaration() {
        let { scanner  } = this;
        if (!scanner.consumeStringFast('<!DOCTYPE') || !this.consumeWhitespace()) {
            return false;
        }
        scanner.consumeMatch(/[^[>]+/y);
        if (scanner.consumeMatch(/\[[\s\S]+?\][\x20\t\r\n]*>/y)) {
            return true;
        }
        if (!scanner.consumeStringFast('>')) {
            this.error('Unclosed doctype declaration');
        }
        return true;
    }
    consumeElement() {
        let { scanner  } = this;
        let mark = scanner.charIndex;
        if (scanner.peek() !== '<') {
            return false;
        }
        scanner.advance();
        let name = this.consumeName();
        if (!name) {
            scanner.reset(mark);
            return false;
        }
        let attributes = Object.create(null);
        while(this.consumeWhitespace()){
            let attrName = this.consumeName();
            if (!attrName) {
                continue;
            }
            let attrValue = this.consumeEqual() && this.consumeAttributeValue();
            if (attrValue === false) {
                this.error('Attribute value expected');
            }
            if (attrName in attributes) {
                this.error(`Duplicate attribute: ${attrName}`);
            }
            if (attrName === 'xml:space' && attrValue !== 'default' && attrValue !== 'preserve') {
                this.error('Value of the `xml:space` attribute must be "default" or "preserve"');
            }
            attributes[attrName] = attrValue;
        }
        if (this.options.sortAttributes) {
            let attrNames = Object.keys(attributes).sort();
            let sortedAttributes = Object.create(null);
            for(let i = 0; i < attrNames.length; ++i){
                let attrName1 = attrNames[i];
                sortedAttributes[attrName1] = attributes[attrName1];
            }
            attributes = sortedAttributes;
        }
        let isEmpty = Boolean(scanner.consumeStringFast('/>'));
        let element = new XmlElement(name, attributes);
        element.parent = this.currentNode;
        if (!isEmpty) {
            if (!scanner.consumeStringFast('>')) {
                this.error(`Unclosed start tag for element \`${name}\``);
            }
            this.currentNode = element;
            this.consumeCharData();
            while(this.consumeElement() || this.consumeContentReference() || this.consumeCdataSection() || this.consumeProcessingInstruction() || this.consumeComment()){
                this.consumeCharData();
            }
            let endTagMark = scanner.charIndex;
            let endTagName;
            if (!scanner.consumeStringFast('</') || !(endTagName = this.consumeName()) || endTagName !== name) {
                scanner.reset(endTagMark);
                this.error(`Missing end tag for element ${name}`);
            }
            this.consumeWhitespace();
            if (!scanner.consumeStringFast('>')) {
                this.error(`Unclosed end tag for element ${name}`);
            }
            this.currentNode = element.parent;
        }
        this.addNode(element);
        return true;
    }
    consumeEqual() {
        this.consumeWhitespace();
        if (this.scanner.consumeStringFast('=')) {
            this.consumeWhitespace();
            return true;
        }
        return false;
    }
    consumeMisc() {
        return this.consumeComment() || this.consumeProcessingInstruction() || this.consumeWhitespace();
    }
    consumeName() {
        return syntax.isNameStartChar(this.scanner.peek()) ? this.scanner.consumeMatchFn(syntax.isNameChar) : emptyString;
    }
    consumeProcessingInstruction() {
        let { scanner  } = this;
        let mark = scanner.charIndex;
        if (!scanner.consumeStringFast('<?')) {
            return false;
        }
        let name = this.consumeName();
        if (name) {
            if (name.toLowerCase() === 'xml') {
                scanner.reset(mark);
                this.error("XML declaration isn't allowed here");
            }
        } else {
            this.error('Invalid processing instruction');
        }
        if (!this.consumeWhitespace()) {
            if (scanner.consumeStringFast('?>')) {
                this.addNode(new XmlProcessingInstruction(name));
                return true;
            }
            this.error('Whitespace is required after a processing instruction name');
        }
        let content = scanner.consumeUntilString('?>');
        this.validateChars(content);
        if (!scanner.consumeStringFast('?>')) {
            this.error('Unterminated processing instruction');
        }
        this.addNode(new XmlProcessingInstruction(name, content));
        return true;
    }
    consumeProlog() {
        let { scanner  } = this;
        let mark = scanner.charIndex;
        this.consumeXmlDeclaration();
        while(this.consumeMisc()){}
        if (this.consumeDoctypeDeclaration()) {
            while(this.consumeMisc()){}
        }
        return mark < scanner.charIndex;
    }
    consumeReference() {
        let { scanner  } = this;
        if (scanner.peek() !== '&') {
            return false;
        }
        scanner.advance();
        let ref = scanner.consumeMatchFn(syntax.isReferenceChar);
        if (scanner.consume() !== ';') {
            this.error('Unterminated reference (a reference must end with `;`)');
        }
        let parsedValue;
        if (ref[0] === '#') {
            let codePoint = ref[1] === 'x' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
            if (isNaN(codePoint)) {
                this.error('Invalid character reference');
            }
            parsedValue = String.fromCodePoint(codePoint);
            if (!syntax.isXmlChar(parsedValue)) {
                this.error('Character reference resolves to an invalid character');
            }
        } else {
            parsedValue = syntax.predefinedEntities[ref];
            if (parsedValue === undefined) {
                let { ignoreUndefinedEntities , resolveUndefinedEntity  } = this.options;
                let wrappedRef = `&${ref};`;
                if (resolveUndefinedEntity) {
                    let resolvedValue = resolveUndefinedEntity(wrappedRef);
                    if (resolvedValue !== null && resolvedValue !== undefined) {
                        let type = typeof resolvedValue;
                        if (type !== 'string') {
                            throw new TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${type}`);
                        }
                        return resolvedValue;
                    }
                }
                if (ignoreUndefinedEntities) {
                    return wrappedRef;
                }
                scanner.reset(-wrappedRef.length);
                this.error(`Named entity isn't defined: ${wrappedRef}`);
            }
        }
        return parsedValue;
    }
    consumeSystemLiteral() {
        let { scanner  } = this;
        let quote = scanner.consumeStringFast('"') || scanner.consumeStringFast("'");
        if (!quote) {
            return false;
        }
        let value = scanner.consumeUntilString(quote);
        this.validateChars(value);
        if (!scanner.consumeStringFast(quote)) {
            this.error('Missing end quote');
        }
        return value;
    }
    consumeWhitespace() {
        return Boolean(this.scanner.consumeMatchFn(syntax.isWhitespace));
    }
    consumeXmlDeclaration() {
        let { scanner  } = this;
        if (!scanner.consumeStringFast('<?xml')) {
            return false;
        }
        if (!this.consumeWhitespace()) {
            this.error('Invalid XML declaration');
        }
        let version = Boolean(scanner.consumeStringFast('version')) && this.consumeEqual() && this.consumeSystemLiteral();
        if (version === false) {
            this.error('XML version is missing or invalid');
        } else if (!/^1\.[0-9]+$/.test(version)) {
            this.error('Invalid character in version number');
        }
        if (this.consumeWhitespace()) {
            let encoding = Boolean(scanner.consumeStringFast('encoding')) && this.consumeEqual() && this.consumeSystemLiteral();
            if (encoding) {
                this.consumeWhitespace();
            }
            let standalone = Boolean(scanner.consumeStringFast('standalone')) && this.consumeEqual() && this.consumeSystemLiteral();
            if (standalone) {
                if (standalone !== 'yes' && standalone !== 'no') {
                    this.error('Only "yes" and "no" are permitted as values of `standalone`');
                }
                this.consumeWhitespace();
            }
        }
        if (!scanner.consumeStringFast('?>')) {
            this.error('Invalid or unclosed XML declaration');
        }
        return true;
    }
    error(message) {
        let { charIndex , string: xml  } = this.scanner;
        let column = 1;
        let excerpt = '';
        let line = 1;
        for(let i = 0; i < charIndex; ++i){
            let __char = xml[i];
            if (__char === '\n') {
                column = 1;
                excerpt = '';
                line += 1;
            } else {
                column += 1;
                excerpt += __char;
            }
        }
        let eol = xml.indexOf('\n', charIndex);
        excerpt += eol === -1 ? xml.slice(charIndex) : xml.slice(charIndex, eol);
        let excerptStart = 0;
        if (excerpt.length > 50) {
            if (column < 40) {
                excerpt = excerpt.slice(0, 50);
            } else {
                excerptStart = column - 20;
                excerpt = excerpt.slice(excerptStart, column + 30);
            }
        }
        let err = new Error(`${message} (line ${line}, column ${column})\n` + `  ${excerpt}\n` + ' '.repeat(column - excerptStart + 1) + '^\n');
        Object.assign(err, {
            column,
            excerpt,
            line,
            pos: charIndex
        });
        throw err;
    }
    validateChars(string) {
        let charIndex = 0;
        for (let __char of string){
            if (syntax.isNotXmlChar(__char)) {
                this.scanner.reset(-([
                    ...string
                ].length - charIndex));
                this.error('Invalid character');
            }
            charIndex += 1;
        }
    }
}
function normalizeXmlString(xml) {
    if (xml[0] === '\uFEFF') {
        xml = xml.slice(1);
    }
    return xml.replace(/\r\n?/g, '\n');
}
class XmlNamespaceStack {
    static forElement(element) {
        if (!(element instanceof XmlElement)) return null;
        let stack = new XmlNamespaceStack();
        do {
            stack.push(element);
            element = element.parent;
        }while (element instanceof XmlElement)
        const tmp = [];
        for (const e of stack.stack){
            tmp.unshift(e);
        }
        stack.stack = tmp;
        return stack;
    }
    constructor(){
        this.stack = [];
    }
    push(element) {
        const elementNamespaces = Object.create(null), attrNames = Object.keys(element.attributes);
        attrNames.filter((attrName)=>attrName.match(/^xmlns/)).forEach(function(attrName) {
            if (attrName.indexOf(':') !== -1) {
                elementNamespaces[attrName.split(':')[1]] = element.attributes[attrName];
            } else {
                elementNamespaces[''] = element.attributes[attrName];
            }
        });
        this.stack.unshift(elementNamespaces);
    }
    pop() {
        this.stack.shift();
    }
    get top() {
        return this.stack[0];
    }
    prefixFor(namespace, preferredPrefixes) {
        const isString = (e)=>typeof e === 'string', isArray = (e)=>e instanceof Array, prefixes = [];
        for (const nsItem of this.stack){
            if (!Object.values(nsItem).includes(namespace)) continue;
            Object.keys(nsItem).forEach(function(prefix) {
                if (nsItem[prefix] === namespace) prefixes.push(prefix);
            });
        }
        let prefix;
        prefixes.forEach(function(p) {
            if (!prefix || p.length < prefix.length) {
                prefix = p;
            }
        });
        if (isString(prefix)) return prefix;
        if (!isArray(preferredPrefixes)) return null;
        if (!isArray(preferredPrefixes) || preferredPrefixes.length === 0) {
            preferredPrefixes = [
                'ns'
            ];
        }
        let n = 0;
        do {
            for (const preferredPrefix of preferredPrefixes){
                let pref = preferredPrefix;
                if (!isString(pref) || !pref.match(/^[a-z]+$/)) {
                    pref = 'ns';
                }
                let p = `${pref}${n === 0 ? '' : n}`;
                let isNsTaken = false;
                for (const nsItem1 of this.stack){
                    if (!Object.keys(nsItem1).includes(p)) continue;
                    isNsTaken = true;
                    break;
                }
                if (!isNsTaken) {
                    prefix = p;
                    break;
                }
            }
            n++;
        }while (!prefix)
        return prefix;
    }
    findNamespace(currentElementName) {
        const isString = (e)=>typeof e === 'string', elementName = currentElementName.indexOf(':') === -1 ? `:${currentElementName}` : currentElementName, prefix = elementName.split(':')[0];
        let result = null;
        for (const nsItem of this.stack){
            const ns = nsItem[prefix];
            if (isString(ns)) {
                result = ns;
                break;
            }
        }
        return result;
    }
    makeCurrentElementSerializable(currentElement) {
        const elementNamespaces = Object.create(null);
        for(let i = this.stack.length - 1; i >= 0; i--){
            const namespaces = this.stack[i];
            for(const prefix in namespaces){
                if (Object.hasOwnProperty.call(namespaces, prefix)) {
                    const namespace = namespaces[prefix];
                    elementNamespaces[prefix] = namespace;
                }
            }
        }
        for(const prefix1 in elementNamespaces){
            if (Object.hasOwnProperty.call(elementNamespaces, prefix1)) {
                const namespace1 = elementNamespaces[prefix1], xmlnsAttrName = XmlNamespaceStack.nsAttrName(prefix1);
                currentElement.attributes[xmlnsAttrName] = namespace1;
            }
        }
    }
    toString() {
        return this.stack.map((item)=>Object.entries(item)).map((item)=>`[${item}]`).join(', ');
    }
    static verifyNamespace(namespace, element, nsStack) {
        nsStack.push(element);
        const ns = nsStack.findNamespace(element.name);
        if (ns !== namespace) return false;
        if (!Array.isArray(element.children)) return true;
        let childrenAreOk = true;
        for(let i = 0; i < element.children.length; i++){
            const child = element.children[i];
            if (!(child instanceof XmlElement)) continue;
            childrenAreOk = childrenAreOk && this.verifyNamespace(namespace, child, nsStack);
            if (!childrenAreOk) break;
        }
        nsStack.pop();
        return childrenAreOk;
    }
    static getElementNameWithoutPrefix(elementName) {
        return elementName.match(/:/) ? elementName.split(':')[1] : elementName;
    }
    static makeElementSerializable(element) {
        if (!(element instanceof XmlElement)) return;
        const nsStack = XmlNamespaceStack.forElement(element);
        nsStack.makeCurrentElementSerializable(element);
    }
    static nsAttrName(nsPrefix) {
        const isString = (e)=>typeof e === 'string';
        if (!isString(nsPrefix)) nsPrefix = '';
        return nsPrefix === '' ? 'xmlns' : `xmlns:${nsPrefix}`;
    }
    static elementName(unqualifiedName, nsPrefix) {
        const isString = (e)=>typeof e === 'string';
        if (!isString(unqualifiedName)) return null;
        if (!isString(nsPrefix)) nsPrefix = '';
        return nsPrefix === '' ? unqualifiedName : `${nsPrefix}:${unqualifiedName}`;
    }
    static encodeXmlTextString(text) {
        const itemIsString = (i)=>typeof i === 'string', encodings = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            "'": '&apos;',
            '"': '&quot;'
        };
        if (!itemIsString(text)) return null;
        let result = '';
        for(let i = 0; i < text.length; i++){
            const __char = text.charAt(i);
            result += encodings[__char] || __char;
        }
        return result;
    }
}
class Writer {
    static elementToString(element) {
        if (!(element instanceof XmlElement)) return '';
        const nsStack = new XmlNamespaceStack();
        let attributes = '', contents = '';
        for (const [k, v] of Object.entries(element.attributes)){
            attributes += ` ${k}="${this._encodeXmlTextString(v)}"`;
        }
        for (const n of element.children){
            if (n instanceof XmlText) {
                contents += this._encodeXmlTextString(n.text);
                continue;
            }
            if (!(n instanceof XmlElement)) continue;
            nsStack.push(n);
            contents += this.elementToString(n, nsStack);
            nsStack.pop();
        }
        return `<${element.name}${attributes}>${contents}</${element.name}>`;
    }
    static _encodeXmlTextString(text) {
        const itemIsString = (i)=>typeof i === 'string', encodings = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            "'": '&apos;',
            '"': '&quot;'
        };
        if (!itemIsString(text)) return null;
        let result = '';
        for(let i = 0; i < text.length; i++){
            const __char = text.charAt(i);
            result += encodings[__char] || __char;
        }
        return result;
    }
}
const mod = {
    Parser: Parser,
    Writer: Writer,
    Document: XmlDocument,
    Node: XmlNode,
    Element: XmlElement,
    Comment: XmlComment,
    Text: XmlText,
    Cdata: XmlCdata,
    ProcessingInstruction: XmlProcessingInstruction,
    NamespaceStack: XmlNamespaceStack
};
class Json extends GenericData {
    static tag = 'json';
    _value;
    static build(value) {
        return new Json(value);
    }
    constructor(value){
        super();
        const json = JSON.stringify(value);
        if (!json) throw new Error(`Value cannot be converted to JSON: ${value}`);
        this._value = value;
    }
    get value() {
        return this._value;
    }
    toString() {
        return `Json(${JSON.stringify(this.value)})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack || XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name);
            if (!namespace) throw new Error(`namespace is not json's`);
            if (!(new URL(namespace).href === GenericData.namespace.href && XmlNamespaceStack.getElementNameWithoutPrefix(element.name) === Json.tag)) throw 'not an int';
            let text = '';
            for (const node of element.children){
                if (![
                    XmlNode.TYPE_TEXT,
                    XmlNode.TYPE_CDATA
                ].includes(node.type)) continue;
                text += node.text;
            }
            try {
                const value = JSON.parse(text);
                result = new Json(value);
            } catch (error) {
                throw new Error(`String is not valid JSON: "${text}"`);
            }
        } catch (error1) {
            errorMessage = `${error1}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Json) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = GenericData.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'd'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [
            new XmlText(JSON.stringify(this.value))
        ], name = XmlNamespaceStack.elementName(Json.tag, prefix), element = new XmlElement(name, attributes, children);
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        return element;
    }
    static fromIndexedDb(encodedData) {
        if (!(encodedData && typeof encodedData === 'object' && !Array.isArray(encodedData) && encodedData.type === `${Json.namespace} ${Json.tag}`)) throw new Error('wrong IndexedDB object');
        return new Json(encodedData.value);
    }
    toIndexedDb() {
        return {
            type: `${Json.namespace} ${Json.tag}`,
            value: this.value
        };
    }
}
class SemanticData extends GenericData {
    static tag = 'semantic';
    static dataTypes = [
        'json-ld',
        'n-quads'
    ];
    _type;
    _value;
    static build(value, type) {
        return new SemanticData(value, type);
    }
    constructor(value, type){
        super();
        this._value = value;
        if (type == null || type == undefined || type.trim().length == 0) {
            type = SemanticData.dataTypes[0];
        }
        if (!SemanticData.dataTypes.includes(type)) throw new Error('Unknown semantic data type');
        this._type = type;
    }
    get type() {
        return this._type;
    }
    get value() {
        return this._value;
    }
    toString() {
        return `SemanticData(${this.value})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack || XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name);
            if (!namespace) throw new Error(`data has no namespace`);
            if (!(new URL(namespace).href === GenericData.namespace.href)) throw 'bad data namespace';
            if (!(XmlNamespaceStack.getElementNameWithoutPrefix(element.name) === SemanticData.tag)) throw 'bad data element tag';
            let text = '';
            for (const node of element.children){
                if (![
                    XmlNode.TYPE_TEXT,
                    XmlNode.TYPE_CDATA
                ].includes(node.type)) continue;
                text += node.text;
            }
            const type = element.attributes['type'];
            let detectedType = SemanticData.dataTypes[0];
            if (type) {
                for (const dataType of SemanticData.dataTypes){
                    if (`${dataType}` === type) {
                        detectedType = dataType;
                        break;
                    }
                }
            }
            result = new SemanticData(text, detectedType);
        } catch (error) {
            errorMessage = `${error}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof SemanticData) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = GenericData.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'd'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [
            new XmlText(JSON.stringify(this.value))
        ], name = XmlNamespaceStack.elementName(SemanticData.tag, prefix), element = new XmlElement(name, attributes, children);
        attributes['type'] = this.type;
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        return element;
    }
    static fromIndexedDb(encodedData) {
        if (!(encodedData && typeof encodedData === 'object' && !Array.isArray(encodedData) && encodedData.type === `${SemanticData.namespace} ${SemanticData.tag}` && typeof encodedData.value === 'object' && typeof encodedData.value.type === 'string' && typeof encodedData.value.text === 'string')) throw new Error('wrong IndexedDB object');
        let detectedType = SemanticData.dataTypes[0];
        for (const dataType of SemanticData.dataTypes){
            if (`${dataType}` === encodedData.value.type) {
                detectedType = dataType;
                break;
            }
        }
        return new SemanticData(encodedData.value.text, detectedType);
    }
    toIndexedDb() {
        return {
            type: `${SemanticData.namespace} ${SemanticData.tag}`,
            value: {
                type: this.type,
                text: this.value
            }
        };
    }
}
DataValue.registry = [
    Json,
    SemanticData
];
class Instruction {
    static namespace = new URL('https://qworum.net/ns/v1/instruction/');
    static registry = [];
    toString() {
        throw new Error('not implemented');
    }
    static fromXmlElement(element, namespaceStack) {
        let errorMessage = 'Not valid instruction';
        for (const instructionType of this.registry){
            try {
                const instruction = instructionType.fromXmlElement(element, namespaceStack);
                return instruction;
            } catch (error) {}
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        throw new Error('not implemented');
    }
    static fromIndexedDb(encoded) {
        let errorMessage = 'Not valid instruction';
        for (const instructionType of this.registry){
            try {
                const instruction = instructionType.fromIndexedDb(encoded);
                return instruction;
            } catch (error) {}
        }
        throw new Error(errorMessage);
    }
    toIndexedDb() {
        throw new Error('not implemented');
    }
    static statementFromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        try {
            return this.fromXmlElement(element, nsStack);
        } catch (error) {}
        try {
            return DataValue.fromXmlElement(element, nsStack);
        } catch (error1) {}
        throw new Error('not a statement');
    }
    static statementFromIndexedDb(encodedStatement) {
        try {
            const instruction = this.fromIndexedDb(encodedStatement);
            return instruction;
        } catch (error) {}
        try {
            const o = DataValue.fromIndexedDb(encodedStatement);
            return o;
        } catch (error1) {}
        throw new Error('not a statement');
    }
}
class FaultTypeError extends Error {
    constructor(message){
        super(message || 'Not a valid fault');
    }
}
class Fault extends Instruction {
    static tag = "fault";
    static entitlementTypes = [
        'entitlement',
        'service entitlement',
        'platform entitlement'
    ];
    static serviceSpecificTypes = [
        'service-specific',
        /^\*/
    ];
    static serviceTypes = [
        'service',
        'script',
        'origin',
        'data',
        'path',
        ...this.serviceSpecificTypes,
        ...this.entitlementTypes
    ];
    static userAgentTypes = [
        'user-agent',
        'runtime'
    ];
    static types = [
        this.serviceTypes,
        this.userAgentTypes
    ].flat();
    static defaultType = this.serviceSpecificTypes[0];
    _type;
    static build(type) {
        return new Fault(type);
    }
    constructor(type, types){
        super();
        if (!type) type = Fault.defaultType;
        const allowedFaultTypes = types || Fault.serviceSpecificTypes;
        if (!allowedFaultTypes.find(Fault._typeMatcher(type))) throw new FaultTypeError();
        this._type = type;
    }
    static _typeMatcher(type) {
        return (typePattern)=>{
            if (typeof typePattern === 'string' && typePattern === type || typePattern instanceof RegExp && type?.match(typePattern)) return true;
            return false;
        };
    }
    get type() {
        return this._type;
    }
    toString() {
        return `Fault(type: ${this.type})`;
    }
    matches(types) {
        let faultTypes = [];
        if (types) {
            if (!(types instanceof Array)) {
                faultTypes = [
                    types
                ];
            } else {
                faultTypes = types;
            }
        }
        if (faultTypes.length === 0) return true;
        const matcher = Fault._typeMatcher(this.type);
        if (faultTypes.find(matcher)) return true;
        if (faultTypes.includes(Fault.entitlementTypes[0]) && Fault.entitlementTypes.find(matcher)) return true;
        if (faultTypes.includes(Fault.serviceSpecificTypes[0]) && Fault.serviceSpecificTypes.find(matcher)) return true;
        if (faultTypes.includes(Fault.serviceTypes[0]) && Fault.serviceTypes.find(matcher)) return true;
        if (faultTypes.includes(Fault.userAgentTypes[0]) && Fault.userAgentTypes.find(matcher)) return true;
        return false;
    }
    static fromXmlElement(element, namespaceStack) {
        return new Fault(Fault._typeFromXmlElement(element, namespaceStack));
    }
    static _typeFromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        let type = '', errorMessage;
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = XmlNamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`namespace is not json's`);
            if (!(new URL(namespace).href === Fault.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            type = element.attributes.type || Fault.defaultType;
        } catch (error) {
            errorMessage = `${error}`;
        } finally{
            nsStack.pop();
        }
        if (errorMessage) throw new Error(errorMessage);
        return type;
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = XmlNamespaceStack.elementName(Fault.tag, prefix), element = new XmlElement(name, attributes, children);
        attributes['type'] = this.type;
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== Fault.tag) throw new Error(`not a ${this.tag}`);
        return new Fault(this._typeFromIndexedDb(encoded));
    }
    static _typeFromIndexedDb(encoded) {
        if (encoded.type !== Fault.tag) throw new Error(`not a ${this.tag}`);
        return encoded.value?.type || Fault.defaultType;
    }
    toIndexedDb() {
        return {
            type: Fault.tag,
            value: {
                type: this.type
            }
        };
    }
}
class PlatformFaultTypeError extends Error {
    constructor(message){
        super(message || 'Not a platform fault');
    }
}
class PlatformFault extends Fault {
    static _platformFaultTypes = PlatformFault.types.filter((type)=>!PlatformFault.serviceSpecificTypes.includes(type));
    constructor(type){
        if (!(type && PlatformFault._platformFaultTypes.includes(type))) throw new PlatformFaultTypeError();
        super(type, PlatformFault.types);
    }
    static build(type) {
        return new PlatformFault(type);
    }
    get type() {
        return super.type;
    }
    toString() {
        return super.toString();
    }
    matches(types) {
        return super.matches(types);
    }
    static fromXmlElement(element, namespaceStack) {
        return new PlatformFault(Fault._typeFromXmlElement(element, namespaceStack));
    }
    toXmlElement(namespaceStack) {
        return super.toXmlElement(namespaceStack);
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== Fault.tag) throw new Error(`not a ${this.tag}`);
        return new PlatformFault(Fault._typeFromIndexedDb(encoded));
    }
    toIndexedDb() {
        return super.toIndexedDb();
    }
}
class Return extends Instruction {
    static tag = "return";
    statement;
    static build(statement) {
        return new Return(statement);
    }
    constructor(statement){
        super();
        if (!statement) throw new Error('statement required');
        this.statement = statement;
    }
    toString() {
        return `Return(${this.statement})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : mod.NamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = mod.NamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`not a namespace`);
            if (!(new URL(namespace).href === Return.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            let statement = null;
            for (const statementElement of element.children){
                if (!(statementElement.type === mod.Node.TYPE_ELEMENT)) continue;
                statement = Instruction.statementFromXmlElement(statementElement, nsStack);
                break;
            }
            if (statement !== null) {
                result = new Return(statement);
            }
        } catch (error) {
            errorMessage = `${error}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Return) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new mod.NamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = mod.NamespaceStack.elementName(Return.tag, prefix), element = new mod.Element(name, attributes, children);
        if (useNewPrefix) {
            attributes[mod.NamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        nsStack.push(element);
        children.push(this.statement.toXmlElement(nsStack));
        nsStack.pop();
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== this.tag) throw new Error(`not a ${this.tag}`);
        return new Return(Instruction.statementFromIndexedDb(encoded.value.statement));
    }
    toIndexedDb() {
        return {
            type: Return.tag,
            value: {
                statement: this.statement.toIndexedDb()
            }
        };
    }
}
class Sequence extends Instruction {
    static tag = "sequence";
    _statements;
    static build(...statements) {
        return new Sequence(...statements);
    }
    constructor(...statements){
        super();
        if (!statements) throw new Error('sequence must contain one or more statements');
        let s = [];
        if (statements instanceof Array) {
            s = statements;
        } else {
            s = [
                statements
            ];
        }
        if (s.length === 0) throw new Error('sequence must contain one or more statements');
        this._statements = s;
    }
    get statements() {
        return this._statements;
    }
    toString() {
        return `Sequence(${this.statements})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = XmlNamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`not a namespace`);
            if (!(new URL(namespace).href === Sequence.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            const statements = [];
            for (const statementElement of element.children){
                if (!(statementElement.type === XmlNode.TYPE_ELEMENT)) continue;
                statements.push(Instruction.statementFromXmlElement(statementElement, nsStack));
            }
            if (statements.length > 0) {
                result = new Sequence(...statements);
            }
        } catch (error) {
            errorMessage = `${error}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Sequence) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = XmlNamespaceStack.elementName(Sequence.tag, prefix), element = new XmlElement(name, attributes, children);
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        nsStack.push(element);
        for (const statement of this.statements){
            children.push(statement.toXmlElement(nsStack));
        }
        nsStack.pop();
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== this.tag) throw new Error(`not a ${this.tag}`);
        const statements = encoded.value.statements.map((encodedStatement)=>Instruction.statementFromIndexedDb(encodedStatement));
        return new Sequence(...statements);
    }
    toIndexedDb() {
        return {
            type: Sequence.tag,
            value: {
                statements: this.statements.map((statement)=>statement.toIndexedDb())
            }
        };
    }
}
class Data extends Instruction {
    static tag = "data";
    _path = [];
    statement = null;
    static build(path, statement) {
        return new Data(path, statement);
    }
    constructor(path, statement){
        super();
        const p = path instanceof Array ? path : [
            path
        ];
        if (p.length === 0) throw new Error('path must have at least one element');
        for(let i = 0; i < p.length; i++){
            const e = p[i];
            if (!(typeof e === "string")) throw new Error('path element must be a string');
            p[i] = e.trim();
        }
        this._path = p;
        this.statement = statement || null;
    }
    get path() {
        return this._path;
    }
    toString() {
        return `Data(path: [${this.path.join(', ')}], statement: ${this.statement})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = XmlNamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`not a namespace`);
            if (!(new URL(namespace).href === Data.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            const maybePath = element.attributes.path;
            if (typeof maybePath !== 'string') throw new Error(`${this.tag} must have a path`);
            let path = [];
            try {
                path = JSON.parse(maybePath);
                if (!(path instanceof Array && path.length > 0)) throw new Error('invalid data path');
                for(let i = 0; i < path.length; i++){
                    const pathElement = path[i];
                    if (!(typeof pathElement === "string")) {
                        throw new Error('invalid path element');
                    }
                }
            } catch (error) {
                throw new Error(`Not a valid data path: "${maybePath}"`);
            }
            let statement = null;
            for (const statementElement of element.children){
                if (!(statementElement.type === XmlNode.TYPE_ELEMENT)) continue;
                statement = Instruction.statementFromXmlElement(statementElement, nsStack);
                break;
            }
            if (statement === null) {
                result = new Data(path);
            } else {
                result = new Data(path, statement);
            }
        } catch (error1) {
            errorMessage = `${error1}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Data) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = XmlNamespaceStack.elementName(Data.tag, prefix), element = new XmlElement(name, attributes, children);
        attributes.path = JSON.stringify(this.path);
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        if (this.statement) {
            nsStack.push(element);
            children.push(this.statement.toXmlElement(nsStack));
            nsStack.pop();
        }
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== Data.tag) throw new Error(`not a ${this.tag}`);
        if (encoded.value) {
            if (encoded.value.statement) {
                return new Data(encoded.value.path, Instruction.statementFromIndexedDb(encoded.value.statement));
            }
        }
        return new Data(encoded.value.path);
    }
    toIndexedDb() {
        return {
            type: Data.tag,
            value: {
                path: this.path,
                statement: this.statement ? this.statement.toIndexedDb() : null
            }
        };
    }
}
class Try extends Instruction {
    static tag = "try";
    statement;
    _catchClauses;
    static build(statement, catchClauses) {
        return new Try(statement, catchClauses);
    }
    constructor(statement, catchClauses){
        super();
        if (!statement) throw new Error('try must contain one statement');
        let s;
        if (statement instanceof Array) {
            s = new Sequence(...statement);
        } else {
            s = statement;
        }
        this.statement = s;
        const c = [];
        if (!(catchClauses instanceof Array)) catchClauses = [
            catchClauses
        ];
        for (const catchClauseArg of catchClauses){
            const catchClause = Object.create(null);
            catchClause['catch'] = [];
            catchClause['do'] = [];
            if (typeof catchClauseArg['catch'] === 'string') {
                catchClause['catch'] = [
                    catchClauseArg['catch']
                ];
            } else if (catchClauseArg['catch'] instanceof Array) {
                catchClause['catch'] = catchClauseArg['catch'];
            }
            for (const faultType of catchClause['catch'])try {
                new PlatformFault(faultType);
            } catch (_error1) {
                try {
                    new Fault(faultType);
                } catch (_error) {
                    throw new Error(`Not a valid fault type: "${faultType}"`);
                }
            }
            if (catchClauseArg['do']) {
                catchClause['do'] = catchClauseArg['do'];
                if (!(catchClauseArg['do'] instanceof Array)) {
                    catchClause['do'] = [
                        catchClauseArg['do']
                    ];
                }
            }
            if (catchClause['do'].length === 0) throw new Error('catch clause must have at least one statement');
            c.push(catchClause);
        }
        if (c.length === 0) throw new Error('try must contain at least one catch clause');
        this._catchClauses = c;
    }
    get catchClauses() {
        return this._catchClauses;
    }
    toString() {
        let catchClauses = '';
        for (const catchClause of this.catchClauses){
            if (catchClauses.length > 0) catchClauses += ', ';
            catchClauses += `{catch: "${catchClause.catch.join(', ')}", do: [`;
            catchClauses += catchClause.do.map((instruction)=>`${instruction}`).join(', ');
            catchClauses += `]`;
            catchClauses += '}';
        }
        catchClauses = `[${catchClauses}]`;
        this.catchClauses.map((cc)=>({
                catch: cc.catch.length > 0 ? cc.catch.join(', ') : [],
                do: [
                    cc.do.map((d)=>d.toString()).join(', ')
                ]
            }));
        return `Try(${this.statement}, ${catchClauses})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = XmlNamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`not a namespace`);
            if (!(new URL(namespace).href === Try.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            let statement = null, catchClauses = [];
            for (const e of element.children){
                if (!(e.type === XmlNode.TYPE_ELEMENT)) continue;
                if (!statement) {
                    statement = Instruction.statementFromXmlElement(e, nsStack);
                    continue;
                }
                try {
                    nsStack.push(e);
                    const catchNamespace = nsStack.findNamespace(e.name), tag1 = XmlNamespaceStack.getElementNameWithoutPrefix(e.name);
                    if (!catchNamespace) throw new Error(`element without namespace`);
                    if (!(new URL(catchNamespace).href === Try.namespace.href && tag1 === 'catch')) throw `not a catch clause`;
                    let faultsToCatch = [], catchStatements = [];
                    if (typeof e.attributes.faults === 'string') {
                        faultsToCatch = JSON.parse(e.attributes.faults).map((s)=>s.trim());
                        for (const faultType of faultsToCatch)try {
                            new PlatformFault(faultType);
                        } catch (_error1) {
                            try {
                                new Fault(faultType);
                            } catch (_error) {
                                throw new Error(`Not a valid fault type: "${faultType}"`);
                            }
                        }
                    }
                    for (const catchStatementElement of e.children){
                        if (!(catchStatementElement.type === XmlNode.TYPE_ELEMENT)) continue;
                        const catchStatement = Instruction.statementFromXmlElement(catchStatementElement, nsStack);
                        catchStatements.push(catchStatement);
                    }
                    if (catchStatements.length === 0) throw new Error(`catch clause has no statement`);
                    catchClauses.push({
                        catch: faultsToCatch,
                        do: catchStatements
                    });
                } catch (error) {
                    errorMessage = `${error}`;
                } finally{
                    nsStack.pop();
                }
            }
            if (!statement) throw new Error(`try has no statement`);
            if (catchClauses.length === 0) throw new Error(`try has no catch clause`);
            result = new Try(statement, catchClauses);
        } catch (error1) {
            errorMessage = `${error1}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Try) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = XmlNamespaceStack.elementName(Try.tag, prefix), element = new XmlElement(name, attributes, children);
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        nsStack.push(element);
        children.push(this.statement.toXmlElement(nsStack));
        for (const catchClause of this.catchClauses){
            const catchElement = new XmlElement(XmlNamespaceStack.elementName('catch', prefix), catchClause['catch'].length > 0 ? {
                faults: JSON.stringify(catchClause['catch'])
            } : {}, catchClause['do'].map((instruction)=>instruction.toXmlElement(nsStack)));
            children.push(catchElement);
        }
        nsStack.pop();
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== this.tag) throw new Error(`not a ${this.tag}`);
        const statement = Instruction.statementFromIndexedDb(encoded.value.statement), catchClauses = encoded.value.catch.map((c)=>({
                'catch': c.catch,
                'do': c.do.map((encodedStatement)=>Instruction.statementFromIndexedDb(encodedStatement))
            }));
        return new Try(statement, catchClauses);
    }
    toIndexedDb() {
        return {
            type: Try.tag,
            value: {
                statement: this.statement.toIndexedDb(),
                catch: this.catchClauses.map((c)=>({
                        'catch': c.catch,
                        'do': c.do.map((statement)=>statement.toIndexedDb())
                    }))
            }
        };
    }
}
class Goto extends Instruction {
    static tag = "goto";
    _href = null;
    _parameters = [];
    static build(href) {
        return new Goto(href);
    }
    constructor(href){
        super();
        const parameters = [];
        if (typeof href === 'string') this._href = href;
        if (!parameters) return;
        const params = parameters instanceof Array ? parameters : [
            parameters
        ];
        for (const value of params.values()){
            this._parameters.push(value);
        }
    }
    get href() {
        return this._href;
    }
    get parameters() {
        return this._parameters;
    }
    parameter(name) {
        const param = this._parameters.find((p)=>p.name === name);
        if (typeof param === 'undefined') throw new Error(`parameter "${name}" not found`);
        return param.value;
    }
    toString() {
        let parameters = null, result = '';
        for (const param of this.parameters){
            if (parameters === null) {
                parameters = '';
            } else {
                parameters += ', ';
            }
            parameters += `{name: ${param.name}, value: ${param.value}}`;
        }
        if (typeof this.href === 'string') {
            result += `href: ${this.href}`;
        }
        if (typeof parameters === 'string') {
            if (result.length > 0) result += ', ';
            result += `parameters: [${parameters}]`;
        }
        return `Goto(${result})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = XmlNamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`not a namespace`);
            if (!(new URL(namespace).href === Goto.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            let href = null, parameters = [];
            if (typeof element.attributes.href === 'string') href = element.attributes.href;
            for (const parametersElement of element.children){
                if (parametersElement.type !== XmlNode.TYPE_ELEMENT) continue;
                try {
                    nsStack.push(parametersElement);
                    const parametersNamespace = nsStack.findNamespace(parametersElement.name), parametersTag = XmlNamespaceStack.getElementNameWithoutPrefix(parametersElement.name);
                    if (!parametersNamespace) throw new Error(`not a namespace`);
                    if (!(new URL(parametersNamespace).href === Goto.namespace.href && parametersTag === 'data-args')) throw `not a parameters`;
                    for (const parameterElement of parametersElement.children){
                        if (parameterElement.type !== XmlNode.TYPE_ELEMENT) continue;
                        try {
                            nsStack.push(parameterElement);
                            const parameterNamespace = nsStack.findNamespace(parameterElement.name), parameterTag = XmlNamespaceStack.getElementNameWithoutPrefix(parameterElement.name);
                            if (!parameterNamespace) throw new Error(`not a namespace`);
                            if (!(new URL(parameterNamespace).href === Goto.namespace.href && parameterTag === 'data-arg')) throw `not a parameter`;
                            if (!(typeof parameterElement.attributes.name === 'string')) throw new Error('parameter without name');
                            const parameterName = parameterElement.attributes.name;
                            for (const parameterValueElement of parameterElement.children){
                                if (parameterValueElement.type !== XmlNode.TYPE_ELEMENT) continue;
                                parameters.push({
                                    name: parameterName,
                                    value: Instruction.statementFromXmlElement(parameterValueElement, nsStack)
                                });
                            }
                        } catch (error) {
                            errorMessage = `${error}`;
                        } finally{
                            nsStack.pop();
                        }
                    }
                } catch (error1) {
                    errorMessage = `${error1}`;
                } finally{
                    nsStack.pop();
                }
            }
            result = new Goto(href);
        } catch (error2) {
            errorMessage = `${error2}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Goto) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = XmlNamespaceStack.elementName(Goto.tag, prefix), element = new XmlElement(name, attributes, children);
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        if (typeof this.href === 'string') attributes['href'] = this.href;
        if (this.parameters.length > 0) {
            nsStack.push(element);
            const parametersAttributes = Object.create(null), parametersChildren = [], parametersElement = new XmlElement(XmlNamespaceStack.elementName('data-args', prefix), parametersAttributes, parametersChildren);
            element.children.push(parametersElement);
            for (const parameter of this.parameters){
                const parameterAttributes = Object.create(null), parameterChildren = [], parameterElement = new XmlElement(XmlNamespaceStack.elementName('data-arg', prefix), parameterAttributes, parameterChildren);
                parameterAttributes['name'] = parameter.name;
                parameterChildren.push(parameter.value.toXmlElement(nsStack));
                parametersChildren.push(parameterElement);
            }
            nsStack.pop();
        }
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== this.tag) throw new Error(`not a ${this.tag}`);
        return new Goto(encoded.value.href);
    }
    toIndexedDb() {
        return {
            type: Goto.tag,
            value: {
                href: this.href,
                parameters: this.parameters.map((param)=>({
                        name: param.name,
                        value: param.value.toIndexedDb()
                    }))
            }
        };
    }
}
class Call extends Instruction {
    static tag = "call";
    _object = [];
    _href = null;
    _parameters = [];
    _objectParameters = [];
    _sendParameters = false;
    static build(object, href, parameters, objectParameters) {
        return new Call(object, href, parameters, objectParameters);
    }
    constructor(object, href, parameters, objectParameters){
        super();
        const sendParameters = false;
        const o = object === null || typeof object === 'undefined' ? [
            '@'
        ] : object instanceof Array ? object : [
            object
        ];
        if (o.length === 0) o.push('@');
        for(let i = 0; i < o.length; i++){
            const e = o[i];
            if (!(typeof e === "string")) throw new Error('object path element must be a string');
            o[i] = e.trim();
        }
        this._object = o;
        if (typeof href === 'string') this._href = href;
        if (objectParameters) {
            const objectParams = objectParameters instanceof Array ? objectParameters : [
                objectParameters
            ];
            for (const value of objectParams.values()){
                this._objectParameters.push(value);
            }
        }
        if (parameters) {
            const params = parameters instanceof Array ? parameters : [
                parameters
            ];
            for (const value1 of params.values()){
                this._parameters.push(value1);
            }
        }
        if (!(false === null || typeof false === 'undefined')) {
            this._sendParameters = sendParameters;
        }
    }
    get object() {
        return this._object;
    }
    get href() {
        return this._href;
    }
    get objectParameters() {
        return this._objectParameters;
    }
    get parameters() {
        return this._parameters;
    }
    get sendParameters() {
        return this._sendParameters;
    }
    objectParameter(name) {
        const objectParam = this._objectParameters.find((p)=>p.name === name);
        if (typeof objectParam === 'undefined') throw new Error(`object parameter "${name}" not found`);
        return objectParam.object;
    }
    parameter(name) {
        const param = this._parameters.find((p)=>p.name === name);
        if (typeof param === 'undefined') throw new Error(`parameter "${name}" not found`);
        return param.value;
    }
    toString() {
        let objectParameters = null, parameters = null, result = '';
        for (const objectParam of this.objectParameters){
            if (objectParameters === null) {
                objectParameters = '';
            } else {
                objectParameters += ', ';
            }
            objectParameters += `{name: ${objectParam.name}, object: ${JSON.stringify(objectParam.object)}}`;
        }
        for (const param of this.parameters){
            if (parameters === null) {
                parameters = '';
            } else {
                parameters += ', ';
            }
            parameters += `{name: ${param.name}, value: ${param.value}}`;
        }
        if (typeof this.href === 'string') {
            result += `href: ${this.href}`;
        }
        if (typeof objectParameters === 'string') {
            if (result.length > 0) result += ', ';
            result += `objectParameters: [${objectParameters}]`;
        }
        if (typeof parameters === 'string') {
            if (result.length > 0) result += ', ';
            result += `parameters: [${parameters}]`;
        }
        return `Call(object: [${this.object.join(', ')}], ${result})`;
    }
    static fromXmlElement(element, namespaceStack) {
        const nsStack = namespaceStack ? namespaceStack : XmlNamespaceStack.forElement(element);
        let result = null, errorMessage = '';
        try {
            nsStack.push(element);
            const namespace = nsStack.findNamespace(element.name), tag = XmlNamespaceStack.getElementNameWithoutPrefix(element.name);
            if (!namespace) throw new Error(`not a namespace`);
            if (!(new URL(namespace).href === Call.namespace.href && tag === this.tag)) throw `not a ${this.tag}`;
            const maybeObject = element.attributes.object;
            if (typeof maybeObject !== 'string') throw new Error(`${this.tag} must have a path`);
            let object = [];
            try {
                object = JSON.parse(maybeObject);
                if (!(object instanceof Array && object.length > 0)) throw new Error('invalid object path');
                for(let i = 0; i < object.length; i++){
                    const pathElement = object[i];
                    if (!(typeof pathElement === "string")) {
                        throw new Error('invalid path element');
                    }
                }
            } catch (error) {
                throw new Error(`Not a valid object path: "${maybeObject}"`);
            }
            let href = null, objectParameters = [], parameters = [], sendParameters = false;
            if (typeof element.attributes.href === 'string') href = element.attributes.href;
            for (const objectParametersElement of element.children){
                if (objectParametersElement.type !== XmlNode.TYPE_ELEMENT) continue;
                try {
                    nsStack.push(objectParametersElement);
                    const objectParametersNamespace = nsStack.findNamespace(objectParametersElement.name), objectParametersTag = XmlNamespaceStack.getElementNameWithoutPrefix(objectParametersElement.name);
                    if (!objectParametersNamespace) throw new Error(`not a namespace`);
                    if (!(new URL(objectParametersNamespace).href === Call.namespace.href && objectParametersTag === 'object-args')) throw `not an object parameters element`;
                    for (const objectParameterElement of objectParametersElement.children){
                        if (objectParameterElement.type !== XmlNode.TYPE_ELEMENT) continue;
                        try {
                            nsStack.push(objectParameterElement);
                            const objectParameterNamespace = nsStack.findNamespace(objectParameterElement.name), objectParameterTag = XmlNamespaceStack.getElementNameWithoutPrefix(objectParameterElement.name);
                            if (!objectParameterNamespace) throw new Error(`not a namespace`);
                            if (!(new URL(objectParameterNamespace).href === Call.namespace.href && objectParameterTag === 'object-arg')) throw `not an object parameter`;
                            if (!(typeof objectParameterElement.attributes.name === 'string')) throw new Error('object parameter without name');
                            const objectParameterName = objectParameterElement.attributes.name, objectParameterObject = objectParameterElement.attributes.object;
                            objectParameters.push({
                                name: objectParameterName,
                                object: JSON.parse(objectParameterObject)
                            });
                        } catch (error1) {
                            errorMessage = `${error1}`;
                        } finally{
                            nsStack.pop();
                        }
                    }
                } catch (error2) {
                    errorMessage = `${error2}`;
                } finally{
                    nsStack.pop();
                }
            }
            for (const parametersElement of element.children){
                if (parametersElement.type !== XmlNode.TYPE_ELEMENT) continue;
                try {
                    nsStack.push(parametersElement);
                    const parametersNamespace = nsStack.findNamespace(parametersElement.name), parametersTag = XmlNamespaceStack.getElementNameWithoutPrefix(parametersElement.name);
                    if (!parametersNamespace) throw new Error(`not a namespace`);
                    if (!(new URL(parametersNamespace).href === Call.namespace.href && parametersTag === 'data-args')) throw `not a parameters element`;
                    sendParameters = parametersElement.attributes.name === 'true';
                    for (const parameterElement of parametersElement.children){
                        if (parameterElement.type !== XmlNode.TYPE_ELEMENT) continue;
                        try {
                            nsStack.push(parameterElement);
                            const parameterNamespace = nsStack.findNamespace(parameterElement.name), parameterTag = XmlNamespaceStack.getElementNameWithoutPrefix(parameterElement.name);
                            if (!parameterNamespace) throw new Error(`not a namespace`);
                            if (!(new URL(parameterNamespace).href === Call.namespace.href && parameterTag === 'data-arg')) throw `not a parameter`;
                            if (!(typeof parameterElement.attributes.name === 'string')) throw new Error('parameter without name');
                            const parameterName = parameterElement.attributes.name;
                            for (const parameterValueElement of parameterElement.children){
                                if (parameterValueElement.type !== XmlNode.TYPE_ELEMENT) continue;
                                parameters.push({
                                    name: parameterName,
                                    value: Instruction.statementFromXmlElement(parameterValueElement, nsStack)
                                });
                            }
                        } catch (error3) {
                            errorMessage = `${error3}`;
                        } finally{
                            nsStack.pop();
                        }
                    }
                } catch (error4) {
                    errorMessage = `${error4}`;
                } finally{
                    nsStack.pop();
                }
            }
            result = new Call(object, href, parameters, objectParameters);
        } catch (error5) {
            errorMessage = `${error5}`;
        } finally{
            nsStack.pop();
        }
        if (result instanceof Call) {
            return result;
        }
        throw new Error(errorMessage);
    }
    toXmlElement(namespaceStack) {
        const namespace = Instruction.namespace.href, nsStack = namespaceStack || new XmlNamespaceStack(), existingPrefix = nsStack.prefixFor(namespace, null), useNewPrefix = typeof existingPrefix !== 'string', newPrefix = useNewPrefix ? nsStack.prefixFor(namespace, [
            'q'
        ]) : null, prefix = newPrefix || existingPrefix, attributes = Object.create(null), children = [], name = XmlNamespaceStack.elementName(Call.tag, prefix), element = new XmlElement(name, attributes, children);
        if (useNewPrefix) {
            attributes[XmlNamespaceStack.nsAttrName(newPrefix)] = namespace;
        }
        attributes['object'] = JSON.stringify(this.object);
        if (typeof this.href === 'string') attributes['href'] = this.href;
        if (this.objectParameters.length > 0) {
            nsStack.push(element);
            const objectParametersAttributes = Object.create(null), objectParametersChildren = [], objectParametersElement = new XmlElement(XmlNamespaceStack.elementName('object-args', prefix), objectParametersAttributes, objectParametersChildren);
            element.children.push(objectParametersElement);
            for (const objectParameter of this.objectParameters){
                const objectParameterAttributes = Object.create(null), objectParameterChildren = [], objectParameterElement = new XmlElement(XmlNamespaceStack.elementName('object-arg', prefix), objectParameterAttributes, objectParameterChildren);
                objectParameterAttributes['name'] = objectParameter.name;
                objectParameterAttributes['object'] = JSON.stringify(objectParameter.object);
                objectParametersChildren.push(objectParameterElement);
            }
            nsStack.pop();
        }
        if (this.parameters.length > 0) {
            nsStack.push(element);
            const parametersAttributes = Object.create(null), parametersChildren = [], parametersElement = new XmlElement(XmlNamespaceStack.elementName('data-args', prefix), parametersAttributes, parametersChildren);
            if (this.sendParameters) parametersAttributes['send'] = `${this.sendParameters}`;
            element.children.push(parametersElement);
            for (const parameter of this.parameters){
                const parameterAttributes = Object.create(null), parameterChildren = [], parameterElement = new XmlElement(XmlNamespaceStack.elementName('data-arg', prefix), parameterAttributes, parameterChildren);
                parameterAttributes['name'] = parameter.name;
                parameterChildren.push(parameter.value.toXmlElement(nsStack));
                parametersChildren.push(parameterElement);
            }
            nsStack.pop();
        }
        return element;
    }
    static fromIndexedDb(encoded) {
        if (encoded.type !== this.tag) throw new Error(`not a ${this.tag}`);
        return new Call(encoded.value.object, encoded.value.href, encoded.value.parameters.map((parameter)=>({
                name: parameter.name,
                value: Instruction.statementFromIndexedDb(parameter.value)
            })), encoded.value.objectParameters);
    }
    toIndexedDb() {
        return {
            type: Call.tag,
            value: {
                object: this.object,
                href: this.href,
                parameters: this.parameters.map((param)=>({
                        name: param.name,
                        value: param.value.toIndexedDb()
                    })),
                sendParameters: this.sendParameters,
                objectParameters: this.objectParameters
            }
        };
    }
}
Instruction.registry = [
    Fault,
    PlatformFault,
    Return,
    Sequence,
    Data,
    Try,
    Goto,
    Call
];
class Script {
    static contentType = 'application/xml';
    _instruction;
    static build(instruction) {
        return new Script(instruction);
    }
    constructor(instruction){
        if (!(instruction instanceof Instruction)) throw new Error('one or more parameters required');
        this._instruction = instruction;
    }
    get instruction() {
        return this._instruction;
    }
    toString() {
        return `${this.instruction}`;
    }
    static fromXml(xmlStr) {
        const doc = new Parser(xmlStr).document, instruction = Instruction.fromXmlElement(doc.root);
        return new Script(instruction);
    }
    toXml() {
        return Writer.elementToString(this.instruction.toXmlElement());
    }
}
class PhaseParameters {
    static namespace = new URL('https://qworum.net/ns/v1/phase-parameters/');
    _params = [];
    static build(params) {
        return new PhaseParameters(params);
    }
    constructor(params){
        if (params.length === 0) throw new Error('one or more parameters required');
        this._params = params;
    }
    get parameters() {
        return this._params;
    }
    parameter(name) {
        const param = this._params.find((p)=>p.name === name);
        if (typeof param === 'undefined') throw new Error(`parameter "${name}" not found`);
        return param.value;
    }
    static fromXml(xmlStr) {
        try {
            const params = [], doc = new Parser(xmlStr).document, nsStack = XmlNamespaceStack.forElement(doc.root);
            if (!doc) throw new Error('not a document');
            if (!nsStack) throw new Error('namespace stack was not initialized');
            let elementNs = nsStack.findNamespace(doc.root.name), elementNameParts = doc.root.name.split(':'), elementName = elementNameParts.length === 1 ? elementNameParts[0] : elementNameParts[1];
            if (!(elementNs === PhaseParameters.namespace.href && elementName === 'data-args')) throw new Error('not a valid phase-parameters message');
            for (const paramElement of doc.root.children){
                if (paramElement.type !== XmlNode.TYPE_ELEMENT) continue;
                let paramElementNs = nsStack.findNamespace(paramElement.name), paramElementNameParts = paramElement.name.split(':'), paramElementName = paramElementNameParts.length === 1 ? paramElementNameParts[0] : paramElementNameParts[1];
                if (!(paramElementNs === PhaseParameters.namespace.href && paramElementName === 'data-arg')) throw new Error('not a param');
                const paramName = paramElement.attributes['name'];
                if (typeof paramName !== 'string') throw new Error('param name must be a string');
                nsStack.push(paramElement);
                let data;
                for (const dataElement of paramElement.children){
                    if (dataElement.type !== XmlNode.TYPE_ELEMENT) continue;
                    try {
                        data = DataValue.fromXmlElement(dataElement, nsStack);
                    } catch (error) {}
                    break;
                }
                nsStack.pop();
                if (!data) throw new Error(`param "${paramName}" does not contain any data`);
                params.push({
                    name: paramName,
                    value: data
                });
            }
            return new PhaseParameters(params);
        } catch (error1) {
            console.error(`[PhaseParameters.read] ${error1}`);
        }
        throw new Error('not a valid phase-parameters message');
    }
    toXml() {
        const attributes = {
            xmlns: PhaseParameters.namespace.href
        }, children = [], params = new XmlElement('data-args', attributes, children), nsStack = new XmlNamespaceStack();
        nsStack.push(params);
        for (const param of this.parameters){
            const data = param.value, paramElement = new XmlElement('data-arg', {
                name: param.name
            }, [
                param.value.toXmlElement(nsStack)
            ]);
            children.push(paramElement);
        }
        nsStack.pop();
        return Writer.elementToString(params);
    }
    toString() {
        let result;
        for (const param of this.parameters){
            result = result ? `${result}, ${param.name}: ${param.value}` : `${param.name}: ${param.value}`;
        }
        return `PhaseParameters(${result})`;
    }
}
const MESSAGE_VERSION = '1.0.7';
const mod1 = {
    DataValue: DataValue,
    GenericData: GenericData,
    Json: Json,
    SemanticData: SemanticData,
    Instruction: Instruction,
    Fault: Fault,
    FaultTypeError: FaultTypeError,
    PlatformFault: PlatformFault,
    PlatformFaultTypeError: PlatformFaultTypeError,
    Return: Return,
    Sequence: Sequence,
    Data: Data,
    Try: Try,
    Goto: Goto,
    Call: Call,
    Script: Script,
    PhaseParameters: PhaseParameters,
    MESSAGE_VERSION: MESSAGE_VERSION
};
class QworumObject {
    origin;
    context;
    static build(origin, context) {
        try {
            origin = new URL(`${origin}`);
            if (![
                'http:',
                'https:'
            ].includes(origin.protocol)) return null;
            origin = new URL(origin.origin);
        } catch (error) {
            return null;
        }
        if (!(context instanceof QworumContext)) context = QworumContext.build();
        return new QworumObject(origin, context);
    }
    constructor(origin, context){
        this.origin = origin;
        this.context = context;
    }
    static readIndexedDbObject(object) {
        const itemIsArray = (i)=>i instanceof Array, itemIsObject = (i)=>i !== null && typeof i === 'object' && !itemIsArray(i);
        let origin, context;
        if (!itemIsObject(object)) return null;
        if (object.type !== 'Object') return null;
        try {
            origin = new URL(object.value.origin);
        } catch (error) {}
        context = QworumContext.readIndexedDbObject(object.value.context);
        return QworumObject.build(origin, context);
    }
    toIndexedDbObject() {
        return {
            type: 'Object',
            value: {
                origin: this.origin.href,
                context: this.context.toIndexedDbObject()
            }
        };
    }
    toString(leftPadding) {
        const leftPaddingStr = ' '.repeat(leftPadding ?? 0);
        return `Object(\n${leftPaddingStr}  origin: ${this.origin},\n${leftPaddingStr}  context: ${this.context}\n${leftPaddingStr})`;
    }
}
class QworumContext {
    data = Object.create(null);
    objects = Object.create(null);
    static build(data, objects) {
        const itemIsArray = (i)=>i instanceof Array, itemIsObject = (i)=>i !== null && typeof i === 'object' && !itemIsArray(i);
        if (!itemIsObject(data)) data = Object.create(null);
        if (!itemIsObject(objects)) objects = Object.create(null);
        for(const key in data){
            if (Object.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (!(value instanceof DataValue)) return null;
            }
        }
        for(const key1 in objects){
            if (Object.hasOwnProperty.call(objects, key1)) {
                const value1 = objects[key1];
                if (!(value1 instanceof QworumObject)) return null;
            }
        }
        return new QworumContext(data, objects);
    }
    constructor(data, objects){
        this.data = data;
        this.objects = objects;
    }
    get dataKeys() {
        return Object.keys(this.data);
    }
    get objectsKeys() {
        return Object.keys(this.objects);
    }
    get noData() {
        return this.dataKeys.length === 0;
    }
    get noObjects() {
        return this.objectsKeys.length === 0;
    }
    static readIndexedDbObject(context) {
        const itemIsArray = (i)=>i instanceof Array, itemIsObject = (i)=>i !== null && typeof i === 'object' && !itemIsArray(i), data = Object.create(null), objects = Object.create(null);
        if (!(itemIsObject(context) && context.type === 'Context' && itemIsObject(context.value) && (!context.value.data || itemIsObject(context.value.data)) && (!context.value.objects || itemIsObject(context.value.objects)))) return null;
        if (context.value.data) for(const key in context.value.data){
            if (Object.hasOwnProperty.call(context.value.data, key)) {
                const value = context.value.data[key];
                data[key] = DataValue.fromIndexedDb(value);
            }
        }
        if (context.value.objects) for(const key1 in context.value.objects){
            if (Object.hasOwnProperty.call(context.value.objects, key1)) {
                const value1 = context.value.objects[key1];
                objects[key1] = QworumObject.readIndexedDbObject(value1);
            }
        }
        return QworumContext.build(data, objects);
    }
    toIndexedDbObject() {
        const encodedData = Object.create(null), encodedObjects = Object.create(null);
        for(const key in this.data){
            if (Object.hasOwnProperty.call(this.data, key)) {
                const value = this.data[key];
                encodedData[key] = value.toIndexedDb();
            }
        }
        for(const key1 in this.objects){
            if (Object.hasOwnProperty.call(this.objects, key1)) {
                const value1 = this.objects[key1];
                encodedObjects[key1] = value1.toIndexedDbObject();
            }
        }
        return {
            type: 'Context',
            value: {
                data: encodedData,
                objects: encodedObjects
            }
        };
    }
}
class QworumCallFrame {
    owner;
    context;
    scriptState;
    scriptUrl;
    static build(owner) {
        if (!(owner instanceof QworumObject)) return null;
        return new QworumCallFrame(owner);
    }
    constructor(owner){
        this.owner = owner;
        this.context = QworumContext.build();
        this.scriptState = null;
    }
    toString() {
        return `CallFrame(owner: ${this.owner}, context: ${this.context}, scriptState: ${this.scriptState}, scriptUrl: ${this.scriptUrl})`;
    }
}
class QworumScriptState {
    stack = [];
    static build(stack) {
        return new QworumScriptState(stack || []);
    }
    constructor(stack){
        this.stack = stack;
    }
    push(instructions) {
        if (instructions === null || instructions === undefined) return false;
        const itemIsArray = (i)=>i instanceof Array, itemIsData = (i)=>i instanceof Data, itemIsAnInstruction = (i)=>i instanceof Instruction, itemIsAStatement = (i)=>itemIsData(i) || itemIsAnInstruction(i), parent = this.top ? this.top.instructions[0] : null, stackElement = {
            parent: parent,
            instructions: null
        };
        if (!itemIsArray(instructions)) {
            instructions = [
                instructions
            ];
        }
        instructions = instructions.map((s)=>itemIsAStatement(s) ? s : s.value).filter((s)=>s instanceof Instruction);
        if (instructions.length === 0) return false;
        stackElement.instructions = instructions;
        this.stack.unshift(stackElement);
        return true;
    }
    pop() {
        if (this.stack.length === 0) return false;
        this.stack.shift();
        return true;
    }
    get isEmpty() {
        return this.stack.length === 0;
    }
    get top() {
        return this.stack[0];
    }
    static readIndexedDbObject(encoded) {
        if (!encoded || encoded.type !== 'ScriptState') return null;
        const stack = [];
        for(let i = encoded.value.length - 1; i >= 0; i--){
            const encodedStackItem = encoded.value[i], instructions = encodedStackItem.instructions.map((o)=>Instruction.fromIndexedDb(o)), parent = encodedStackItem.parent >= 0 ? stack[0].instructions[encodedStackItem.parent] : null;
            stack.unshift({
                parent,
                instructions
            });
        }
        return QworumScriptState.build(stack);
    }
    toIndexedDbObject() {
        let result = {
            type: 'ScriptState',
            value: []
        };
        for(let i = this.stack.length - 1; i >= 0; i--){
            const stackItem = this.stack[i], prevStackItem = i + 1 < this.stack.length ? this.stack[i + 1] : null, parentInstructionIndex = prevStackItem ? prevStackItem.instructions.findIndex((instruction)=>instruction === stackItem.parent) : -1, encodedInstructions = stackItem.instructions.map((instruction)=>instruction.toIndexedDb());
            result.value.unshift({
                parent: parentInstructionIndex,
                instructions: encodedInstructions
            });
        }
        return result;
    }
}
class QworumRuntime {
    static callOwnerName = '@';
    static reservedObjectNamePrefixes = [
        this.callOwnerName,
        '#',
        '$'
    ];
    mainObject;
    stack = [];
    static build(mainObject, stack) {
        if (!(mainObject instanceof QworumObject)) return null;
        if (!stack) stack = [
            QworumCallFrame.build(mainObject)
        ];
        return new QworumRuntime(mainObject, stack);
    }
    constructor(mainObject, stack){
        this.mainObject = mainObject;
        this.stack = stack;
    }
    push(frame) {
        if (!(frame instanceof QworumCallFrame)) return false;
        this.stack.unshift(frame);
    }
    _getContext(path) {
        try {
            if (!(path instanceof Array)) return null;
            if (this.isEmpty) return null;
            const currentCall = this.top;
            let context = currentCall.context, pathElement;
            for(let i = 0; i < path.length - 1; i++){
                pathElement = path[i];
                if (typeof pathElement !== 'string') return null;
                pathElement = pathElement.trim();
                if (pathElement.startsWith(QworumRuntime.callOwnerName)) {
                    context = currentCall.owner.context;
                    continue;
                }
                const ancestorObject = context.objects[pathElement];
                if (!ancestorObject) return null;
                context = ancestorObject.context;
            }
            return context;
        } catch (error) {
            console.error(`[runtime _getContext] error: ${error}`);
        }
        return null;
    }
    getObject(path, newObject) {
        try {
            const context = this._getContext(path);
            if (!context) return null;
            let pathElement = path[path.length - 1];
            if (typeof pathElement !== 'string') return null;
            pathElement = pathElement.trim();
            let object;
            if (pathElement.startsWith(QworumRuntime.callOwnerName)) {
                object = this.top.owner;
            } else {
                object = context.objects[pathElement];
            }
            if (!object && newObject instanceof QworumObject) {
                context.objects[pathElement] = newObject;
                object = newObject;
            }
            return object;
        } catch (error) {
            console.error(`[runtime getObject] error: ${error}`);
        }
        return null;
    }
    getData(path, newData) {
        try {
            const context = this._getContext(path);
            if (!context) return null;
            let pathElement = path[path.length - 1];
            if (typeof pathElement !== 'string') return null;
            pathElement = pathElement.trim();
            let data = context.data[pathElement];
            if (!data && newData instanceof DataValue) {
                context.data[pathElement] = newData;
                data = newData;
            }
            return data;
        } catch (error) {
            console.error(`[runtime getData] error: ${error}`);
        }
        return null;
    }
    setData(path, newData) {
        try {
            const context = this._getContext(path);
            if (!context) return null;
            if (!(newData instanceof DataValue)) return null;
            let pathElement = path[path.length - 1];
            if (typeof pathElement !== 'string') return null;
            pathElement = pathElement.trim();
            context.data[pathElement] = newData;
            return newData;
        } catch (error) {
            console.error(`[runtime setData] error: ${error}`);
        }
        return null;
    }
    pop() {
        if (this.stack.length === 0) return false;
        this.stack.shift();
        return true;
    }
    get isEmpty() {
        return this.stack.length === 0;
    }
    get top() {
        return !this.isEmpty ? this.stack[0] : null;
    }
    toIndexedDbObject() {
        const encodedMainObject = this.mainObject.toIndexedDbObject(), encodedStack = [];
        for(let i = 0; i < this.stack.length; i++){
            const frame = this.stack[i], encodedContext = frame.context.toIndexedDbObject(), encodedScriptState = frame.scriptState ? frame.scriptState.toIndexedDbObject() : null, encodedScriptUrl = frame.scriptUrl ? frame.scriptUrl.href : null, encodedOwner = this._getAbsoluteObjectPath(frame.owner), encodedStackFrame = {
                owner: encodedOwner,
                context: encodedContext
            };
            if (encodedScriptState) encodedStackFrame['scriptState'] = encodedScriptState;
            if (encodedScriptUrl) encodedStackFrame['scriptUrl'] = encodedScriptUrl;
            encodedStack.push(encodedStackFrame);
        }
        return {
            type: 'Runtime',
            value: {
                stack: encodedStack,
                mainObject: encodedMainObject
            }
        };
    }
    static readIndexedDbObject(encoded) {
        if (encoded.type !== 'Runtime') return null;
        const mainObject = QworumObject.readIndexedDbObject(encoded.value.mainObject), stack = [];
        for(let i = 0; i < encoded.value.stack.length; i++){
            const encodedCallFrame = encoded.value.stack[i], callFrame = QworumCallFrame.build(this._getObjectFromPath(encodedCallFrame.owner, mainObject, stack));
            callFrame.context = QworumContext.readIndexedDbObject(encodedCallFrame.context);
            callFrame.scriptState = QworumScriptState.readIndexedDbObject(encodedCallFrame.scriptState);
            callFrame.scriptUrl = encodedCallFrame.scriptUrl ? new URL(encodedCallFrame.scriptUrl) : null;
            stack.push(callFrame);
        }
        return QworumRuntime.build(mainObject, stack);
    }
    static _getObjectFromPath(path, mainObject, stack) {
        if (path.length === 0) return mainObject;
        path = [
            ...path
        ];
        let context = mainObject.context;
        if (typeof path[0] !== 'string') {
            context = stack[path[0]].context;
            path.shift();
        }
        while(path.length > 0){
            const objectName = path[0], object = context.objects[objectName];
            if (!object) return null;
            path.shift();
            if (path.length === 0) return object;
            context = object.context;
        }
        return null;
    }
    _getAbsoluteObjectPath(object) {
        let path;
        for(let i = this.stack.length - 1; i >= 0; i--){
            const frame = this.stack[i];
            path = this._getObjectPathInContext(object, [
                i
            ], frame.context);
            if (path) return path;
        }
        if (object === this.mainObject) return [];
        path = this._getObjectPathInContext(object, [], this.mainObject.context);
        if (path) return path;
        return null;
    }
    _getObjectPathInContext(object, contextPath, context) {
        let path;
        for(const key in context.objects){
            if (Object.hasOwnProperty.call(context.objects, key)) {
                const o = context.objects[key];
                if (o === object) return [
                    ...contextPath,
                    key
                ];
            }
        }
        for(const key1 in context.objects){
            if (Object.hasOwnProperty.call(context.objects, key1)) {
                const o1 = context.objects[key1];
                path = this._getObjectPathInContext(object, [
                    ...contextPath,
                    key1
                ], o1.context);
                if (path) return path;
            }
        }
        return null;
    }
    toString() {
        let mainObject = `${this.mainObject}`, stack = this.stack.map((callFrame)=>`${callFrame}`).join(', ');
        stack = `[\n    ${stack}\n  ]`;
        return `Runtime(\n  stack: ${stack},\n  mainObject: ${mainObject}\n)`;
    }
}
class QworumRequest {
    url;
    phaseParameters;
    static build(url, phaseParameters) {
        if (!(url instanceof URL && (phaseParameters === undefined || phaseParameters === null || phaseParameters instanceof PhaseParameters))) throw new Error('wrong phase parameters arguments');
        return new QworumRequest(url, phaseParameters);
    }
    constructor(url, phaseParameters){
        this.url = url;
        this.phaseParameters = phaseParameters;
    }
    toString() {
        let result = `url: ${this.url}`;
        if (this.phaseParameters) result += `, params: ${this.phaseParameters}`;
        return `QworumRequest(${result})`;
    }
    toJsonable() {
        if (!this.phaseParameters) {
            return {
                url: this.url.href
            };
        }
        return {
            url: this.url.href,
            phaseParameters: this.phaseParameters.toXml()
        };
    }
    static fromJsonable(jsonable) {
        return QworumRequest.build(new URL(jsonable.url), jsonable.phaseParameters ? PhaseParameters.fromXml(jsonable.phaseParameters) : null);
    }
}
class QworumInterpreter {
    static eval(script, url, runtime, isPlatformScript) {
        const Sequence1 = Sequence.build, PlatformFault1 = PlatformFault.build;
        if (!(url instanceof URL && runtime instanceof QworumRuntime && !runtime.isEmpty)) return PlatformFault1('runtime');
        if (!this.isValidScript(script, isPlatformScript)) {
            console.error(`[eval] script is not valid`);
            script = Script.build(PlatformFault1('script'));
        }
        let result;
        runtime.top.scriptState = QworumScriptState.build();
        runtime.top.scriptUrl = url;
        runtime.top.scriptState.push(script.instruction);
        do {
            result = this.evalCurrentInstruction(runtime);
            if (!(result instanceof QworumRequest)) {
                runtime.pop();
                if (runtime.isEmpty) break;
                runtime.top.scriptState.top.instructions.shift();
                runtime.top.scriptState.top.instructions.unshift(result instanceof Fault ? result : Sequence1(result));
            }
        }while (!(runtime.isEmpty || result instanceof QworumRequest))
        return result;
    }
    static isValidScript(script, isPlatformScript) {
        if (!(script instanceof Script)) return false;
        return this._isValidStatement(script.instruction, isPlatformScript);
    }
    static _isValidStatement(statement, isPlatformScript) {
        let result = true;
        switch(statement.constructor){
            case PlatformFault:
                if (!isPlatformScript) result = false;
                break;
            case Fault:
            case DataValue:
            case GenericData:
            case Json:
            case SemanticData:
            case Goto:
                break;
            case Call:
                result = statement.parameters.reduce((result, param)=>result && this._isValidStatement(param.value), true);
                break;
            case Return:
                result = this._isValidStatement(statement.statement);
                break;
            case Data:
                if (!statement.statement) {
                    result = true;
                } else {
                    result = this._isValidStatement(statement.statement);
                }
                break;
            case Try:
                result = this._isValidStatement(statement.statement) && statement.catchClauses.reduce((result, catchClause)=>result && catchClause.do.reduce((result, statement)=>result && this._isValidStatement(statement), true), true);
                break;
            case Sequence:
                result = statement.statements.reduce((result, statement)=>result && this._isValidStatement(statement), true);
                break;
            default:
                result = false;
                break;
        }
        return result;
    }
    static evalCurrentInstruction(runtime) {
        const PlatformFault1 = PlatformFault.build, scriptState = runtime.top.scriptState, instruction = scriptState.top.instructions[0];
        let result;
        switch(instruction.constructor){
            case Goto:
                result = this.evalGoto(runtime);
                break;
            case Call:
                result = this.evalCall(runtime);
                break;
            case Return:
                result = this.evalReturn(runtime);
                break;
            case Data:
                result = this.evalData(runtime);
                break;
            case Fault:
                result = this.evalFault(runtime);
                break;
            case PlatformFault:
                result = this.evalFault(runtime);
                break;
            case Try:
                result = this.evalTry(runtime);
                break;
            case Sequence:
                result = this.evalSequence(runtime);
                break;
            default:
                result = PlatformFault1('runtime');
                break;
        }
        return result;
    }
    static evalGoto(runtime) {
        const PlatformFault1 = PlatformFault.build, scriptState = runtime.top.scriptState, url = runtime.top.scriptUrl, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, __goto = instructions[0];
        console.log(`[evalGoto] evaluating ${__goto}`);
        if (scriptState.push(__goto.parameters)) {
            return this.evalCurrentInstruction(runtime);
        }
        try {
            const originOfObject = runtime.top.owner.origin, requestUrl = new URL(__goto.href || url.href, url), phaseParams = __goto.parameters.length > 0 ? PhaseParameters.build(__goto.parameters) : null, request = QworumRequest.build(requestUrl, phaseParams);
            if (!requestUrl.href.startsWith(originOfObject.href)) {
                instructions[0] = PlatformFault1('origin');
                return this.evalCurrentInstruction(runtime);
            }
            runtime.top.scriptState = null;
            return request;
        } catch (error) {
            console.error(`[evalGoto] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
    static evalCall(runtime) {
        const PlatformFault1 = PlatformFault.build, scriptState = runtime.top.scriptState, url = runtime.top.scriptUrl, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, call = instructions[0];
        console.log(`[evalCall] evaluating ${call}`);
        if (scriptState.push(call.parameters)) {
            return this.evalCurrentInstruction(runtime);
        }
        try {
            const requestUrl = new URL(call.href || url.href, url), phaseParams = call.parameters.length > 0 && call.sendParameters ? PhaseParameters.build(call.parameters) : null, request = call.sendParameters ? QworumRequest.build(requestUrl, phaseParams) : QworumRequest.build(requestUrl);
            let owner = runtime.getObject(call.object, QworumObject.build(new URL(requestUrl.origin)));
            if (!requestUrl.href.startsWith(owner.origin.href)) {
                instructions[0] = PlatformFault1('origin');
                return this.evalCurrentInstruction(runtime);
            }
            const callFrame = QworumCallFrame.build(owner);
            for (const parameter of call.parameters){
                callFrame.context.data[parameter.name] = parameter.value;
            }
            for (const objectParameter of call.objectParameters){
                callFrame.context.objects[objectParameter.name] = runtime.getObject(objectParameter.object);
                if (!callFrame.context.objects[objectParameter.name]) {
                    throw new Error('object path does not point to any object');
                }
            }
            runtime.push(callFrame);
            return request;
        } catch (error) {
            console.error(`[evalCall] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
    static evalSequence(runtime) {
        const itemIsAnInstruction = (i)=>i instanceof Instruction, PlatformFault1 = PlatformFault.build, Return1 = Return.build;
        let scriptState = runtime.top.scriptState, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, sequence = instructions[0];
        try {
            console.log(`[evalSequence] evaluating ${sequence} (stack size: ${runtime.stack.length})`);
            if (scriptState.push(sequence.statements)) {
                return this.evalCurrentInstruction(runtime);
            }
            const data = sequence.statements[sequence.statements.length - 1];
            if (!(parentInstruction instanceof Instruction)) {
                instructions[0] = Return1(data);
                return this.evalCurrentInstruction(runtime);
            }
            instructions.shift();
            if (instructions.length === 0) {
                scriptState.pop();
            }
            let indexOfInstructionToReplace, indexOfParamToReplace;
            switch(parentInstruction.constructor){
                case Goto:
                    indexOfParamToReplace = parentInstruction.parameters.findIndex((param)=>itemIsAnInstruction(param.value));
                    if (indexOfParamToReplace >= 0) parentInstruction.parameters[indexOfParamToReplace].value = data;
                    break;
                case Call:
                    indexOfParamToReplace = parentInstruction.parameters.findIndex((param)=>itemIsAnInstruction(param.value));
                    if (indexOfParamToReplace >= 0) parentInstruction.parameters[indexOfParamToReplace].value = data;
                    break;
                case Return:
                    parentInstruction.statement = data;
                    break;
                case Data:
                    parentInstruction.statement = data;
                    break;
                case Try:
                    parentInstruction.statement = data;
                    break;
                case Sequence:
                    indexOfInstructionToReplace = parentInstruction.statements.findIndex((statement)=>itemIsAnInstruction(statement));
                    if (indexOfInstructionToReplace >= 0) parentInstruction.statements[indexOfInstructionToReplace] = data;
                    break;
                default:
                    break;
            }
            return this.evalCurrentInstruction(runtime);
        } catch (error) {
            console.error(`[evalSequence] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
    static evalData(runtime) {
        const PlatformFault1 = PlatformFault.build, Sequence1 = Sequence.build, currentCall = runtime.top, scriptState = currentCall.scriptState, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, variable = instructions[0];
        try {
            console.log(`[evalData] evaluating ${variable}`);
            if (scriptState.push(variable.statement)) {
                return this.evalCurrentInstruction(runtime);
            }
            if (variable.statement instanceof DataValue) {
                runtime.setData(variable.path, variable.statement);
                instructions[0] = Sequence1(variable.statement);
                return this.evalCurrentInstruction(runtime);
            }
            let data = runtime.getData(variable.path);
            if (!(data instanceof DataValue)) {
                instructions[0] = PlatformFault1('data');
                return this.evalCurrentInstruction(runtime);
            }
            instructions[0] = Sequence1(data);
            return this.evalCurrentInstruction(runtime);
        } catch (error) {
            console.error(`[evalData] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
    static evalFault(runtime) {
        const PlatformFault1 = PlatformFault.build, Sequence1 = Sequence.build;
        let scriptState = runtime.top.scriptState, url = runtime.top.scriptUrl, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, fault = instructions[0];
        console.log(`[evalFault] evaluating ${fault}`);
        try {
            if (!parentInstruction) {
                runtime.pop();
                if (runtime.isEmpty) {
                    return fault;
                }
                scriptState = runtime.top.scriptState;
                instructions = scriptState.top.instructions;
                instructions[0] = fault;
                return this.evalCurrentInstruction(runtime);
            }
            if (parentInstruction instanceof Try) {
                for (const catchClause of parentInstruction.catchClauses){
                    if (!fault.matches(catchClause.catch)) continue;
                    instructions[0] = Sequence1(catchClause.do);
                    return this.evalCurrentInstruction(runtime);
                }
            }
            scriptState.pop();
            for(let i = 0; i < scriptState.top.instructions.length; i++){
                const instruction = scriptState.top.instructions[i];
                if (instruction !== parentInstruction) continue;
                scriptState.top.instructions[i] = fault;
                break;
            }
            return this.evalCurrentInstruction(runtime);
        } catch (error) {
            console.error(`[evalFault] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
    static evalTry(runtime) {
        const PlatformFault1 = PlatformFault.build, Sequence1 = Sequence.build, scriptState = runtime.top.scriptState, url = runtime.top.scriptUrl, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, trycatch = instructions[0];
        console.log(`[evalTry] evaluating ${trycatch}`);
        try {
            if (scriptState.push(trycatch.statement)) {
                return this.evalCurrentInstruction(runtime);
            }
            instructions[0] = Sequence1(trycatch.statement);
            return this.evalCurrentInstruction(runtime);
        } catch (error) {
            console.error(`[evalTry] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
    static evalReturn(runtime) {
        const PlatformFault1 = PlatformFault.build, Sequence1 = Sequence.build;
        let scriptState = runtime.top.scriptState, url = runtime.top.scriptUrl, parentInstruction = scriptState.top.parent, instructions = scriptState.top.instructions, retrn = instructions[0];
        console.log(`[evalReturn] evaluating ${retrn} (stack size: ${runtime.stack.length})`);
        try {
            if (scriptState.push(retrn.statement)) {
                return this.evalCurrentInstruction(runtime);
            }
            runtime.pop();
            if (runtime.isEmpty) {
                return retrn.statement;
            }
            scriptState = runtime.top.scriptState;
            instructions = scriptState.top.instructions;
            instructions[0] = Sequence1(retrn.statement);
            return this.evalCurrentInstruction(runtime);
        } catch (error) {
            console.error(`[evalReturn] ${error}`);
            instructions[0] = PlatformFault1('script');
            return this.evalCurrentInstruction(runtime);
        }
    }
}
const entitlements = {
    platform: [
        {
            domain: 'qworum.net',
            subdomains: {
                count: 10_000
            }
        },
        {
            domain: 'localhost',
            subdomains: {
                count: 0
            }
        },
        {
            domain: '127.0.0.1',
            subdomains: {
                count: 0
            }
        }
    ]
};
class PlatformEntitlement {
    _domain;
    _subdomainsCount;
    static for(url) {
        if (!(url instanceof URL && [
            'https:',
            'http:'
        ].includes(url.protocol))) {
            console.error(`Not an HTTP(S) URL: ${url}`);
            throw new TypeError(`Not an HTTP(S) URL: ${url}`);
        }
        for (const entitlement of entitlements.platform){
            if (!(url.hostname === entitlement.domain || entitlement.subdomains.count > 0 && url.hostname.endsWith(`.${entitlement.domain}`))) continue;
            return new PlatformEntitlement(entitlement.domain, entitlement.subdomains.count);
        }
        return null;
    }
    constructor(domain, subdomainsCount){
        this._domain = domain;
        this._subdomainsCount = subdomainsCount;
    }
    get domain() {
        return this._domain;
    }
    get subdomainsCount() {
        return this._subdomainsCount;
    }
    toString() {
        return `PlatformEntitlement(domain: ${this.domain}, subdomains: ${this.subdomainsCount})`;
    }
}
class Database {
    static use(op) {
        const dbFactory = indexedDB, dbRequestor = dbFactory.open('Qworum', 1);
        dbRequestor.onupgradeneeded = function(event) {
            console.info(`[Database] upgrading from v${event.oldVersion} to v${event.newVersion}`);
            const db = dbRequestor.result, _runtimesStore = db.createObjectStore('runtimes', {
                keyPath: "tabId",
                autoIncrement: false
            });
        };
        dbRequestor.onsuccess = function(_event) {
            console.info(`[Database] connected`);
            const db = dbRequestor.result;
            try {
                if (op) op(db);
            } catch (error) {
                console.error(`[Database] error during operation: ${error}`);
            } finally{
                db.close();
                console.info(`[Database] disconnected`);
            }
        };
    }
}
class Cache {
    static _tabStates = [];
    static init() {
        Cache._tabStates = [];
    }
    static setTabState(tabState) {
        const tabStateInCache = Cache._tabStates.find((tabStateInCache)=>tabStateInCache.tabId === tabState.tabId);
        if (tabStateInCache) {
            tabStateInCache.runtime = tabState.runtime;
            return;
        }
        Cache._tabStates.push(tabState);
    }
    static unsetTabState(tabId) {
        for(let i = 0; i < Cache._tabStates.length; i++){
            const tabState = Cache._tabStates[i];
            if (tabState.tabId !== tabId) continue;
            Cache._tabStates.splice(i, 1);
            return true;
        }
        return false;
    }
    static getTabState(tabId) {
        for(let i = 0; i < Cache._tabStates.length; i++){
            const tabState = Cache._tabStates[i];
            if (tabState.tabId !== tabId) continue;
            return tabState;
        }
        return null;
    }
    static get count() {
        return Cache._tabStates.length;
    }
}
class CachedDatabase {
    static init() {
        Cache.init();
        return new Promise((resolve, reject)=>{
            Database.use((db)=>{
                const transactedStores = [
                    'runtimes'
                ], transaction = db.transaction(transactedStores, "readwrite"), runtimesStore = transaction.objectStore('runtimes');
                transaction.oncomplete = (_event)=>{
                    console.info(`[Database Cache] ... reading tab states was successful.`);
                    resolve(true);
                };
                transaction.onerror = (_event)=>{
                    console.info(`[Database Cache] ... error while reading tab states.`);
                    reject(new Error(`error while reading tab states`));
                };
                const runtimesStoreRequest = runtimesStore.getAll();
                runtimesStoreRequest.onsuccess = function(_event) {
                    console.info(`[Database Cache] reading all tab states ...`);
                    const tabStates = runtimesStoreRequest.result.map((doc)=>({
                            tabId: doc.tabId,
                            runtime: QworumRuntime.readIndexedDbObject(doc.runtime)
                        }));
                    console.info(`[Database Cache] ... found ${tabStates.length} tab states`);
                    for (const tabState of tabStates){
                        Cache.setTabState(tabState);
                    }
                    console.info(`[Database Cache] tab states: ${JSON.stringify(Cache._tabStates)}`);
                };
            });
        });
    }
    static get tabsCount() {
        return Cache.count;
    }
    static setTabState(tabState) {
        Cache.setTabState(tabState);
        return new Promise((resolve, reject)=>{
            Database.use((db)=>{
                console.info(`[CachedDatabase] adding tab state ...`);
                const transactedStores = [
                    'runtimes'
                ], transaction = db.transaction(transactedStores, "readwrite"), runtimesStore = transaction.objectStore('runtimes');
                transaction.oncomplete = (_event)=>{
                    console.info(`[Database Cache] ... setting tab state was successful.`);
                    resolve(true);
                };
                transaction.onerror = (_event)=>{
                    console.info(`[Database Cache] ... error while setting tab state.`);
                    reject(new Error(`Error while setting tab state for tab id ${tabState.tabId}`));
                };
                runtimesStore.put({
                    tabId: tabState.tabId,
                    runtime: tabState.runtime.toIndexedDbObject()
                });
            });
        });
    }
    static unsetTabState(tabId) {
        console.info(`[CachedDatabase] removing tab state ...`);
        return new Promise((resolve, reject)=>{
            Database.use((db)=>{
                console.info(`[CachedDatabase] adding tab state ...`);
                const transactedStores = [
                    'runtimes'
                ], transaction = db.transaction(transactedStores, "readwrite"), runtimesStore = transaction.objectStore('runtimes');
                transaction.oncomplete = (_event)=>{
                    console.info(`[Database Cache] ... setting tab state was successful.`);
                    resolve(Cache.unsetTabState(tabId));
                };
                transaction.onerror = (_event)=>{
                    console.info(`[Database Cache] ... error while setting tab state.`);
                    reject(new Error(`Error while deleting tab state for tab id ${tabId}`));
                };
                runtimesStore.delete(tabId);
            });
        });
    }
    static getTabState(tabId) {
        const tabState = Cache.getTabState(tabId);
        if (tabState) return Promise.resolve(tabState);
        return Promise.reject(new Error(`State not found for tab id: ${tabId}`));
    }
}
const API_VERSION = '1.0';
var APIClientType;
(function(APIClientType) {
    APIClientType["WebPage"] = 'web page';
    APIClientType["ContentScript"] = 'content script';
    APIClientType["ServiceWorker"] = 'service worker';
})(APIClientType || (APIClientType = {}));
class API {
    static endpoints = {
        availabilityChecker: 'Check Qworum availability',
        navigationLogger: 'Log page navigation',
        scriptEvaluator: 'Evaluate script',
        dataSetter: 'Set data',
        dataGetter: 'Get data',
        tabCloser: 'Close tab'
    };
    static statuses = {
        ok: {
            code: 200,
            message: "OK"
        },
        badRequest: {
            code: 400,
            message: "Bad request"
        },
        notFound: {
            code: 404,
            message: "Not found"
        },
        notImplemented: {
            code: 501,
            message: "Endpoint not implemented"
        },
        apiVersionNotSupported: {
            code: 505,
            message: "API version not supported"
        },
        serverError: {
            code: 500,
            message: "Server error"
        }
    };
    static _isInitialised = false;
    static _endpointHandlers = {};
    static async init() {
        if (API._isInitialised) {
            console.info(`[API init] already initialised, not initialising`);
            return Promise.resolve(false);
        }
        console.info(`[API init] initialising`);
        API._endpointHandlers[API.endpoints.tabCloser] = API._closeTab;
        API._endpointHandlers[API.endpoints.availabilityChecker] = API._checkAvailability;
        API._endpointHandlers[API.endpoints.navigationLogger] = API._logNavigation;
        API._endpointHandlers[API.endpoints.scriptEvaluator] = API._evalScript;
        API._endpointHandlers[API.endpoints.dataSetter] = API._setData;
        API._endpointHandlers[API.endpoints.dataGetter] = API._getData;
        try {
            await CachedDatabase.init();
        } catch (error) {
            console.error(`[API init] CachedDatabase.init() threw an error:`, error);
            return Promise.reject(error);
        }
        API._isInitialised = true;
        return Promise.resolve(true);
    }
    static async handleRequest(request, sender) {
        let inSession = await API._isInSession(sender);
        console.debug(`[API handleRequest] request:`, request);
        try {
            if (!API._requestFormatIsValid(request)) {
                console.debug(`[API handleRequest] bad request format`);
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.badRequest,
                    inSession,
                    body: {}
                });
            }
            if (request.apiVersion !== API_VERSION) {
                console.debug(`[API handleRequest] API version error`);
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.apiVersionNotSupported,
                    inSession,
                    body: {
                        message: `API version not supported: ${request.apiVersion}`
                    }
                });
            }
            const endpoint = API._endpointHandlers[request.endpoint];
            if (endpoint) {
                const response = await endpoint(request, sender);
                inSession = await API._isInSession(sender);
                response.inSession = inSession;
                console.debug(`[API handleRequest] response:`, response);
                return Promise.resolve(response);
            } else {
                console.debug(`[API handleRequest] Endpoint not implemented: ${request.endpoint}`);
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.notImplemented,
                    inSession,
                    body: {
                        message: `Endpoint not implemented: ${request.endpoint}`
                    }
                });
            }
        } catch (error) {
            console.debug(`[API handleRequest] error:`, error);
            inSession = await API._isInSession(sender);
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.serverError,
                inSession,
                body: {
                    message: `${error}`
                }
            });
        }
    }
    static async _evalScript(request, sender) {
        const tabId = sender.tab.id, tabUrl = new URL(sender.tab.url), requestBody = request.body, apiClientType = request.apiClientType;
        if (typeof requestBody.xml !== 'string') {
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.badRequest,
                body: {
                    message: 'body.xml is not a string'
                }
            });
        }
        console.info(`[API] apiClientType: ${apiClientType}`);
        let script, isPlatformScript = apiClientType === APIClientType.ContentScript;
        try {
            script = mod1.Script.fromXml(requestBody.xml);
            if (!(script instanceof mod1.Script)) throw new Error('String is not XML, or XML is not a valid Qworum script');
        } catch (error) {
            console.info(`[API] error while parsing script: ${error.message}`);
            script = mod1.Script.build(mod1.PlatformFault.build('script'));
            isPlatformScript = true;
        }
        let tabState;
        try {
            tabState = await CachedDatabase.getTabState(tabId);
        } catch (_error) {
            console.debug(`[API _evalScript] building runtime for tabUrl: ${tabUrl}`);
            const mainObject = QworumObject.build(tabUrl), runtime = QworumRuntime.build(mainObject);
            if (runtime) {
                tabState = {
                    tabId,
                    runtime
                };
                if (!await CachedDatabase.setTabState(tabState)) {
                    console.debug(`[API _evalScript] 1 Tab state was not created for tab ${tabId}`);
                    return Promise.resolve({
                        apiVersion: API_VERSION,
                        status: API.statuses.serverError,
                        body: {
                            message: `Tab state was not created for tab ${tabId}`
                        }
                    });
                }
            } else {
                console.debug(`[API _evalScript] 2 Tab state was not created for tab ${tabId}`);
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.serverError,
                    body: {
                        message: `Tab state was not created for tab ${tabId}`
                    }
                });
            }
        }
        const responseBody = {};
        try {
            console.info(`[API] isPlatformScript: ${isPlatformScript}`);
            console.info(`[API] evaluating script: ${script}`);
            const evalResult = QworumInterpreter.eval(script, tabUrl, tabState.runtime, isPlatformScript);
            if (evalResult instanceof QworumRequest) {
                responseBody.webRequest = evalResult.toJsonable();
            } else if (evalResult instanceof mod1.Fault) {
                responseBody.fault = evalResult.toIndexedDb();
            } else {
                if (!(evalResult instanceof mod1.DataValue)) throw new Error('Script evaluation yielded unknown value');
                responseBody.data = evalResult.toIndexedDb();
            }
            if (responseBody.webRequest) {
                try {
                    await CachedDatabase.setTabState(tabState);
                } catch (error) {
                    return Promise.resolve({
                        apiVersion: API_VERSION,
                        status: API.statuses.serverError,
                        body: {
                            message: `${error}`
                        }
                    });
                }
            } else {
                try {
                    await CachedDatabase.unsetTabState(tabState.tabId);
                } catch (error) {
                    console.error(`[API] Ignoring tab state deletion error: ${error}`);
                }
            }
        } catch (error) {
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.serverError,
                body: {
                    message: `${error}`
                }
            });
        }
        return Promise.resolve({
            apiVersion: API_VERSION,
            status: API.statuses.ok,
            body: responseBody
        });
    }
    static async _setData(request, sender) {
        const tabId = sender.tab.id, tabUrl = new URL(sender.tab.url), requestBody = request.body;
        if (!API._isStringArray(requestBody.path)) {
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.badRequest,
                body: {
                    message: `Bad data path: ${JSON.stringify(requestBody.path)}`
                }
            });
        }
        let dataValue;
        try {
            dataValue = mod1.Json.fromIndexedDb(requestBody.value);
        } catch (_error) {
            try {
                dataValue = mod1.SemanticData.fromIndexedDb(requestBody.value);
            } catch (_error) {
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.badRequest,
                    body: {
                        message: `Bad data value: ${JSON.stringify(requestBody.value)}`
                    }
                });
            }
        }
        let tabState;
        try {
            tabState = await CachedDatabase.getTabState(tabId);
        } catch (_error) {
            const mainObject = QworumObject.build(tabUrl), runtime = QworumRuntime.build(mainObject);
            if (runtime) {
                tabState = {
                    tabId: tabId,
                    runtime
                };
                if (!await CachedDatabase.setTabState(tabState)) {
                    return Promise.resolve({
                        apiVersion: API_VERSION,
                        status: API.statuses.serverError,
                        body: {
                            message: `Tab state was not created for tab ${tabId}`
                        }
                    });
                }
            } else {
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.serverError,
                    body: {
                        message: `Tab state was not created for tab ${tabId}`
                    }
                });
            }
        }
        try {
            if (tabState.runtime.setData(requestBody.path, dataValue)) {
                try {
                    await CachedDatabase.setTabState(tabState);
                } catch (error) {
                    return Promise.resolve({
                        apiVersion: API_VERSION,
                        status: API.statuses.serverError,
                        body: {
                            message: `${error}`
                        }
                    });
                }
            } else {
                throw new Error(`Data was not set. Is path correct?`);
            }
        } catch (error) {
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.badRequest,
                body: {
                    message: `${error}`
                }
            });
        }
        return Promise.resolve({
            apiVersion: API_VERSION,
            status: API.statuses.ok,
            body: {}
        });
    }
    static async _getData(request, sender) {
        const tabId = sender.tab.id, requestBody = request.body;
        if (!API._isStringArray(requestBody.path)) {
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.badRequest,
                body: {
                    message: 'Bad data path'
                }
            });
        }
        try {
            const tabState = await CachedDatabase.getTabState(tabId), dataValue = tabState.runtime.getData(requestBody.path);
            if (!(dataValue instanceof mod1.DataValue)) {
                return Promise.resolve({
                    apiVersion: API_VERSION,
                    status: API.statuses.notFound,
                    body: {
                        message: `Data not found: ${JSON.stringify(requestBody.path)}`
                    }
                });
            }
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.ok,
                body: {
                    value: dataValue.toIndexedDb()
                }
            });
        } catch (_error) {
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.notFound,
                body: {
                    message: `Data not found, not in a Qworum session`
                }
            });
        }
    }
    static async _closeTab(_request, sender) {
        const tabId = sender.tab.id;
        try {
            await CachedDatabase.unsetTabState(tabId);
        } catch (error) {
            console.error(`[API] Ignoring tab state deletion error while closing tab ${tabId}: ${error}`);
        }
        try {
            console.info(`[API] closing the tab ${tabId}...`);
            await chrome.tabs.remove(tabId);
            console.info(`[API] ... closed the tab ${tabId}`);
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.ok,
                body: {}
            });
        } catch (error) {
            console.info(`[API] ... error while closing the tab ${tabId}: ${error}`);
            return Promise.resolve({
                apiVersion: API_VERSION,
                status: API.statuses.serverError,
                body: {
                    message: `${error}`
                }
            });
        }
    }
    static _checkAvailability(_request, _sender) {
        return Promise.resolve({
            apiVersion: API_VERSION,
            status: API.statuses.ok,
            body: {}
        });
    }
    static async _logNavigation(request, sender) {
        console.info(`_logNavigation 1`);
        const Script = mod1.Script.build, PlatformFault = mod1.PlatformFault.build, tabId = sender.tab.id, tabUrl = new URL(`${sender.tab.url}`), requestBody = request.body;
        console.info(`_logNavigation 2`);
        const body = {};
        try {
            const tabState = await CachedDatabase.getTabState(tabId), originOfCurrentService = tabState.runtime.top.owner.origin;
            if (Math.sin(0) == 4.0) {
                await CachedDatabase.unsetTabState(tabId);
                body.fault = PlatformFault('service').toIndexedDb();
            } else if (!tabUrl.toString().startsWith(`${originOfCurrentService}`)) {
                const evalResult = QworumInterpreter.eval(Script(PlatformFault('service')), tabUrl, tabState.runtime, true);
                if (evalResult instanceof QworumRequest) {
                    body.webRequest = evalResult.toJsonable();
                } else if (evalResult instanceof mod1.Fault) {
                    body.fault = evalResult.toIndexedDb();
                } else {
                    body.data = evalResult.toIndexedDb();
                }
            }
        } catch (_error) {}
        console.info(`_logNavigation body: ${JSON.stringify(body)}`);
        return Promise.resolve({
            apiVersion: API_VERSION,
            status: API.statuses.ok,
            body
        });
    }
    static async _isInSession(sender) {
        try {
            await CachedDatabase.getTabState(sender.tab.id);
            return Promise.resolve(true);
        } catch (_error) {
            return Promise.resolve(false);
        }
    }
    static _requestFormatIsValid(request) {
        try {
            if (!(typeof request.apiVersion === "string" && typeof request.endpoint === "string" && typeof request.body === 'object' && !(request.body instanceof Array))) return false;
        } catch (_error) {
            return false;
        }
        return true;
    }
    static _isStringArray(value) {
        return value instanceof Array && value.reduce((total, current)=>total && typeof current == 'string', true);
    }
}
class UI {
    static setActive(tabId) {
        const details = {
            path: '/assets/images/icons/Qworum logo - alpha - 128px.png',
            tabId
        };
        chrome.action.setIcon(details);
        console.info(`[UI] toolbar icon set to active for tab "${tabId}"`);
    }
    static setInSession(tabId) {
        const details = {
            path: '/assets/images/icons/in-session/Qworum logo - alpha - in-session - 128px.png',
            tabId
        };
        chrome.action.setIcon(details);
        console.info(`[UI] Showing the "in session" badge on the toolbar icon for tab "${tabId}"`);
    }
}
export { QworumObject as QworumObject, QworumRuntime as QworumRuntime, QworumRequest as QworumRequest, QworumInterpreter as QworumInterpreter, mod1 as message, PlatformEntitlement as PlatformEntitlement, CachedDatabase as CachedDatabase, API as API, API_VERSION as API_VERSION, APIClientType as APIClientType, UI as UI };

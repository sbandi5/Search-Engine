// tokenizer.js
class Tokenizer {
    constructor() {
        // Constants
        this.cBlank = ' ';
        this.cCR = '\r';
        this.cLF = '\n';
        this.cTab = '\t';

        this.endHTMLComment = '-->';
        this.endScript = 'SCRIPT>';
        this.startH1 = '<H1';
        this.endH1 = '</H1>';
        this.startMETA = '<META';
        this.endAngleBracket = '>';
        this.startAnchor = '<A';
        this.endAnchor = '</A>';

        this.token = '';
        this.ch = this.cBlank;
        this.maxLen = 1000;
    }

    isWhiteSpace(ch) {
        return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
    }

    delimiter(c) {
        return (this.isWhiteSpace(c) || c === '>' || c === null);
    }

    appendCharToString(ch) {
        this.token += ch.toUpperCase();
    }

    getToken(content) {
        while (this.delimiter(this.ch) && this.ch !== null) {
            this.ch = content.shift();
        }

        if ((this.ch === '"' || this.ch === "'") && this.token.includes('<')) {
            let c = this.ch;
            do {
                this.appendCharToString(this.ch);
                this.ch = content.shift();
                if (this.ch === null) return;
            } while (this.ch !== c);
            this.appendCharToString(this.ch);
            this.ch = content.shift();
            return;
        }

        while (!this.delimiter(this.ch) && this.ch !== null) {
            this.appendCharToString(this.ch);
            this.ch = content.shift();
        }
    }

    processContent(content) {
        content = content.split(''); // Convert the string content into a character array
        while (content.length > 0) {
            this.getToken(content);
            if (this.token.length === 0) continue;

            console.log(this.token);

            if (this.token.startsWith('<!--')) {
                console.log("IN COMMENT TAG");
                do {
                    this.getToken(content);
                } while (!this.token.endsWith(this.endHTMLComment) && this.token.length !== 0);
                console.log("OUT OF COMMENT TAG");
            } else if (this.token.includes('<SCRIPT')) {
                console.log("IN SCRIPT TAG");
                do {
                    this.getToken(content);
                } while (!this.token.endsWith(this.endScript) && this.token.length !== 0);
                console.log("OUT OF SCRIPT TAG");
            } else if (this.token.includes(this.startH1)) {
                console.log("IN H1 TAG:");
                do {
                    console.log(this.token);
                    this.getToken(content);
                } while (!this.token.endsWith(this.endH1));
                console.log("OUT OF H1 TAG " + this.token);
            } else {
                this.getToken(content);
            }
        }
    }
}

// Export the class to be used in other files
module.exports = Tokenizer;

class Tokenizer {
  constructor() {
    this.cBlank = ' ';
    this.cCR = '\r';
    this.cLF = '\n';
    this.cTab = '\t';
    this.maxLen = 200;
    this.token = '';
    this.ch = this.cBlank;
    this.openAngle = 0;

    // Define HTML-like delimiters and tags
    this.endHTMLComment = "-->";
    this.endScript = "SCRIPT>";
    this.startH1 = "<H1";
    this.endH1 = "</H1>";
    this.startMETA = "<META";
    this.endAngleBracket = ">";
    this.startAnchor = "<A";
    this.endAnchor = "</A>";
  }

  isWhiteSpace(ch) {
    return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
  }

  delimiter(ch) {
    return (this.isWhiteSpace(ch) || ch === this.endAngleBracket || ch === null);
  }

  appendCharToString(ch) {
    if (this.token.length === this.maxLen - 1) {
      this.maxLen *= 2;
    }
    this.token += ch;
  }

  // Helper function to check if we're inside a tag
  isInsideTag() {
    return this.openAngle > 0;
  }

  // Main function to read and process the input while counting occurrences of a keyword and extracting description
  processInput(input, keyword) {
    let tokens = [];
    let description = '';
    let i = 0;
    let keywordCount = 0;
    let insideTag = false;
    let ignoreContent = false;
    let currentTag = '';

    while (i < input.length) {
      this.ch = input[i];

      // Track if we are inside a tag
      if (this.ch === '<') {
        insideTag = true;
        currentTag = '';
        ignoreContent = false;
      } else if (this.ch === '>') {
        insideTag = false;
        // Check for specific tags to ignore their content (like <script>)
        if (currentTag.toLowerCase().includes('script') || currentTag.toLowerCase().includes('style')) {
          ignoreContent = true;
        }
      } else if (insideTag) {
        currentTag += this.ch;
      } else if (!ignoreContent) {
        // If we're not inside a tag and not ignoring content, process character
        if (!this.delimiter(this.ch)) {
          this.appendCharToString(this.ch);
          // Collect description up to 200 characters, ignoring tags
          if (description.length < 200) {
            description += this.ch;
          }
        } else {
          if (this.token.length > 0) {
            // Store and reset the token
            tokens.push(this.token);

            // Count keyword occurrences (case-insensitive)
            if (this.token.toLowerCase() === keyword.toLowerCase()) {
              keywordCount++;
            }
            this.token = ''; // Reset token
          }
        }
      }
      i++;
    }

    // Push any last remaining token
    if (this.token.length > 0) {
      tokens.push(this.token);

      // Count keyword occurrences for the last token
      if (this.token.toLowerCase() === keyword.toLowerCase()) {
        keywordCount++;
      }
    }

    // Return extracted description and keyword count
    return { description, keywordCount };
  }
}

module.exports = Tokenizer;

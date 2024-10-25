// class Tokenizer {
//     constructor() {
//       this.cBlank = ' ';
//       this.cCR = '\r';
//       this.cLF = '\n';
//       this.cTab = '\t';
//       this.maxLen = 1000;
//       this.token = '';
//       this.ch = this.cBlank;
//       this.openAngle = 0;
  
//       // Define HTML-like delimiters and tags
//       this.endHTMLComment = "-->";
//       this.endScript = "SCRIPT>";
//       this.startH1 = "<H1";
//       this.endH1 = "</H1>";
//       this.startMETA = "<META";
//       this.endAngleBracket = ">";
//       this.startAnchor = "<A";
//       this.endAnchor = "</A>";
//     }
  
//     isWhiteSpace(ch) {
//       return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
//     }
  
//     delimiter(ch) {
//       return (this.isWhiteSpace(ch) || ch === this.endAngleBracket || ch === null);
//     }
  
//     appendCharToString(ch) {
//       if (this.token.length === this.maxLen - 1) {
//         this.maxLen *= 2;
//       }
//       this.token += ch;
//     }
  
//     // Main function to read and process the input while counting occurrences of a keyword
//     processInput(input, keyword) {
//       let tokens = [];
//       let i = 0;
//       let keywordCount = 0;
      
//       while (i < input.length) {
//         this.ch = input[i];
  
//         if (this.delimiter(this.ch)) {
//           if (this.token.length > 0) {
//             tokens.push(this.token);
            
//             // Count keyword occurrences (case-insensitive)
//             if (this.token.toLowerCase() === keyword.toLowerCase()) {
//               keywordCount++;
//             }
  
//             this.token = ''; // Reset token
//           }
//         } else {
//           this.appendCharToString(this.ch);
//         }
//         i++;
//       }
  
//       // Push any last remaining token
//       if (this.token.length > 0) {
//         tokens.push(this.token);
        
//         // Count keyword occurrences for the last token
//         if (this.token.toLowerCase() === keyword.toLowerCase()) {
//           keywordCount++;
//         }
//       }
  
//       return { tokens, keywordCount };
//     }
//   }


class Tokenizer {
  constructor() {
    this.cBlank = ' ';
    this.cCR = '\r';
    this.cLF = '\n';
    this.cTab = '\t';
    this.maxLen = 1000;
    this.token = '';
    this.ch = this.cBlank;
    this.inTag = false; // Track if currently inside an HTML tag
  }

  isWhiteSpace(ch) {
    return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
  }

  delimiter(ch) {
    return (this.isWhiteSpace(ch) || ch === null);
  }

  appendCharToString(ch) {
    if (this.token.length === this.maxLen - 1) {
      this.maxLen *= 2;
    }
    this.token += ch;
  }

  // Main function to read and process the input while counting occurrences of a keyword
  processInput(input, keyword) {
    let tokens = [];
    let i = 0;
    let keywordCount = 0;
    this.token = ''; // Reset the token

    while (i < input.length) {
      this.ch = input[i];

      // Check if we're entering or exiting an HTML tag
      if (this.ch === '<') {
        this.inTag = true;
      } else if (this.ch === '>') {
        this.inTag = false;
        this.token = ''; // Reset token after finishing a tag
        i++;
        continue;
      }

      // Skip processing characters inside HTML tags
      if (!this.inTag) {
        if (this.delimiter(this.ch)) {
          if (this.token.length > 0) {
            tokens.push(this.token);

            // Count keyword occurrences (case-insensitive)
            if (this.token.toLowerCase() === keyword.toLowerCase()) {
              keywordCount++;
            }

            this.token = ''; // Reset token
          }
        } else {
          this.appendCharToString(this.ch);
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

    return { tokens, keywordCount };
  }
}

module.exports = Tokenizer;  
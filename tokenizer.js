const database = require('./Database');
const databaseconnection = database.getInstance();

class Tokenizer {
  constructor() {
    this.cBlank = ' ';
    this.cCR = '\r';
    this.cLF = '\n';
    this.cTab = '\t';
    this.k = 5; // the maximum number of keywords length in each URL
    this.n = 250; // Maximum number of URLs to process
    this.token = '';
    this.ch = this.cBlank;
    this.inTag = false;
    this.currentTag = '';
    this.baseURL = ''; // Store the base URL for converting relative links to absolute
    this.inScriptOrComment = false;
    this.description = '';
  }

  isWhiteSpace(ch) {
    return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
  }

  appendCharToString(ch) {
    this.token += ch;
  }

  toAbsoluteURL(base, relative) {
    try {
      const absoluteURL = new URL(relative, base).href;
      return absoluteURL.startsWith('http') ? absoluteURL.split('#')[0] : null;
    } catch (e) {
      return null;
    }
  }

  countKeywordOccurrences(inputData, keyword) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi'); // Match the keyword as a whole word, case-insensitive
    const matches = inputData.match(regex);
    return matches ? matches.length : 0;
  }

  extractDescription(input) {
    let description = '';
    let regex = /<title>(.*?)<\/title>/i;
    let match = regex.exec(input);
    if (match) {
      description += match[1]; // Get content of <title> tag
    }

    // Extract content from h1-h6, p, and span tags
    let tagRegex = /<(h[1-6]|p|span)[^>]*>(.*?)<\/\1>/gi;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(input)) !== null) {
      description += ' ' + tagMatch[2]; // Append content inside each matching tag
    }

    // Limit description length to 200 characters
    description = description.trim().substring(0, 200);
    this.description = description; // Store it in the instance variable

    return this.description;
  }

  async processInput(input, baseURL) {
    let tokens = [];
    let i = 0;
    this.baseURL = baseURL;
    let keywords = [];
    let keywordSet = new Set();

    // Extract description once at the start
    const description = this.extractDescription(input);


    while (i < input.length) {
      this.ch = input[i];

      // Check for comment or script start
      if (input.slice(i, i + 4) === '<!--') {
        this.inScriptOrComment = true;
        i += 3;
        continue;
      }
      if (input.slice(i, i + 7).toLowerCase() === '<script') {
        this.inScriptOrComment = true;
      }

      // Check for end of comment or script
      if (this.inScriptOrComment) {
        if (input.slice(i, i + 3) === '-->' || input.slice(i, i + 9).toLowerCase() === '</script>') {
          this.inScriptOrComment = false;
          i += input.slice(i, i + 3) === '-->' ? 2 : 8;
        }
        i++;
        continue;
      }

      if (this.ch === '<') {
        this.inTag = true;
        this.currentTag = '';
        this.token = '';
      }

      if (this.inTag) {
        this.currentTag += this.ch;
        if (this.ch === '>') {
          this.inTag = false;

          // Process anchor tag for URLs
          const anchorMatch = this.currentTag.match(/<a[^>]*href="([^"]*)"/i);
          if (anchorMatch) {
            const absoluteLink = this.toAbsoluteURL(this.baseURL, anchorMatch[1]);
            if (absoluteLink && await databaseconnection.checkpos()< this.n) {
              try {
                await databaseconnection.updateRobot(absoluteLink);
              } catch (err) {
                console.error(`Failed to update robotUrl table with URL: ${absoluteLink}`, err);
              }
            }
          }

          this.currentTag = '';
        }
      } else {
        if (!this.isWhiteSpace(this.ch)) {
          this.appendCharToString(this.ch);
        }

        if (this.token.length > 0 && this.isWhiteSpace(this.ch)) {
          tokens.push(this.token);

          const word = this.token.toLowerCase().trim();
          if (word.length > 3 && word.length < 30 && keywords.length < this.k && !keywordSet.has(word)) {
            keywords.push(word);
            keywordSet.add(word);
          }
          this.token = '';
        }
      }
      i++;
    }

    if (this.token.length > 0) {
      tokens.push(this.token);
    }

    // Limit final keywords to this.k
    keywords = keywords.slice(0, this.k);
    const keywordsString = keywords.join(' ');

    return {
      description,
      keywordsString
    };
  }
}

module.exports = Tokenizer;

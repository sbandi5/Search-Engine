const database = require('./Database');
const databaseconnection = database.getInstance();

class Tokenizer {
  constructor() {
    this.cBlank = ' ';
    this.cCR = '\r';
    this.cLF = '\n';
    this.cTab = '\t';
    this.maxLen = 200; // Maximum description length in each url
    this.k = 5; //the maximum number of keywords length in each url
    this.n = 500; // Maximum number of URLs to process
    this.token = '';
    this.description = '';
    this.ch = this.cBlank;
    this.inTag = false;
    this.currentTag = '';
    this.baseURL = ''; // Store the base URL for converting relative links to absolute
    this.inScriptOrComment = false;
  }

  isWhiteSpace(ch) {
    return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
  }

  appendCharToString(ch) {
    if (this.token.length === this.maxLen - 1) {
      this.maxLen *= 2;
    }
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

  async processInput(input, keyword, baseURL) {
    let tokens = [];
    let keywordCount = 0;
    let i = 0;
    this.baseURL = baseURL;
    let descriptionLength = 0;
    let keywords = [];
    let keywordSet = new Set();
    this.description = '';

    let posChecker;
    try {
      posChecker = await databaseconnection.checkpos();
    } catch (err) {
      console.error('Error getting position count:', err);
      return;
    }

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

        if (this.token.length > 0 && this.token.toLowerCase() === keyword.toLowerCase()) {
          keywordCount++;
        }
        this.token = '';
      }

      if (this.inTag) {
        this.currentTag += this.ch;
        if (this.ch === '>') {
          this.inTag = false;

          const anchorMatch = this.currentTag.match(/<a[^>]*href="([^"]*)"/i);
          if (anchorMatch) {
            const absoluteLink = this.toAbsoluteURL(this.baseURL, anchorMatch[1]);
            if (absoluteLink && posChecker < this.n) {
              try {
                await databaseconnection.updateRobot(absoluteLink);
              } catch (err) {
                console.error(`Failed to update robotUrl table with URL: ${absoluteLink}`, err);
              }
            }
          }

          const isDescriptionTag = this.currentTag.match(/<(title|h\d|p|span)[^>]*>/i);
          if (isDescriptionTag && descriptionLength < 200) {
            i++;
            let tagContent = '';
            while (i < input.length && input[i] !== '<' && descriptionLength < 200) {
              tagContent += input[i];
              this.description += input[i];
              descriptionLength++;
              i++;
            }
            i--;

            const tagWords = tagContent.split(/\s+/);
            for (let word of tagWords) {
              word = word.trim().toLowerCase();
              if (word.length > 3 && !keywordSet.has(word)) {
                keywords.push(word);
                keywordSet.add(word);
                if (keywords.length >= this.k) break;
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
          if (this.token.toLowerCase() === keyword.toLowerCase()) {
            keywordCount++;
          }

          const word = this.token.toLowerCase().trim();
          if (word.length > 3 && keywords.length < this.k && !keywordSet.has(word)) {
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
      if (this.token.toLowerCase() === keyword.toLowerCase()) {
        keywordCount++;
      }
    }

    if (this.description.length > this.maxLen) {
      this.description = this.description.substring(0, this.maxLen).trim();
    }
    keywords = keywords.slice(0, this.k);
    console.log('The value of keyword before passing: ' + keywordCount);
    return {
      description: this.description.trim(),
      keywordCount,
      keywordsString: keywords.join(' ')
    };
  }
}

module.exports = Tokenizer;

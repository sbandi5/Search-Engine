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
      // Return the absolute URL only if the relative URL is successfully converted
      return absoluteURL.startsWith('http') ? absoluteURL.split('#')[0] : null;
    } catch (e) {
      return null; // If URL parsing fails, return null to indicate invalid/relative URL
    }
  }

  // Inside an async function
  async processInput(input, keyword, baseURL) {
    let tokens = [];
    let keywordCount = 0;
    let i = 0;
    this.baseURL = baseURL;
    let descriptionLength = 0;
    let keywords = []; // Store extracted keywords
    let keywordSet = new Set(); // To ensure unique keywords
  
    // Reset the description before processing a new document
    this.description = '';
  
    // Check the position count asynchronously
    let posChecker;
    try {
        posChecker = await databaseconnection.checkpos();
    } catch (err) {
        console.error('Error getting position count:', err);
        return;
    }
  
    // Now, proceed with processing the input
    while (i < input.length) {
        this.ch = input[i];
  
        if (this.ch === '<') {
            this.inTag = true;
            this.currentTag = '';
  
            if (this.token.length > 0 && this.token.toLowerCase() === keyword.toLowerCase()) {
                keywordCount++;
            }
  
            this.token = ''; // Reset token for processing tag contents
        }
  
        if (this.inTag) {
            this.currentTag += this.ch;
            if (this.ch === '>') {
                this.inTag = false;
  
                // Check for anchor tags to extract links
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
  
                // Check if current tag is for description and keywords (title, h1-h6, p, span)
                const isDescriptionTag = this.currentTag.match(/<(title|h\d|p|span)[^>]*>/i);
                if (isDescriptionTag && descriptionLength < 200) {
                    i++;
                    let tagContent = ''; // Collect text inside the tag
                    while (i < input.length && input[i] !== '<' && descriptionLength < 200) {
                        tagContent += input[i];
                        this.description += input[i];
                        descriptionLength++;
                        i++;
                    }
                    i--; // Step back to handle the next iteration correctly
  
                    // Extract keywords from prioritized tags content
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
  
                this.currentTag = ''; // Reset the current tag
            }
        } else {
            // If not inside a tag, continue processing text content
            if (!this.isWhiteSpace(this.ch)) {
                this.appendCharToString(this.ch);
            }
  
            // Check if the token contains the keyword (case-insensitive)
            if (this.token.length > 0 && this.isWhiteSpace(this.ch)) {
                tokens.push(this.token);
                if (this.token.toLowerCase() === keyword.toLowerCase()) {
                    keywordCount++;
                }
  
                // Extract additional keywords from non-prioritized content if needed
                const word = this.token.toLowerCase().trim();
                if (word.length > 3 && keywords.length < this.k && !keywordSet.has(word)) {
                    keywords.push(word);
                    keywordSet.add(word);
                }
  
                this.token = ''; // Reset token
            }
        }
        i++;
    }
  
    // Process any remaining token
    if (this.token.length > 0) {
        tokens.push(this.token);
        if (this.token.toLowerCase() === keyword.toLowerCase()) {
            keywordCount++;
        }
    }
  
    // Truncate the description to maxLen characters if necessary
    if (this.description.length > this.maxLen) {
        this.description = this.description.substring(0, this.maxLen).trim();
    }
    keywords = keywords.slice(0, this.k);
    console.log('The value of keyword before passing: ' + keywordCount);
    return {
        description: this.description.trim(),
        keywordCount,
        keywordsString: keywords.join(' ') // Limit to this.k keywords
    };
  }
  
}

module.exports = Tokenizer;

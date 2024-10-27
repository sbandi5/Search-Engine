class Tokenizer {
  constructor() {
    this.cBlank = ' ';
    this.cCR = '\r';
    this.cLF = '\n';
    this.cTab = '\t';
    this.maxLen = 200;
    this.token = '';
    this.description = '';
    this.ch = this.cBlank;
    this.inTag = false;
    this.currentTag = '';
    this.baseURL = ''; // Store the base URL for converting relative links to absolute
  }

  // Helper function to determine if a character is whitespace
  isWhiteSpace(ch) {
    return (ch === this.cBlank || ch === this.cCR || ch === this.cLF || ch === this.cTab);
  }

  // Helper function to append characters to the token
  appendCharToString(ch) {
    if (this.token.length === this.maxLen - 1) {
      this.maxLen *= 2;
    }
    this.token += ch;
  }

  // Converts a relative link to an absolute link using the base URL
  toAbsoluteURL(base, relative) {
    try {
      return new URL(relative, base).href;
    } catch (e) {
      return relative; // If URL parsing fails, return the relative URL
    }
  }

  // Main function to read and process the input while counting occurrences of a keyword and extracting links and description
  processInput(input, keyword, baseURL) {
    let tokens = [];
    let links = [];
    let keywordCount = 0;
    let i = 0;
    this.baseURL = baseURL;
    let descriptionLength = 0;
    
    // Reset the description before processing a new document
    this.description = ''; 

    while (i < input.length) {
      this.ch = input[i];

      if (this.ch === '<') {
        this.inTag = true;
        this.currentTag = '';

        // Check if the token contains the keyword (case-insensitive)
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
            links.push(absoluteLink);
          }

          // Check if current tag is for description content (title, h1-h6, p, span)
          const isDescriptionTag = this.currentTag.match(/<(title|h\d|p|span)[^>]*>/i);
          if (isDescriptionTag && descriptionLength < 200) {
            // Extract description outside of tags
            i++;
            while (i < input.length && input[i] !== '<' && descriptionLength < 200) {
              this.description += input[i];
              descriptionLength++;
              i++;
            }
            i--; // Step back to handle the next iteration correctly
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

    return {
      description: this.description.trim(),
      keywordCount,
      links
    };
  }
}

module.exports = Tokenizer;

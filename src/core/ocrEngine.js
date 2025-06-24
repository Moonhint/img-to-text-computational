const Tesseract = require('tesseract.js');
const chalk = require('chalk');

class OCREngine {
  constructor(options = {}) {
    this.language = options.language || 'eng';
    this.config = {
      logger: options.verbose ? m => console.log(chalk.blue(`OCR: ${m.status} - ${m.progress}%`)) : () => {},
      ...options.tesseractConfig
    };
  }

  /**
   * Extract text from image with position and confidence data
   * @param {string|Buffer} image - Image path or buffer
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} OCR result with structured text data
   */
  async extractText(image, options = {}) {
    try {
      const result = await Tesseract.recognize(image, this.language, {
        ...this.config,
        ...options
      });

      return this.processOCRResult(result.data);
    } catch (error) {
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Process raw OCR result into structured format
   * @param {Object} data - Raw Tesseract result
   * @returns {Object} Processed OCR data
   */
  processOCRResult(data) {
    return {
      raw_text: data.text.trim(),
      confidence: data.confidence,
      structured_text: this.extractStructuredText(data),
      words: this.extractWords(data.words),
      lines: this.extractLines(data.lines),
      paragraphs: this.extractParagraphs(data.paragraphs),
      blocks: this.extractBlocks(data.blocks)
    };
  }

  /**
   * Extract structured text with semantic meaning
   * @param {Object} data - OCR data
   * @returns {Array} Structured text elements
   */
  extractStructuredText(data) {
    const structured = [];

    // Process each paragraph
    data.paragraphs.forEach((paragraph, index) => {
      if (paragraph.text.trim()) {
        const element = {
          id: `paragraph_${index}`,
          type: this.classifyTextType(paragraph.text),
          text: paragraph.text.trim(),
          position: {
            x: paragraph.bbox.x0,
            y: paragraph.bbox.y0,
            width: paragraph.bbox.x1 - paragraph.bbox.x0,
            height: paragraph.bbox.y1 - paragraph.bbox.y0
          },
          confidence: paragraph.confidence,
          font_info: this.estimateFontInfo(paragraph)
        };

        structured.push(element);
      }
    });

    return structured;
  }

  /**
   * Classify text type based on content and position
   * @param {string} text - Text content
   * @returns {string} Text classification
   */
  classifyTextType(text) {
    const trimmed = text.trim();
    
    // Check for common UI patterns
    if (this.isNavigationText(trimmed)) return 'navigation';
    if (this.isButtonText(trimmed)) return 'button';
    if (this.isHeaderText(trimmed)) return 'header';
    if (this.isLabelText(trimmed)) return 'label';
    if (this.isLinkText(trimmed)) return 'link';
    if (this.isFormText(trimmed)) return 'form';
    
    // Default classifications
    if (trimmed.length < 50) return 'short_text';
    if (trimmed.length > 200) return 'paragraph';
    
    return 'text';
  }

  /**
   * Check if text appears to be navigation
   */
  isNavigationText(text) {
    const navKeywords = ['home', 'about', 'contact', 'services', 'products', 'menu'];
    const hasNavKeywords = navKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    // Check for pipe-separated navigation
    const hasPipeSeparation = text.includes('|');
    
    // Check for multiple short words (typical navigation pattern)
    const words = text.split(/\s+/);
    const hasMultipleShortWords = words.length >= 3 && words.every(word => word.length < 15);
    
    return hasNavKeywords || hasPipeSeparation || hasMultipleShortWords;
  }

  /**
   * Check if text appears to be a button
   */
  isButtonText(text) {
    const buttonKeywords = [
      'click', 'submit', 'send', 'buy', 'purchase', 'download', 'login', 'signup',
      'register', 'subscribe', 'learn more', 'get started', 'try now', 'book now'
    ];
    
    const lowerText = text.toLowerCase();
    return buttonKeywords.some(keyword => lowerText.includes(keyword)) || 
           (text.length < 30 && /^[A-Z]/.test(text));
  }

  /**
   * Check if text appears to be a header
   */
  isHeaderText(text) {
    // Headers are typically short, capitalized, and may contain key phrases
    const headerKeywords = ['welcome', 'introduction', 'overview', 'about us', 'our services'];
    const lowerText = text.toLowerCase();
    
    const hasHeaderKeywords = headerKeywords.some(keyword => lowerText.includes(keyword));
    const isShortAndCapitalized = text.length < 100 && /^[A-Z]/.test(text);
    const isAllCaps = text === text.toUpperCase() && text.length > 5;
    
    return hasHeaderKeywords || isShortAndCapitalized || isAllCaps;
  }

  /**
   * Check if text appears to be a label
   */
  isLabelText(text) {
    const labelPatterns = [
      /.*:$/,  // Ends with colon
      /^(name|email|phone|address|city|state|zip|country)$/i,
      /^\*.*$/,  // Starts with asterisk (required field)
    ];
    
    return labelPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Check if text appears to be a link
   */
  isLinkText(text) {
    const urlPattern = /https?:\/\/[^\s]+/;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    
    return urlPattern.test(text) || emailPattern.test(text);
  }

  /**
   * Check if text appears to be form-related
   */
  isFormText(text) {
    const formKeywords = [
      'enter', 'input', 'select', 'choose', 'required', 'optional',
      'placeholder', 'search', 'filter'
    ];
    
    const lowerText = text.toLowerCase();
    return formKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Estimate font information from OCR data
   * @param {Object} paragraph - Paragraph data
   * @returns {Object} Font information
   */
  estimateFontInfo(paragraph) {
    const height = paragraph.bbox.y1 - paragraph.bbox.y0;
    
    // Estimate font size based on text height
    let fontSize = Math.round(height * 0.75); // Approximate conversion
    
    // Classify font size
    let sizeCategory = 'normal';
    if (fontSize >= 24) sizeCategory = 'large';
    else if (fontSize >= 18) sizeCategory = 'medium';
    else if (fontSize <= 12) sizeCategory = 'small';
    
    return {
      estimated_size: fontSize,
      size_category: sizeCategory,
      height: height
    };
  }

  /**
   * Extract word-level data
   */
  extractWords(words) {
    return words
      .filter(word => word.text.trim() && word.confidence > 30)
      .map(word => ({
        text: word.text,
        confidence: word.confidence,
        position: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        }
      }));
  }

  /**
   * Extract line-level data
   */
  extractLines(lines) {
    return lines
      .filter(line => line.text.trim())
      .map(line => ({
        text: line.text.trim(),
        confidence: line.confidence,
        position: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0
        }
      }));
  }

  /**
   * Extract paragraph-level data
   */
  extractParagraphs(paragraphs) {
    return paragraphs
      .filter(para => para.text.trim())
      .map(para => ({
        text: para.text.trim(),
        confidence: para.confidence,
        position: {
          x: para.bbox.x0,
          y: para.bbox.y0,
          width: para.bbox.x1 - para.bbox.x0,
          height: para.bbox.y1 - para.bbox.y0
        }
      }));
  }

  /**
   * Extract block-level data
   */
  extractBlocks(blocks) {
    return blocks
      .filter(block => block.text.trim())
      .map(block => ({
        text: block.text.trim(),
        confidence: block.confidence,
        position: {
          x: block.bbox.x0,
          y: block.bbox.y0,
          width: block.bbox.x1 - block.bbox.x0,
          height: block.bbox.y1 - block.bbox.y0
        }
      }));
  }

  /**
   * Find text overlapping with a given region
   * @param {Object} region - Region with x, y, width, height
   * @param {Array} words - Array of word objects
   * @returns {string} Overlapping text
   */
  findOverlappingText(region, words) {
    const overlapping = words.filter(word => {
      const wordRegion = word.position;
      return this.regionsOverlap(region, wordRegion);
    });

    return overlapping.map(word => word.text).join(' ').trim();
  }

  /**
   * Check if two regions overlap
   */
  regionsOverlap(region1, region2) {
    return !(
      region1.x > region2.x + region2.width ||
      region2.x > region1.x + region1.width ||
      region1.y > region2.y + region2.height ||
      region2.y > region1.y + region1.height
    );
  }
}

module.exports = OCREngine; 
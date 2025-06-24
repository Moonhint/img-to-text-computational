class ComponentClassifier {
  constructor(options = {}) {
    this.options = {
      buttonMinAspectRatio: options.buttonMinAspectRatio || 0.2,
      buttonMaxAspectRatio: options.buttonMaxAspectRatio || 5,
      inputMinAspectRatio: options.inputMinAspectRatio || 2,
      cardMinAspectRatio: options.cardMinAspectRatio || 0.3,
      cardMaxAspectRatio: options.cardMaxAspectRatio || 3,
      ...options
    };

    // Initialize classification rules
    this.rules = this.initializeRules();
  }

  /**
   * Initialize classification rules
   */
  initializeRules() {
    return {
      button: {
        patterns: [
          { type: 'text', keywords: ['click', 'submit', 'send', 'buy', 'download', 'login', 'signup', 'register', 'subscribe', 'learn more', 'get started', 'try now', 'book now', 'add to cart', 'purchase', 'order', 'save', 'cancel', 'delete', 'edit', 'next', 'previous', 'continue'] },
          { type: 'shape', criteria: { rectangular: true, aspectRatio: [0.2, 5] } },
          { type: 'size', criteria: { minWidth: 50, maxWidth: 300, minHeight: 20, maxHeight: 80 } },
          { type: 'position', criteria: { isolated: true } }
        ],
        confidence: 0.8
      },

      input: {
        patterns: [
          { type: 'text', keywords: ['enter', 'input', 'search', 'email', 'password', 'name', 'address', 'phone'] },
          { type: 'shape', criteria: { rectangular: true, aspectRatio: [2, 10] } },
          { type: 'size', criteria: { minWidth: 100, maxWidth: 500, minHeight: 25, maxHeight: 60 } },
          { type: 'visual', criteria: { hasOutline: true } }
        ],
        confidence: 0.7
      },

      navigation: {
        patterns: [
          { type: 'text', keywords: ['home', 'about', 'contact', 'services', 'products', 'menu', 'nav'] },
          { type: 'position', criteria: { topRegion: true, fullWidth: true } },
          { type: 'container', criteria: { hasMultipleElements: true } }
        ],
        confidence: 0.9
      },

      header: {
        patterns: [
          { type: 'position', criteria: { topRegion: true } },
          { type: 'size', criteria: { fullWidth: true, minHeight: 60 } },
          { type: 'text', keywords: ['welcome', 'title', 'brand', 'logo'] }
        ],
        confidence: 0.8
      },

      footer: {
        patterns: [
          { type: 'position', criteria: { bottomRegion: true } },
          { type: 'size', criteria: { fullWidth: true } },
          { type: 'text', keywords: ['copyright', 'terms', 'privacy', 'contact', 'footer'] }
        ],
        confidence: 0.8
      },

      card: {
        patterns: [
          { type: 'shape', criteria: { rectangular: true, aspectRatio: [0.3, 3] } },
          { type: 'size', criteria: { minWidth: 150, minHeight: 100 } },
          { type: 'visual', criteria: { hasOutline: true, standalone: true } }
        ],
        confidence: 0.7
      },

      image: {
        patterns: [
          { type: 'shape', criteria: { rectangular: true } },
          { type: 'size', criteria: { minWidth: 50, minHeight: 50 } },
          { type: 'visual', criteria: { noText: true, hasVisualContent: true } }
        ],
        confidence: 0.6
      },

      text_block: {
        patterns: [
          { type: 'text', criteria: { hasText: true, longText: true } },
          { type: 'shape', criteria: { rectangular: true } },
          { type: 'size', criteria: { minHeight: 40 } }
        ],
        confidence: 0.8
      },

      sidebar: {
        patterns: [
          { type: 'position', criteria: { sideRegion: true } },
          { type: 'size', criteria: { tallAspectRatio: true } },
          { type: 'container', criteria: { hasMultipleElements: true } }
        ],
        confidence: 0.7
      },

      modal: {
        patterns: [
          { type: 'position', criteria: { centered: true, overlapping: true } },
          { type: 'size', criteria: { moderateSize: true } },
          { type: 'visual', criteria: { hasOutline: true, elevated: true } }
        ],
        confidence: 0.6
      }
    };
  }

  /**
   * Classify a visual element
   * @param {Object} visualElement - Visual element with shape and position data
   * @param {string} overlappingText - Text content overlapping with the element
   * @param {Object} analysisResult - Full analysis result for context
   * @returns {Promise<Object>} Classification result
   */
  async classify(visualElement, overlappingText, analysisResult) {
    const classifications = [];

    // Test each component type
    for (const [componentType, rules] of Object.entries(this.rules)) {
      const score = this.calculateComponentScore(
        componentType,
        rules,
        visualElement,
        overlappingText,
        analysisResult
      );

      if (score > 0.3) { // Minimum threshold
        classifications.push({
          type: componentType,
          confidence: score,
          reasoning: this.generateReasoning(componentType, rules, visualElement, overlappingText)
        });
      }
    }

    // Sort by confidence and return the best match
    classifications.sort((a, b) => b.confidence - a.confidence);

    return classifications.length > 0 ? classifications[0] : {
      type: 'unknown',
      confidence: 0.1,
      reasoning: 'No clear pattern match found'
    };
  }

  /**
   * Calculate component score based on rules
   */
  calculateComponentScore(componentType, rules, visualElement, overlappingText, analysisResult) {
    let totalScore = 0;
    let maxScore = 0;

    for (const pattern of rules.patterns) {
      const { score, weight } = this.evaluatePattern(pattern, visualElement, overlappingText, analysisResult);
      totalScore += score * weight;
      maxScore += weight;
    }

    // Apply base confidence
    const normalizedScore = maxScore > 0 ? (totalScore / maxScore) : 0;
    return normalizedScore * rules.confidence;
  }

  /**
   * Evaluate individual pattern
   */
  evaluatePattern(pattern, visualElement, overlappingText, analysisResult) {
    let score = 0;
    let weight = 1;

    switch (pattern.type) {
      case 'text':
        score = this.evaluateTextPattern(pattern, overlappingText);
        weight = 1.2; // Text patterns are highly indicative
        break;

      case 'shape':
        score = this.evaluateShapePattern(pattern, visualElement);
        weight = 1.0;
        break;

      case 'size':
        score = this.evaluateSizePattern(pattern, visualElement);
        weight = 0.8;
        break;

      case 'position':
        score = this.evaluatePositionPattern(pattern, visualElement, analysisResult);
        weight = 1.0;
        break;

      case 'visual':
        score = this.evaluateVisualPattern(pattern, visualElement, overlappingText);
        weight = 0.9;
        break;

      case 'container':
        score = this.evaluateContainerPattern(pattern, visualElement, analysisResult);
        weight = 0.7;
        break;
    }

    return { score, weight };
  }

  /**
   * Evaluate text-based patterns
   */
  evaluateTextPattern(pattern, overlappingText) {
    if (!overlappingText || overlappingText.trim().length === 0) {
      return pattern.criteria?.hasText ? 0 : 0.1;
    }

    const text = overlappingText.toLowerCase();

    // Check for specific keywords
    if (pattern.keywords) {
      const matchingKeywords = pattern.keywords.filter(keyword =>
        text.includes(keyword.toLowerCase())
      );

      if (matchingKeywords.length > 0) {
        return Math.min(1.0, matchingKeywords.length / 3); // Diminishing returns
      }
    }

    // Check for text criteria
    if (pattern.criteria) {
      let score = 0;

      if (pattern.criteria.hasText && text.length > 0) score += 0.5;
      if (pattern.criteria.longText && text.length > 50) score += 0.3;
      if (pattern.criteria.shortText && text.length < 20) score += 0.3;

      return Math.min(score, 1.0);
    }

    return 0;
  }

  /**
   * Evaluate shape-based patterns
   */
  evaluateShapePattern(pattern, visualElement) {
    let score = 0;
    const criteria = pattern.criteria;

    if (criteria.rectangular && visualElement.type === 'rectangle') {
      score += 0.5;
    }

    if (criteria.circular && visualElement.type === 'circle') {
      score += 0.5;
    }

    if (criteria.aspectRatio && visualElement.aspect_ratio) {
      const [minRatio, maxRatio] = criteria.aspectRatio;
      if (visualElement.aspect_ratio >= minRatio && visualElement.aspect_ratio <= maxRatio) {
        score += 0.4;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Evaluate size-based patterns
   */
  evaluateSizePattern(pattern, visualElement) {
    let score = 0;
    const criteria = pattern.criteria;
    const pos = visualElement.position;

    if (criteria.minWidth && pos.width >= criteria.minWidth) score += 0.2;
    if (criteria.maxWidth && pos.width <= criteria.maxWidth) score += 0.2;
    if (criteria.minHeight && pos.height >= criteria.minHeight) score += 0.2;
    if (criteria.maxHeight && pos.height <= criteria.maxHeight) score += 0.2;

    if (criteria.fullWidth && pos.width > 600) score += 0.3; // Assuming full width
    if (criteria.moderateSize && pos.width > 200 && pos.width < 600 && pos.height > 100 && pos.height < 400) score += 0.3;
    if (criteria.tallAspectRatio && visualElement.aspect_ratio && visualElement.aspect_ratio < 0.5) score += 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Evaluate position-based patterns
   */
  evaluatePositionPattern(pattern, visualElement, analysisResult) {
    let score = 0;
    const criteria = pattern.criteria;
    const pos = visualElement.position;
    const imageHeight = analysisResult?.image_metadata?.height || 1000;
    const imageWidth = analysisResult?.image_metadata?.width || 1000;

    if (criteria.topRegion && pos.y < imageHeight * 0.2) score += 0.4;
    if (criteria.bottomRegion && pos.y > imageHeight * 0.8) score += 0.4;
    if (criteria.sideRegion && (pos.x < imageWidth * 0.2 || pos.x > imageWidth * 0.8)) score += 0.4;
    if (criteria.centered && Math.abs(pos.x + pos.width / 2 - imageWidth / 2) < imageWidth * 0.1) score += 0.3;
    if (criteria.fullWidth && pos.width > imageWidth * 0.8) score += 0.4;
    if (criteria.isolated && this.isElementIsolated(visualElement, analysisResult)) score += 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Evaluate visual-based patterns
   */
  evaluateVisualPattern(pattern, visualElement, overlappingText) {
    let score = 0;
    const criteria = pattern.criteria;

    if (criteria.hasOutline && visualElement.type === 'rectangle') score += 0.3;
    if (criteria.noText && (!overlappingText || overlappingText.trim().length === 0)) score += 0.3;
    if (criteria.hasText && overlappingText && overlappingText.trim().length > 0) score += 0.3;
    if (criteria.standalone && visualElement.confidence > 0.7) score += 0.2;
    if (criteria.elevated && visualElement.type === 'rectangle') score += 0.2; // Simplified
    if (criteria.hasVisualContent && visualElement.area > 1000) score += 0.3;

    return Math.min(score, 1.0);
  }

  /**
   * Evaluate container-based patterns
   */
  evaluateContainerPattern(pattern, visualElement, analysisResult) {
    let score = 0;
    const criteria = pattern.criteria;

    if (criteria.hasMultipleElements) {
      // Check if this element contains or is near other elements
      const nearbyElements = this.findNearbyElements(visualElement, analysisResult);
      if (nearbyElements.length >= 2) score += 0.4;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Check if element is isolated from others
   */
  isElementIsolated(element, analysisResult) {
    const allElements = analysisResult?.vision_analysis?.visual_elements || [];
    const minDistance = 50;

    for (const other of allElements) {
      if (other.id === element.id) continue;

      const distance = this.calculateDistance(element.position, other.position);
      if (distance < minDistance) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find elements near the given element
   */
  findNearbyElements(element, analysisResult) {
    const allElements = analysisResult?.vision_analysis?.visual_elements || [];
    const maxDistance = 100;
    const nearby = [];

    for (const other of allElements) {
      if (other.id === element.id) continue;

      const distance = this.calculateDistance(element.position, other.position);
      if (distance < maxDistance) {
        nearby.push(other);
      }
    }

    return nearby;
  }

  /**
   * Calculate distance between two positions
   */
  calculateDistance(pos1, pos2) {
    const centerX1 = pos1.x + pos1.width / 2;
    const centerY1 = pos1.y + pos1.height / 2;
    const centerX2 = pos2.x + pos2.width / 2;
    const centerY2 = pos2.y + pos2.height / 2;

    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  }

  /**
   * Generate reasoning for classification
   */
  generateReasoning(componentType, rules, visualElement, overlappingText) {
    const reasons = [];

    // Check text patterns
    if (overlappingText && overlappingText.trim().length > 0) {
      const textPattern = rules.patterns.find(p => p.type === 'text');
      if (textPattern && textPattern.keywords) {
        const matchingKeywords = textPattern.keywords.filter(keyword =>
          overlappingText.toLowerCase().includes(keyword.toLowerCase())
        );
        if (matchingKeywords.length > 0) {
          reasons.push(`Contains ${componentType}-related text: "${matchingKeywords.join(', ')}"`);
        }
      }
    }

    // Check shape patterns
    if (visualElement.type === 'rectangle') {
      reasons.push('Has rectangular shape');
    }

    // Check size patterns
    const sizePattern = rules.patterns.find(p => p.type === 'size');
    if (sizePattern && sizePattern.criteria) {
      const criteria = sizePattern.criteria;
      if (criteria.minWidth && visualElement.position.width >= criteria.minWidth) {
        reasons.push(`Width meets minimum requirement (${visualElement.position.width}px >= ${criteria.minWidth}px)`);
      }
    }

    // Check aspect ratio
    if (visualElement.aspect_ratio) {
      const shapePattern = rules.patterns.find(p => p.type === 'shape');
      if (shapePattern && shapePattern.criteria && shapePattern.criteria.aspectRatio) {
        const [min, max] = shapePattern.criteria.aspectRatio;
        if (visualElement.aspect_ratio >= min && visualElement.aspect_ratio <= max) {
          reasons.push(`Aspect ratio (${visualElement.aspect_ratio.toFixed(2)}) fits ${componentType} pattern`);
        }
      }
    }

    return reasons.length > 0 ? reasons.join('; ') : `General ${componentType} pattern match`;
  }

  /**
   * Batch classify multiple elements
   */
  async batchClassify(visualElements, textElements, analysisResult) {
    const classifications = [];

    for (const visualElement of visualElements) {
      // Find overlapping text
      const overlappingText = this.findOverlappingText(visualElement, textElements);

      // Classify the element
      const classification = await this.classify(visualElement, overlappingText, analysisResult);

      classifications.push({
        element_id: visualElement.id,
        ...classification
      });
    }

    return classifications;
  }

  /**
   * Find text overlapping with visual element
   */
  findOverlappingText(visualElement, textElements) {
    const overlapping = textElements.filter(textElement => {
      return this.regionsOverlap(visualElement.position, textElement.position);
    });

    return overlapping.map(element => element.text).join(' ').trim();
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

  /**
   * Get classification statistics
   */
  getClassificationStats(classifications) {
    const stats = {
      total_elements: classifications.length,
      by_type: {},
      confidence_distribution: {
        high: 0, // > 0.8
        medium: 0, // 0.5 - 0.8
        low: 0 // < 0.5
      },
      average_confidence: 0
    };

    let totalConfidence = 0;

    for (const classification of classifications) {
      // Count by type
      stats.by_type[classification.type] = (stats.by_type[classification.type] || 0) + 1;

      // Count by confidence level
      if (classification.confidence > 0.8) {
        stats.confidence_distribution.high++;
      } else if (classification.confidence > 0.5) {
        stats.confidence_distribution.medium++;
      } else {
        stats.confidence_distribution.low++;
      }

      totalConfidence += classification.confidence;
    }

    stats.average_confidence = classifications.length > 0 ? totalConfidence / classifications.length : 0;

    return stats;
  }
}

module.exports = ComponentClassifier;
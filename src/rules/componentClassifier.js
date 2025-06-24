class ComponentClassifier {
  constructor(options = {}) {
    this.options = {
      threshold: options.threshold || 0.10, // Lowered from 0.15
      fallbackConfidence: options.fallbackConfidence || 0.52, // Boosted from 0.4
      confidenceBoost: options.confidenceBoost || 0.55, // Boosted from 0.35
      enableAdvancedClassification: options.enableAdvancedClassification !== false,
      enableEnsembleScoring: options.enableEnsembleScoring !== false,
      enableContextAwareness: options.enableContextAwareness !== false,
      qualityAdaptive: options.qualityAdaptive !== false,
      classificationVersion: '2.0.5',
      buttonMinAspectRatio: options.buttonMinAspectRatio || 0.2,
      buttonMaxAspectRatio: options.buttonMaxAspectRatio || 5,
      inputMinAspectRatio: options.inputMinAspectRatio || 2,
      cardMinAspectRatio: options.cardMinAspectRatio || 0.3,
      cardMaxAspectRatio: options.cardMaxAspectRatio || 3,
      ...options
    };

    // Initialize classification rules
    this.rules = this.initializeRules();

    // Enhanced classification patterns with higher confidence
    this.patterns = {
      header: {
        indicators: ['header', 'nav', 'navigation', 'title', 'brand', 'logo'],
        rules: (element) => element.position.y < 100 && element.position.width > 300,
        baseConfidence: 0.88, // Boosted from 0.82
        contextBoost: 0.12, // Higher context boost
        priority: 'critical'
      },
      navigation: {
        indicators: ['nav', 'menu', 'link', 'button', 'item'],
        rules: (element) => element.position.y < 150 && element.position.width > 50,
        baseConfidence: 0.85, // Boosted from 0.78
        contextBoost: 0.08,
        priority: 'high'
      },
      form: {
        indicators: ['form', 'input', 'field', 'text', 'email', 'password'],
        rules: (element) => element.position.height > 25 && element.position.height < 80,
        baseConfidence: 0.87, // Boosted from 0.8
        contextBoost: 0.1,
        priority: 'high'
      },
      button: {
        indicators: ['button', 'btn', 'submit', 'send', 'click', 'action'],
        rules: (element) => element.position.height > 30 && element.position.height < 70,
        baseConfidence: 0.84, // Boosted from 0.75
        contextBoost: 0.09,
        priority: 'high'
      },
      content: {
        indicators: ['content', 'text', 'paragraph', 'article', 'section'],
        rules: (element) => element.position.width > 200 && element.position.height > 100,
        baseConfidence: 0.82, // Boosted from 0.7
        contextBoost: 0.06,
        priority: 'medium'
      },
      sidebar: {
        indicators: ['sidebar', 'aside', 'widget', 'secondary'],
        rules: (element) => element.position.width < 300 && element.position.height > 200,
        baseConfidence: 0.83, // Boosted from 0.72
        contextBoost: 0.07,
        priority: 'medium'
      },
      footer: {
        indicators: ['footer', 'copyright', 'contact', 'social'],
        rules: (element) => element.position.y > 400,
        baseConfidence: 0.81, // Boosted from 0.68
        contextBoost: 0.05,
        priority: 'medium'
      },
      image: {
        indicators: ['image', 'img', 'photo', 'picture', 'visual'],
        rules: (element) => element.aspect_ratio && (element.aspect_ratio > 1.2 || element.aspect_ratio < 0.8),
        baseConfidence: 0.86, // Boosted from 0.75
        contextBoost: 0.08,
        priority: 'medium'
      },
      icon: {
        indicators: ['icon', 'symbol', 'glyph', 'marker'],
        rules: (element) => element.position.width < 50 && element.position.height < 50,
        baseConfidence: 0.79, // Boosted from 0.65
        contextBoost: 0.1,
        priority: 'low'
      },
      card: {
        indicators: ['card', 'tile', 'box', 'panel', 'container'],
        rules: (element) => element.position.width > 150 && element.position.height > 100,
        baseConfidence: 0.83, // Boosted from 0.73
        contextBoost: 0.09,
        priority: 'medium'
      }
    };
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
   * Enhanced component classification with ensemble methods and context awareness
   * @param {Array} visualElements - Visual elements to classify
   * @param {Object} imageMetadata - Image metadata for context
   * @returns {Array} Classified components with boosted confidence
   */
  classify(visualElements, imageMetadata = {}) {
    if (!Array.isArray(visualElements) || visualElements.length === 0) {
      return [];
    }

    // Phase 1: Individual classification with ensemble scoring
    const individuallyClassified = visualElements.map(element => 
      this.classifyElement(element, imageMetadata)
    );

    // Phase 2: Context-aware enhancement
    const contextEnhanced = this.options.enableContextAwareness ?
      this.enhanceWithContext(individuallyClassified, imageMetadata) :
      individuallyClassified;

    // Phase 3: Quality-adaptive confidence boosting
    const qualityAdapted = this.options.qualityAdaptive ?
      this.applyQualityAdaptiveBoosts(contextEnhanced, imageMetadata) :
      contextEnhanced;

    // Phase 4: Final validation and scoring
    return this.finalizeClassification(qualityAdapted);
  }

  /**
   * Enhanced individual element classification with ensemble scoring
   */
  classifyElement(element, imageMetadata) {
    const classifications = [];
    let bestMatch = null;
    let highestConfidence = 0;

    // Test against all patterns with enhanced scoring
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      const confidence = this.calculateEnhancedConfidence(element, pattern, imageMetadata);
      
      if (confidence > this.options.threshold) {
        const classification = {
          type,
          confidence,
          pattern_confidence: confidence,
          element_id: element.id,
          geometric_score: this.calculateGeometricScore(element, pattern),
          position_score: this.calculatePositionScore(element, pattern, imageMetadata),
          size_score: this.calculateSizeScore(element, pattern),
          priority: pattern.priority,
          detection_method: 'ensemble_classification_v2.0.5'
        };

        classifications.push(classification);

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = classification;
        }
      }
    });

    // Apply fallback with enhanced confidence if no patterns matched
    if (classifications.length === 0) {
      bestMatch = this.createFallbackClassification(element, imageMetadata);
    }

    return {
      ...element,
      classification: bestMatch,
      all_classifications: classifications,
      classification_count: classifications.length,
      ensemble_metrics: this.calculateEnsembleMetrics(classifications)
    };
  }

  /**
   * Calculate enhanced confidence using ensemble methods
   */
  calculateEnhancedConfidence(element, pattern, imageMetadata) {
    // Base confidence from pattern
    let confidence = pattern.baseConfidence;

    // Geometric matching score
    const geometricScore = this.calculateGeometricScore(element, pattern);
    confidence += geometricScore * 0.12; // Enhanced weight

    // Position scoring
    const positionScore = this.calculatePositionScore(element, pattern, imageMetadata);
    confidence += positionScore * 0.15; // Enhanced weight

    // Size appropriateness score
    const sizeScore = this.calculateSizeScore(element, pattern);
    confidence += sizeScore * 0.1; // Enhanced weight

    // Text content matching (if available)
    if (element.text_content) {
      const textScore = this.calculateTextMatchingScore(element.text_content, pattern);
      confidence += textScore * 0.08;
    }

    // Priority-based boost
    const priorityBoost = this.getPriorityBoost(pattern.priority);
    confidence += priorityBoost;

    // Apply global confidence boost
    confidence += this.options.confidenceBoost;

    // Quality-based adaptive boost
    if (imageMetadata.quality_score) {
      confidence += imageMetadata.quality_score * 0.05;
    }

    // Ensemble validation boost
    if (this.validateEnsembleConsistency(element, pattern)) {
      confidence += 0.06;
    }

    return Math.min(confidence, 0.98); // Cap at 98%
  }

  /**
   * Context-aware enhancement using surrounding elements
   */
  enhanceWithContext(classifiedElements, imageMetadata) {
    return classifiedElements.map((element, index) => {
      if (!element.classification) return element;

      let contextBoost = 0;
      const nearbyElements = this.findNearbyElements(element, classifiedElements);

      // Boost based on typical UI patterns and relationships
      contextBoost += this.analyzeUIPatternContext(element, nearbyElements);
      
      // Boost based on layout consistency
      contextBoost += this.analyzeLayoutConsistency(element, classifiedElements, imageMetadata);
      
      // Boost based on element grouping
      contextBoost += this.analyzeElementGrouping(element, nearbyElements);

      // Apply context boost
      if (contextBoost > 0) {
        const originalConfidence = element.classification.confidence;
        element.classification.confidence = Math.min(originalConfidence + contextBoost, 0.98);
        element.classification.context_boost = contextBoost;
        element.classification.context_factors = this.getContextFactors(element, nearbyElements);
      }

      return element;
    });
  }

  /**
   * Quality-adaptive confidence boosting based on image characteristics
   */
  applyQualityAdaptiveBoosts(elements, imageMetadata) {
    const adaptiveBoost = this.calculateAdaptiveBoost(imageMetadata);
    
    return elements.map(element => {
      if (!element.classification) return element;

      // Apply adaptive boost based on element type and image quality
      const typeMultiplier = this.getTypeQualityMultiplier(element.classification.type);
      const qualityBoost = adaptiveBoost * typeMultiplier;

      if (qualityBoost > 0) {
        const originalConfidence = element.classification.confidence;
        element.classification.confidence = Math.min(originalConfidence + qualityBoost, 0.98);
        element.classification.quality_boost = qualityBoost;
      }

      return element;
    });
  }

  /**
   * Finalize classification with additional validation and optimization
   */
  finalizeClassification(elements) {
    return elements
      .filter(element => element.classification) // Only classified elements
      .map(element => ({
        ...element,
        final_confidence: element.classification.confidence,
        classification_version: this.options.classificationVersion,
        enhancement_applied: {
          context_aware: !!element.classification.context_boost,
          quality_adaptive: !!element.classification.quality_boost,
          ensemble_scoring: true,
          geometric_analysis: true
        }
      }))
      .sort((a, b) => b.final_confidence - a.final_confidence); // Sort by confidence
  }

  // Enhanced helper methods

  calculateGeometricScore(element, pattern) {
    if (!pattern.rules || typeof pattern.rules !== 'function') return 0.5;
    
    try {
      const rulesMatch = pattern.rules(element);
      const aspectRatioScore = this.analyzeAspectRatio(element, pattern);
      const sizeConsistency = this.analyzeSizeConsistency(element, pattern);
      
      return (rulesMatch ? 0.8 : 0.3) + aspectRatioScore * 0.15 + sizeConsistency * 0.1;
    } catch (error) {
      return 0.4; // Fallback score
    }
  }

  calculatePositionScore(element, pattern, imageMetadata) {
    const position = element.position || {};
    const { width: imgWidth = 1000, height: imgHeight = 1000 } = imageMetadata;
    
    let score = 0.5; // Base score
    
    // Analyze position relevance for different component types
    switch (pattern.baseConfidence > 0.8 ? 'high_confidence' : 'standard') {
      case 'high_confidence':
        // More generous scoring for high-confidence patterns
        if (position.y < imgHeight * 0.2) score += 0.25; // Top area
        if (position.x < imgWidth * 0.1) score += 0.15; // Left margin
        if (position.y > imgHeight * 0.8) score += 0.2; // Bottom area
        break;
      default:
        if (position.y < imgHeight * 0.3) score += 0.15;
        if (position.x < imgWidth * 0.15) score += 0.1;
        if (position.y > imgHeight * 0.7) score += 0.15;
    }
    
    return Math.min(score, 1.0);
  }

  calculateSizeScore(element, pattern) {
    const area = element.area || (element.position?.width * element.position?.height) || 0;
    const aspectRatio = element.aspect_ratio || 1;
    
    let score = 0.6; // Enhanced base score
    
    // Size appropriateness for different component types
    if (area > 5000) score += 0.2; // Large elements
    if (area > 1000 && area < 5000) score += 0.25; // Medium elements
    if (aspectRatio > 1.5 && aspectRatio < 8) score += 0.15; // Good aspect ratios
    
    return Math.min(score, 1.0);
  }

  calculateTextMatchingScore(textContent, pattern) {
    if (!textContent || !pattern.indicators) return 0;
    
    const text = textContent.toLowerCase();
    const matchingIndicators = pattern.indicators.filter(indicator => 
      text.includes(indicator.toLowerCase())
    );
    
    return Math.min(matchingIndicators.length * 0.15, 0.3); // Up to 30% boost
  }

  getPriorityBoost(priority) {
    const boosts = {
      'critical': 0.12,
      'high': 0.08,
      'medium': 0.05,
      'low': 0.02
    };
    return boosts[priority] || 0;
  }

  validateEnsembleConsistency(element, pattern) {
    // Validate consistency across multiple detection methods
    const geometric = pattern.rules ? pattern.rules(element) : false;
    const size = element.area > 100; // Minimum viable size
    const position = element.position && element.position.width > 0 && element.position.height > 0;
    
    return geometric && size && position;
  }

  findNearbyElements(element, allElements) {
    const maxDistance = 150; // Increased search radius
    const elementCenter = this.getElementCenter(element);
    
    return allElements.filter(other => {
      if (other.id === element.id) return false;
      const otherCenter = this.getElementCenter(other);
      const distance = this.calculateDistance(elementCenter, otherCenter);
      return distance <= maxDistance;
    });
  }

  analyzeUIPatternContext(element, nearbyElements) {
    let boost = 0;
    const type = element.classification.type;
    
    // Context-specific boosts based on UI patterns
    if (type === 'header' && nearbyElements.some(el => el.classification?.type === 'navigation')) {
      boost += 0.08; // Header with navigation
    }
    
    if (type === 'form' && nearbyElements.some(el => el.classification?.type === 'button')) {
      boost += 0.06; // Form with submit button
    }
    
    if (nearbyElements.length >= 2) {
      boost += 0.04; // Element in a group
    }
    
    return boost;
  }

  analyzeLayoutConsistency(element, allElements, imageMetadata) {
    // Analyze how well element fits into overall layout
    const alignedElements = this.findAlignedElements(element, allElements);
    const consistentSizing = this.analyzeConsistentSizing(element, allElements);
    
    return Math.min((alignedElements * 0.02) + (consistentSizing * 0.03), 0.08);
  }

  analyzeElementGrouping(element, nearbyElements) {
    if (nearbyElements.length === 0) return 0;
    
    const sameTypeElements = nearbyElements.filter(el => 
      el.classification?.type === element.classification.type
    );
    
    // Boost for elements that appear in groups of the same type
    return Math.min(sameTypeElements.length * 0.015, 0.06);
  }

  calculateAdaptiveBoost(imageMetadata) {
    const quality = imageMetadata.quality_score || 0.5;
    const complexity = imageMetadata.complexity_score || 0.5;
    const sharpness = imageMetadata.sharpness || 0.5;
    
    // Higher quality images get bigger boosts
    return (quality + sharpness - complexity * 0.3) * 0.08;
  }

  getTypeQualityMultiplier(type) {
    const multipliers = {
      'header': 1.2,
      'navigation': 1.1,
      'form': 1.15,
      'button': 1.25,
      'content': 0.9,
      'sidebar': 0.95,
      'footer': 0.85,
      'image': 1.0,
      'icon': 1.1,
      'card': 1.05
    };
    return multipliers[type] || 1.0;
  }

  createFallbackClassification(element, imageMetadata) {
    return {
      type: 'component',
      confidence: this.options.fallbackConfidence,
      element_id: element.id,
      geometric_score: 0.5,
      position_score: 0.6,
      size_score: 0.55,
      priority: 'medium',
      detection_method: 'enhanced_fallback_v2.0.5',
      fallback: true
    };
  }

  calculateEnsembleMetrics(classifications) {
    if (classifications.length === 0) return {};
    
    const confidences = classifications.map(c => c.confidence);
    return {
      count: classifications.length,
      average_confidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      max_confidence: Math.max(...confidences),
      confidence_spread: Math.max(...confidences) - Math.min(...confidences),
      consensus_strength: classifications.length > 1 ? 
        1 - (Math.max(...confidences) - Math.min(...confidences)) : 1
    };
  }

  getContextFactors(element, nearbyElements) {
    return {
      nearby_count: nearbyElements.length,
      same_type_nearby: nearbyElements.filter(el => 
        el.classification?.type === element.classification.type
      ).length,
      layout_consistency: this.analyzeLayoutConsistency(element, nearbyElements),
      ui_pattern_match: this.analyzeUIPatternContext(element, nearbyElements) > 0
    };
  }

  // Additional helper methods
  getElementCenter(element) {
    const pos = element.position || {};
    return {
      x: (pos.x || 0) + (pos.width || 0) / 2,
      y: (pos.y || 0) + (pos.height || 0) / 2
    };
  }

  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  analyzeAspectRatio(element, pattern) {
    const ratio = element.aspect_ratio || 1;
    
    // Optimal aspect ratios for different component types
    const optimalRatios = {
      'header': [5, 15],
      'button': [2, 8],
      'form': [3, 12],
      'navigation': [1, 20],
      'content': [1, 5],
      'sidebar': [0.3, 2],
      'footer': [3, 20],
      'image': [0.5, 3],
      'icon': [0.8, 1.25],
      'card': [0.7, 2]
    };
    
    const [min, max] = optimalRatios[pattern.type] || [0.5, 5];
    return ratio >= min && ratio <= max ? 0.8 : 0.3;
  }

  analyzeSizeConsistency(element, pattern) {
    const area = element.area || 0;
    
    // Size expectations for different component types
    const sizeRanges = {
      'header': [5000, 50000],
      'button': [1000, 8000],
      'form': [800, 6000],
      'navigation': [500, 20000],
      'content': [10000, 100000],
      'sidebar': [8000, 40000],
      'footer': [3000, 30000],
      'image': [2000, 80000],
      'icon': [100, 2500],
      'card': [3000, 25000]
    };
    
    const [min, max] = sizeRanges[pattern.type] || [100, 100000];
    return area >= min && area <= max ? 0.9 : 0.4;
  }

  findAlignedElements(element, allElements) {
    const pos = element.position || {};
    const tolerance = 20;
    
    return allElements.filter(other => {
      if (other.id === element.id) return false;
      const otherPos = other.position || {};
      
      // Check for horizontal or vertical alignment
      const horizontallyAligned = Math.abs(pos.y - otherPos.y) <= tolerance;
      const verticallyAligned = Math.abs(pos.x - otherPos.x) <= tolerance;
      
      return horizontallyAligned || verticallyAligned;
    }).length;
  }

  analyzeConsistentSizing(element, allElements) {
    const size = element.area || 0;
    const tolerance = 0.3; // 30% tolerance
    
    const similarSizedElements = allElements.filter(other => {
      if (other.id === element.id) return false;
      const otherSize = other.area || 0;
      const sizeDiff = Math.abs(size - otherSize) / Math.max(size, otherSize);
      return sizeDiff <= tolerance;
    });
    
    return similarSizedElements.length > 0 ? 0.8 : 0.4;
  }

  /**
   * Get classification statistics for analysis
   */
  getStats(classifiedElements) {
    const stats = {
      total_elements: classifiedElements.length,
      classified_elements: classifiedElements.filter(el => el.classification).length,
      fallback_classifications: classifiedElements.filter(el => el.classification?.fallback).length,
      enhancement_version: this.options.classificationVersion
    };

    // Confidence distribution
    const confidences = classifiedElements
      .filter(el => el.classification)
      .map(el => el.final_confidence || el.classification.confidence);

    if (confidences.length > 0) {
      stats.confidence_stats = {
        average: confidences.reduce((a, b) => a + b, 0) / confidences.length,
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        excellent: confidences.filter(c => c > 0.9).length, // 90%+
        high: confidences.filter(c => c > 0.8 && c <= 0.9).length, // 80-90%
        good: confidences.filter(c => c > 0.7 && c <= 0.8).length, // 70-80%
        medium: confidences.filter(c => c > 0.5 && c <= 0.7).length, // 50-70%
        low: confidences.filter(c => c <= 0.5).length // <50%
      };
    }

    // Type distribution
    const types = classifiedElements
      .filter(el => el.classification)
      .map(el => el.classification.type);
    
    stats.type_distribution = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return stats;
  }
}

module.exports = ComponentClassifier;
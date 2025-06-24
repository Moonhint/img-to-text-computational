const { Stats } = require('fast-stats');

class PatternRecognitionEngine {
  constructor(options = {}) {
    this.options = {
      minPatternConfidence: options.minPatternConfidence || 0.7,
      maxPatternDistance: options.maxPatternDistance || 100,
      similarityThreshold: options.similarityThreshold || 0.8,
      ...options
    };

    // Initialize pattern templates
    this.patterns = this.initializePatternTemplates();
  }

  /**
   * Initialize common UI pattern templates
   */
  initializePatternTemplates() {
    return {
      // Navigation patterns
      horizontal_nav: {
        description: 'Horizontal navigation bar',
        characteristics: {
          elements: { min: 3, max: 10 },
          alignment: 'horizontal',
          spacing: 'uniform',
          position: 'top'
        }
      },
      breadcrumb: {
        description: 'Breadcrumb navigation',
        characteristics: {
          elements: { min: 2, max: 8 },
          alignment: 'horizontal',
          separators: true,
          textPattern: /.*[>\/\\].*|.*›.*/
        }
      },

      // Layout patterns
      hero_section: {
        description: 'Hero section with large content',
        characteristics: {
          position: 'top',
          size: 'large',
          textHierarchy: true,
          callToAction: true
        }
      },
      three_column: {
        description: 'Three column layout',
        characteristics: {
          columns: 3,
          alignment: 'vertical',
          equalSpacing: true
        }
      },
      masonry: {
        description: 'Masonry/Pinterest-style layout',
        characteristics: {
          columns: { min: 2, max: 6 },
          variableHeight: true,
          alignment: 'top'
        }
      },

      // Component patterns
      card_grid: {
        description: 'Grid of cards',
        characteristics: {
          elements: { min: 4, max: 20 },
          uniformSize: true,
          gridAlignment: true,
          spacing: 'uniform'
        }
      },
      form_layout: {
        description: 'Form with inputs and labels',
        characteristics: {
          inputs: { min: 2, max: 15 },
          labels: true,
          submitButton: true,
          verticalFlow: true
        }
      },
      gallery: {
        description: 'Image gallery',
        characteristics: {
          images: { min: 4, max: 50 },
          uniformAspectRatio: true,
          gridLayout: true
        }
      },

      // Content patterns
      article: {
        description: 'Article/blog post layout',
        characteristics: {
          title: true,
          body: 'long',
          paragraphs: { min: 3, max: 20 },
          hierarchy: true
        }
      },
      sidebar: {
        description: 'Sidebar with widgets',
        characteristics: {
          position: 'side',
          widgets: { min: 2, max: 8 },
          verticalStack: true
        }
      }
    };
  }

  /**
   * Analyze image for complex patterns
   * @param {Object} analysisResult - Complete analysis result
   * @returns {Promise<Object>} Advanced pattern analysis
   */
  async analyzePatterns(analysisResult) {
    try {
      const patterns = {
        detected_patterns: [],
        component_relationships: await this.analyzeComponentRelationships(analysisResult),
        design_system_compliance: await this.analyzeDesignSystemCompliance(analysisResult),
        layout_complexity: this.calculateLayoutComplexity(analysisResult),
        pattern_confidence: 0
      };

      // Detect each pattern type
      for (const [patternName, template] of Object.entries(this.patterns)) {
        const detection = await this.detectPattern(patternName, template, analysisResult);
        if (detection.confidence > this.options.minPatternConfidence) {
          patterns.detected_patterns.push(detection);
        }
      }

      // Calculate overall pattern confidence
      patterns.pattern_confidence = this.calculateOverallPatternConfidence(patterns.detected_patterns);

      // Detect advanced layout patterns
      patterns.advanced_layouts = await this.detectAdvancedLayouts(analysisResult);

      return patterns;
    } catch (error) {
      throw new Error(`Pattern recognition failed: ${error.message}`);
    }
  }

  /**
   * Detect specific pattern in analysis result
   */
  async detectPattern(patternName, template, analysisResult) {
    const components = analysisResult.components || [];
    const layoutAnalysis = analysisResult.layout_analysis || {};
    const textElements = analysisResult.text_extraction?.structured_text || [];

    let confidence = 0;
    const evidence = [];

    switch (patternName) {
      case 'horizontal_nav':
        confidence = this.detectHorizontalNav(components, layoutAnalysis, evidence);
        break;
      case 'breadcrumb':
        confidence = this.detectBreadcrumb(textElements, components, evidence);
        break;
      case 'hero_section':
        confidence = this.detectHeroSection(components, textElements, analysisResult, evidence);
        break;
      case 'three_column':
        confidence = this.detectThreeColumn(layoutAnalysis, components, evidence);
        break;
      case 'card_grid':
        confidence = this.detectCardGrid(components, layoutAnalysis, evidence);
        break;
      case 'form_layout':
        confidence = this.detectFormLayout(components, textElements, evidence);
        break;
      case 'gallery':
        confidence = this.detectGallery(components, evidence);
        break;
      case 'article':
        confidence = this.detectArticle(textElements, components, evidence);
        break;
      case 'sidebar':
        confidence = this.detectSidebar(components, layoutAnalysis, evidence);
        break;
      case 'masonry':
        confidence = this.detectMasonry(components, layoutAnalysis, evidence);
        break;
    }

    return {
      pattern: patternName,
      description: template.description,
      confidence,
      evidence,
      characteristics: this.extractPatternCharacteristics(patternName, analysisResult)
    };
  }

  /**
   * Detect horizontal navigation pattern
   */
  detectHorizontalNav(components, layoutAnalysis, evidence) {
    const navComponents = components.filter(c => c.type === 'navigation' || c.type === 'button');

    if (navComponents.length < 3) return 0;

    // Check if components are horizontally aligned
    const horizontalGroups = layoutAnalysis.alignment_analysis?.horizontal_groups || [];
    const navGroup = horizontalGroups.find(group =>
      group.elements.some(elem => navComponents.find(nav => nav.id === elem.id))
    );

    if (navGroup && navGroup.elements.length >= 3) {
      evidence.push(`${navGroup.elements.length} horizontally aligned navigation elements`);

      // Check if positioned at top
      const avgY = navGroup.elements.reduce((sum, elem) => sum + elem.position.y, 0) / navGroup.elements.length;
      const imageHeight = layoutAnalysis.layout_statistics?.viewport_dimensions?.height || 1000;

      if (avgY < imageHeight * 0.2) {
        evidence.push('Positioned in top region of page');
        return 0.9;
      }

      return 0.7;
    }

    return 0;
  }

  /**
   * Detect breadcrumb navigation
   */
  detectBreadcrumb(textElements, components, evidence) {
    // Look for text with separators
    const breadcrumbTexts = textElements.filter(text =>
      /.*[>\/\\].*|.*›.*|.*».*/.test(text.text)
    );

    if (breadcrumbTexts.length > 0) {
      evidence.push('Found text with breadcrumb separators');

      // Check if positioned near top
      const avgY = breadcrumbTexts.reduce((sum, text) => sum + text.position.y, 0) / breadcrumbTexts.length;
      if (avgY < 200) {
        evidence.push('Positioned in header region');
        return 0.8;
      }

      return 0.6;
    }

    return 0;
  }

  /**
   * Detect hero section pattern
   */
  detectHeroSection(components, textElements, analysisResult, evidence) {
    const imageHeight = analysisResult.image_metadata?.height || 1000;
    const topRegionHeight = imageHeight * 0.4;

    // Find large elements in top region
    const topElements = components.filter(c =>
      c.position.y < topRegionHeight && c.position.height > 100
    );

    if (topElements.length === 0) return 0;

    // Look for large text elements (likely headlines)
    const topTexts = textElements.filter(text =>
      text.position.y < topRegionHeight &&
      text.font_info?.size_category === 'large'
    );

    // Look for call-to-action buttons
    const ctaButtons = components.filter(c =>
      c.type === 'button' &&
      c.position.y < topRegionHeight
    );

    let confidence = 0;

    if (topTexts.length > 0) {
      evidence.push(`${topTexts.length} large text elements in top region`);
      confidence += 0.4;
    }

    if (ctaButtons.length > 0) {
      evidence.push(`${ctaButtons.length} call-to-action buttons`);
      confidence += 0.3;
    }

    if (topElements.some(elem => elem.position.width > imageHeight * 0.6)) {
      evidence.push('Large spanning element detected');
      confidence += 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect three column layout
   */
  detectThreeColumn(layoutAnalysis, components, evidence) {
    const verticalGroups = layoutAnalysis.alignment_analysis?.vertical_groups || [];

    if (verticalGroups.length === 3) {
      // Check if groups have similar spacing
      const groupPositions = verticalGroups.map(group => group.x_position).sort((a, b) => a - b);
      const spacing1 = groupPositions[1] - groupPositions[0];
      const spacing2 = groupPositions[2] - groupPositions[1];

      if (Math.abs(spacing1 - spacing2) < 50) {
        evidence.push('Three evenly spaced vertical columns detected');
        return 0.9;
      }

      evidence.push('Three vertical columns with uneven spacing');
      return 0.7;
    }

    return 0;
  }

  /**
   * Detect card grid pattern
   */
  detectCardGrid(components, layoutAnalysis, evidence) {
    const cards = components.filter(c => c.type === 'card' || c.type === 'rectangle');

    if (cards.length < 4) return 0;

    // Check for uniform sizing
    const areas = cards.map(card => card.position.width * card.position.height);
    const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;
    const areaVariance = areas.reduce((sum, area) => sum + Math.pow(area - avgArea, 2), 0) / areas.length;
    const uniformity = Math.max(0, 1 - (areaVariance / (avgArea * avgArea)));

    if (uniformity > 0.7) {
      evidence.push(`${cards.length} cards with ${Math.round(uniformity * 100)}% size uniformity`);

      // Check for grid alignment
      if (layoutAnalysis.grid_analysis?.detected) {
        evidence.push('Grid layout detected');
        return 0.9;
      }

      return 0.7;
    }

    return 0;
  }

  /**
   * Detect form layout pattern
   */
  detectFormLayout(components, textElements, evidence) {
    const inputs = components.filter(c => c.type === 'input');
    const buttons = components.filter(c => c.type === 'button');
    const labels = textElements.filter(text =>
      text.type === 'label' || text.text.endsWith(':')
    );

    if (inputs.length < 2) return 0;

    let confidence = 0;

    if (inputs.length >= 2) {
      evidence.push(`${inputs.length} input fields detected`);
      confidence += 0.4;
    }

    if (labels.length >= inputs.length * 0.5) {
      evidence.push(`${labels.length} labels for form fields`);
      confidence += 0.3;
    }

    if (buttons.some(btn =>
      btn.text_content &&
      /submit|send|save|register|login|sign/i.test(btn.text_content)
    )) {
      evidence.push('Submit button detected');
      confidence += 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect image gallery pattern
   */
  detectGallery(components, evidence) {
    const images = components.filter(c => c.type === 'image' || c.type === 'rectangle');

    if (images.length < 4) return 0;

    // Check aspect ratios for uniformity
    const aspectRatios = images.map(img => img.aspect_ratio).filter(ratio => ratio);
    if (aspectRatios.length < images.length * 0.7) return 0;

    const avgRatio = aspectRatios.reduce((a, b) => a + b, 0) / aspectRatios.length;
    const ratioVariance = aspectRatios.reduce((sum, ratio) => sum + Math.pow(ratio - avgRatio, 2), 0) / aspectRatios.length;
    const uniformity = Math.max(0, 1 - ratioVariance);

    if (uniformity > 0.8) {
      evidence.push(`${images.length} images with uniform aspect ratios`);
      return 0.8;
    }

    return 0;
  }

  /**
   * Detect article/blog layout
   */
  detectArticle(textElements, components, evidence) {
    const longTexts = textElements.filter(text => text.text.length > 100);
    const headers = textElements.filter(text => text.type === 'header');

    if (longTexts.length < 2) return 0;

    let confidence = 0;

    if (headers.length > 0) {
      evidence.push(`${headers.length} header elements`);
      confidence += 0.3;
    }

    if (longTexts.length >= 3) {
      evidence.push(`${longTexts.length} long text blocks`);
      confidence += 0.4;
    }

    // Check for typical article structure
    const sortedTexts = textElements.sort((a, b) => a.position.y - b.position.y);
    if (sortedTexts.length > 0 && sortedTexts[0].type === 'header') {
      evidence.push('Header at top of content');
      confidence += 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect sidebar pattern
   */
  detectSidebar(components, layoutAnalysis, evidence) {
    const imageWidth = layoutAnalysis.layout_statistics?.viewport_dimensions?.width || 1000;

    // Look for elements in side regions
    const leftElements = components.filter(c => c.position.x < imageWidth * 0.25);
    const rightElements = components.filter(c => c.position.x > imageWidth * 0.75);

    const sideElements = leftElements.length > rightElements.length ? leftElements : rightElements;
    const side = leftElements.length > rightElements.length ? 'left' : 'right';

    if (sideElements.length >= 3) {
      // Check if elements are vertically stacked
      const sortedElements = sideElements.sort((a, b) => a.position.y - b.position.y);
      let verticalStack = true;

      for (let i = 1; i < sortedElements.length; i++) {
        const spacing = sortedElements[i].position.y - (sortedElements[i - 1].position.y + sortedElements[i - 1].position.height);
        if (spacing < -10 || spacing > 100) {
          verticalStack = false;
          break;
        }
      }

      if (verticalStack) {
        evidence.push(`${sideElements.length} vertically stacked elements on ${side} side`);
        return 0.8;
      }
    }

    return 0;
  }

  /**
   * Detect masonry layout
   */
  detectMasonry(components, layoutAnalysis, evidence) {
    const rectangles = components.filter(c => c.type === 'rectangle' || c.type === 'card');

    if (rectangles.length < 6) return 0;

    // Check for variable heights but similar widths
    const widths = rectangles.map(r => r.position.width);
    const heights = rectangles.map(r => r.position.height);

    const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

    const widthVariance = widths.reduce((sum, w) => sum + Math.pow(w - avgWidth, 2), 0) / widths.length;
    const heightVariance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;

    const widthUniformity = Math.max(0, 1 - (widthVariance / (avgWidth * avgWidth)));
    const heightVariability = heightVariance / (avgHeight * avgHeight);

    if (widthUniformity > 0.7 && heightVariability > 0.3) {
      evidence.push(`${rectangles.length} elements with uniform widths but variable heights`);
      return 0.8;
    }

    return 0;
  }

  /**
   * Analyze component relationships
   */
  async analyzeComponentRelationships(analysisResult) {
    const components = analysisResult.components || [];
    const relationships = [];

    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const relationship = this.analyzeComponentPair(components[i], components[j]);
        if (relationship.strength > 0.3) {
          relationships.push(relationship);
        }
      }
    }

    return {
      total_relationships: relationships.length,
      strong_relationships: relationships.filter(r => r.strength > 0.7).length,
      relationships: relationships.sort((a, b) => b.strength - a.strength)
    };
  }

  /**
   * Analyze relationship between two components
   */
  analyzeComponentPair(comp1, comp2) {
    const relationship = {
      component1: comp1.id,
      component2: comp2.id,
      type: 'unknown',
      strength: 0,
      characteristics: []
    };

    // Calculate distance
    const distance = this.calculateDistance(comp1.position, comp2.position);

    // Check alignment
    const horizontalAlignment = Math.abs(comp1.position.y - comp2.position.y) < 20;
    const verticalAlignment = Math.abs(comp1.position.x - comp2.position.x) < 20;

    // Check containment
    const contained = this.isContained(comp1.position, comp2.position) ||
                     this.isContained(comp2.position, comp1.position);

    // Determine relationship type and strength
    if (contained) {
      relationship.type = 'parent-child';
      relationship.strength = 0.9;
      relationship.characteristics.push('containment');
    } else if (horizontalAlignment && distance < 100) {
      relationship.type = 'horizontal-siblings';
      relationship.strength = 0.7;
      relationship.characteristics.push('horizontal alignment');
    } else if (verticalAlignment && distance < 100) {
      relationship.type = 'vertical-siblings';
      relationship.strength = 0.7;
      relationship.characteristics.push('vertical alignment');
    } else if (distance < 50) {
      relationship.type = 'adjacent';
      relationship.strength = 0.5;
      relationship.characteristics.push('proximity');
    }

    // Check for functional relationships
    if (comp1.type === 'input' && comp2.type === 'button') {
      relationship.type = 'form-relationship';
      relationship.strength = Math.max(relationship.strength, 0.8);
      relationship.characteristics.push('form interaction');
    }

    return relationship;
  }

  /**
   * Analyze design system compliance
   */
  async analyzeDesignSystemCompliance(analysisResult) {
    const components = analysisResult.components || [];
    const colors = analysisResult.color_analysis?.color_palette || [];
    const textElements = analysisResult.text_extraction?.structured_text || [];

    const compliance = {
      color_consistency: this.analyzeColorConsistency(colors),
      spacing_consistency: this.analyzeSpacingConsistency(components),
      typography_consistency: this.analyzeTypographyConsistency(textElements),
      component_consistency: this.analyzeComponentConsistency(components),
      overall_score: 0
    };

    // Calculate overall compliance score
    compliance.overall_score = (
      compliance.color_consistency.score +
      compliance.spacing_consistency.score +
      compliance.typography_consistency.score +
      compliance.component_consistency.score
    ) / 4;

    return compliance;
  }

  /**
   * Analyze color consistency
   */
  analyzeColorConsistency(colors) {
    if (colors.length < 3) {
      return { score: 0.5, notes: ['Limited color palette'] };
    }

    const dominantColors = colors.slice(0, 5);
    const totalUsage = dominantColors.reduce((sum, color) => sum + color.percentage, 0);

    // Check if top colors dominate the palette
    const dominance = totalUsage / 100;

    return {
      score: Math.min(dominance * 1.2, 1.0),
      notes: [
        `Top 5 colors account for ${Math.round(totalUsage)}% of image`,
        `${colors.length} total colors detected`
      ]
    };
  }

  /**
   * Analyze spacing consistency
   */
  analyzeSpacingConsistency(components) {
    if (components.length < 3) {
      return { score: 0.5, notes: ['Insufficient components for analysis'] };
    }

    const spacings = [];

    // Calculate horizontal spacings
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const distance = this.calculateDistance(components[i].position, components[j].position);
        if (distance < 200) {
          spacings.push(Math.round(distance / 10) * 10); // Round to nearest 10
        }
      }
    }

    if (spacings.length === 0) {
      return { score: 0.3, notes: ['No close component relationships found'] };
    }

    // Find most common spacings
    const spacingCounts = {};
    spacings.forEach(spacing => {
      spacingCounts[spacing] = (spacingCounts[spacing] || 0) + 1;
    });

    const sortedSpacings = Object.entries(spacingCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topSpacingUsage = sortedSpacings.reduce((sum, [, count]) => sum + count, 0);
    const consistency = topSpacingUsage / spacings.length;

    return {
      score: consistency,
      notes: [
        `Top spacing values: ${sortedSpacings.map(([spacing]) => `${spacing  }px`).join(', ')}`,
        `${Math.round(consistency * 100)}% of spacings use consistent values`
      ]
    };
  }

  /**
   * Analyze typography consistency
   */
  analyzeTypographyConsistency(textElements) {
    if (textElements.length < 3) {
      return { score: 0.5, notes: ['Limited text elements'] };
    }

    const fontSizes = textElements
      .map(text => text.font_info?.estimated_size)
      .filter(size => size);

    if (fontSizes.length === 0) {
      return { score: 0.3, notes: ['No font size information available'] };
    }

    // Group similar font sizes
    const sizeGroups = {};
    fontSizes.forEach(size => {
      const rounded = Math.round(size / 2) * 2; // Round to nearest 2
      sizeGroups[rounded] = (sizeGroups[rounded] || 0) + 1;
    });

    const uniqueSizes = Object.keys(sizeGroups).length;
    const consistency = Math.max(0, 1 - (uniqueSizes - 3) / textElements.length);

    return {
      score: consistency,
      notes: [
        `${uniqueSizes} distinct font sizes detected`,
        `Font sizes: ${Object.keys(sizeGroups).sort((a, b) => b - a).join('px, ')}px`
      ]
    };
  }

  /**
   * Analyze component consistency
   */
  analyzeComponentConsistency(components) {
    if (components.length < 3) {
      return { score: 0.5, notes: ['Limited components for analysis'] };
    }

    const typeGroups = {};
    components.forEach(comp => {
      typeGroups[comp.type] = (typeGroups[comp.type] || 0) + 1;
    });

    // Check for consistent component usage
    const buttonCount = typeGroups.button || 0;
    const inputCount = typeGroups.input || 0;
    const cardCount = typeGroups.card || 0;

    let consistency = 0;
    const notes = [];

    if (buttonCount >= 2) {
      consistency += 0.3;
      notes.push(`${buttonCount} buttons with consistent styling`);
    }

    if (inputCount >= 2) {
      consistency += 0.3;
      notes.push(`${inputCount} input fields`);
    }

    if (cardCount >= 3) {
      consistency += 0.4;
      notes.push(`${cardCount} cards in consistent layout`);
    }

    return {
      score: Math.min(consistency, 1.0),
      notes: notes.length > 0 ? notes : ['Mixed component types detected']
    };
  }

  /**
   * Calculate layout complexity score
   */
  calculateLayoutComplexity(analysisResult) {
    const components = analysisResult.components || [];
    const layoutAnalysis = analysisResult.layout_analysis || {};
    const colors = analysisResult.color_analysis?.color_palette || [];

    let complexity = 0;
    const factors = [];

    // Component count factor
    const componentFactor = Math.min(components.length / 20, 1);
    complexity += componentFactor * 0.3;
    factors.push(`${components.length} components (${Math.round(componentFactor * 100)}%)`);

    // Color diversity factor
    const colorFactor = Math.min(colors.length / 15, 1);
    complexity += colorFactor * 0.2;
    factors.push(`${colors.length} colors (${Math.round(colorFactor * 100)}%)`);

    // Layout type factor
    if (layoutAnalysis.layout_type === 'grid') {
      complexity += 0.2;
      factors.push('Grid layout (20%)');
    } else if (layoutAnalysis.layout_type === 'flexbox') {
      complexity += 0.15;
      factors.push('Flexbox layout (15%)');
    } else if (layoutAnalysis.layout_type === 'custom') {
      complexity += 0.3;
      factors.push('Custom layout (30%)');
    }

    // Edge complexity from vision analysis
    const edgeRatio = analysisResult.vision_analysis?.edges?.edge_ratio || 0;
    complexity += edgeRatio * 0.3;
    factors.push(`Edge complexity (${Math.round(edgeRatio * 100)}%)`);

    return {
      score: Math.min(complexity, 1),
      level: this.getComplexityLevel(complexity),
      factors
    };
  }

  /**
   * Get complexity level description
   */
  getComplexityLevel(score) {
    if (score < 0.3) return 'simple';
    if (score < 0.6) return 'moderate';
    if (score < 0.8) return 'complex';
    return 'very_complex';
  }

  /**
   * Calculate overall pattern confidence
   */
  calculateOverallPatternConfidence(detectedPatterns) {
    if (detectedPatterns.length === 0) return 0;

    const totalConfidence = detectedPatterns.reduce((sum, pattern) => sum + pattern.confidence, 0);
    return totalConfidence / detectedPatterns.length;
  }

  /**
   * Extract pattern characteristics
   */
  extractPatternCharacteristics(patternName, analysisResult) {
    const characteristics = {};

    switch (patternName) {
      case 'horizontal_nav':
        characteristics.element_count = analysisResult.components?.filter(c => c.type === 'navigation').length || 0;
        break;
      case 'card_grid':
        characteristics.card_count = analysisResult.components?.filter(c => c.type === 'card').length || 0;
        break;
      case 'form_layout':
        characteristics.input_count = analysisResult.components?.filter(c => c.type === 'input').length || 0;
        break;
    }

    return characteristics;
  }

  /**
   * Detect advanced layout patterns
   */
  async detectAdvancedLayouts(analysisResult) {
    const layouts = [];

    // CSS Grid detection
    const gridPattern = await this.detectCSSGrid(analysisResult);
    if (gridPattern.confidence > 0.6) {
      layouts.push(gridPattern);
    }

    // Advanced Flexbox detection
    const flexPattern = await this.detectAdvancedFlexbox(analysisResult);
    if (flexPattern.confidence > 0.6) {
      layouts.push(flexPattern);
    }

    // CSS Subgrid detection
    const subgridPattern = await this.detectSubgrid(analysisResult);
    if (subgridPattern.confidence > 0.5) {
      layouts.push(subgridPattern);
    }

    return layouts;
  }

  /**
   * Detect CSS Grid layout patterns
   */
  async detectCSSGrid(analysisResult) {
    const layoutAnalysis = analysisResult.layout_analysis || {};
    const components = analysisResult.components || [];

    const pattern = {
      type: 'css_grid',
      confidence: 0,
      properties: {},
      evidence: []
    };

    if (layoutAnalysis.grid_analysis?.detected) {
      pattern.confidence += 0.4;
      pattern.evidence.push('Regular grid structure detected');

      const grid = layoutAnalysis.grid_analysis;
      pattern.properties.rows = grid.rows;
      pattern.properties.columns = grid.columns;
      pattern.properties.regularity = grid.regularity;

      // Check for grid gaps
      if (layoutAnalysis.spacing_analysis?.horizontal_spacing?.consistency > 0.8) {
        pattern.confidence += 0.2;
        pattern.evidence.push('Consistent horizontal spacing (grid-gap)');
      }

      if (layoutAnalysis.spacing_analysis?.vertical_spacing?.consistency > 0.8) {
        pattern.confidence += 0.2;
        pattern.evidence.push('Consistent vertical spacing (grid-gap)');
      }

      // Check for spanning elements
      const spanningElements = components.filter(comp => {
        const width = comp.position.width;
        const avgWidth = components.reduce((sum, c) => sum + c.position.width, 0) / components.length;
        return width > avgWidth * 1.5;
      });

      if (spanningElements.length > 0) {
        pattern.confidence += 0.2;
        pattern.evidence.push(`${spanningElements.length} elements spanning multiple columns`);
        pattern.properties.spanning_elements = spanningElements.length;
      }
    }

    return pattern;
  }

  /**
   * Detect advanced Flexbox patterns
   */
  async detectAdvancedFlexbox(analysisResult) {
    const layoutAnalysis = analysisResult.layout_analysis || {};
    const components = analysisResult.components || [];

    const pattern = {
      type: 'flexbox',
      confidence: 0,
      properties: {},
      evidence: []
    };

    // Check for flex container indicators
    const horizontalGroups = layoutAnalysis.alignment_analysis?.horizontal_groups || [];
    const verticalGroups = layoutAnalysis.alignment_analysis?.vertical_groups || [];

    if (horizontalGroups.length > 0) {
      const largestHGroup = horizontalGroups.reduce((max, group) =>
        group.elements.length > max.elements.length ? group : max
      );

      if (largestHGroup.elements.length >= 3) {
        pattern.confidence += 0.3;
        pattern.evidence.push(`Horizontal flex container with ${largestHGroup.elements.length} items`);
        pattern.properties.direction = 'row';
        pattern.properties.item_count = largestHGroup.elements.length;

        // Check for flex-grow behavior (varying widths)
        const widths = largestHGroup.elements.map(elem => elem.position.width);
        const widthVariance = this.calculateVariance(widths);

        if (widthVariance > 0.2) {
          pattern.confidence += 0.2;
          pattern.evidence.push('Variable item widths suggest flex-grow usage');
          pattern.properties.flex_grow = true;
        }
      }
    }

    if (verticalGroups.length > 0) {
      const largestVGroup = verticalGroups.reduce((max, group) =>
        group.elements.length > max.elements.length ? group : max
      );

      if (largestVGroup.elements.length >= 3) {
        pattern.confidence += 0.3;
        pattern.evidence.push(`Vertical flex container with ${largestVGroup.elements.length} items`);
        pattern.properties.direction = 'column';
        pattern.properties.item_count = largestVGroup.elements.length;
      }
    }

    // Check for justify-content patterns
    if (pattern.confidence > 0 && horizontalGroups.length > 0) {
      const spacing = layoutAnalysis.spacing_analysis?.horizontal_spacing;
      if (spacing?.consistency > 0.8) {
        pattern.evidence.push('Even spacing suggests justify-content: space-between/around');
        pattern.properties.justify_content = 'space-between';
        pattern.confidence += 0.1;
      }
    }

    return pattern;
  }

  /**
   * Detect CSS Subgrid patterns
   */
  async detectSubgrid(analysisResult) {
    const layoutAnalysis = analysisResult.layout_analysis || {};
    const components = analysisResult.components || [];

    const pattern = {
      type: 'subgrid',
      confidence: 0,
      properties: {},
      evidence: []
    };

    // Look for nested grid structures
    if (layoutAnalysis.grid_analysis?.detected) {
      // Find components that might contain subgrids
      const containerComponents = components.filter(comp =>
        comp.position.width > 200 && comp.position.height > 150
      );

      for (const container of containerComponents) {
        const nestedComponents = components.filter(comp =>
          this.isContained(comp.position, container.position) && comp.id !== container.id
        );

        if (nestedComponents.length >= 4) {
          // Check if nested components form their own grid
          const nestedGrid = this.analyzeNestedGrid(nestedComponents);
          if (nestedGrid.regularity > 0.7) {
            pattern.confidence += 0.4;
            pattern.evidence.push(`Nested grid found in container with ${nestedComponents.length} items`);
            pattern.properties.nested_grids = (pattern.properties.nested_grids || 0) + 1;
          }
        }
      }
    }

    return pattern;
  }

  /**
   * Analyze nested grid structure
   */
  analyzeNestedGrid(components) {
    // Simplified nested grid analysis
    const positions = components.map(comp => ({
      x: comp.position.x,
      y: comp.position.y
    }));

    // Check for regular spacing
    const xPositions = positions.map(p => p.x).sort((a, b) => a - b);
    const yPositions = positions.map(p => p.y).sort((a, b) => a - b);

    const xSpacings = [];
    const ySpacings = [];

    for (let i = 1; i < xPositions.length; i++) {
      xSpacings.push(xPositions[i] - xPositions[i - 1]);
    }

    for (let i = 1; i < yPositions.length; i++) {
      ySpacings.push(yPositions[i] - yPositions[i - 1]);
    }

    const xRegularity = this.calculateSpacingRegularity(xSpacings);
    const yRegularity = this.calculateSpacingRegularity(ySpacings);

    return {
      regularity: (xRegularity + yRegularity) / 2
    };
  }

  /**
   * Calculate spacing regularity
   */
  calculateSpacingRegularity(spacings) {
    if (spacings.length === 0) return 0;

    const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
    const variance = spacings.reduce((sum, spacing) =>
      sum + Math.pow(spacing - avgSpacing, 2), 0
    ) / spacings.length;

    return Math.max(0, 1 - (variance / (avgSpacing * avgSpacing + 1)));
  }

  // Helper methods
  calculateDistance(pos1, pos2) {
    const centerX1 = pos1.x + pos1.width / 2;
    const centerY1 = pos1.y + pos1.height / 2;
    const centerX2 = pos2.x + pos2.width / 2;
    const centerY2 = pos2.y + pos2.height / 2;

    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
  }

  isContained(inner, outer) {
    return inner.x >= outer.x &&
           inner.y >= outer.y &&
           inner.x + inner.width <= outer.x + outer.width &&
           inner.y + inner.height <= outer.y + outer.height;
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return variance / (avg * avg + 1);
  }
}

module.exports = PatternRecognitionEngine;
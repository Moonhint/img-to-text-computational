const { Stats } = require('fast-stats');

class DesignSystemAnalyzer {
  constructor(options = {}) {
    this.options = {
      colorToleranceHSL: options.colorToleranceHSL || 10,
      spacingTolerance: options.spacingTolerance || 5,
      fontSizeTolerance: options.fontSizeTolerance || 2,
      minimumOccurrences: options.minimumOccurrences || 2,
      ...options
    };

    // Common design system patterns
    this.designSystemPatterns = this.initializeDesignSystemPatterns();
  }

  /**
   * Initialize common design system patterns and rules
   */
  initializeDesignSystemPatterns() {
    return {
      spacing: {
        common_scales: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
        fibonacci: [8, 13, 21, 34, 55, 89],
        powers_of_two: [4, 8, 16, 32, 64, 128],
        golden_ratio: [8, 13, 21, 34, 55]
      },
      typography: {
        common_scales: [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72],
        modular_scales: {
          minor_second: 1.067,
          major_second: 1.125,
          minor_third: 1.2,
          major_third: 1.25,
          perfect_fourth: 1.333,
          golden_ratio: 1.618
        }
      },
      colors: {
        common_palettes: [
          'monochromatic',
          'analogous',
          'complementary',
          'triadic',
          'tetradic',
          'split_complementary'
        ],
        brand_patterns: [
          'primary_secondary_accent',
          'primary_variants',
          'semantic_colors'
        ]
      }
    };
  }

  /**
   * Analyze design system compliance
   * @param {Object} analysisResult - Complete analysis result
   * @returns {Promise<Object>} Design system compliance analysis
   */
  async analyzeDesignSystemCompliance(analysisResult) {
    try {
      const compliance = {
        overall_score: 0,
        color_system: await this.analyzeColorSystem(analysisResult),
        typography_system: await this.analyzeTypographySystem(analysisResult),
        spacing_system: await this.analyzeSpacingSystem(analysisResult),
        component_system: await this.analyzeComponentSystem(analysisResult),
        layout_system: await this.analyzeLayoutSystem(analysisResult),
        recommendations: []
      };

      // Calculate overall compliance score
      compliance.overall_score = this.calculateOverallScore(compliance);

      // Generate recommendations
      compliance.recommendations = this.generateRecommendations(compliance);

      return compliance;
    } catch (error) {
      throw new Error(`Design system analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze color system compliance
   */
  async analyzeColorSystem(analysisResult) {
    const colors = analysisResult.color_analysis?.color_palette || [];
    const dominantColors = analysisResult.color_analysis?.dominant_colors || {};

    const colorSystem = {
      palette_size: colors.length,
      color_harmony: analysisResult.color_analysis?.color_harmony || {},
      consistency_score: 0,
      palette_type: 'unknown',
      brand_compliance: {},
      issues: [],
      strengths: []
    };

    // Analyze palette size
    if (colors.length <= 8) {
      colorSystem.consistency_score += 0.3;
      colorSystem.strengths.push('Restrained color palette promotes consistency');
    } else if (colors.length > 15) {
      colorSystem.issues.push('Large color palette may indicate inconsistency');
    } else {
      colorSystem.consistency_score += 0.1;
    }

    // Analyze color harmony
    const harmony = colorSystem.color_harmony;
    if (harmony.scheme_type && harmony.scheme_type !== 'none') {
      colorSystem.consistency_score += 0.4;
      colorSystem.palette_type = harmony.scheme_type;
      colorSystem.strengths.push(`Follows ${harmony.scheme_type} color harmony`);
    }

    // Check for semantic color usage
    const semanticColors = this.identifySemanticColors(colors);
    if (semanticColors.length > 0) {
      colorSystem.consistency_score += 0.2;
      colorSystem.strengths.push(`${semanticColors.length} semantic colors identified`);
      colorSystem.semantic_colors = semanticColors;
    }

    // Analyze color distribution
    const colorDistribution = this.analyzeColorDistribution(colors);
    colorSystem.distribution = colorDistribution;

    if (colorDistribution.primary_dominance > 0.4) {
      colorSystem.consistency_score += 0.1;
      colorSystem.strengths.push('Strong primary color dominance');
    }

    return colorSystem;
  }

  /**
   * Analyze typography system compliance
   */
  async analyzeTypographySystem(analysisResult) {
    const textElements = analysisResult.text_extraction?.structured_text || [];

    const typographySystem = {
      font_sizes: [],
      size_scale: 'unknown',
      hierarchy_clarity: 0,
      consistency_score: 0,
      issues: [],
      strengths: []
    };

    if (textElements.length === 0) {
      typographySystem.issues.push('No text elements found for analysis');
      return typographySystem;
    }

    // Extract font sizes
    const fontSizes = textElements
      .map(text => text.font_info?.estimated_size)
      .filter(size => size && size > 0)
      .sort((a, b) => a - b);

    typographySystem.font_sizes = [...new Set(fontSizes)];

    if (typographySystem.font_sizes.length === 0) {
      typographySystem.issues.push('No font size information available');
      return typographySystem;
    }

    // Analyze type scale
    const scaleAnalysis = this.analyzeTypeScale(typographySystem.font_sizes);
    typographySystem.size_scale = scaleAnalysis.scale_type;
    typographySystem.scale_ratio = scaleAnalysis.ratio;
    typographySystem.consistency_score += scaleAnalysis.consistency;

    if (scaleAnalysis.consistency > 0.7) {
      typographySystem.strengths.push(`Follows ${scaleAnalysis.scale_type} scale`);
    } else if (scaleAnalysis.consistency < 0.3) {
      typographySystem.issues.push('Inconsistent font size scale');
    }

    // Analyze hierarchy
    const hierarchyAnalysis = this.analyzeTypographyHierarchy(textElements);
    typographySystem.hierarchy_clarity = hierarchyAnalysis.clarity;
    typographySystem.hierarchy_levels = hierarchyAnalysis.levels;

    if (hierarchyAnalysis.clarity > 0.7) {
      typographySystem.strengths.push('Clear typographic hierarchy');
      typographySystem.consistency_score += 0.3;
    } else {
      typographySystem.issues.push('Unclear typographic hierarchy');
    }

    // Check for reasonable font size range
    const minSize = Math.min(...typographySystem.font_sizes);
    const maxSize = Math.max(...typographySystem.font_sizes);
    const sizeRange = maxSize / minSize;

    if (sizeRange >= 2 && sizeRange <= 6) {
      typographySystem.strengths.push('Appropriate font size range');
      typographySystem.consistency_score += 0.2;
    } else if (sizeRange > 8) {
      typographySystem.issues.push('Very large font size range may impact consistency');
    }

    return typographySystem;
  }

  /**
   * Analyze spacing system compliance
   */
  async analyzeSpacingSystem(analysisResult) {
    const components = analysisResult.components || [];
    const layoutAnalysis = analysisResult.layout_analysis || {};

    const spacingSystem = {
      spacing_values: [],
      scale_type: 'unknown',
      consistency_score: 0,
      grid_compliance: false,
      issues: [],
      strengths: []
    };

    if (components.length < 2) {
      spacingSystem.issues.push('Insufficient components for spacing analysis');
      return spacingSystem;
    }

    // Extract spacing values
    const spacingValues = this.extractSpacingValues(components);
    spacingSystem.spacing_values = spacingValues.unique;

    // Analyze spacing scale
    const scaleAnalysis = this.analyzeSpacingScale(spacingValues.all);
    spacingSystem.scale_type = scaleAnalysis.scale_type;
    spacingSystem.consistency_score = scaleAnalysis.consistency;

    if (scaleAnalysis.consistency > 0.7) {
      spacingSystem.strengths.push(`Follows ${scaleAnalysis.scale_type} spacing scale`);
    } else if (scaleAnalysis.consistency < 0.4) {
      spacingSystem.issues.push('Inconsistent spacing values');
    }

    // Check grid compliance
    if (layoutAnalysis.grid_analysis?.detected) {
      spacingSystem.grid_compliance = true;
      spacingSystem.strengths.push('Grid-based layout promotes consistent spacing');
      spacingSystem.consistency_score += 0.2;
    }

    // Analyze spacing distribution
    const distribution = this.analyzeSpacingDistribution(spacingValues.all);
    spacingSystem.distribution = distribution;

    if (distribution.most_common_usage > 0.4) {
      spacingSystem.strengths.push('Consistent use of primary spacing values');
      spacingSystem.consistency_score += 0.1;
    }

    return spacingSystem;
  }

  /**
   * Analyze component system compliance
   */
  async analyzeComponentSystem(analysisResult) {
    const components = analysisResult.components || [];

    const componentSystem = {
      component_types: {},
      consistency_score: 0,
      reusability_score: 0,
      standardization: {},
      issues: [],
      strengths: []
    };

    if (components.length === 0) {
      componentSystem.issues.push('No components found for analysis');
      return componentSystem;
    }

    // Group components by type
    components.forEach(comp => {
      if (!componentSystem.component_types[comp.type]) {
        componentSystem.component_types[comp.type] = [];
      }
      componentSystem.component_types[comp.type].push(comp);
    });

    // Analyze each component type
    for (const [type, typeComponents] of Object.entries(componentSystem.component_types)) {
      if (typeComponents.length >= 2) {
        const typeAnalysis = this.analyzeComponentType(type, typeComponents);
        componentSystem.standardization[type] = typeAnalysis;

        if (typeAnalysis.consistency > 0.7) {
          componentSystem.strengths.push(`Consistent ${type} components`);
          componentSystem.consistency_score += 0.1;
        } else if (typeAnalysis.consistency < 0.4) {
          componentSystem.issues.push(`Inconsistent ${type} components`);
        }
      }
    }

    // Calculate reusability score
    const reusableTypes = Object.values(componentSystem.component_types)
      .filter(typeComponents => typeComponents.length >= 2);

    componentSystem.reusability_score = reusableTypes.length / Object.keys(componentSystem.component_types).length;

    if (componentSystem.reusability_score > 0.6) {
      componentSystem.strengths.push('High component reusability');
    } else if (componentSystem.reusability_score < 0.3) {
      componentSystem.issues.push('Low component reusability');
    }

    return componentSystem;
  }

  /**
   * Analyze layout system compliance
   */
  async analyzeLayoutSystem(analysisResult) {
    const layoutAnalysis = analysisResult.layout_analysis || {};
    const components = analysisResult.components || [];

    const layoutSystem = {
      layout_type: layoutAnalysis.layout_type || 'unknown',
      consistency_score: 0,
      alignment_quality: 0,
      responsive_indicators: [],
      issues: [],
      strengths: []
    };

    // Analyze alignment quality
    const alignmentAnalysis = layoutAnalysis.alignment_analysis || {};
    if (alignmentAnalysis.horizontal_groups || alignmentAnalysis.vertical_groups) {
      const totalElements = components.length;
      const alignedElements = (alignmentAnalysis.horizontal_groups?.reduce((sum, group) => sum + group.elements.length, 0) || 0) +
                            (alignmentAnalysis.vertical_groups?.reduce((sum, group) => sum + group.elements.length, 0) || 0);

      layoutSystem.alignment_quality = Math.min(alignedElements / totalElements, 1);

      if (layoutSystem.alignment_quality > 0.7) {
        layoutSystem.strengths.push('Strong element alignment');
        layoutSystem.consistency_score += 0.3;
      } else if (layoutSystem.alignment_quality < 0.4) {
        layoutSystem.issues.push('Poor element alignment');
      }
    }

    // Check for grid system usage
    if (layoutAnalysis.grid_analysis?.detected) {
      layoutSystem.strengths.push('Grid-based layout system');
      layoutSystem.consistency_score += 0.4;

      const grid = layoutAnalysis.grid_analysis;
      if (grid.regularity > 0.8) {
        layoutSystem.strengths.push('Highly regular grid structure');
        layoutSystem.consistency_score += 0.2;
      }
    }

    // Analyze spacing consistency
    if (layoutAnalysis.spacing_analysis) {
      const hSpacing = layoutAnalysis.spacing_analysis.horizontal_spacing;
      const vSpacing = layoutAnalysis.spacing_analysis.vertical_spacing;

      const avgConsistency = ((hSpacing?.consistency || 0) + (vSpacing?.consistency || 0)) / 2;

      if (avgConsistency > 0.7) {
        layoutSystem.strengths.push('Consistent spacing throughout layout');
        layoutSystem.consistency_score += 0.1;
      } else if (avgConsistency < 0.4) {
        layoutSystem.issues.push('Inconsistent spacing in layout');
      }
    }

    // Check for responsive design indicators
    const responsiveIndicators = this.detectResponsiveIndicators(analysisResult);
    layoutSystem.responsive_indicators = responsiveIndicators;

    if (responsiveIndicators.length > 0) {
      layoutSystem.strengths.push(`${responsiveIndicators.length} responsive design indicators`);
      layoutSystem.consistency_score += 0.1;
    }

    return layoutSystem;
  }

  /**
   * Identify semantic colors (success, error, warning, info)
   */
  identifySemanticColors(colors) {
    const semanticColors = [];

    colors.forEach(color => {
      const hsl = this.hexToHSL(color.hex);

      // Green range - success
      if (hsl.h >= 90 && hsl.h <= 150 && hsl.s > 0.3) {
        semanticColors.push({ ...color, semantic: 'success' });
      }
      // Red range - error/danger
      else if ((hsl.h >= 0 && hsl.h <= 20) || (hsl.h >= 340 && hsl.h <= 360)) {
        if (hsl.s > 0.3) {
          semanticColors.push({ ...color, semantic: 'error' });
        }
      }
      // Yellow/Orange range - warning
      else if (hsl.h >= 35 && hsl.h <= 65 && hsl.s > 0.4) {
        semanticColors.push({ ...color, semantic: 'warning' });
      }
      // Blue range - info
      else if (hsl.h >= 190 && hsl.h <= 250 && hsl.s > 0.3) {
        semanticColors.push({ ...color, semantic: 'info' });
      }
    });

    return semanticColors;
  }

  /**
   * Analyze color distribution patterns
   */
  analyzeColorDistribution(colors) {
    if (colors.length === 0) return { primary_dominance: 0 };

    const totalPercentage = colors.reduce((sum, color) => sum + color.percentage, 0);
    const primaryColor = colors[0];

    return {
      primary_dominance: primaryColor.percentage / totalPercentage,
      top_3_dominance: colors.slice(0, 3).reduce((sum, color) => sum + color.percentage, 0) / totalPercentage,
      distribution_evenness: this.calculateDistributionEvenness(colors)
    };
  }

  /**
   * Calculate distribution evenness (lower values = more even distribution)
   */
  calculateDistributionEvenness(colors) {
    const percentages = colors.map(color => color.percentage);
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / percentages.length;
    return Math.sqrt(variance) / avg;
  }

  /**
   * Analyze typography scale
   */
  analyzeTypeScale(fontSizes) {
    if (fontSizes.length < 2) {
      return { scale_type: 'insufficient_data', consistency: 0, ratio: 0 };
    }

    const ratios = [];
    for (let i = 1; i < fontSizes.length; i++) {
      ratios.push(fontSizes[i] / fontSizes[i - 1]);
    }

    // Check against known modular scales
    const scaleChecks = [];
    for (const [scaleName, expectedRatio] of Object.entries(this.designSystemPatterns.typography.modular_scales)) {
      const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      const ratioConsistency = 1 - Math.abs(avgRatio - expectedRatio) / expectedRatio;

      if (ratioConsistency > 0.7) {
        scaleChecks.push({ scale: scaleName, consistency: ratioConsistency, ratio: expectedRatio });
      }
    }

    if (scaleChecks.length > 0) {
      const bestScale = scaleChecks.reduce((best, current) =>
        current.consistency > best.consistency ? current : best
      );
      return {
        scale_type: bestScale.scale,
        consistency: bestScale.consistency,
        ratio: bestScale.ratio
      };
    }

    // Check against common font sizes
    const commonSizeMatches = fontSizes.filter(size =>
      this.designSystemPatterns.typography.common_scales.includes(size)
    );

    const commonSizeConsistency = commonSizeMatches.length / fontSizes.length;

    return {
      scale_type: commonSizeConsistency > 0.6 ? 'common_sizes' : 'custom',
      consistency: commonSizeConsistency,
      ratio: ratios.reduce((a, b) => a + b, 0) / ratios.length
    };
  }

  /**
   * Analyze typography hierarchy
   */
  analyzeTypographyHierarchy(textElements) {
    const sizeGroups = {};

    textElements.forEach(text => {
      const size = text.font_info?.estimated_size;
      if (size) {
        const roundedSize = Math.round(size / 2) * 2; // Group similar sizes
        if (!sizeGroups[roundedSize]) {
          sizeGroups[roundedSize] = [];
        }
        sizeGroups[roundedSize].push(text);
      }
    });

    const levels = Object.keys(sizeGroups).map(Number).sort((a, b) => b - a);

    // Check if hierarchy makes sense (larger sizes for headers, etc.)
    let hierarchyClarity = 0;

    if (levels.length >= 2) {
      // Check if largest sizes are used for headers
      const largestSizeTexts = sizeGroups[levels[0]];
      const headerCount = largestSizeTexts.filter(text => text.type === 'header').length;

      if (headerCount / largestSizeTexts.length > 0.5) {
        hierarchyClarity += 0.4;
      }

      // Check for reasonable size differences between levels
      const sizeDifferences = [];
      for (let i = 1; i < levels.length; i++) {
        sizeDifferences.push(levels[i - 1] - levels[i]);
      }

      const avgDifference = sizeDifferences.reduce((a, b) => a + b, 0) / sizeDifferences.length;
      if (avgDifference >= 4 && avgDifference <= 12) {
        hierarchyClarity += 0.4;
      }

      // Check for consistent level usage
      const levelUsage = levels.map(level => sizeGroups[level].length);
      const usageVariance = this.calculateVariance(levelUsage);

      if (usageVariance < 0.5) {
        hierarchyClarity += 0.2;
      }
    }

    return {
      clarity: hierarchyClarity,
      levels: levels.length,
      size_groups: sizeGroups
    };
  }

  /**
   * Extract spacing values from components
   */
  extractSpacingValues(components) {
    const spacingValues = [];

    // Calculate distances between components
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i];
        const comp2 = components[j];

        // Horizontal spacing
        const horizontalSpacing = Math.abs(comp1.position.x - (comp2.position.x + comp2.position.width));
        if (horizontalSpacing < 200) {
          spacingValues.push(Math.round(horizontalSpacing));
        }

        // Vertical spacing
        const verticalSpacing = Math.abs(comp1.position.y - (comp2.position.y + comp2.position.height));
        if (verticalSpacing < 200) {
          spacingValues.push(Math.round(verticalSpacing));
        }
      }
    }

    // Also include margins from edges (if available)
    components.forEach(comp => {
      if (comp.position.x < 50) spacingValues.push(comp.position.x);
      if (comp.position.y < 50) spacingValues.push(comp.position.y);
    });

    return {
      all: spacingValues,
      unique: [...new Set(spacingValues)].sort((a, b) => a - b)
    };
  }

  /**
   * Analyze spacing scale
   */
  analyzeSpacingScale(spacingValues) {
    if (spacingValues.length === 0) {
      return { scale_type: 'no_data', consistency: 0 };
    }

    const uniqueValues = [...new Set(spacingValues)].sort((a, b) => a - b);

    // Check against common spacing scales
    const scaleMatches = {};

    for (const [scaleName, scaleValues] of Object.entries(this.designSystemPatterns.spacing)) {
      const matches = uniqueValues.filter(value =>
        scaleValues.some(scaleValue => Math.abs(value - scaleValue) <= this.options.spacingTolerance)
      );

      scaleMatches[scaleName] = matches.length / uniqueValues.length;
    }

    const bestMatch = Object.entries(scaleMatches).reduce((best, [scale, score]) =>
      score > best.score ? { scale, score } : best
    , { scale: 'custom', score: 0 });

    return {
      scale_type: bestMatch.score > 0.5 ? bestMatch.scale : 'custom',
      consistency: bestMatch.score,
      matches: scaleMatches
    };
  }

  /**
   * Analyze spacing distribution
   */
  analyzeSpacingDistribution(spacingValues) {
    const counts = {};
    spacingValues.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });

    const sortedCounts = Object.entries(counts).sort(([, a], [, b]) => b - a);
    const totalValues = spacingValues.length;

    return {
      most_common_value: parseInt(sortedCounts[0]?.[0] || 0),
      most_common_usage: (sortedCounts[0]?.[1] || 0) / totalValues,
      top_3_usage: sortedCounts.slice(0, 3).reduce((sum, [, count]) => sum + count, 0) / totalValues
    };
  }

  /**
   * Analyze component type consistency
   */
  analyzeComponentType(type, components) {
    const analysis = {
      count: components.length,
      consistency: 0,
      variations: {},
      issues: []
    };

    // Analyze size consistency
    const widths = components.map(comp => comp.position.width);
    const heights = components.map(comp => comp.position.height);

    const widthConsistency = 1 - this.calculateVariance(widths);
    const heightConsistency = 1 - this.calculateVariance(heights);

    analysis.size_consistency = (widthConsistency + heightConsistency) / 2;

    // Analyze text content consistency (for buttons, etc.)
    if (type === 'button') {
      const textLengths = components
        .map(comp => comp.text_content?.length || 0)
        .filter(length => length > 0);

      if (textLengths.length > 0) {
        const textConsistency = 1 - this.calculateVariance(textLengths);
        analysis.text_consistency = textConsistency;
      }
    }

    // Calculate overall consistency
    analysis.consistency = analysis.size_consistency;
    if (analysis.text_consistency) {
      analysis.consistency = (analysis.consistency + analysis.text_consistency) / 2;
    }

    return analysis;
  }

  /**
   * Detect responsive design indicators
   */
  detectResponsiveIndicators(analysisResult) {
    const indicators = [];
    const components = analysisResult.components || [];
    const layoutAnalysis = analysisResult.layout_analysis || {};

    // Check for flexible layouts
    if (layoutAnalysis.layout_type === 'flexbox') {
      indicators.push('Flexbox layout suggests responsive design');
    }

    if (layoutAnalysis.grid_analysis?.detected) {
      indicators.push('Grid layout can adapt to different screen sizes');
    }

    // Check for relative sizing
    const imageWidth = analysisResult.image_metadata?.width || 1000;
    const relativeComponents = components.filter(comp =>
      comp.position.width / imageWidth > 0.8 || comp.position.width / imageWidth < 0.2
    );

    if (relativeComponents.length > components.length * 0.3) {
      indicators.push('Mix of full-width and narrow components suggests responsive design');
    }

    // Check for stacked layouts (mobile-first indicator)
    const verticalGroups = layoutAnalysis.alignment_analysis?.vertical_groups || [];
    if (verticalGroups.length === 1 && verticalGroups[0].elements.length > 3) {
      indicators.push('Single column layout suggests mobile-first design');
    }

    return indicators;
  }

  /**
   * Calculate overall design system compliance score
   */
  calculateOverallScore(compliance) {
    const scores = [
      compliance.color_system.consistency_score,
      compliance.typography_system.consistency_score,
      compliance.spacing_system.consistency_score,
      compliance.component_system.consistency_score,
      compliance.layout_system.consistency_score
    ];

    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0;

    return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  }

  /**
   * Generate design system recommendations
   */
  generateRecommendations(compliance) {
    const recommendations = [];

    // Color system recommendations
    if (compliance.color_system.consistency_score < 0.5) {
      recommendations.push({
        category: 'colors',
        priority: 'high',
        issue: 'Inconsistent color usage',
        recommendation: 'Define a limited color palette with primary, secondary, and accent colors'
      });
    }

    if (compliance.color_system.palette_size > 12) {
      recommendations.push({
        category: 'colors',
        priority: 'medium',
        issue: 'Large color palette',
        recommendation: 'Reduce color palette to 8-12 colors for better consistency'
      });
    }

    // Typography recommendations
    if (compliance.typography_system.consistency_score < 0.5) {
      recommendations.push({
        category: 'typography',
        priority: 'high',
        issue: 'Inconsistent typography scale',
        recommendation: 'Implement a modular typography scale (e.g., 1.25 ratio)'
      });
    }

    if (compliance.typography_system.hierarchy_clarity < 0.5) {
      recommendations.push({
        category: 'typography',
        priority: 'medium',
        issue: 'Unclear typographic hierarchy',
        recommendation: 'Establish clear size differences between heading levels'
      });
    }

    // Spacing recommendations
    if (compliance.spacing_system.consistency_score < 0.5) {
      recommendations.push({
        category: 'spacing',
        priority: 'high',
        issue: 'Inconsistent spacing values',
        recommendation: 'Define a spacing scale (e.g., 4px, 8px, 16px, 24px, 32px)'
      });
    }

    // Component recommendations
    if (compliance.component_system.reusability_score < 0.4) {
      recommendations.push({
        category: 'components',
        priority: 'medium',
        issue: 'Low component reusability',
        recommendation: 'Create reusable component variants instead of unique components'
      });
    }

    // Layout recommendations
    if (compliance.layout_system.alignment_quality < 0.5) {
      recommendations.push({
        category: 'layout',
        priority: 'medium',
        issue: 'Poor element alignment',
        recommendation: 'Use grid or flexbox layouts for better alignment'
      });
    }

    return recommendations;
  }

  // Helper methods
  hexToHSL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return variance / (avg * avg + 1);
  }
}

module.exports = DesignSystemAnalyzer;
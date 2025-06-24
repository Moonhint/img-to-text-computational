class LayoutAnalyzer {
  constructor(options = {}) {
    this.options = {
      gridTolerance: options.gridTolerance || 15, // pixels
      alignmentTolerance: options.alignmentTolerance || 10, // pixels
      minGridElements: options.minGridElements || 3,
      ...options
    };
  }

  /**
   * Analyze layout patterns in visual elements
   * @param {Array} elements - Array of visual elements with positions
   * @param {Object} imageMetadata - Image dimensions and metadata
   * @returns {Promise<Object>} Layout analysis results
   */
  async analyze(elements, imageMetadata) {
    try {
      const analysis = {
        layout_type: this.detectLayoutType(elements, imageMetadata),
        grid_analysis: this.analyzeGrid(elements),
        alignment_analysis: this.analyzeAlignment(elements),
        spacing_analysis: this.analyzeSpacing(elements),
        layout_patterns: this.detectLayoutPatterns(elements),
        responsive_indicators: this.detectResponsivePatterns(elements, imageMetadata),
        layout_statistics: this.calculateLayoutStatistics(elements, imageMetadata)
      };

      // Add layout quality assessment
      analysis.layout_quality = this.assessLayoutQuality(analysis);

      return analysis;
    } catch (error) {
      throw new Error(`Layout analysis failed: ${error.message}`);
    }
  }

  /**
   * Detect primary layout type
   */
  detectLayoutType(elements, imageMetadata) {
    if (elements.length === 0) return 'empty';
    
    const gridScore = this.calculateGridScore(elements);
    const flexScore = this.calculateFlexScore(elements);
    const flowScore = this.calculateFlowScore(elements);
    
    // Determine primary layout type
    if (gridScore > 0.7) return 'grid';
    if (flexScore > 0.6) return 'flexbox';
    if (flowScore > 0.5) return 'flow';
    
    return 'custom';
  }

  /**
   * Analyze grid patterns
   */
  analyzeGrid(elements) {
    const grid = {
      detected: false,
      rows: 0,
      columns: 0,
      cells: [],
      regularity: 0,
      alignment_score: 0
    };

    if (elements.length < this.options.minGridElements) {
      return grid;
    }

    // Group elements by rows and columns
    const rows = this.groupByRows(elements);
    const columns = this.groupByColumns(elements);

    // Check for regular grid pattern
    if (rows.length >= 2 && columns.length >= 2) {
      const isRegularGrid = this.isRegularGrid(rows, columns);
      
      if (isRegularGrid) {
        grid.detected = true;
        grid.rows = rows.length;
        grid.columns = columns.length;
        grid.cells = this.createGridCells(rows, columns);
        grid.regularity = this.calculateGridRegularity(rows, columns);
        grid.alignment_score = this.calculateGridAlignment(elements);
      }
    }

    return grid;
  }

  /**
   * Group elements by horizontal rows
   */
  groupByRows(elements) {
    const rows = [];
    const sortedElements = [...elements].sort((a, b) => a.position.y - b.position.y);
    
    let currentRow = [];
    let currentY = sortedElements[0]?.position.y;
    
    for (const element of sortedElements) {
      if (Math.abs(element.position.y - currentY) <= this.options.gridTolerance) {
        currentRow.push(element);
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow.sort((a, b) => a.position.x - b.position.x));
        }
        currentRow = [element];
        currentY = element.position.y;
      }
    }
    
    if (currentRow.length > 0) {
      rows.push(currentRow.sort((a, b) => a.position.x - b.position.x));
    }
    
    return rows;
  }

  /**
   * Group elements by vertical columns
   */
  groupByColumns(elements) {
    const columns = [];
    const sortedElements = [...elements].sort((a, b) => a.position.x - b.position.x);
    
    let currentColumn = [];
    let currentX = sortedElements[0]?.position.x;
    
    for (const element of sortedElements) {
      if (Math.abs(element.position.x - currentX) <= this.options.gridTolerance) {
        currentColumn.push(element);
      } else {
        if (currentColumn.length > 0) {
          columns.push(currentColumn.sort((a, b) => a.position.y - b.position.y));
        }
        currentColumn = [element];
        currentX = element.position.x;
      }
    }
    
    if (currentColumn.length > 0) {
      columns.push(currentColumn.sort((a, b) => a.position.y - b.position.y));
    }
    
    return columns;
  }

  /**
   * Check if elements form a regular grid
   */
  isRegularGrid(rows, columns) {
    // Check if all rows have similar number of elements
    const rowSizes = rows.map(row => row.length);
    const avgRowSize = rowSizes.reduce((a, b) => a + b, 0) / rowSizes.length;
    const rowSizeVariance = rowSizes.reduce((sum, size) => sum + Math.pow(size - avgRowSize, 2), 0) / rowSizes.length;
    
    // Check if all columns have similar number of elements
    const columnSizes = columns.map(col => col.length);
    const avgColumnSize = columnSizes.reduce((a, b) => a + b, 0) / columnSizes.length;
    const columnSizeVariance = columnSizes.reduce((sum, size) => sum + Math.pow(size - avgColumnSize, 2), 0) / columnSizes.length;
    
    // Grid is regular if variance is low
    return rowSizeVariance < 1 && columnSizeVariance < 1;
  }

  /**
   * Create grid cell structure
   */
  createGridCells(rows, columns) {
    const cells = [];
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        // Find element at this grid position
        const element = this.findElementAtGridPosition(rows, columns, rowIndex, colIndex);
        
        cells.push({
          row: rowIndex,
          column: colIndex,
          element: element,
          occupied: !!element
        });
      }
    }
    
    return cells;
  }

  /**
   * Find element at specific grid position
   */
  findElementAtGridPosition(rows, columns, rowIndex, colIndex) {
    const row = rows[rowIndex];
    const column = columns[colIndex];
    
    // Find common element in both row and column
    for (const rowElement of row) {
      for (const colElement of column) {
        if (rowElement.id === colElement.id) {
          return rowElement;
        }
      }
    }
    
    return null;
  }

  /**
   * Calculate grid regularity score
   */
  calculateGridRegularity(rows, columns) {
    let totalScore = 0;
    let measurements = 0;
    
    // Check horizontal spacing consistency
    for (const row of rows) {
      if (row.length > 1) {
        const spacings = [];
        for (let i = 1; i < row.length; i++) {
          const spacing = row[i].position.x - (row[i-1].position.x + row[i-1].position.width);
          spacings.push(spacing);
        }
        
        const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        const variance = spacings.reduce((sum, spacing) => sum + Math.pow(spacing - avgSpacing, 2), 0) / spacings.length;
        const consistency = Math.max(0, 1 - (variance / 100)); // Normalize variance
        
        totalScore += consistency;
        measurements++;
      }
    }
    
    // Check vertical spacing consistency
    for (const column of columns) {
      if (column.length > 1) {
        const spacings = [];
        for (let i = 1; i < column.length; i++) {
          const spacing = column[i].position.y - (column[i-1].position.y + column[i-1].position.height);
          spacings.push(spacing);
        }
        
        const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        const variance = spacings.reduce((sum, spacing) => sum + Math.pow(spacing - avgSpacing, 2), 0) / spacings.length;
        const consistency = Math.max(0, 1 - (variance / 100));
        
        totalScore += consistency;
        measurements++;
      }
    }
    
    return measurements > 0 ? totalScore / measurements : 0;
  }

  /**
   * Calculate grid alignment score
   */
  calculateGridAlignment(elements) {
    let alignmentScore = 0;
    let alignmentChecks = 0;
    
    // Check horizontal alignment
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elem1 = elements[i];
        const elem2 = elements[j];
        
        // Check if elements are horizontally aligned
        if (Math.abs(elem1.position.y - elem2.position.y) <= this.options.alignmentTolerance) {
          alignmentScore += 1;
        }
        
        // Check if elements are vertically aligned
        if (Math.abs(elem1.position.x - elem2.position.x) <= this.options.alignmentTolerance) {
          alignmentScore += 1;
        }
        
        alignmentChecks += 2;
      }
    }
    
    return alignmentChecks > 0 ? alignmentScore / alignmentChecks : 0;
  }

  /**
   * Analyze element alignment
   */
  analyzeAlignment(elements) {
    return {
      horizontal_groups: this.findHorizontallyAlignedGroups(elements),
      vertical_groups: this.findVerticallyAlignedGroups(elements),
      edge_alignments: this.findEdgeAlignments(elements),
      center_alignments: this.findCenterAlignments(elements)
    };
  }

  /**
   * Find horizontally aligned groups
   */
  findHorizontallyAlignedGroups(elements) {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < elements.length; i++) {
      if (processed.has(i)) continue;
      
      const group = [elements[i]];
      processed.add(i);
      
      for (let j = i + 1; j < elements.length; j++) {
        if (processed.has(j)) continue;
        
        if (Math.abs(elements[i].position.y - elements[j].position.y) <= this.options.alignmentTolerance) {
          group.push(elements[j]);
          processed.add(j);
        }
      }
      
      if (group.length > 1) {
        groups.push({
          elements: group,
          y_position: elements[i].position.y,
          alignment_quality: this.calculateAlignmentQuality(group, 'horizontal')
        });
      }
    }
    
    return groups;
  }

  /**
   * Find vertically aligned groups
   */
  findVerticallyAlignedGroups(elements) {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < elements.length; i++) {
      if (processed.has(i)) continue;
      
      const group = [elements[i]];
      processed.add(i);
      
      for (let j = i + 1; j < elements.length; j++) {
        if (processed.has(j)) continue;
        
        if (Math.abs(elements[i].position.x - elements[j].position.x) <= this.options.alignmentTolerance) {
          group.push(elements[j]);
          processed.add(j);
        }
      }
      
      if (group.length > 1) {
        groups.push({
          elements: group,
          x_position: elements[i].position.x,
          alignment_quality: this.calculateAlignmentQuality(group, 'vertical')
        });
      }
    }
    
    return groups;
  }

  /**
   * Calculate alignment quality for a group
   */
  calculateAlignmentQuality(group, direction) {
    if (group.length < 2) return 0;
    
    const positions = group.map(elem => 
      direction === 'horizontal' ? elem.position.y : elem.position.x
    );
    
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
    const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - avgPosition, 2), 0) / positions.length;
    
    // Lower variance = better alignment
    return Math.max(0, 1 - (variance / 100));
  }

  /**
   * Find edge alignments (left, right, top, bottom)
   */
  findEdgeAlignments(elements) {
    const alignments = {
      left_aligned: [],
      right_aligned: [],
      top_aligned: [],
      bottom_aligned: []
    };
    
    // Group by edge positions
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elem1 = elements[i];
        const elem2 = elements[j];
        
        // Left edge alignment
        if (Math.abs(elem1.position.x - elem2.position.x) <= this.options.alignmentTolerance) {
          alignments.left_aligned.push([elem1, elem2]);
        }
        
        // Right edge alignment
        const right1 = elem1.position.x + elem1.position.width;
        const right2 = elem2.position.x + elem2.position.width;
        if (Math.abs(right1 - right2) <= this.options.alignmentTolerance) {
          alignments.right_aligned.push([elem1, elem2]);
        }
        
        // Top edge alignment
        if (Math.abs(elem1.position.y - elem2.position.y) <= this.options.alignmentTolerance) {
          alignments.top_aligned.push([elem1, elem2]);
        }
        
        // Bottom edge alignment
        const bottom1 = elem1.position.y + elem1.position.height;
        const bottom2 = elem2.position.y + elem2.position.height;
        if (Math.abs(bottom1 - bottom2) <= this.options.alignmentTolerance) {
          alignments.bottom_aligned.push([elem1, elem2]);
        }
      }
    }
    
    return alignments;
  }

  /**
   * Find center alignments
   */
  findCenterAlignments(elements) {
    const alignments = {
      horizontal_center: [],
      vertical_center: []
    };
    
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const elem1 = elements[i];
        const elem2 = elements[j];
        
        // Horizontal center alignment
        const centerY1 = elem1.position.y + elem1.position.height / 2;
        const centerY2 = elem2.position.y + elem2.position.height / 2;
        if (Math.abs(centerY1 - centerY2) <= this.options.alignmentTolerance) {
          alignments.horizontal_center.push([elem1, elem2]);
        }
        
        // Vertical center alignment
        const centerX1 = elem1.position.x + elem1.position.width / 2;
        const centerX2 = elem2.position.x + elem2.position.width / 2;
        if (Math.abs(centerX1 - centerX2) <= this.options.alignmentTolerance) {
          alignments.vertical_center.push([elem1, elem2]);
        }
      }
    }
    
    return alignments;
  }

  /**
   * Analyze spacing patterns
   */
  analyzeSpacing(elements) {
    const spacing = {
      horizontal_spacing: this.calculateHorizontalSpacing(elements),
      vertical_spacing: this.calculateVerticalSpacing(elements),
      margin_analysis: this.analyzeMargins(elements),
      padding_estimation: this.estimatePadding(elements)
    };
    
    return spacing;
  }

  /**
   * Calculate horizontal spacing patterns
   */
  calculateHorizontalSpacing(elements) {
    const spacings = [];
    const sortedElements = [...elements].sort((a, b) => a.position.x - b.position.x);
    
    for (let i = 1; i < sortedElements.length; i++) {
      const prevElement = sortedElements[i - 1];
      const currentElement = sortedElements[i];
      
      // Check if elements are on the same horizontal level
      if (Math.abs(prevElement.position.y - currentElement.position.y) <= this.options.alignmentTolerance) {
        const spacing = currentElement.position.x - (prevElement.position.x + prevElement.position.width);
        if (spacing >= 0) {
          spacings.push(spacing);
        }
      }
    }
    
    return this.analyzeSpacingArray(spacings);
  }

  /**
   * Calculate vertical spacing patterns
   */
  calculateVerticalSpacing(elements) {
    const spacings = [];
    const sortedElements = [...elements].sort((a, b) => a.position.y - b.position.y);
    
    for (let i = 1; i < sortedElements.length; i++) {
      const prevElement = sortedElements[i - 1];
      const currentElement = sortedElements[i];
      
      // Check if elements are on the same vertical line
      if (Math.abs(prevElement.position.x - currentElement.position.x) <= this.options.alignmentTolerance) {
        const spacing = currentElement.position.y - (prevElement.position.y + prevElement.position.height);
        if (spacing >= 0) {
          spacings.push(spacing);
        }
      }
    }
    
    return this.analyzeSpacingArray(spacings);
  }

  /**
   * Analyze array of spacing values
   */
  analyzeSpacingArray(spacings) {
    if (spacings.length === 0) {
      return { count: 0, average: 0, consistency: 0, common_values: [] };
    }
    
    const average = spacings.reduce((a, b) => a + b, 0) / spacings.length;
    const variance = spacings.reduce((sum, spacing) => sum + Math.pow(spacing - average, 2), 0) / spacings.length;
    const consistency = Math.max(0, 1 - (variance / (average * average + 1)));
    
    // Find common spacing values
    const spacingCounts = {};
    spacings.forEach(spacing => {
      const rounded = Math.round(spacing / 5) * 5; // Round to nearest 5
      spacingCounts[rounded] = (spacingCounts[rounded] || 0) + 1;
    });
    
    const commonValues = Object.entries(spacingCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([value, count]) => ({ value: parseInt(value), count }));
    
    return {
      count: spacings.length,
      average: Math.round(average),
      consistency: consistency,
      common_values: commonValues
    };
  }

  /**
   * Analyze margins
   */
  analyzeMargins(elements) {
    // This is a simplified margin estimation
    // In a real implementation, you'd need more sophisticated analysis
    return {
      estimated_margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      margin_consistency: 0.8
    };
  }

  /**
   * Estimate padding
   */
  estimatePadding(elements) {
    // Simplified padding estimation
    return {
      estimated_padding: {
        horizontal: 15,
        vertical: 10
      },
      padding_consistency: 0.7
    };
  }

  /**
   * Calculate grid score
   */
  calculateGridScore(elements) {
    const rows = this.groupByRows(elements);
    const columns = this.groupByColumns(elements);
    
    if (rows.length < 2 || columns.length < 2) return 0;
    
    const regularityScore = this.calculateGridRegularity(rows, columns);
    const alignmentScore = this.calculateGridAlignment(elements);
    
    return (regularityScore + alignmentScore) / 2;
  }

  /**
   * Calculate flexbox score
   */
  calculateFlexScore(elements) {
    // Look for flexbox patterns: items in a row or column with similar sizes
    const rows = this.groupByRows(elements);
    const columns = this.groupByColumns(elements);
    
    let flexScore = 0;
    
    // Check for flex row patterns
    for (const row of rows) {
      if (row.length >= 2) {
        const widths = row.map(elem => elem.position.width);
        const heights = row.map(elem => elem.position.height);
        
        // Check for similar heights (flex-direction: row)
        const heightVariance = this.calculateVariance(heights);
        if (heightVariance < 0.1) {
          flexScore += 0.3;
        }
      }
    }
    
    // Check for flex column patterns
    for (const column of columns) {
      if (column.length >= 2) {
        const widths = column.map(elem => elem.position.width);
        
        // Check for similar widths (flex-direction: column)
        const widthVariance = this.calculateVariance(widths);
        if (widthVariance < 0.1) {
          flexScore += 0.3;
        }
      }
    }
    
    return Math.min(flexScore, 1);
  }

  /**
   * Calculate flow score
   */
  calculateFlowScore(elements) {
    // Look for document flow patterns
    const sortedByPosition = [...elements].sort((a, b) => 
      a.position.y - b.position.y || a.position.x - b.position.x
    );
    
    let flowScore = 0;
    
    for (let i = 1; i < sortedByPosition.length; i++) {
      const prev = sortedByPosition[i - 1];
      const current = sortedByPosition[i];
      
      // Check if elements follow reading order (left to right, top to bottom)
      if (current.position.y >= prev.position.y) {
        flowScore += 0.1;
      }
    }
    
    return Math.min(flowScore, 1);
  }

  /**
   * Calculate variance of an array
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
    
    return variance / (average * average + 1); // Normalized variance
  }

  /**
   * Detect layout patterns
   */
  detectLayoutPatterns(elements) {
    const patterns = [];
    
    // Detect common layout patterns
    const headerPattern = this.detectHeaderPattern(elements);
    if (headerPattern) patterns.push(headerPattern);
    
    const sidebarPattern = this.detectSidebarPattern(elements);
    if (sidebarPattern) patterns.push(sidebarPattern);
    
    const cardLayoutPattern = this.detectCardLayoutPattern(elements);
    if (cardLayoutPattern) patterns.push(cardLayoutPattern);
    
    return patterns;
  }

  /**
   * Detect header pattern
   */
  detectHeaderPattern(elements) {
    const topElements = elements.filter(elem => elem.position.y < 100);
    
    if (topElements.length >= 2) {
      const spans = topElements.some(elem => 
        elem.position.width > (elements[0]?.position?.width || 0) * 0.8
      );
      
      if (spans) {
        return {
          pattern: 'header',
          confidence: 0.8,
          elements: topElements.length
        };
      }
    }
    
    return null;
  }

  /**
   * Detect sidebar pattern
   */
  detectSidebarPattern(elements) {
    const leftElements = elements.filter(elem => elem.position.x < 200);
    const rightElements = elements.filter(elem => elem.position.x > 600);
    
    if (leftElements.length >= 3 || rightElements.length >= 3) {
      return {
        pattern: 'sidebar',
        confidence: 0.7,
        side: leftElements.length >= 3 ? 'left' : 'right',
        elements: Math.max(leftElements.length, rightElements.length)
      };
    }
    
    return null;
  }

  /**
   * Detect card layout pattern
   */
  detectCardLayoutPattern(elements) {
    const rectangularElements = elements.filter(elem => 
      elem.type === 'rectangle' && elem.aspect_ratio && elem.aspect_ratio > 0.5 && elem.aspect_ratio < 2
    );
    
    if (rectangularElements.length >= 3) {
      return {
        pattern: 'card_layout',
        confidence: 0.9,
        elements: rectangularElements.length
      };
    }
    
    return null;
  }

  /**
   * Detect responsive patterns
   */
  detectResponsivePatterns(elements, imageMetadata) {
    const patterns = [];
    
    // Check for mobile-first indicators
    if (imageMetadata.width < 768) {
      patterns.push({
        pattern: 'mobile_layout',
        indicators: ['small_viewport', 'stacked_elements']
      });
    }
    
    // Check for tablet indicators
    if (imageMetadata.width >= 768 && imageMetadata.width < 1024) {
      patterns.push({
        pattern: 'tablet_layout',
        indicators: ['medium_viewport', 'adaptive_columns']
      });
    }
    
    // Check for desktop indicators
    if (imageMetadata.width >= 1024) {
      patterns.push({
        pattern: 'desktop_layout',
        indicators: ['large_viewport', 'multi_column']
      });
    }
    
    return patterns;
  }

  /**
   * Calculate layout statistics
   */
  calculateLayoutStatistics(elements, imageMetadata) {
    return {
      total_elements: elements.length,
      viewport_dimensions: {
        width: imageMetadata.width,
        height: imageMetadata.height,
        aspect_ratio: imageMetadata.width / imageMetadata.height
      },
      element_density: elements.length / (imageMetadata.width * imageMetadata.height / 10000),
      average_element_size: this.calculateAverageElementSize(elements),
      layout_efficiency: this.calculateLayoutEfficiency(elements, imageMetadata)
    };
  }

  /**
   * Calculate average element size
   */
  calculateAverageElementSize(elements) {
    if (elements.length === 0) return { width: 0, height: 0 };
    
    const totalWidth = elements.reduce((sum, elem) => sum + elem.position.width, 0);
    const totalHeight = elements.reduce((sum, elem) => sum + elem.position.height, 0);
    
    return {
      width: Math.round(totalWidth / elements.length),
      height: Math.round(totalHeight / elements.length)
    };
  }

  /**
   * Calculate layout efficiency
   */
  calculateLayoutEfficiency(elements, imageMetadata) {
    const totalElementArea = elements.reduce((sum, elem) => 
      sum + (elem.position.width * elem.position.height), 0
    );
    
    const totalImageArea = imageMetadata.width * imageMetadata.height;
    const coverage = totalElementArea / totalImageArea;
    
    // Efficient layout has good coverage but not too dense
    const efficiency = coverage > 0.6 ? Math.max(0, 1 - (coverage - 0.6) * 2) : coverage;
    
    return Math.min(efficiency, 1);
  }

  /**
   * Assess overall layout quality
   */
  assessLayoutQuality(analysis) {
    let qualityScore = 0;
    let factors = 0;
    
    // Grid quality
    if (analysis.grid_analysis.detected) {
      qualityScore += analysis.grid_analysis.regularity * 0.3;
      factors += 0.3;
    }
    
    // Alignment quality
    const alignmentScore = (
      analysis.alignment_analysis.horizontal_groups.length +
      analysis.alignment_analysis.vertical_groups.length
    ) / Math.max(1, analysis.layout_statistics.total_elements / 2);
    
    qualityScore += Math.min(alignmentScore, 1) * 0.3;
    factors += 0.3;
    
    // Spacing consistency
    const spacingScore = (
      analysis.spacing_analysis.horizontal_spacing.consistency +
      analysis.spacing_analysis.vertical_spacing.consistency
    ) / 2;
    
    qualityScore += spacingScore * 0.2;
    factors += 0.2;
    
    // Layout efficiency
    qualityScore += analysis.layout_statistics.layout_efficiency * 0.2;
    factors += 0.2;
    
    const overallScore = factors > 0 ? qualityScore / factors : 0;
    
    return {
      score: overallScore,
      rating: this.getQualityRating(overallScore),
      factors: {
        grid_quality: analysis.grid_analysis.detected ? analysis.grid_analysis.regularity : 0,
        alignment_quality: Math.min(alignmentScore, 1),
        spacing_consistency: spacingScore,
        layout_efficiency: analysis.layout_statistics.layout_efficiency
      }
    };
  }

  /**
   * Get quality rating from score
   */
  getQualityRating(score) {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }
}

module.exports = LayoutAnalyzer; 
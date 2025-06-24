const ImageProcessor = require('./core/imageProcessor');
const OCREngine = require('./core/ocrEngine');
const VisionAnalyzer = require('./core/visionAnalyzer');
const ColorAnalyzer = require('./algorithms/colorAnalysis');
const LayoutAnalyzer = require('./core/layoutAnalyzer');
const ComponentClassifier = require('./rules/componentClassifier');

// Advanced pattern recognition and analysis
const PatternRecognitionEngine = require('./algorithms/patternRecognition');
const DesignSystemAnalyzer = require('./algorithms/designSystemAnalyzer');
const ComponentRelationshipMapper = require('./algorithms/componentRelationshipMapper');
const MultiLanguageOCR = require('./algorithms/multiLanguageOCR');
const PerformanceOptimizer = require('./algorithms/performanceOptimizer');

// Export modules
const SVGExporter = require('./exporters/svgExporter');
const XMLExporter = require('./exporters/xmlExporter');

const { formatOutput, saveResult, displayResult } = require('./utils/formatters');
const { validateImage, validateOptions } = require('./utils/validators');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class ImageToText {
  constructor(options = {}) {
    this.config = {
      outputFormat: options.outputFormat || 'json',
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      ocrLanguage: options.ocrLanguage || 'eng',
      precision: options.precision || 'standard', // fast, standard, high
      enableOCR: options.enableOCR !== false,
      enableShapeDetection: options.enableShapeDetection !== false,
      enableColorAnalysis: options.enableColorAnalysis !== false,
      enableLayoutAnalysis: options.enableLayoutAnalysis !== false,
      enableAdvancedPatterns: options.enableAdvancedPatterns !== false,
      enableDesignSystemAnalysis: options.enableDesignSystemAnalysis !== false,
      enableComponentRelationships: options.enableComponentRelationships !== false,
      enableMultiLanguageOCR: options.enableMultiLanguageOCR !== false,
      enablePerformanceOptimization: options.enablePerformanceOptimization !== false,
      verbose: options.verbose || false,
      ...options
    };

    // Initialize core components
    this.imageProcessor = new ImageProcessor(this.config);
    this.ocrEngine = new OCREngine({
      language: this.config.ocrLanguage,
      verbose: this.config.verbose
    });
    this.visionAnalyzer = new VisionAnalyzer(this.config);
    this.colorAnalyzer = new ColorAnalyzer(this.config);
    this.layoutAnalyzer = new LayoutAnalyzer(this.config);
    this.componentClassifier = new ComponentClassifier(this.config);

    // Initialize advanced components
    this.patternRecognition = new PatternRecognitionEngine(this.config);
    this.designSystemAnalyzer = new DesignSystemAnalyzer(this.config);
    this.componentRelationshipMapper = new ComponentRelationshipMapper(this.config);
    this.multiLanguageOCR = new MultiLanguageOCR(this.config);
    this.performanceOptimizer = new PerformanceOptimizer(this.config);

    // Initialize exporters
    this.svgExporter = new SVGExporter(this.config);
    this.xmlExporter = new XMLExporter(this.config);
  }

  /**
   * Analyze a single image using computational methods
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Complete analysis result
   */
  async analyze(imagePath, options = {}) {
    try {
      if (this.config.verbose) {
        console.log(chalk.blue(`Starting computational analysis of: ${path.basename(imagePath)}`));
      }

      // Validate inputs
      await validateImage(imagePath);
      validateOptions(options);

      const analysisOptions = {
        extractText: options.extractText !== false,
        detectShapes: options.detectShapes !== false,
        analyzeColors: options.analyzeColors !== false,
        analyzeLayout: options.analyzeLayout !== false,
        classifyComponents: options.classifyComponents !== false,
        ...options
      };

      // Step 1: Process and prepare image
      if (this.config.verbose) console.log(chalk.yellow('1. Processing image...'));
      const { buffer, metadata } = await this.imageProcessor.process(imagePath);

      const result = {
        image_metadata: {
          file_path: imagePath,
          file_name: path.basename(imagePath),
          dimensions: `${metadata.width}x${metadata.height}`,
          format: metadata.format?.toUpperCase(),
          file_size: this.formatFileSize(metadata.size),
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels,
          density: metadata.density || null,
          analyzed_at: new Date().toISOString()
        }
      };

      // Step 2: OCR Text Extraction (with multi-language support)
      if (analysisOptions.extractText && this.config.enableOCR) {
        if (this.config.verbose) console.log(chalk.yellow('2. Extracting text with OCR...'));

        if (this.config.enableMultiLanguageOCR) {
          result.text_extraction = await this.multiLanguageOCR.processImage(buffer, {
            language: this.config.ocrLanguage,
            autoDetectLanguage: true
          });
        } else {
          result.text_extraction = await this.ocrEngine.extractText(buffer);
        }
      }

      // Step 3: Computer Vision Analysis
      if (analysisOptions.detectShapes && this.config.enableShapeDetection) {
        if (this.config.verbose) console.log(chalk.yellow('3. Detecting shapes and visual elements...'));
        result.vision_analysis = await this.visionAnalyzer.analyze(buffer);
      }

      // Step 4: Color Analysis
      if (analysisOptions.analyzeColors && this.config.enableColorAnalysis) {
        if (this.config.verbose) console.log(chalk.yellow('4. Analyzing colors...'));
        result.color_analysis = await this.colorAnalyzer.analyze(buffer);
      }

      // Step 5: Layout Analysis
      if (analysisOptions.analyzeLayout && this.config.enableLayoutAnalysis) {
        if (this.config.verbose) console.log(chalk.yellow('5. Analyzing layout...'));
        const components = result.vision_analysis?.visual_elements || [];
        result.layout_analysis = await this.layoutAnalyzer.analyze(components, metadata);
      }

      // Step 6: Component Classification
      if (analysisOptions.classifyComponents) {
        if (this.config.verbose) console.log(chalk.yellow('6. Classifying UI components...'));
        result.components = await this.classifyComponents(result);
      }

      // Step 7: Advanced Pattern Recognition
      if (this.config.enableAdvancedPatterns) {
        if (this.config.verbose) console.log(chalk.yellow('7. Analyzing advanced patterns...'));
        result.advanced_patterns = await this.patternRecognition.analyzePatterns(result);
      }

      // Step 8: Component Relationship Mapping
      if (this.config.enableComponentRelationships && result.components) {
        if (this.config.verbose) console.log(chalk.yellow('8. Mapping component relationships...'));
        result.component_relationships = await this.componentRelationshipMapper.mapComponentRelationships(
          result.components,
          result.layout_analysis,
          result.text_extraction
        );
      }

      // Step 9: Design System Compliance Analysis
      if (this.config.enableDesignSystemAnalysis) {
        if (this.config.verbose) console.log(chalk.yellow('9. Analyzing design system compliance...'));
        result.design_system_compliance = await this.designSystemAnalyzer.analyzeDesignSystemCompliance(result);
      }

      // Step 10: Generate Computational Recommendations
      if (this.config.verbose) console.log(chalk.yellow('10. Generating recommendations...'));
      result.computed_recommendations = await this.generateRecommendations(result);

      // Step 11: Calculate Analysis Statistics
      result.analysis_statistics = this.calculateStatistics(result);

      if (this.config.verbose) {
        console.log(chalk.green('✓ Analysis completed successfully'));
        this.displaySummary(result);
      }

      return result;

    } catch (error) {
      throw new Error(`Computational analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple images in batch
   * @param {Array|string} input - Array of image paths or directory path
   * @param {Object} options - Batch analysis options
   * @returns {Promise<Array>} Array of analysis results
   */
  async batchAnalyze(input, options = {}) {
    let imagePaths = [];

    if (typeof input === 'string') {
      // Input is a directory path
      const glob = require('glob');
      const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'];

      for (const ext of imageExtensions) {
        const pattern = path.join(input, `**/*.${ext}`);
        const files = glob.sync(pattern, { nocase: true });
        imagePaths = imagePaths.concat(files);
      }
    } else if (Array.isArray(input)) {
      imagePaths = input;
    } else {
      throw new Error('Input must be an array of image paths or a directory path');
    }

    if (imagePaths.length === 0) {
      throw new Error('No image files found');
    }

    const results = [];
    const outputDir = options.outputDir;

    // Ensure output directory exists
    if (outputDir) {
      await fs.ensureDir(outputDir);
    }

    console.log(chalk.blue(`Processing ${imagePaths.length} images...`));

    // Process images sequentially for memory management
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const fileName = path.basename(imagePath, path.extname(imagePath));

      try {
        console.log(chalk.blue(`[${i + 1}/${imagePaths.length}] Processing: ${path.basename(imagePath)}`));

        const result = await this.analyze(imagePath, options);

        // Save individual result if output directory is specified
        if (outputDir) {
          const outputFile = path.join(outputDir, `${fileName}.${options.format || 'json'}`);
          await this.saveResult(result, outputFile, options.format || 'json');
        }

        results.push({
          inputFile: imagePath,
          outputFile: outputDir ? path.join(outputDir, `${fileName}.${options.format || 'json'}`) : null,
          status: 'success',
          result,
          processing_time: result.analysis_statistics?.processing_time
        });

        console.log(chalk.green(`✓ ${path.basename(imagePath)} completed`));

      } catch (error) {
        console.log(chalk.red(`✗ ${path.basename(imagePath)} failed: ${error.message}`));

        results.push({
          inputFile: imagePath,
          status: 'error',
          error: error.message
        });
      }
    }

    // Generate batch summary
    const summary = this.generateBatchSummary(results);
    console.log(chalk.blue('\nBatch Processing Summary:'));
    console.log(chalk.green(`✓ ${summary.successful} successful`));
    if (summary.failed > 0) {
      console.log(chalk.red(`✗ ${summary.failed} failed`));
    }
    console.log(chalk.gray(`Total processing time: ${summary.total_time}ms`));

    return results;
  }

  /**
   * Classify UI components using advanced rule-based analysis v2.0.5
   */
  async classifyComponents(analysisResult) {
    const visualElements = analysisResult.vision_analysis?.visual_elements || [];
    const textElements = analysisResult.text_extraction?.structured_text || [];
    const imageMetadata = {
      width: analysisResult.vision_analysis?.image_metadata?.width || 1000,
      height: analysisResult.vision_analysis?.image_metadata?.height || 800,
      quality_score: analysisResult.vision_analysis?.quality_score || 0.7,
      complexity_score: analysisResult.vision_analysis?.complexity_score || 0.5,
      sharpness: analysisResult.vision_analysis?.sharpness || 0.6
    };

    // Add text content to visual elements
    const enrichedElements = visualElements.map(visualElement => ({
      ...visualElement,
      text_content: this.findOverlappingText(visualElement.position, textElements)
    }));

    // Use advanced component classifier
    const classifiedComponents = this.componentClassifier.classify(enrichedElements, imageMetadata);

    // Transform to expected format with enhanced data
    const components = classifiedComponents.map((element, index) => ({
      id: `component_${index}`,
      type: element.classification?.type || 'component',
      confidence: element.final_confidence || element.classification?.confidence || 0.5,
      position: element.position,
      visual_properties: {
        shape: element.type,
        area: element.area,
        aspect_ratio: element.aspect_ratio
      },
      text_content: element.text_content || '',
      classification_reasoning: element.classification?.detection_method || 'advanced_classification_v2.0.5',
      enhancement_data: {
        context_boost: element.classification?.context_boost || 0,
        quality_boost: element.classification?.quality_boost || 0,
        ensemble_score: element.ensemble_score || 0,
        position_boost: element.position_boost || 0,
        classification_version: '2.0.5'
      }
    }));

    return components.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find text overlapping with visual element
   */
  findOverlappingText(position, textElements) {
    const overlapping = textElements.filter(textElement => {
      return this.regionsOverlap(position, textElement.position);
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
   * Generate computational recommendations
   */
  async generateRecommendations(analysisResult) {
    const recommendations = {
      framework_suggestions: [],
      implementation_notes: [],
      accessibility_notes: [],
      css_suggestions: [],
      html_structure: null,
      design_patterns: []
    };

    // Analyze layout for framework suggestions
    if (analysisResult.layout_analysis) {
      const layout = analysisResult.layout_analysis;

      if (layout.grid_detected) {
        recommendations.framework_suggestions.push('CSS Grid', 'Bootstrap Grid', 'Tailwind CSS Grid');
        recommendations.css_suggestions.push({
          property: 'display',
          value: 'grid',
          reasoning: 'Grid layout detected'
        });
      }

      if (layout.flexbox_patterns) {
        recommendations.framework_suggestions.push('Flexbox', 'Tailwind CSS Flex');
        recommendations.css_suggestions.push({
          property: 'display',
          value: 'flex',
          reasoning: 'Flexbox patterns detected'
        });
      }
    }

    // Component-based recommendations
    if (analysisResult.components) {
      const componentTypes = [...new Set(analysisResult.components.map(c => c.type))];

      if (componentTypes.includes('button')) {
        recommendations.implementation_notes.push('Use semantic <button> elements for interactive components');
      }

      if (componentTypes.includes('navigation')) {
        recommendations.implementation_notes.push('Implement navigation with <nav> and proper ARIA labels');
        recommendations.html_structure = this.generateHTMLStructure(analysisResult.components);
      }
    }

    // Color-based accessibility recommendations
    if (analysisResult.color_analysis?.accessibility) {
      const accessibility = analysisResult.color_analysis.accessibility;

      if (!accessibility.wcag_aa_compliant) {
        recommendations.accessibility_notes.push('Improve color contrast for WCAG AA compliance');
      }

      if (!accessibility.wcag_aaa_compliant) {
        recommendations.accessibility_notes.push('Consider enhancing contrast for WCAG AAA compliance');
      }
    }

    // Detect common design patterns
    recommendations.design_patterns = this.detectDesignPatterns(analysisResult);

    return recommendations;
  }

  /**
   * Generate HTML structure suggestion
   */
  generateHTMLStructure(components) {
    const structure = [];

    // Sort components by position (top to bottom)
    const sortedComponents = components.sort((a, b) => a.position.y - b.position.y);

    for (const component of sortedComponents) {
      switch (component.type) {
        case 'header':
          structure.push('<header>');
          break;
        case 'navigation':
          structure.push('  <nav>');
          structure.push('    <!-- Navigation items -->');
          structure.push('  </nav>');
          break;
        case 'button':
          structure.push(`  <button>${component.text_content || 'Button Text'}</button>`);
          break;
        case 'footer':
          structure.push('<footer>');
          break;
      }
    }

    return structure.join('\n');
  }

  /**
   * Detect common design patterns
   */
  detectDesignPatterns(analysisResult) {
    const patterns = [];
    const components = analysisResult.components || [];

    // Header pattern
    const hasHeader = components.some(c => c.type === 'header');
    const hasNavigation = components.some(c => c.type === 'navigation');
    if (hasHeader && hasNavigation) {
      patterns.push({
        name: 'Header with Navigation',
        confidence: 0.9,
        description: 'Standard website header pattern with navigation'
      });
    }

    // Card layout pattern
    const rectangles = analysisResult.vision_analysis?.shapes?.rectangles || [];
    if (rectangles.length >= 3) {
      const similarSized = rectangles.filter(r =>
        Math.abs(r.aspect_ratio - rectangles[0].aspect_ratio) < 0.3
      );

      if (similarSized.length >= 3) {
        patterns.push({
          name: 'Card Layout',
          confidence: 0.8,
          description: 'Multiple similar-sized rectangular elements suggesting card layout'
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate analysis statistics
   */
  calculateStatistics(result) {
    const stats = {
      processing_time: Date.now() - (result._startTime || Date.now()),
      components_detected: result.components?.length || 0,
      text_elements: result.text_extraction?.structured_text?.length || 0,
      visual_elements: result.vision_analysis?.visual_elements?.length || 0,
      colors_extracted: result.color_analysis?.color_palette?.length || 0,
      confidence_scores: {
        average: 0,
        min: 1,
        max: 0
      }
    };

    // Calculate confidence statistics
    if (result.components && result.components.length > 0) {
      const confidences = result.components.map(c => c.confidence);
      stats.confidence_scores.average = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      stats.confidence_scores.min = Math.min(...confidences);
      stats.confidence_scores.max = Math.max(...confidences);
    }

    return stats;
  }

  /**
   * Display analysis summary
   */
  displaySummary(result) {
    const stats = result.analysis_statistics;
    console.log(chalk.gray('Analysis Summary:'));
    console.log(chalk.gray(`- Components detected: ${stats.components_detected}`));
    console.log(chalk.gray(`- Text elements: ${stats.text_elements}`));
    console.log(chalk.gray(`- Visual elements: ${stats.visual_elements}`));
    console.log(chalk.gray(`- Colors extracted: ${stats.colors_extracted}`));
    console.log(chalk.gray(`- Processing time: ${stats.processing_time}ms`));
  }

  /**
   * Generate batch processing summary
   */
  generateBatchSummary(results) {
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.length - successful;
    const totalTime = results
      .filter(r => r.processing_time)
      .reduce((total, r) => total + r.processing_time, 0);

    return { successful, failed, total_time: totalTime };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100  } ${  sizes[i]}`;
  }

  /**
   * Save analysis result to file
   * @param {Object} result - Analysis result
   * @param {string} outputPath - Output file path
   * @param {string} format - Output format
   */
  async saveResult(result, outputPath, format = 'json') {
    return await saveResult(result, outputPath, format);
  }

  /**
   * Display analysis result in console
   * @param {Object} result - Analysis result
   */
  displayResult(result) {
    displayResult(result);
  }

  /**
   * Export analysis results to SVG format
   * @param {Object} analysisResult - Analysis result
   * @param {Object} options - Export options
   * @returns {Promise<string>} SVG content
   */
  async exportToSVG(analysisResult, options = {}) {
    return await this.svgExporter.exportToSVG(analysisResult, options);
  }

  /**
   * Export analysis results to XML format
   * @param {Object} analysisResult - Analysis result
   * @param {Object} options - Export options
   * @returns {Promise<string>} XML content
   */
  async exportToXML(analysisResult, options = {}) {
    return await this.xmlExporter.exportToXML(analysisResult, options);
  }

  /**
   * Export to specific design tool format
   * @param {Object} analysisResult - Analysis result
   * @param {string} toolType - Tool type (figma, sketch, adobe, html)
   * @param {Object} options - Export options
   * @returns {Promise<string>} Tool-specific format
   */
  async exportToDesignTool(analysisResult, toolType, options = {}) {
    switch (toolType.toLowerCase()) {
      case 'svg':
        return await this.svgExporter.exportToSVG(analysisResult, options);
      case 'wireframe':
        return await this.svgExporter.exportLayoutWireframe(analysisResult, options);
      case 'interactive':
        return await this.svgExporter.exportInteractiveSVG(analysisResult, options);
      case 'hierarchy':
        return await this.svgExporter.exportComponentHierarchy(analysisResult, options);
      case 'figma':
      case 'sketch':
      case 'adobe':
      case 'html':
        return await this.xmlExporter.exportToSchema(analysisResult, toolType, options);
      default:
        throw new Error(`Unsupported design tool format: ${toolType}`);
    }
  }

  /**
   * Optimize processing with performance enhancements
   * @param {string|Buffer} imageInput - Image input
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Optimized processing results
   */
  async analyzeWithOptimization(imageInput, options = {}) {
    if (!this.config.enablePerformanceOptimization) {
      return await this.analyze(imageInput, options);
    }

    // Initialize performance optimizer if not already done
    if (!this.performanceOptimizer.initialized) {
      await this.performanceOptimizer.initialize();
    }

    return await this.performanceOptimizer.optimizeProcessing(imageInput, {
      ...options,
      analyzer: this
    });
  }

  /**
   * Batch analyze with performance optimization
   * @param {Array} imageInputs - Array of image inputs
   * @param {Object} options - Processing options
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Object>} Batch processing results
   */
  async batchAnalyzeOptimized(imageInputs, options = {}, progressCallback = null) {
    if (!this.config.enablePerformanceOptimization) {
      return await this.batchAnalyze(imageInputs, options);
    }

    // Initialize performance optimizer if not already done
    if (!this.performanceOptimizer.initialized) {
      await this.performanceOptimizer.initialize();
    }

    return await this.performanceOptimizer.optimizeBatchProcessing(
      imageInputs,
      { ...options, analyzer: this },
      progressCallback
    );
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    if (this.config.enablePerformanceOptimization) {
      return this.performanceOptimizer.getPerformanceStats();
    }
    return null;
  }

  /**
   * Clear performance cache
   * @returns {Promise<void>}
   */
  async clearCache() {
    if (this.config.enablePerformanceOptimization) {
      await this.performanceOptimizer.clearCache();
    }
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (this.config.enablePerformanceOptimization) {
      await this.performanceOptimizer.cleanup();
    }
    if (this.config.enableMultiLanguageOCR) {
      await this.multiLanguageOCR.cleanup();
    }
  }

  /**
   * Get configuration information
   * @returns {Object} Configuration object
   */
  getConfig() {
    return { ...this.config };
  }
}

// Export main class and utilities
module.exports = {
  ImageToText,
  formatOutput,
  saveResult,
  displayResult,
  validateImage,
  validateOptions
};
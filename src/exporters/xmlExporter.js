class XMLExporter {
  constructor(options = {}) {
    this.options = {
      includeMetadata: options.includeMetadata !== false,
      includePositions: options.includePositions !== false,
      includeConfidence: options.includeConfidence !== false,
      prettyPrint: options.prettyPrint !== false,
      encoding: options.encoding || 'UTF-8',
      version: options.version || '1.0',
      rootElement: options.rootElement || 'ImageAnalysis',
      ...options
    };
  }

  /**
   * Export analysis results to XML format
   * @param {Object} analysisResult - Complete analysis result
   * @param {Object} options - Export options
   * @returns {Promise<string>} XML content
   */
  async exportToXML(analysisResult, options = {}) {
    try {
      const exportOptions = { ...this.options, ...options };
      
      let xml = this.createXMLHeader();
      xml += this.createRootElement(analysisResult);
      
      // Add image metadata
      if (exportOptions.includeMetadata && analysisResult.image_metadata) {
        xml += this.addImageMetadata(analysisResult.image_metadata);
      }

      // Add text extraction results
      if (analysisResult.text_extraction) {
        xml += this.addTextExtraction(analysisResult.text_extraction);
      }

      // Add vision analysis
      if (analysisResult.vision_analysis) {
        xml += this.addVisionAnalysis(analysisResult.vision_analysis);
      }

      // Add color analysis
      if (analysisResult.color_analysis) {
        xml += this.addColorAnalysis(analysisResult.color_analysis);
      }

      // Add layout analysis
      if (analysisResult.layout_analysis) {
        xml += this.addLayoutAnalysis(analysisResult.layout_analysis);
      }

      // Add components
      if (analysisResult.components) {
        xml += this.addComponents(analysisResult.components);
      }

      // Add advanced patterns
      if (analysisResult.advanced_patterns) {
        xml += this.addAdvancedPatterns(analysisResult.advanced_patterns);
      }

      // Add component relationships
      if (analysisResult.component_relationships) {
        xml += this.addComponentRelationships(analysisResult.component_relationships);
      }

      // Add design system compliance
      if (analysisResult.design_system_compliance) {
        xml += this.addDesignSystemCompliance(analysisResult.design_system_compliance);
      }

      // Add processing statistics
      if (analysisResult.analysis_statistics) {
        xml += this.addProcessingStatistics(analysisResult.analysis_statistics);
      }

      xml += this.closeRootElement();

      return exportOptions.prettyPrint ? this.formatXML(xml) : xml;
    } catch (error) {
      throw new Error(`XML export failed: ${error.message}`);
    }
  }

  /**
   * Create XML header
   */
  createXMLHeader() {
    return `<?xml version="${this.options.version}" encoding="${this.options.encoding}"?>\n`;
  }

  /**
   * Create root element
   */
  createRootElement(analysisResult) {
    const timestamp = new Date().toISOString();
    const version = require('../../package.json').version || '1.0.0';
    
    return `<${this.options.rootElement} 
  timestamp="${timestamp}" 
  version="${version}" 
  generator="img-to-text-computational">\n`;
  }

  /**
   * Close root element
   */
  closeRootElement() {
    return `</${this.options.rootElement}>\n`;
  }

  /**
   * Add image metadata
   */
  addImageMetadata(metadata) {
    let xml = '  <ImageMetadata>\n';
    
    if (metadata.file_name) {
      xml += `    <FileName>${this.escapeXML(metadata.file_name)}</FileName>\n`;
    }
    
    if (metadata.dimensions) {
      xml += `    <Dimensions width="${metadata.width || 0}" height="${metadata.height || 0}">${metadata.dimensions}</Dimensions>\n`;
    }
    
    if (metadata.format) {
      xml += `    <Format>${metadata.format}</Format>\n`;
    }
    
    if (metadata.file_size) {
      xml += `    <FileSize bytes="${metadata.file_size}">${this.formatFileSize(metadata.file_size)}</FileSize>\n`;
    }
    
    if (metadata.analyzed_at) {
      xml += `    <AnalyzedAt>${metadata.analyzed_at}</AnalyzedAt>\n`;
    }
    
    xml += '  </ImageMetadata>\n';
    return xml;
  }

  /**
   * Add text extraction results
   */
  addTextExtraction(textExtraction) {
    let xml = '  <TextExtraction>\n';
    
    if (textExtraction.raw_text) {
      xml += `    <RawText confidence="${textExtraction.confidence || 0}"><![CDATA[${textExtraction.raw_text}]]></RawText>\n`;
    }
    
    if (textExtraction.structured_text && textExtraction.structured_text.length > 0) {
      xml += '    <StructuredText>\n';
      
      textExtraction.structured_text.forEach((textElement, index) => {
        xml += `      <TextElement id="${textElement.id}" type="${textElement.type}"`;
        
        if (this.options.includeConfidence && textElement.confidence) {
          xml += ` confidence="${textElement.confidence}"`;
        }
        
        xml += '>\n';
        
        xml += `        <Text><![CDATA[${textElement.text}]]></Text>\n`;
        
        if (this.options.includePositions && textElement.position) {
          xml += this.addPosition(textElement.position, '        ');
        }
        
        if (textElement.font_info) {
          xml += '        <FontInfo>\n';
          if (textElement.font_info.estimated_size) {
            xml += `          <EstimatedSize>${textElement.font_info.estimated_size}</EstimatedSize>\n`;
          }
          if (textElement.font_info.size_category) {
            xml += `          <SizeCategory>${textElement.font_info.size_category}</SizeCategory>\n`;
          }
          xml += '        </FontInfo>\n';
        }
        
        xml += '      </TextElement>\n';
      });
      
      xml += '    </StructuredText>\n';
    }
    
    xml += '  </TextExtraction>\n';
    return xml;
  }

  /**
   * Add vision analysis
   */
  addVisionAnalysis(visionAnalysis) {
    let xml = '  <VisionAnalysis>\n';
    
    if (visionAnalysis.shapes) {
      xml += '    <Shapes>\n';
      
      if (visionAnalysis.shapes.rectangles) {
        xml += '      <Rectangles>\n';
        visionAnalysis.shapes.rectangles.forEach((rect, index) => {
          xml += `        <Rectangle id="${index}"`;
          if (this.options.includeConfidence && rect.confidence) {
            xml += ` confidence="${rect.confidence}"`;
          }
          xml += '>\n';
          
          if (this.options.includePositions && rect.position) {
            xml += this.addPosition(rect.position, '          ');
          }
          
          if (rect.aspect_ratio) {
            xml += `          <AspectRatio>${rect.aspect_ratio}</AspectRatio>\n`;
          }
          
          xml += '        </Rectangle>\n';
        });
        xml += '      </Rectangles>\n';
      }
      
      if (visionAnalysis.shapes.circles) {
        xml += '      <Circles>\n';
        visionAnalysis.shapes.circles.forEach((circle, index) => {
          xml += `        <Circle id="${index}"`;
          if (this.options.includeConfidence && circle.confidence) {
            xml += ` confidence="${circle.confidence}"`;
          }
          xml += '>\n';
          
          if (circle.center) {
            xml += `          <Center x="${circle.center.x}" y="${circle.center.y}" />\n`;
          }
          
          if (circle.radius) {
            xml += `          <Radius>${circle.radius}</Radius>\n`;
          }
          
          xml += '        </Circle>\n';
        });
        xml += '      </Circles>\n';
      }
      
      xml += '    </Shapes>\n';
    }
    
    if (visionAnalysis.edges) {
      xml += '    <EdgeAnalysis>\n';
      if (visionAnalysis.edges.edge_count) {
        xml += `      <EdgeCount>${visionAnalysis.edges.edge_count}</EdgeCount>\n`;
      }
      if (visionAnalysis.edges.edge_ratio) {
        xml += `      <EdgeRatio>${visionAnalysis.edges.edge_ratio}</EdgeRatio>\n`;
      }
      xml += '    </EdgeAnalysis>\n';
    }
    
    if (visionAnalysis.complexity) {
      xml += `    <Complexity>${visionAnalysis.complexity}</Complexity>\n`;
    }
    
    xml += '  </VisionAnalysis>\n';
    return xml;
  }

  /**
   * Add color analysis
   */
  addColorAnalysis(colorAnalysis) {
    let xml = '  <ColorAnalysis>\n';
    
    if (colorAnalysis.dominant_colors) {
      xml += '    <DominantColors>\n';
      
      Object.entries(colorAnalysis.dominant_colors).forEach(([key, color]) => {
        if (color && color.hex) {
          xml += `      <Color type="${key}" hex="${color.hex}">\n`;
          if (color.rgb) {
            xml += `        <RGB r="${color.rgb.r}" g="${color.rgb.g}" b="${color.rgb.b}" />\n`;
          }
          if (color.hsl) {
            xml += `        <HSL h="${color.hsl.h}" s="${color.hsl.s}" l="${color.hsl.l}" />\n`;
          }
          xml += '      </Color>\n';
        }
      });
      
      xml += '    </DominantColors>\n';
    }
    
    if (colorAnalysis.color_palette && colorAnalysis.color_palette.length > 0) {
      xml += '    <ColorPalette>\n';
      
      colorAnalysis.color_palette.forEach((color, index) => {
        xml += `      <PaletteColor index="${index}" hex="${color.hex}" percentage="${color.percentage}">\n`;
        if (color.rgb) {
          xml += `        <RGB r="${color.rgb.r}" g="${color.rgb.g}" b="${color.rgb.b}" />\n`;
        }
        xml += '      </PaletteColor>\n';
      });
      
      xml += '    </ColorPalette>\n';
    }
    
    if (colorAnalysis.color_harmony) {
      xml += '    <ColorHarmony>\n';
      if (colorAnalysis.color_harmony.scheme_type) {
        xml += `      <SchemeType>${colorAnalysis.color_harmony.scheme_type}</SchemeType>\n`;
      }
      if (colorAnalysis.color_harmony.temperature) {
        xml += `      <Temperature>${colorAnalysis.color_harmony.temperature}</Temperature>\n`;
      }
      xml += '    </ColorHarmony>\n';
    }
    
    if (colorAnalysis.accessibility) {
      xml += '    <Accessibility>\n';
      if (colorAnalysis.accessibility.wcag_aa_compliant !== undefined) {
        xml += `      <WCAGAACompliant>${colorAnalysis.accessibility.wcag_aa_compliant}</WCAGAACompliant>\n`;
      }
      
      if (colorAnalysis.accessibility.contrast_ratios) {
        xml += '      <ContrastRatios>\n';
        colorAnalysis.accessibility.contrast_ratios.forEach((ratio, index) => {
          xml += `        <ContrastRatio index="${index}" 
            textColor="${ratio.text_color}" 
            backgroundColor="${ratio.background_color}" 
            ratio="${ratio.contrast_ratio}" 
            wcagAA="${ratio.wcag_aa}" />\n`;
        });
        xml += '      </ContrastRatios>\n';
      }
      
      xml += '    </Accessibility>\n';
    }
    
    xml += '  </ColorAnalysis>\n';
    return xml;
  }

  /**
   * Add layout analysis
   */
  addLayoutAnalysis(layoutAnalysis) {
    let xml = '  <LayoutAnalysis>\n';
    
    if (layoutAnalysis.layout_type) {
      xml += `    <LayoutType>${layoutAnalysis.layout_type}</LayoutType>\n`;
    }
    
    if (layoutAnalysis.grid_analysis) {
      xml += '    <GridAnalysis>\n';
      const grid = layoutAnalysis.grid_analysis;
      
      xml += `      <Detected>${grid.detected}</Detected>\n`;
      
      if (grid.detected) {
        if (grid.rows) xml += `      <Rows>${grid.rows}</Rows>\n`;
        if (grid.columns) xml += `      <Columns>${grid.columns}</Columns>\n`;
        if (grid.regularity) xml += `      <Regularity>${grid.regularity}</Regularity>\n`;
      }
      
      xml += '    </GridAnalysis>\n';
    }
    
    if (layoutAnalysis.alignment_analysis) {
      xml += '    <AlignmentAnalysis>\n';
      const alignment = layoutAnalysis.alignment_analysis;
      
      if (alignment.horizontal_groups) {
        xml += `      <HorizontalGroups count="${alignment.horizontal_groups.length}">\n`;
        alignment.horizontal_groups.forEach((group, index) => {
          xml += `        <Group id="${index}" elementCount="${group.elements ? group.elements.length : 0}"`;
          if (group.y_position) xml += ` yPosition="${group.y_position}"`;
          xml += ' />\n';
        });
        xml += '      </HorizontalGroups>\n';
      }
      
      if (alignment.vertical_groups) {
        xml += `      <VerticalGroups count="${alignment.vertical_groups.length}">\n`;
        alignment.vertical_groups.forEach((group, index) => {
          xml += `        <Group id="${index}" elementCount="${group.elements ? group.elements.length : 0}"`;
          if (group.x_position) xml += ` xPosition="${group.x_position}"`;
          xml += ' />\n';
        });
        xml += '      </VerticalGroups>\n';
      }
      
      xml += '    </AlignmentAnalysis>\n';
    }
    
    if (layoutAnalysis.spacing_analysis) {
      xml += '    <SpacingAnalysis>\n';
      const spacing = layoutAnalysis.spacing_analysis;
      
      if (spacing.horizontal_spacing) {
        xml += `      <HorizontalSpacing consistency="${spacing.horizontal_spacing.consistency || 0}" />\n`;
      }
      
      if (spacing.vertical_spacing) {
        xml += `      <VerticalSpacing consistency="${spacing.vertical_spacing.consistency || 0}" />\n`;
      }
      
      xml += '    </SpacingAnalysis>\n';
    }
    
    xml += '  </LayoutAnalysis>\n';
    return xml;
  }

  /**
   * Add components
   */
  addComponents(components) {
    let xml = `  <Components count="${components.length}">\n`;
    
    components.forEach((component, index) => {
      xml += `    <Component id="${component.id}" type="${component.type}"`;
      
      if (this.options.includeConfidence && component.confidence) {
        xml += ` confidence="${component.confidence}"`;
      }
      
      xml += '>\n';
      
      if (this.options.includePositions && component.position) {
        xml += this.addPosition(component.position, '      ');
      }
      
      if (component.text_content) {
        xml += `      <TextContent><![CDATA[${component.text_content}]]></TextContent>\n`;
      }
      
      if (component.classification_reasoning) {
        xml += `      <ClassificationReasoning><![CDATA[${component.classification_reasoning}]]></ClassificationReasoning>\n`;
      }
      
      if (component.aspect_ratio) {
        xml += `      <AspectRatio>${component.aspect_ratio}</AspectRatio>\n`;
      }
      
      xml += '    </Component>\n';
    });
    
    xml += '  </Components>\n';
    return xml;
  }

  /**
   * Add advanced patterns
   */
  addAdvancedPatterns(advancedPatterns) {
    let xml = '  <AdvancedPatterns>\n';
    
    if (advancedPatterns.detected_patterns) {
      xml += `    <DetectedPatterns count="${advancedPatterns.detected_patterns.length}">\n`;
      
      advancedPatterns.detected_patterns.forEach((pattern, index) => {
        xml += `      <Pattern id="${index}" name="${pattern.pattern}" confidence="${pattern.confidence}">\n`;
        
        if (pattern.description) {
          xml += `        <Description><![CDATA[${pattern.description}]]></Description>\n`;
        }
        
        if (pattern.evidence && pattern.evidence.length > 0) {
          xml += '        <Evidence>\n';
          pattern.evidence.forEach((evidence, evidenceIndex) => {
            xml += `          <Item index="${evidenceIndex}"><![CDATA[${evidence}]]></Item>\n`;
          });
          xml += '        </Evidence>\n';
        }
        
        if (pattern.characteristics) {
          xml += '        <Characteristics>\n';
          Object.entries(pattern.characteristics).forEach(([key, value]) => {
            xml += `          <Characteristic name="${key}" value="${value}" />\n`;
          });
          xml += '        </Characteristics>\n';
        }
        
        xml += '      </Pattern>\n';
      });
      
      xml += '    </DetectedPatterns>\n';
    }
    
    if (advancedPatterns.layout_complexity) {
      xml += '    <LayoutComplexity>\n';
      const complexity = advancedPatterns.layout_complexity;
      
      xml += `      <Score>${complexity.score}</Score>\n`;
      xml += `      <Level>${complexity.level}</Level>\n`;
      
      if (complexity.factors) {
        xml += '      <Factors>\n';
        complexity.factors.forEach((factor, index) => {
          xml += `        <Factor index="${index}"><![CDATA[${factor}]]></Factor>\n`;
        });
        xml += '      </Factors>\n';
      }
      
      xml += '    </LayoutComplexity>\n';
    }
    
    xml += '  </AdvancedPatterns>\n';
    return xml;
  }

  /**
   * Add component relationships
   */
  addComponentRelationships(relationships) {
    let xml = '  <ComponentRelationships>\n';
    
    if (relationships.spatial_relationships) {
      xml += '    <SpatialRelationships>\n';
      const spatial = relationships.spatial_relationships;
      
      xml += `      <Summary totalRelationships="${spatial.total_relationships}" strongRelationships="${spatial.strong_relationships}" />\n`;
      
      if (spatial.relationships && spatial.relationships.length > 0) {
        xml += '      <Relationships>\n';
        spatial.relationships.slice(0, 10).forEach((rel, index) => { // Limit to top 10
          xml += `        <Relationship id="${index}" 
            component1="${rel.component1}" 
            component2="${rel.component2}" 
            type="${rel.subtype}" 
            strength="${rel.strength}" 
            distance="${rel.distance || 0}" />\n`;
        });
        xml += '      </Relationships>\n';
      }
      
      xml += '    </SpatialRelationships>\n';
    }
    
    if (relationships.functional_relationships) {
      xml += '    <FunctionalRelationships>\n';
      const functional = relationships.functional_relationships;
      
      xml += `      <Summary totalRelationships="${functional.total_relationships}" />\n`;
      
      if (functional.relationships && functional.relationships.length > 0) {
        xml += '      <Relationships>\n';
        functional.relationships.slice(0, 10).forEach((rel, index) => {
          xml += `        <Relationship id="${index}" 
            component1="${rel.component1}" 
            component2="${rel.component2}" 
            type="${rel.subtype}" 
            confidence="${rel.confidence}" />\n`;
        });
        xml += '      </Relationships>\n';
      }
      
      xml += '    </FunctionalRelationships>\n';
    }
    
    xml += '  </ComponentRelationships>\n';
    return xml;
  }

  /**
   * Add design system compliance
   */
  addDesignSystemCompliance(designSystem) {
    let xml = '  <DesignSystemCompliance>\n';
    
    xml += `    <OverallScore>${designSystem.overall_score}</OverallScore>\n`;
    
    if (designSystem.color_system) {
      xml += '    <ColorSystem>\n';
      const colorSys = designSystem.color_system;
      
      xml += `      <ConsistencyScore>${colorSys.consistency_score}</ConsistencyScore>\n`;
      xml += `      <PaletteSize>${colorSys.palette_size}</PaletteSize>\n`;
      
      if (colorSys.palette_type) {
        xml += `      <PaletteType>${colorSys.palette_type}</PaletteType>\n`;
      }
      
      xml += '    </ColorSystem>\n';
    }
    
    if (designSystem.typography_system) {
      xml += '    <TypographySystem>\n';
      const typoSys = designSystem.typography_system;
      
      xml += `      <ConsistencyScore>${typoSys.consistency_score}</ConsistencyScore>\n`;
      xml += `      <HierarchyClarity>${typoSys.hierarchy_clarity}</HierarchyClarity>\n`;
      
      if (typoSys.size_scale) {
        xml += `      <SizeScale>${typoSys.size_scale}</SizeScale>\n`;
      }
      
      xml += '    </TypographySystem>\n';
    }
    
    if (designSystem.spacing_system) {
      xml += '    <SpacingSystem>\n';
      const spacingSys = designSystem.spacing_system;
      
      xml += `      <ConsistencyScore>${spacingSys.consistency_score}</ConsistencyScore>\n`;
      xml += `      <GridCompliance>${spacingSys.grid_compliance}</GridCompliance>\n`;
      
      if (spacingSys.scale_type) {
        xml += `      <ScaleType>${spacingSys.scale_type}</ScaleType>\n`;
      }
      
      xml += '    </SpacingSystem>\n';
    }
    
    if (designSystem.recommendations && designSystem.recommendations.length > 0) {
      xml += '    <Recommendations>\n';
      designSystem.recommendations.forEach((rec, index) => {
        xml += `      <Recommendation id="${index}" category="${rec.category}" priority="${rec.priority}">\n`;
        xml += `        <Issue><![CDATA[${rec.issue}]]></Issue>\n`;
        xml += `        <Recommendation><![CDATA[${rec.recommendation}]]></Recommendation>\n`;
        xml += '      </Recommendation>\n';
      });
      xml += '    </Recommendations>\n';
    }
    
    xml += '  </DesignSystemCompliance>\n';
    return xml;
  }

  /**
   * Add processing statistics
   */
  addProcessingStatistics(statistics) {
    let xml = '  <ProcessingStatistics>\n';
    
    if (statistics.processing_time) {
      xml += `    <ProcessingTime milliseconds="${statistics.processing_time}">${statistics.processing_time}ms</ProcessingTime>\n`;
    }
    
    if (statistics.components_detected) {
      xml += `    <ComponentsDetected>${statistics.components_detected}</ComponentsDetected>\n`;
    }
    
    if (statistics.text_elements) {
      xml += `    <TextElements>${statistics.text_elements}</TextElements>\n`;
    }
    
    if (statistics.visual_elements) {
      xml += `    <VisualElements>${statistics.visual_elements}</VisualElements>\n`;
    }
    
    if (statistics.colors_extracted) {
      xml += `    <ColorsExtracted>${statistics.colors_extracted}</ColorsExtracted>\n`;
    }
    
    if (statistics.confidence_scores) {
      xml += '    <ConfidenceScores>\n';
      const scores = statistics.confidence_scores;
      
      xml += `      <Average>${scores.average}</Average>\n`;
      xml += `      <Minimum>${scores.min}</Minimum>\n`;
      xml += `      <Maximum>${scores.max}</Maximum>\n`;
      
      xml += '    </ConfidenceScores>\n';
    }
    
    xml += '  </ProcessingStatistics>\n';
    return xml;
  }

  /**
   * Add position information
   */
  addPosition(position, indent = '') {
    return `${indent}<Position x="${position.x}" y="${position.y}" width="${position.width}" height="${position.height}" />\n`;
  }

  /**
   * Export to specific XML schema formats
   */
  async exportToSchema(analysisResult, schemaType, options = {}) {
    switch (schemaType.toLowerCase()) {
      case 'figma':
        return this.exportToFigmaXML(analysisResult, options);
      case 'sketch':
        return this.exportToSketchXML(analysisResult, options);
      case 'adobe':
        return this.exportToAdobeXML(analysisResult, options);
      case 'html':
        return this.exportToHTMLStructure(analysisResult, options);
      default:
        throw new Error(`Unsupported schema type: ${schemaType}`);
    }
  }

  /**
   * Export to Figma-compatible XML
   */
  async exportToFigmaXML(analysisResult, options = {}) {
    let xml = this.createXMLHeader();
    xml += '<FigmaImport>\n';
    
    const components = analysisResult.components || [];
    
    xml += '  <Frames>\n';
    xml += '    <Frame name="Imported Design" x="0" y="0" width="1000" height="800">\n';
    
    components.forEach((component, index) => {
      const pos = component.position;
      
      switch (component.type) {
        case 'button':
          xml += `      <Rectangle name="Button ${index}" x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" fill="#4285F4" />\n`;
          if (component.text_content) {
            xml += `      <Text name="Button Text ${index}" x="${pos.x + 10}" y="${pos.y + 10}" text="${this.escapeXML(component.text_content)}" />\n`;
          }
          break;
        case 'input':
          xml += `      <Rectangle name="Input ${index}" x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" fill="#FFFFFF" stroke="#CCCCCC" />\n`;
          break;
        case 'image':
          xml += `      <Rectangle name="Image ${index}" x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" fill="#F0F0F0" />\n`;
          break;
        default:
          xml += `      <Rectangle name="${component.type} ${index}" x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" fill="#EEEEEE" />\n`;
      }
    });
    
    xml += '    </Frame>\n';
    xml += '  </Frames>\n';
    xml += '</FigmaImport>\n';
    
    return xml;
  }

  /**
   * Export to HTML structure
   */
  async exportToHTMLStructure(analysisResult, options = {}) {
    let xml = this.createXMLHeader();
    xml += '<HTMLStructure>\n';
    
    const components = analysisResult.components || [];
    
    xml += '  <Body>\n';
    
    components.forEach((component, index) => {
      const pos = component.position;
      
      switch (component.type) {
        case 'button':
          xml += `    <Button id="btn-${index}" class="button" style="position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;">\n`;
          xml += `      ${this.escapeXML(component.text_content || 'Button')}\n`;
          xml += '    </Button>\n';
          break;
        case 'input':
          xml += `    <Input id="input-${index}" type="text" class="input" style="position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;" />\n`;
          break;
        case 'image':
          xml += `    <Img id="img-${index}" class="image" style="position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;" alt="Image" />\n`;
          break;
        case 'navigation':
          xml += `    <Nav id="nav-${index}" class="navigation" style="position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;">\n`;
          xml += `      <!-- Navigation content -->\n`;
          xml += '    </Nav>\n';
          break;
        default:
          xml += `    <Div id="div-${index}" class="${component.type}" style="position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;">\n`;
          xml += `      ${this.escapeXML(component.text_content || '')}\n`;
          xml += '    </Div>\n';
      }
    });
    
    xml += '  </Body>\n';
    xml += '</HTMLStructure>\n';
    
    return xml;
  }

  /**
   * Format XML with proper indentation
   */
  formatXML(xml) {
    // Simple XML formatting - in production, use a proper XML formatter
    return xml
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => {
        const depth = (line.match(/</g) || []).length - (line.match(/\//g) || []).length;
        return '  '.repeat(Math.max(0, depth)) + line.trim();
      })
      .join('\n');
  }

  /**
   * Escape XML special characters
   */
  escapeXML(text) {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = XMLExporter; 
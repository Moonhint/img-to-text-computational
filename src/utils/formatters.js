const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Format analysis output in various formats
 * @param {Object} result - Analysis result
 * @param {string} format - Output format (json, yaml, xml, text)
 * @returns {string} Formatted output
 */
function formatOutput(result, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(result, null, 2);
    
    case 'yaml':
      const yaml = require('yaml');
      return yaml.stringify(result);
    
    case 'xml':
      return formatAsXML(result);
    
    case 'text':
      return formatAsText(result);
    
    default:
      return JSON.stringify(result, null, 2);
  }
}

/**
 * Save analysis result to file
 * @param {Object} result - Analysis result
 * @param {string} outputPath - Output file path
 * @param {string} format - Output format
 */
async function saveResult(result, outputPath, format = 'json') {
  try {
    const formattedOutput = formatOutput(result, format);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, formattedOutput, 'utf8');
    console.log(chalk.green(`✓ Result saved to: ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`✗ Failed to save result: ${error.message}`));
    throw error;
  }
}

/**
 * Display analysis result in console
 * @param {Object} result - Analysis result
 */
function displayResult(result) {
  console.log(chalk.cyan('\n=== Analysis Result ==='));
  
  if (result.image_metadata) {
    console.log(chalk.yellow('\nImage Metadata:'));
    console.log(`  File: ${result.image_metadata.file_name}`);
    console.log(`  Dimensions: ${result.image_metadata.dimensions}`);
    console.log(`  Size: ${result.image_metadata.file_size}`);
  }
  
  if (result.text_extraction) {
    console.log(chalk.yellow('\nText Extraction:'));
    console.log(`  Text Found: ${result.text_extraction.text_blocks?.length || 0} blocks`);
    console.log(`  Confidence: ${result.text_extraction.confidence || 'N/A'}`);
  }
  
  if (result.color_analysis) {
    console.log(chalk.yellow('\nColor Analysis:'));
    console.log(`  Dominant Colors: ${result.color_analysis.color_palette?.length || 0}`);
  }
  
  if (result.layout_analysis) {
    console.log(chalk.yellow('\nLayout Analysis:'));
    console.log(`  Layout Type: ${result.layout_analysis.layout_type || 'Unknown'}`);
    console.log(`  Grid Detected: ${result.layout_analysis.grid_detected ? 'Yes' : 'No'}`);
  }
  
  if (result.components) {
    console.log(chalk.yellow('\nComponents:'));
    console.log(`  UI Components: ${result.components.length || 0}`);
  }
  
  console.log(chalk.cyan('\n========================\n'));
}

/**
 * Format result as XML string
 * @param {Object} result - Analysis result
 * @returns {string} XML formatted string
 */
function formatAsXML(result) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<analysis>\n';
  xml += objectToXML(result, 1);
  xml += '</analysis>';
  return xml;
}

/**
 * Convert object to XML recursively
 * @param {*} obj - Object to convert
 * @param {number} indent - Indentation level
 * @returns {string} XML string
 */
function objectToXML(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let xml = '';
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      xml += `${spaces}<item index="${index}">\n`;
      xml += objectToXML(item, indent + 1);
      xml += `${spaces}</item>\n`;
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const tagName = key.replace(/[^a-zA-Z0-9_]/g, '_');
      if (typeof value === 'object') {
        xml += `${spaces}<${tagName}>\n`;
        xml += objectToXML(value, indent + 1);
        xml += `${spaces}</${tagName}>\n`;
      } else {
        xml += `${spaces}<${tagName}>${escapeXML(String(value))}</${tagName}>\n`;
      }
    }
  } else {
    xml += `${spaces}${escapeXML(String(obj))}\n`;
  }
  
  return xml;
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format result as human-readable text
 * @param {Object} result - Analysis result
 * @returns {string} Text formatted string
 */
function formatAsText(result) {
  let text = 'IMAGE ANALYSIS REPORT\n';
  text += '===================\n\n';
  
  if (result.image_metadata) {
    text += 'IMAGE METADATA\n';
    text += '--------------\n';
    text += `File: ${result.image_metadata.file_name}\n`;
    text += `Dimensions: ${result.image_metadata.dimensions}\n`;
    text += `Size: ${result.image_metadata.file_size}\n`;
    text += `Format: ${result.image_metadata.format}\n\n`;
  }
  
  if (result.text_extraction) {
    text += 'TEXT EXTRACTION\n';
    text += '---------------\n';
    text += `Confidence: ${result.text_extraction.confidence || 'N/A'}\n`;
    if (result.text_extraction.text_blocks) {
      text += `Text Blocks Found: ${result.text_extraction.text_blocks.length}\n`;
      result.text_extraction.text_blocks.forEach((block, index) => {
        text += `  Block ${index + 1}: "${block.text}"\n`;
      });
    }
    text += '\n';
  }
  
  if (result.color_analysis) {
    text += 'COLOR ANALYSIS\n';
    text += '--------------\n';
    if (result.color_analysis.color_palette) {
      text += `Colors Found: ${result.color_analysis.color_palette.length}\n`;
      result.color_analysis.color_palette.slice(0, 5).forEach((color, index) => {
        text += `  ${index + 1}. ${color.hex} (${color.percentage.toFixed(1)}%)\n`;
      });
    }
    text += '\n';
  }
  
  if (result.components) {
    text += 'UI COMPONENTS\n';
    text += '-------------\n';
    text += `Components Found: ${result.components.length}\n`;
    result.components.forEach((component, index) => {
      text += `  ${index + 1}. ${component.type} (${component.confidence}% confidence)\n`;
    });
    text += '\n';
  }
  
  return text;
}

module.exports = {
  formatOutput,
  saveResult,
  displayResult,
  formatAsXML,
  formatAsText
}; 
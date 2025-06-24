const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');

/**
 * Validate image file
 * @param {string} imagePath - Path to image file
 * @throws {Error} If validation fails
 */
async function validateImage(imagePath) {
  if (!imagePath) {
    throw new Error('Image path is required');
  }

  if (typeof imagePath !== 'string') {
    throw new Error('Image path must be a string');
  }

  // Check if file exists
  const exists = await fs.pathExists(imagePath);
  if (!exists) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  // Check if it's a file (not a directory)
  const stats = await fs.stat(imagePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${imagePath}`);
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (stats.size > maxSize) {
    throw new Error(`Image file too large: ${formatFileSize(stats.size)} (max: ${formatFileSize(maxSize)})`);
  }

  // Check file extension
  const ext = path.extname(imagePath).toLowerCase();
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];
  if (!supportedExtensions.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Supported: ${supportedExtensions.join(', ')}`);
  }

  // Check MIME type
  const mimeType = mime.lookup(imagePath);
  const supportedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
  ];
  
  if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
    throw new Error(`Invalid image MIME type: ${mimeType}`);
  }
}

/**
 * Validate analysis options
 * @param {Object} options - Analysis options
 * @throws {Error} If validation fails
 */
function validateOptions(options) {
  if (!options || typeof options !== 'object') {
    return; // Options are optional
  }

  // Validate outputFormat
  if (options.outputFormat) {
    const validFormats = ['json', 'yaml', 'xml', 'text'];
    if (!validFormats.includes(options.outputFormat.toLowerCase())) {
      throw new Error(`Invalid output format: ${options.outputFormat}. Valid formats: ${validFormats.join(', ')}`);
    }
  }

  // Validate precision
  if (options.precision) {
    const validPrecisions = ['fast', 'standard', 'high'];
    if (!validPrecisions.includes(options.precision.toLowerCase())) {
      throw new Error(`Invalid precision: ${options.precision}. Valid precisions: ${validPrecisions.join(', ')}`);
    }
  }

  // Validate OCR language
  if (options.ocrLanguage) {
    if (typeof options.ocrLanguage !== 'string') {
      throw new Error('OCR language must be a string');
    }
    // Basic validation - tesseract.js supports many languages
    if (options.ocrLanguage.length < 2 || options.ocrLanguage.length > 10) {
      throw new Error('OCR language code must be between 2 and 10 characters');
    }
  }

  // Validate boolean options
  const booleanOptions = [
    'enableOCR',
    'enableShapeDetection',
    'enableColorAnalysis',
    'enableLayoutAnalysis',
    'enableAdvancedPatterns',
    'enableDesignSystemAnalysis',
    'enableComponentRelationships',
    'enableMultiLanguageOCR',
    'enablePerformanceOptimization',
    'verbose',
    'extractText',
    'detectShapes',
    'analyzeColors',
    'analyzeLayout',
    'classifyComponents'
  ];

  for (const option of booleanOptions) {
    if (options[option] !== undefined && typeof options[option] !== 'boolean') {
      throw new Error(`Option '${option}' must be a boolean`);
    }
  }

  // Validate numeric options
  if (options.maxFileSize !== undefined) {
    if (typeof options.maxFileSize !== 'number' || options.maxFileSize <= 0) {
      throw new Error('maxFileSize must be a positive number');
    }
  }

  // Validate confidence threshold
  if (options.confidenceThreshold !== undefined) {
    if (typeof options.confidenceThreshold !== 'number' || 
        options.confidenceThreshold < 0 || 
        options.confidenceThreshold > 1) {
      throw new Error('confidenceThreshold must be a number between 0 and 1');
    }
  }
}

/**
 * Validate output path
 * @param {string} outputPath - Output file path
 * @throws {Error} If validation fails
 */
async function validateOutputPath(outputPath) {
  if (!outputPath) {
    throw new Error('Output path is required');
  }

  if (typeof outputPath !== 'string') {
    throw new Error('Output path must be a string');
  }

  // Check if directory exists or can be created
  const dir = path.dirname(outputPath);
  try {
    await fs.ensureDir(dir);
  } catch (error) {
    throw new Error(`Cannot create output directory: ${error.message}`);
  }

  // Check if file already exists and is writable
  const exists = await fs.pathExists(outputPath);
  if (exists) {
    try {
      await fs.access(outputPath, fs.constants.W_OK);
    } catch (error) {
      throw new Error(`Output file is not writable: ${outputPath}`);
    }
  }
}

/**
 * Validate batch input
 * @param {Array|string} input - Array of paths or directory path
 * @throws {Error} If validation fails
 */
async function validateBatchInput(input) {
  if (!input) {
    throw new Error('Batch input is required');
  }

  if (Array.isArray(input)) {
    if (input.length === 0) {
      throw new Error('Batch input array cannot be empty');
    }

    for (const imagePath of input) {
      await validateImage(imagePath);
    }
  } else if (typeof input === 'string') {
    // Validate directory path
    const exists = await fs.pathExists(input);
    if (!exists) {
      throw new Error(`Directory not found: ${input}`);
    }

    const stats = await fs.stat(input);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${input}`);
    }
  } else {
    throw new Error('Batch input must be an array of paths or a directory path');
  }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  validateImage,
  validateOptions,
  validateOutputPath,
  validateBatchInput,
  formatFileSize
}; 
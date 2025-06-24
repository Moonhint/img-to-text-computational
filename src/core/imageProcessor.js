const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');

class ImageProcessor {
  constructor(options = {}) {
    this.options = {
      maxWidth: options.maxWidth || 2048,
      maxHeight: options.maxHeight || 2048,
      quality: options.quality || 90,
      preserveAspectRatio: options.preserveAspectRatio !== false,
      enhanceContrast: options.enhanceContrast || false,
      ...options
    };
  }

  /**
   * Process image file and return buffer with metadata
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Object with buffer and metadata
   */
  async process(imagePath) {
    try {
      // Validate file exists
      if (!await fs.pathExists(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Get file stats
      const stats = await fs.stat(imagePath);

      // Validate file type
      const mimeType = mime.lookup(imagePath);
      if (!this.isSupportedImageType(mimeType)) {
        throw new Error(`Unsupported image format: ${mimeType}`);
      }

      // Load image with Sharp
      let image = sharp(imagePath);

      // Get initial metadata
      const metadata = await image.metadata();

      // Apply preprocessing
      image = await this.preprocess(image, metadata);

      // Convert to buffer
      const buffer = await image.toBuffer();

      // Get final metadata
      const finalMetadata = await sharp(buffer).metadata();

      return {
        buffer,
        metadata: {
          ...finalMetadata,
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          originalFormat: metadata.format,
          fileSize: stats.size,
          processed: true
        }
      };

    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image for optimal analysis
   * @param {Sharp} image - Sharp image instance
   * @param {Object} metadata - Image metadata
   * @returns {Promise<Sharp>} Processed Sharp instance
   */
  async preprocess(image, metadata) {
    let processed = image;

    // Resize if too large
    if (metadata.width > this.options.maxWidth || metadata.height > this.options.maxHeight) {
      processed = processed.resize(
        this.options.maxWidth,
        this.options.maxHeight,
        {
          fit: 'inside',
          withoutEnlargement: true
        }
      );
    }

    // Enhance contrast if requested
    if (this.options.enhanceContrast) {
      processed = processed.normalise();
    }

    // Ensure RGB format for computer vision
    processed = processed.removeAlpha().toColorspace('srgb');

    // Set quality for JPEG output
    if (metadata.format === 'jpeg' || !metadata.format) {
      processed = processed.jpeg({ quality: this.options.quality });
    } else if (metadata.format === 'png') {
      processed = processed.png();
    }

    return processed;
  }

  /**
   * Check if file type is supported
   * @param {string} mimeType - MIME type
   * @returns {boolean} Whether format is supported
   */
  isSupportedImageType(mimeType) {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];

    return supportedTypes.includes(mimeType);
  }

  /**
   * Create thumbnail of image
   * @param {string} imagePath - Source image path
   * @param {number} size - Thumbnail size
   * @returns {Promise<Buffer>} Thumbnail buffer
   */
  async createThumbnail(imagePath, size = 200) {
    try {
      const thumbnail = await sharp(imagePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      throw new Error(`Thumbnail creation failed: ${error.message}`);
    }
  }

  /**
   * Extract image region
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} region - Region coordinates {x, y, width, height}
   * @returns {Promise<Buffer>} Extracted region buffer
   */
  async extractRegion(imageBuffer, region) {
    try {
      const extracted = await sharp(imageBuffer)
        .extract({
          left: Math.round(region.x),
          top: Math.round(region.y),
          width: Math.round(region.width),
          height: Math.round(region.height)
        })
        .toBuffer();

      return extracted;
    } catch (error) {
      throw new Error(`Region extraction failed: ${error.message}`);
    }
  }

  /**
   * Convert image to grayscale
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Buffer>} Grayscale image buffer
   */
  async toGrayscale(imageBuffer) {
    try {
      const grayscale = await sharp(imageBuffer)
        .grayscale()
        .toBuffer();

      return grayscale;
    } catch (error) {
      throw new Error(`Grayscale conversion failed: ${error.message}`);
    }
  }

  /**
   * Enhance image for OCR
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Buffer>} Enhanced image buffer
   */
  async enhanceForOCR(imageBuffer) {
    try {
      const enhanced = await sharp(imageBuffer)
        .grayscale()
        .normalise()
        .sharpen()
        .png()
        .toBuffer();

      return enhanced;
    } catch (error) {
      throw new Error(`OCR enhancement failed: ${error.message}`);
    }
  }

  /**
   * Get image dominant color
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Dominant color information
   */
  async getDominantColor(imageBuffer) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .resize(1, 1)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const r = data[0];
      const g = data[1];
      const b = data[2];

      return {
        rgb: { r, g, b },
        hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      };
    } catch (error) {
      throw new Error(`Dominant color extraction failed: ${error.message}`);
    }
  }

  /**
   * Apply filters to enhance specific features
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} filterType - Type of filter to apply
   * @returns {Promise<Buffer>} Filtered image buffer
   */
  async applyFilter(imageBuffer, filterType) {
    try {
      let filtered = sharp(imageBuffer);

      switch (filterType) {
        case 'edge_enhance':
          filtered = filtered.convolve({
            width: 3,
            height: 3,
            kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
          });
          break;

        case 'sharpen':
          filtered = filtered.sharpen();
          break;

        case 'blur':
          filtered = filtered.blur(2);
          break;

        case 'high_contrast':
          filtered = filtered.normalise().modulate({
            brightness: 1.1,
            saturation: 1.2
          });
          break;

        default:
          throw new Error(`Unknown filter type: ${filterType}`);
      }

      return await filtered.toBuffer();
    } catch (error) {
      throw new Error(`Filter application failed: ${error.message}`);
    }
  }

  /**
   * Split image into grid regions
   * @param {Buffer} imageBuffer - Image buffer
   * @param {Object} grid - Grid configuration {rows, cols}
   * @returns {Promise<Array>} Array of region buffers with coordinates
   */
  async splitIntoGrid(imageBuffer, grid = { rows: 3, cols: 3 }) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const cellWidth = Math.floor(metadata.width / grid.cols);
      const cellHeight = Math.floor(metadata.height / grid.rows);

      const regions = [];

      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          const x = col * cellWidth;
          const y = row * cellHeight;

          const regionBuffer = await this.extractRegion(imageBuffer, {
            x,
            y,
            width: cellWidth,
            height: cellHeight
          });

          regions.push({
            buffer: regionBuffer,
            position: { x, y, width: cellWidth, height: cellHeight },
            gridIndex: { row, col }
          });
        }
      }

      return regions;
    } catch (error) {
      throw new Error(`Grid splitting failed: ${error.message}`);
    }
  }

  /**
   * Detect image quality issues
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Quality assessment
   */
  async assessQuality(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();

      const quality = {
        resolution: {
          width: metadata.width,
          height: metadata.height,
          megapixels: (metadata.width * metadata.height) / 1000000,
          rating: this.rateResolution(metadata.width, metadata.height)
        },
        sharpness: {
          rating: this.estimateSharpness(stats),
          description: this.getSharpnessDescription(this.estimateSharpness(stats))
        },
        brightness: {
          mean: stats.channels[0].mean,
          rating: this.rateBrightness(stats.channels[0].mean)
        },
        overall_quality: 'good' // Simplified assessment
      };

      return quality;
    } catch (error) {
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  /**
   * Rate image resolution
   */
  rateResolution(width, height) {
    const pixels = width * height;
    if (pixels >= 2000000) return 'high';
    if (pixels >= 800000) return 'medium';
    return 'low';
  }

  /**
   * Estimate image sharpness from statistics
   */
  estimateSharpness(stats) {
    // Simplified sharpness estimation based on standard deviation
    const avgStd = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
    if (avgStd > 50) return 'sharp';
    if (avgStd > 30) return 'moderate';
    return 'soft';
  }

  /**
   * Get sharpness description
   */
  getSharpnessDescription(rating) {
    const descriptions = {
      sharp: 'Image appears sharp and well-focused',
      moderate: 'Image has moderate sharpness',
      soft: 'Image appears soft or slightly blurred'
    };
    return descriptions[rating] || 'Unknown sharpness level';
  }

  /**
   * Rate image brightness
   */
  rateBrightness(mean) {
    if (mean > 200) return 'very_bright';
    if (mean > 150) return 'bright';
    if (mean > 100) return 'normal';
    if (mean > 50) return 'dark';
    return 'very_dark';
  }
}

module.exports = ImageProcessor;
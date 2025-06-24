const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

/**
 * Stream-based image processor for handling large images efficiently
 */
class StreamProcessor extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    
    this.options = {
      chunkSize: options.chunkSize || 1024 * 1024, // 1MB chunks
      maxConcurrent: options.maxConcurrent || 4,
      enableCompression: options.enableCompression !== false,
      ...options
    };
    
    this.processingQueue = [];
    this.activeProcessing = 0;
  }

  /**
   * Transform stream implementation
   */
  _transform(chunk, encoding, callback) {
    this.processChunk(chunk)
      .then(result => callback(null, result))
      .catch(error => callback(error));
  }

  /**
   * Process individual chunk
   */
  async processChunk(chunk) {
    try {
      // Wait for available processing slot
      await this.waitForSlot();
      
      this.activeProcessing++;
      
      // Process the chunk based on its type
      let result;
      if (chunk.type === 'image') {
        result = await this.processImageChunk(chunk);
      } else if (chunk.type === 'batch') {
        result = await this.processBatchChunk(chunk);
      } else {
        result = await this.processGenericChunk(chunk);
      }
      
      this.activeProcessing--;
      
      return result;
    } catch (error) {
      this.activeProcessing--;
      throw error;
    }
  }

  /**
   * Wait for available processing slot
   */
  async waitForSlot() {
    while (this.activeProcessing >= this.options.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Process image chunk
   */
  async processImageChunk(chunk) {
    const { imageData, metadata, processingOptions } = chunk;
    
    // Apply streaming optimizations
    const optimizedData = await this.optimizeImageData(imageData);
    
    return {
      type: 'processed_image',
      data: optimizedData,
      metadata: metadata,
      processing_time: Date.now() - chunk.start_time,
      optimizations_applied: ['compression', 'chunking']
    };
  }

  /**
   * Process batch chunk
   */
  async processBatchChunk(chunk) {
    const { images, batchOptions } = chunk;
    const results = [];
    
    // Process images in parallel within the chunk
    const promises = images.map(async (image, index) => {
      try {
        return await this.processImageChunk({
          imageData: image.data,
          metadata: image.metadata,
          processingOptions: batchOptions,
          start_time: Date.now()
        });
      } catch (error) {
        return {
          type: 'error',
          index: index,
          error: error.message
        };
      }
    });
    
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
    
    return {
      type: 'processed_batch',
      results: results,
      batch_size: images.length,
      processing_time: Date.now() - chunk.start_time
    };
  }

  /**
   * Process generic chunk
   */
  async processGenericChunk(chunk) {
    // Default processing for unknown chunk types
    return {
      type: 'processed_generic',
      data: chunk,
      processing_time: Date.now() - (chunk.start_time || Date.now())
    };
  }

  /**
   * Optimize image data for streaming
   */
  async optimizeImageData(imageData) {
    if (!this.options.enableCompression) {
      return imageData;
    }

    try {
      const Sharp = require('sharp');
      
      // Apply streaming-friendly optimizations
      const optimized = await Sharp(imageData)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      
      return optimized;
    } catch (error) {
      // Return original if optimization fails
      return imageData;
    }
  }
}

/**
 * Stream-based batch processor
 */
class BatchStreamProcessor {
  constructor(options = {}) {
    this.options = {
      batchSize: options.batchSize || 10,
      maxConcurrent: options.maxConcurrent || 4,
      enableProgressTracking: options.enableProgressTracking !== false,
      ...options
    };
    
    this.processor = new StreamProcessor(options);
    this.stats = {
      processed: 0,
      failed: 0,
      totalTime: 0
    };
  }

  /**
   * Process array of images using streaming
   */
  async processImages(images, progressCallback = null) {
    const startTime = Date.now();
    const results = [];
    
    try {
      // Create batches
      const batches = this.createBatches(images);
      
      // Process batches through stream
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchChunk = {
          type: 'batch',
          images: batch,
          batchOptions: this.options,
          start_time: Date.now()
        };
        
        const result = await this.processor.processChunk(batchChunk);
        results.push(result);
        
        // Update statistics
        this.stats.processed += batch.length;
        
        // Progress callback
        if (progressCallback) {
          progressCallback({
            batch: i + 1,
            totalBatches: batches.length,
            processed: this.stats.processed,
            total: images.length,
            percentage: (this.stats.processed / images.length) * 100
          });
        }
      }
      
      this.stats.totalTime = Date.now() - startTime;
      
      return {
        results: results,
        statistics: this.stats,
        processing_method: 'stream_batch'
      };
    } catch (error) {
      throw new Error(`Stream batch processing failed: ${error.message}`);
    }
  }

  /**
   * Create batches from image array
   */
  createBatches(images) {
    const batches = [];
    
    for (let i = 0; i < images.length; i += this.options.batchSize) {
      const batch = images.slice(i, i + this.options.batchSize);
      batches.push(batch);
    }
    
    return batches;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.stats,
      average_time_per_image: this.stats.totalTime / this.stats.processed || 0,
      success_rate: this.stats.processed / (this.stats.processed + this.stats.failed) || 0
    };
  }
}

/**
 * Memory-efficient image loader
 */
class MemoryEfficientLoader {
  constructor(options = {}) {
    this.options = {
      maxMemoryUsage: options.maxMemoryUsage || 256 * 1024 * 1024, // 256MB
      preloadCount: options.preloadCount || 3,
      enableLazyLoading: options.enableLazyLoading !== false,
      ...options
    };
    
    this.loadedImages = new Map();
    this.loadQueue = [];
    this.currentMemoryUsage = 0;
  }

  /**
   * Load image with memory management
   */
  async loadImage(imagePath) {
    try {
      // Check if already loaded
      if (this.loadedImages.has(imagePath)) {
        return this.loadedImages.get(imagePath);
      }
      
      // Check memory usage before loading
      await this.ensureMemoryAvailable();
      
      // Load image
      const fs = require('fs').promises;
      const imageBuffer = await fs.readFile(imagePath);
      
      // Store in memory with metadata
      const imageData = {
        buffer: imageBuffer,
        size: imageBuffer.length,
        loadedAt: Date.now(),
        accessCount: 0
      };
      
      this.loadedImages.set(imagePath, imageData);
      this.currentMemoryUsage += imageBuffer.length;
      
      return imageData;
    } catch (error) {
      throw new Error(`Failed to load image ${imagePath}: ${error.message}`);
    }
  }

  /**
   * Ensure memory is available for new image
   */
  async ensureMemoryAvailable() {
    while (this.currentMemoryUsage > this.options.maxMemoryUsage * 0.8) {
      // Evict least recently used image
      const lruImage = this.findLeastRecentlyUsed();
      if (lruImage) {
        this.evictImage(lruImage);
      } else {
        break; // No images to evict
      }
    }
  }

  /**
   * Find least recently used image
   */
  findLeastRecentlyUsed() {
    let lruPath = null;
    let oldestAccess = Date.now();
    
    for (const [path, data] of this.loadedImages.entries()) {
      if (data.loadedAt < oldestAccess) {
        oldestAccess = data.loadedAt;
        lruPath = path;
      }
    }
    
    return lruPath;
  }

  /**
   * Evict image from memory
   */
  evictImage(imagePath) {
    const imageData = this.loadedImages.get(imagePath);
    if (imageData) {
      this.currentMemoryUsage -= imageData.size;
      this.loadedImages.delete(imagePath);
    }
  }

  /**
   * Preload images for batch processing
   */
  async preloadImages(imagePaths) {
    const preloadTasks = imagePaths.slice(0, this.options.preloadCount).map(path => 
      this.loadImage(path).catch(error => ({ error: error.message, path }))
    );
    
    const results = await Promise.all(preloadTasks);
    return results.filter(result => !result.error);
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    return {
      current_usage_mb: Math.round(this.currentMemoryUsage / 1024 / 1024),
      max_usage_mb: Math.round(this.options.maxMemoryUsage / 1024 / 1024),
      utilization: this.currentMemoryUsage / this.options.maxMemoryUsage,
      loaded_images: this.loadedImages.size,
      average_image_size_kb: this.loadedImages.size > 0 
        ? Math.round((this.currentMemoryUsage / this.loadedImages.size) / 1024)
        : 0
    };
  }

  /**
   * Clear all loaded images
   */
  clearMemory() {
    this.loadedImages.clear();
    this.currentMemoryUsage = 0;
  }
}

module.exports = {
  StreamProcessor,
  BatchStreamProcessor,
  MemoryEfficientLoader
}; 
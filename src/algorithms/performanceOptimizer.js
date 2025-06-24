const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

class PerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      maxImageSize: options.maxImageSize || 4096, // Max width/height
      maxMemoryUsage: options.maxMemoryUsage || 512 * 1024 * 1024, // 512MB
      maxConcurrentWorkers: options.maxConcurrentWorkers || Math.min(os.cpus().length, 4),
      enableImageCompression: options.enableImageCompression !== false,
      enableCaching: options.enableCaching !== false,
      cacheDirectory: options.cacheDirectory || './.img-to-text-cache',
      chunkSize: options.chunkSize || 10, // Batch processing chunk size
      enableProgressTracking: options.enableProgressTracking !== false,
      enableMemoryMonitoring: options.enableMemoryMonitoring !== false,
      // Enhanced performance options
      enableAdaptiveProcessing: options.enableAdaptiveProcessing !== false,
      enableMemoryPooling: options.enableMemoryPooling !== false,
      enableIntelligentCaching: options.enableIntelligentCaching !== false,
      enablePerformanceProfiling: options.enablePerformanceProfiling !== false,
      cacheMaxSize: options.cacheMaxSize || 100 * 1024 * 1024, // 100MB cache limit
      adaptiveChunkSize: options.adaptiveChunkSize !== false,
      preloadWorkers: options.preloadWorkers !== false,
      enableStreamProcessing: options.enableStreamProcessing !== false,
      ...options
    };

    this.workerPool = [];
    this.activeWorkers = 0;
    this.processingQueue = [];
    this.cache = new Map();
    this.memoryUsage = { current: 0, peak: 0 };
    this.processingStats = {
      totalProcessed: 0,
      totalTime: 0,
      averageTime: 0,
      errorCount: 0
    };
    
    // Enhanced performance tracking
    this.memoryPool = new Map();
    this.performanceProfile = {
      processingTimes: [],
      memoryUsages: [],
      cacheHitRates: [],
      workerUtilization: [],
      adaptiveMetrics: {
        optimalChunkSize: this.options.chunkSize,
        optimalWorkerCount: this.options.maxConcurrentWorkers,
        lastOptimization: Date.now()
      }
    };
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
    this.initialized = false;
  }

  /**
   * Initialize the performance optimizer
   */
  async initialize() {
    try {
      // Create cache directory if caching is enabled
      if (this.options.enableCaching) {
        await this.initializeCache();
      }

      // Initialize memory pool
      if (this.options.enableMemoryPooling) {
        await this.initializeMemoryPool();
      }

      // Initialize worker pool
      await this.initializeWorkerPool();

      // Preload workers if enabled
      if (this.options.preloadWorkers) {
        await this.preloadWorkers();
      }

      // Start memory monitoring if enabled
      if (this.options.enableMemoryMonitoring) {
        this.startMemoryMonitoring();
      }

      // Start performance profiling if enabled
      if (this.options.enablePerformanceProfiling) {
        this.startPerformanceProfiling();
      }

      // Start adaptive processing if enabled
      if (this.options.enableAdaptiveProcessing) {
        this.startAdaptiveOptimization();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      throw new Error(`Performance optimizer initialization failed: ${error.message}`);
    }
  }

  /**
   * Optimize image processing with performance enhancements
   * @param {string|Buffer} imageInput - Image input
   * @param {Object} processingOptions - Processing options
   * @returns {Promise<Object>} Optimized processing results
   */
  async optimizeProcessing(imageInput, processingOptions = {}) {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = await this.generateCacheKey(imageInput, processingOptions);
      
      // Check cache first
      if (this.options.enableCaching) {
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          return {
            ...cachedResult,
            from_cache: true,
            processing_time: Date.now() - startTime
          };
        }
      }

      // Optimize image before processing
      const optimizedImage = await this.optimizeImage(imageInput);
      
      // Process with performance optimizations
      const result = await this.processWithOptimizations(optimizedImage, processingOptions);
      
      // Cache result if enabled
      if (this.options.enableCaching) {
        await this.cacheResult(cacheKey, result);
      }

      // Update statistics
      this.updateProcessingStats(Date.now() - startTime, false);

      return {
        ...result,
        from_cache: false,
        processing_time: Date.now() - startTime,
        optimization_stats: {
          image_optimized: optimizedImage.was_optimized,
          original_size: optimizedImage.original_size,
          optimized_size: optimizedImage.optimized_size,
          memory_usage: this.getCurrentMemoryUsage()
        }
      };
    } catch (error) {
      this.updateProcessingStats(Date.now() - startTime, true);
      throw new Error(`Optimized processing failed: ${error.message}`);
    }
  }

  /**
   * Optimize batch processing with chunking and parallel processing
   * @param {Array} imageInputs - Array of image inputs
   * @param {Object} processingOptions - Processing options
   * @param {Function} progressCallback - Progress callback function
   * @returns {Promise<Array>} Batch processing results
   */
  async optimizeBatchProcessing(imageInputs, processingOptions = {}, progressCallback = null) {
    const startTime = Date.now();
    const totalImages = imageInputs.length;
    const results = [];
    let processedCount = 0;

    try {
      // Split into chunks for memory management
      const chunks = this.chunkArray(imageInputs, this.options.chunkSize);
      
      for (const chunk of chunks) {
        // Process chunk in parallel with worker pool
        const chunkResults = await this.processChunkInParallel(chunk, processingOptions);
        results.push(...chunkResults);
        
        processedCount += chunk.length;
        
        // Call progress callback if provided
        if (progressCallback) {
          progressCallback({
            processed: processedCount,
            total: totalImages,
            percentage: (processedCount / totalImages) * 100,
            current_chunk_size: chunk.length,
            memory_usage: this.getCurrentMemoryUsage()
          });
        }

        // Garbage collection hint between chunks
        if (global.gc) {
          global.gc();
        }
      }

      return {
        results: results,
        batch_stats: {
          total_images: totalImages,
          successful: results.filter(r => !r.error).length,
          failed: results.filter(r => r.error).length,
          total_time: Date.now() - startTime,
          average_time_per_image: (Date.now() - startTime) / totalImages,
          memory_peak: this.memoryUsage.peak
        }
      };
    } catch (error) {
      throw new Error(`Batch processing optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize image before processing
   */
  async optimizeImage(imageInput) {
    try {
      const Sharp = require('sharp');
      let imageBuffer;
      let originalSize = 0;
      
      // Convert input to buffer
      if (typeof imageInput === 'string') {
        imageBuffer = await fs.readFile(imageInput);
      } else if (Buffer.isBuffer(imageInput)) {
        imageBuffer = imageInput;
      } else {
        throw new Error('Invalid image input type');
      }

      originalSize = imageBuffer.length;
      
      // Get image metadata
      const metadata = await Sharp(imageBuffer).metadata();
      
      let optimizedBuffer = imageBuffer;
      let wasOptimized = false;

      // Resize if image is too large
      if (metadata.width > this.options.maxImageSize || metadata.height > this.options.maxImageSize) {
        const maxDimension = Math.max(metadata.width, metadata.height);
        const scale = this.options.maxImageSize / maxDimension;
        
        optimizedBuffer = await Sharp(imageBuffer)
          .resize(Math.round(metadata.width * scale), Math.round(metadata.height * scale))
          .jpeg({ quality: 90 })
          .toBuffer();
        
        wasOptimized = true;
      }

      // Compress if enabled and image is large
      if (this.options.enableImageCompression && originalSize > 1024 * 1024) { // 1MB
        const compressed = await Sharp(optimizedBuffer)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
        
        if (compressed.length < optimizedBuffer.length) {
          optimizedBuffer = compressed;
          wasOptimized = true;
        }
      }

      // Enhance for OCR if needed
      if (metadata.density && metadata.density < 150) {
        optimizedBuffer = await Sharp(optimizedBuffer)
          .sharpen()
          .normalize()
          .toBuffer();
        
        wasOptimized = true;
      }

      return {
        buffer: optimizedBuffer,
        was_optimized: wasOptimized,
        original_size: originalSize,
        optimized_size: optimizedBuffer.length,
        metadata: metadata,
        compression_ratio: originalSize / optimizedBuffer.length
      };
    } catch (error) {
      // Return original if optimization fails
      return {
        buffer: imageInput,
        was_optimized: false,
        original_size: Buffer.isBuffer(imageInput) ? imageInput.length : 0,
        optimized_size: Buffer.isBuffer(imageInput) ? imageInput.length : 0,
        error: error.message
      };
    }
  }

  /**
   * Process with performance optimizations
   */
  async processWithOptimizations(optimizedImage, processingOptions) {
    // This would integrate with the main processing pipeline
    // For now, return a placeholder structure
    return {
      image_metadata: {
        optimized: optimizedImage.was_optimized,
        original_size: optimizedImage.original_size,
        processed_size: optimizedImage.optimized_size
      },
      processing_optimizations: {
        memory_efficient: true,
        parallel_processing: this.options.maxConcurrentWorkers > 1,
        caching_enabled: this.options.enableCaching
      }
    };
  }

  /**
   * Process chunk in parallel using worker pool
   */
  async processChunkInParallel(chunk, processingOptions) {
    const promises = chunk.map(async (imageInput, index) => {
      try {
        const worker = await this.getAvailableWorker();
        const result = await this.processWithWorker(worker, imageInput, processingOptions);
        this.releaseWorker(worker);
        return result;
      } catch (error) {
        return {
          error: error.message,
          image_index: index,
          processing_time: 0
        };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Process image with worker thread
   */
  async processWithWorker(worker, imageInput, processingOptions) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker processing timeout'));
      }, 30000); // 30 second timeout

      worker.postMessage({
        type: 'process_image',
        imageInput: imageInput,
        options: processingOptions
      });

      worker.once('message', (result) => {
        clearTimeout(timeout);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      });

      worker.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Initialize cache system
   */
  async initializeCache() {
    try {
      await fs.mkdir(this.options.cacheDirectory, { recursive: true });
      
      // Load existing cache index
      const cacheIndexPath = path.join(this.options.cacheDirectory, 'cache-index.json');
      try {
        const indexData = await fs.readFile(cacheIndexPath, 'utf8');
        const cacheIndex = JSON.parse(indexData);
        
        // Validate cache entries
        for (const [key, entry] of Object.entries(cacheIndex)) {
          const filePath = path.join(this.options.cacheDirectory, entry.filename);
          try {
            await fs.access(filePath);
            this.cache.set(key, entry);
          } catch (error) {
            // Cache file doesn't exist, remove from index
            delete cacheIndex[key];
          }
        }
      } catch (error) {
        // Cache index doesn't exist, start fresh
      }
    } catch (error) {
      console.warn(`Cache initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize worker pool
   */
  async initializeWorkerPool() {
    const workerScript = path.join(__dirname, 'processing-worker.js');
    
    // Create worker script if it doesn't exist
    await this.createWorkerScript(workerScript);
    
    for (let i = 0; i < this.options.maxConcurrentWorkers; i++) {
      try {
        const worker = new Worker(workerScript);
        worker.available = true;
        this.workerPool.push(worker);
      } catch (error) {
        console.warn(`Failed to create worker ${i}: ${error.message}`);
      }
    }
  }

  /**
   * Create worker script
   */
  async createWorkerScript(scriptPath) {
    const workerCode = `
const { parentPort } = require('worker_threads');
const ImageToText = require('../index.js');

let analyzer = null;

parentPort.on('message', async (message) => {
  try {
    if (message.type === 'process_image') {
      if (!analyzer) {
        analyzer = new ImageToText(message.options);
      }
      
      const result = await analyzer.analyze(message.imageInput, message.options);
      parentPort.postMessage(result);
    }
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
    `;

    try {
      await fs.writeFile(scriptPath, workerCode);
    } catch (error) {
      // Worker script creation failed, fall back to single-threaded processing
      console.warn(`Worker script creation failed: ${error.message}`);
    }
  }

  /**
   * Get available worker from pool
   */
  async getAvailableWorker() {
    return new Promise((resolve) => {
      const checkForWorker = () => {
        const availableWorker = this.workerPool.find(worker => worker.available);
        if (availableWorker) {
          availableWorker.available = false;
          this.activeWorkers++;
          resolve(availableWorker);
        } else {
          setTimeout(checkForWorker, 10);
        }
      };
      checkForWorker();
    });
  }

  /**
   * Release worker back to pool
   */
  releaseWorker(worker) {
    worker.available = true;
    this.activeWorkers--;
  }

  /**
   * Generate cache key for image and options
   */
  async generateCacheKey(imageInput, processingOptions) {
    const crypto = require('crypto');
    
    let imageHash = '';
    if (typeof imageInput === 'string') {
      // File path - use file stats
      const stats = await fs.stat(imageInput);
      imageHash = `${imageInput}-${stats.mtime.getTime()}-${stats.size}`;
    } else if (Buffer.isBuffer(imageInput)) {
      // Buffer - use content hash
      imageHash = crypto.createHash('md5').update(imageInput).digest('hex');
    }

    const optionsHash = crypto.createHash('md5').update(JSON.stringify(processingOptions)).digest('hex');
    
    return `${imageHash}-${optionsHash}`;
  }

  /**
   * Get cached result
   */
  async getCachedResult(cacheKey) {
    if (!this.cache.has(cacheKey)) {
      return null;
    }

    try {
      const cacheEntry = this.cache.get(cacheKey);
      const filePath = path.join(this.options.cacheDirectory, cacheEntry.filename);
      const data = await fs.readFile(filePath, 'utf8');
      
      return {
        ...JSON.parse(data),
        cache_hit: true,
        cached_at: cacheEntry.timestamp
      };
    } catch (error) {
      // Cache file corrupted or missing, remove from cache
      this.cache.delete(cacheKey);
      return null;
    }
  }

  /**
   * Cache processing result
   */
  async cacheResult(cacheKey, result) {
    try {
      const filename = `${cacheKey}.json`;
      const filePath = path.join(this.options.cacheDirectory, filename);
      
      await fs.writeFile(filePath, JSON.stringify(result, null, 2));
      
      this.cache.set(cacheKey, {
        filename: filename,
        timestamp: Date.now(),
        size: JSON.stringify(result).length
      });

      // Update cache index
      await this.updateCacheIndex();
    } catch (error) {
      console.warn(`Failed to cache result: ${error.message}`);
    }
  }

  /**
   * Update cache index file
   */
  async updateCacheIndex() {
    try {
      const cacheIndex = {};
      for (const [key, entry] of this.cache.entries()) {
        cacheIndex[key] = entry;
      }
      
      const indexPath = path.join(this.options.cacheDirectory, 'cache-index.json');
      await fs.writeFile(indexPath, JSON.stringify(cacheIndex, null, 2));
    } catch (error) {
      console.warn(`Failed to update cache index: ${error.message}`);
    }
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.current = memUsage.heapUsed;
      this.memoryUsage.peak = Math.max(this.memoryUsage.peak, memUsage.heapUsed);
      
      // Trigger garbage collection if memory usage is high
      if (memUsage.heapUsed > this.options.maxMemoryUsage && global.gc) {
        global.gc();
      }
    }, 1000);
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      heap_used: memUsage.heapUsed,
      heap_total: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
  }

  /**
   * Update processing statistics
   */
  updateProcessingStats(processingTime, isError) {
    this.processingStats.totalProcessed++;
    
    if (isError) {
      this.processingStats.errorCount++;
    } else {
      this.processingStats.totalTime += processingTime;
      this.processingStats.averageTime = this.processingStats.totalTime / (this.processingStats.totalProcessed - this.processingStats.errorCount);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      processing_stats: this.processingStats,
      memory_usage: this.memoryUsage,
      worker_pool: {
        total_workers: this.workerPool.length,
        active_workers: this.activeWorkers,
        available_workers: this.workerPool.filter(w => w.available).length
      },
      cache_stats: {
        enabled: this.options.enableCaching,
        entries: this.cache.size,
        directory: this.options.cacheDirectory
      },
      optimization_settings: {
        max_image_size: this.options.maxImageSize,
        max_memory_usage: this.options.maxMemoryUsage,
        max_concurrent_workers: this.options.maxConcurrentWorkers,
        compression_enabled: this.options.enableImageCompression,
        chunk_size: this.options.chunkSize
      }
    };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      if (this.options.enableCaching) {
        const files = await fs.readdir(this.options.cacheDirectory);
        await Promise.all(
          files.map(file => fs.unlink(path.join(this.options.cacheDirectory, file)))
        );
        this.cache.clear();
      }
    } catch (error) {
      console.warn(`Failed to clear cache: ${error.message}`);
    }
  }

  /**
   * Optimize processing queue
   */
  optimizeProcessingQueue(queue) {
    // Sort by image size (smaller images first for faster processing)
    return queue.sort((a, b) => {
      const sizeA = a.size || 0;
      const sizeB = b.size || 0;
      return sizeA - sizeB;
    });
  }

  /**
   * Chunk array into smaller arrays
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      // Terminate all workers
      await Promise.all(
        this.workerPool.map(worker => worker.terminate())
      );
      
      this.workerPool = [];
      this.activeWorkers = 0;
      
      // Update cache index one final time
      if (this.options.enableCaching) {
        await this.updateCacheIndex();
      }

      // Cleanup memory pool
      if (this.options.enableMemoryPooling) {
        this.memoryPool.clear();
      }

      this.initialized = false;
    } catch (error) {
      console.warn(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Initialize memory pool for efficient buffer reuse
   */
  async initializeMemoryPool() {
    try {
      const poolSizes = [1024, 4096, 16384, 65536, 262144, 1048576]; // Different buffer sizes
      
      for (const size of poolSizes) {
        this.memoryPool.set(size, {
          available: [],
          inUse: new Set(),
          totalAllocated: 0,
          maxPoolSize: 10 // Maximum buffers per size
        });
      }
    } catch (error) {
      console.warn(`Memory pool initialization failed: ${error.message}`);
    }
  }

  /**
   * Get buffer from memory pool or create new one
   */
  getPooledBuffer(size) {
    if (!this.options.enableMemoryPooling) {
      return Buffer.alloc(size);
    }

    // Find the best fit pool
    const poolSize = this.findBestPoolSize(size);
    const pool = this.memoryPool.get(poolSize);
    
    if (pool && pool.available.length > 0) {
      const buffer = pool.available.pop();
      pool.inUse.add(buffer);
      return buffer.slice(0, size);
    }

    // Create new buffer if pool is empty
    const buffer = Buffer.alloc(poolSize);
    if (pool) {
      pool.inUse.add(buffer);
      pool.totalAllocated++;
    }
    
    return buffer.slice(0, size);
  }

  /**
   * Return buffer to memory pool
   */
  returnPooledBuffer(buffer) {
    if (!this.options.enableMemoryPooling || !buffer) {
      return;
    }

    const poolSize = this.findBestPoolSize(buffer.length);
    const pool = this.memoryPool.get(poolSize);
    
    if (pool && pool.inUse.has(buffer)) {
      pool.inUse.delete(buffer);
      
      if (pool.available.length < pool.maxPoolSize) {
        pool.available.push(buffer);
      }
    }
  }

  /**
   * Find best pool size for given buffer size
   */
  findBestPoolSize(size) {
    const poolSizes = Array.from(this.memoryPool.keys()).sort((a, b) => a - b);
    return poolSizes.find(poolSize => poolSize >= size) || poolSizes[poolSizes.length - 1];
  }

  /**
   * Preload workers with common processing tasks
   */
  async preloadWorkers() {
    try {
      const preloadTasks = this.workerPool.map(async (worker) => {
        // Preload common libraries and initialize worker state
        return new Promise((resolve) => {
          worker.postMessage({
            type: 'preload',
            libraries: ['tesseract.js', 'sharp', 'opencv.js']
          });
          
          worker.once('message', (result) => {
            if (result.type === 'preload_complete') {
              resolve();
            }
          });
        });
      });

      await Promise.all(preloadTasks);
    } catch (error) {
      console.warn(`Worker preloading failed: ${error.message}`);
    }
  }

  /**
   * Start performance profiling
   */
  startPerformanceProfiling() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cacheHitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
      const workerUtilization = this.activeWorkers / this.workerPool.length || 0;

      // Store performance metrics
      this.performanceProfile.memoryUsages.push({
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      });

      this.performanceProfile.cacheHitRates.push({
        timestamp: Date.now(),
        hitRate: cacheHitRate
      });

      this.performanceProfile.workerUtilization.push({
        timestamp: Date.now(),
        utilization: workerUtilization
      });

      // Keep only last 100 entries to prevent memory growth
      if (this.performanceProfile.memoryUsages.length > 100) {
        this.performanceProfile.memoryUsages.shift();
        this.performanceProfile.cacheHitRates.shift();
        this.performanceProfile.workerUtilization.shift();
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Start adaptive optimization
   */
  startAdaptiveOptimization() {
    setInterval(() => {
      this.optimizeAdaptiveSettings();
    }, 30000); // Every 30 seconds
  }

  /**
   * Optimize adaptive settings based on performance data
   */
  optimizeAdaptiveSettings() {
    try {
      const now = Date.now();
      const timeSinceLastOptimization = now - this.performanceProfile.adaptiveMetrics.lastOptimization;
      
      // Only optimize if enough time has passed and we have data
      if (timeSinceLastOptimization < 60000 || this.performanceProfile.processingTimes.length < 10) {
        return;
      }

      // Analyze processing times to optimize chunk size
      if (this.options.adaptiveChunkSize) {
        this.optimizeChunkSize();
      }

      // Analyze worker utilization to optimize worker count
      this.optimizeWorkerCount();

      // Optimize cache settings
      if (this.options.enableIntelligentCaching) {
        this.optimizeCacheSettings();
      }

      this.performanceProfile.adaptiveMetrics.lastOptimization = now;
    } catch (error) {
      console.warn(`Adaptive optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize chunk size based on processing performance
   */
  optimizeChunkSize() {
    const recentTimes = this.performanceProfile.processingTimes.slice(-20);
    const avgTime = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
    
    const currentChunkSize = this.performanceProfile.adaptiveMetrics.optimalChunkSize;
    
    // If processing is too slow, reduce chunk size
    if (avgTime > 5000 && currentChunkSize > 5) {
      this.performanceProfile.adaptiveMetrics.optimalChunkSize = Math.max(5, currentChunkSize - 2);
    }
    // If processing is fast and memory usage is low, increase chunk size
    else if (avgTime < 2000 && currentChunkSize < 20) {
      const memUsage = this.getCurrentMemoryUsage();
      if (memUsage.heap_used < this.options.maxMemoryUsage * 0.7) {
        this.performanceProfile.adaptiveMetrics.optimalChunkSize = Math.min(20, currentChunkSize + 2);
      }
    }
  }

  /**
   * Optimize worker count based on utilization
   */
  optimizeWorkerCount() {
    const recentUtilization = this.performanceProfile.workerUtilization.slice(-10);
    const avgUtilization = recentUtilization.reduce((sum, util) => sum + util.utilization, 0) / recentUtilization.length;
    
    const currentWorkerCount = this.performanceProfile.adaptiveMetrics.optimalWorkerCount;
    const maxWorkers = Math.min(os.cpus().length, 8);
    
    // If utilization is high, consider adding workers
    if (avgUtilization > 0.8 && currentWorkerCount < maxWorkers) {
      this.performanceProfile.adaptiveMetrics.optimalWorkerCount = Math.min(maxWorkers, currentWorkerCount + 1);
    }
    // If utilization is low, consider reducing workers
    else if (avgUtilization < 0.3 && currentWorkerCount > 2) {
      this.performanceProfile.adaptiveMetrics.optimalWorkerCount = Math.max(2, currentWorkerCount - 1);
    }
  }

  /**
   * Optimize cache settings based on hit rates and memory usage
   */
  optimizeCacheSettings() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    
    // If hit rate is low and cache is full, implement LRU eviction
    if (hitRate < 0.3 && this.cacheStats.totalSize > this.options.cacheMaxSize * 0.8) {
      this.evictLeastRecentlyUsed();
    }
    
    // If hit rate is high but cache is small, allow more caching
    if (hitRate > 0.7 && this.cacheStats.totalSize < this.options.cacheMaxSize * 0.5) {
      // Cache more aggressively by reducing eviction threshold
    }
  }

  /**
   * Evict least recently used cache entries
   */
  evictLeastRecentlyUsed() {
    const cacheEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const entriesToEvict = Math.ceil(cacheEntries.length * 0.2); // Evict 20%
    
    for (let i = 0; i < entriesToEvict; i++) {
      const [key, entry] = cacheEntries[i];
      this.cache.delete(key);
      this.cacheStats.totalSize -= entry.size || 0;
      this.cacheStats.evictions++;
    }
  }

  /**
   * Enhanced cache result with intelligent caching
   */
  async cacheResultIntelligent(cacheKey, result) {
    if (!this.options.enableIntelligentCaching) {
      return await this.cacheResult(cacheKey, result);
    }

    try {
      const resultSize = JSON.stringify(result).length;
      
      // Check if we have space or need to evict
      if (this.cacheStats.totalSize + resultSize > this.options.cacheMaxSize) {
        this.evictLeastRecentlyUsed();
      }

      // Only cache if result is worth caching (not too small, not too large)
      if (resultSize > 1000 && resultSize < 1024 * 1024) { // Between 1KB and 1MB
        const filename = `${cacheKey}.json`;
        const filePath = path.join(this.options.cacheDirectory, filename);
        
        await fs.writeFile(filePath, JSON.stringify(result, null, 2));
        
        this.cache.set(cacheKey, {
          filename: filename,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          size: resultSize,
          accessCount: 0
        });

        this.cacheStats.totalSize += resultSize;
        await this.updateCacheIndex();
      }
    } catch (error) {
      console.warn(`Intelligent caching failed: ${error.message}`);
    }
  }

  /**
   * Enhanced get cached result with access tracking
   */
  async getCachedResultIntelligent(cacheKey) {
    if (!this.cache.has(cacheKey)) {
      this.cacheStats.misses++;
      return null;
    }

    try {
      const cacheEntry = this.cache.get(cacheKey);
      const filePath = path.join(this.options.cacheDirectory, cacheEntry.filename);
      const data = await fs.readFile(filePath, 'utf8');
      
      // Update access tracking
      cacheEntry.lastAccessed = Date.now();
      cacheEntry.accessCount++;
      
      this.cacheStats.hits++;
      
      return {
        ...JSON.parse(data),
        cache_hit: true,
        cached_at: cacheEntry.timestamp,
        access_count: cacheEntry.accessCount
      };
    } catch (error) {
      // Cache file corrupted or missing, remove from cache
      this.cache.delete(cacheKey);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    const report = {
      ...this.getPerformanceStats(),
      adaptive_metrics: this.performanceProfile.adaptiveMetrics,
      cache_performance: {
        hit_rate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
        total_hits: this.cacheStats.hits,
        total_misses: this.cacheStats.misses,
        evictions: this.cacheStats.evictions,
        cache_size_mb: Math.round(this.cacheStats.totalSize / 1024 / 1024),
        cache_utilization: this.cacheStats.totalSize / this.options.cacheMaxSize
      },
      memory_pool_stats: this.getMemoryPoolStats(),
      performance_trends: this.getPerformanceTrends(),
      optimization_recommendations: this.getOptimizationRecommendations()
    };

    return report;
  }

  /**
   * Get memory pool statistics
   */
  getMemoryPoolStats() {
    if (!this.options.enableMemoryPooling) {
      return { enabled: false };
    }

    const stats = {};
    for (const [size, pool] of this.memoryPool.entries()) {
      stats[`pool_${size}`] = {
        available: pool.available.length,
        in_use: pool.inUse.size,
        total_allocated: pool.totalAllocated,
        utilization: pool.inUse.size / pool.totalAllocated || 0
      };
    }

    return { enabled: true, pools: stats };
  }

  /**
   * Get performance trends analysis
   */
  getPerformanceTrends() {
    const recentTimes = this.performanceProfile.processingTimes.slice(-20);
    const recentMemory = this.performanceProfile.memoryUsages.slice(-20);
    
    return {
      processing_time_trend: this.calculateTrend(recentTimes),
      memory_usage_trend: this.calculateTrend(recentMemory.map(m => m.heapUsed)),
      cache_hit_rate_trend: this.calculateTrend(
        this.performanceProfile.cacheHitRates.slice(-20).map(c => c.hitRate)
      )
    };
  }

  /**
   * Calculate trend direction (increasing, decreasing, stable)
   */
  calculateTrend(values) {
    if (values.length < 5) return 'insufficient_data';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (percentChange > 10) return 'increasing';
    if (percentChange < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    
    // Memory recommendations
    const memUsage = this.getCurrentMemoryUsage();
    if (memUsage.heap_used_mb > 256) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage detected. Consider reducing chunk size or enabling memory pooling.',
        action: 'reduce_chunk_size'
      });
    }
    
    // Cache recommendations
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0;
    if (hitRate < 0.3 && this.options.enableCaching) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Low cache hit rate. Consider adjusting cache size or enabling intelligent caching.',
        action: 'optimize_cache'
      });
    }
    
    // Worker recommendations
    const avgUtilization = this.performanceProfile.workerUtilization.slice(-10)
      .reduce((sum, util) => sum + util.utilization, 0) / 10 || 0;
    
    if (avgUtilization > 0.9) {
      recommendations.push({
        type: 'workers',
        priority: 'medium',
        message: 'High worker utilization. Consider increasing worker count.',
        action: 'increase_workers'
      });
    } else if (avgUtilization < 0.2) {
      recommendations.push({
        type: 'workers',
        priority: 'low',
        message: 'Low worker utilization. Consider reducing worker count to save resources.',
        action: 'reduce_workers'
      });
    }
    
    return recommendations;
  }
}

module.exports = PerformanceOptimizer; 
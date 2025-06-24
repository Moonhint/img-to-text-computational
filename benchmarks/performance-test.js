const Benchmark = require('benchmark');
const path = require('path');
const fs = require('fs').promises;
const { ImageToText } = require('../src/index.js');
const { PerformanceOptimizer } = require('../src/algorithms/performanceOptimizer.js');
const { StreamProcessor, MemoryEfficientLoader } = require('../src/algorithms/streamProcessor.js');

/**
 * Comprehensive performance benchmarking suite
 */
class PerformanceBenchmark {
  constructor() {
    this.results = {
      single_image: {},
      batch_processing: {},
      memory_efficiency: {},
      cache_performance: {},
      stream_processing: {},
      optimization_comparison: {}
    };
    
    this.testImages = [];
    this.analyzer = null;
    this.optimizer = null;
  }

  /**
   * Initialize benchmark environment
   */
  async initialize() {
    console.log('🚀 Initializing Performance Benchmark Suite...\n');
    
    // Create test images directory if it doesn't exist
    const testDir = path.join(__dirname, 'test-images');
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
    
    // Generate or load test images
    await this.prepareTestImages();
    
    // Initialize analyzers
    this.analyzer = new ImageToText({
      enablePerformanceOptimization: true,
      enableAdaptiveProcessing: true,
      enableIntelligentCaching: true,
      verbose: false
    });
    
    this.optimizer = new PerformanceOptimizer({
      enablePerformanceProfiling: true,
      enableMemoryPooling: true
    });
    
    await this.optimizer.initialize();
    
    console.log('✅ Benchmark environment initialized\n');
  }

  /**
   * Prepare test images for benchmarking
   */
  async prepareTestImages() {
    const testDir = path.join(__dirname, 'test-images');
    
    // Create synthetic test images if none exist
    const Sharp = require('sharp');
    
    const imageSizes = [
      { name: 'small', width: 800, height: 600 },
      { name: 'medium', width: 1920, height: 1080 },
      { name: 'large', width: 2560, height: 1440 },
      { name: 'xlarge', width: 4096, height: 2160 }
    ];
    
    for (const size of imageSizes) {
      const imagePath = path.join(testDir, `test-${size.name}.png`);
      
      try {
        await fs.access(imagePath);
        this.testImages.push({ path: imagePath, ...size });
      } catch (error) {
        // Create synthetic image
        const buffer = await Sharp({
          create: {
            width: size.width,
            height: size.height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
        .png()
        .toBuffer();
        
        await fs.writeFile(imagePath, buffer);
        this.testImages.push({ path: imagePath, ...size });
        console.log(`📸 Created test image: ${size.name} (${size.width}x${size.height})`);
      }
    }
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks() {
    console.log('🏁 Starting Comprehensive Performance Benchmarks\n');
    console.log('=' .repeat(60));
    
    await this.benchmarkSingleImageProcessing();
    await this.benchmarkBatchProcessing();
    await this.benchmarkMemoryEfficiency();
    await this.benchmarkCachePerformance();
    await this.benchmarkStreamProcessing();
    await this.benchmarkOptimizationComparison();
    
    await this.generateReport();
  }

  /**
   * Benchmark single image processing
   */
  async benchmarkSingleImageProcessing() {
    console.log('\n📊 Single Image Processing Benchmarks');
    console.log('-'.repeat(40));
    
    for (const testImage of this.testImages) {
      const results = [];
      
      // Basic analysis
      const basicStart = Date.now();
      try {
        await this.analyzer.analyze(testImage.path, { 
          enableOCR: true,
          enableShapeDetection: false,
          enableColorAnalysis: false
        });
        const basicTime = Date.now() - basicStart;
        results.push({ type: 'basic', time: basicTime });
      } catch (error) {
        results.push({ type: 'basic', error: error.message });
      }
      
      // Comprehensive analysis
      const comprehensiveStart = Date.now();
      try {
        await this.analyzer.analyze(testImage.path, { 
          detailLevel: 'comprehensive',
          enableOCR: true,
          enableShapeDetection: true,
          enableColorAnalysis: true,
          enableLayoutAnalysis: true
        });
        const comprehensiveTime = Date.now() - comprehensiveStart;
        results.push({ type: 'comprehensive', time: comprehensiveTime });
      } catch (error) {
        results.push({ type: 'comprehensive', error: error.message });
      }
      
      // Optimized analysis
      const optimizedStart = Date.now();
      try {
        await this.analyzer.analyzeWithOptimization(testImage.path, {
          detailLevel: 'comprehensive'
        });
        const optimizedTime = Date.now() - optimizedStart;
        results.push({ type: 'optimized', time: optimizedTime });
      } catch (error) {
        results.push({ type: 'optimized', error: error.message });
      }
      
      this.results.single_image[testImage.name] = results;
      
      // Display results
      console.log(`\n${testImage.name.toUpperCase()} (${testImage.width}x${testImage.height}):`);
      results.forEach(result => {
        if (result.error) {
          console.log(`  ${result.type}: ERROR - ${result.error}`);
        } else {
          console.log(`  ${result.type}: ${result.time}ms`);
        }
      });
    }
  }

  /**
   * Benchmark batch processing
   */
  async benchmarkBatchProcessing() {
    console.log('\n📊 Batch Processing Benchmarks');
    console.log('-'.repeat(40));
    
    const batchSizes = [5, 10, 20];
    
    for (const batchSize of batchSizes) {
      console.log(`\nBatch Size: ${batchSize} images`);
      
      // Create batch of test images
      const batch = [];
      for (let i = 0; i < batchSize; i++) {
        const testImage = this.testImages[i % this.testImages.length];
        batch.push(testImage.path);
      }
      
      // Standard batch processing
      const standardStart = Date.now();
      try {
        const standardResults = await this.analyzer.batchAnalyze(batch, {
          enableProgressTracking: false
        });
        const standardTime = Date.now() - standardStart;
        
        console.log(`  Standard: ${standardTime}ms (${(standardTime / batchSize).toFixed(1)}ms/image)`);
        
        this.results.batch_processing[`batch_${batchSize}_standard`] = {
          total_time: standardTime,
          per_image: standardTime / batchSize,
          images: batchSize
        };
      } catch (error) {
        console.log(`  Standard: ERROR - ${error.message}`);
      }
    }
  }

  /**
   * Benchmark memory efficiency
   */
  async benchmarkMemoryEfficiency() {
    console.log('\n📊 Memory Efficiency Benchmarks');
    console.log('-'.repeat(40));
    
    const memoryLoader = new MemoryEfficientLoader({
      maxMemoryUsage: 128 * 1024 * 1024, // 128MB
      preloadCount: 3
    });
    
    // Test memory usage patterns
    const memoryTests = [
      { name: 'sequential_loading', count: 10 },
      { name: 'preload_batch', count: 5 }
    ];
    
    for (const test of memoryTests) {
      console.log(`\n${test.name.replace('_', ' ').toUpperCase()}:`);
      
      const startTime = Date.now();
      
      try {
        if (test.name === 'sequential_loading') {
          for (let i = 0; i < test.count; i++) {
            const testImage = this.testImages[i % this.testImages.length];
            await memoryLoader.loadImage(testImage.path);
          }
        } else if (test.name === 'preload_batch') {
          const imagePaths = this.testImages.slice(0, test.count).map(img => img.path);
          await memoryLoader.preloadImages(imagePaths);
        }
        
        const processingTime = Date.now() - startTime;
        const memoryStats = memoryLoader.getMemoryStats();
        
        console.log(`  Processing Time: ${processingTime}ms`);
        console.log(`  Memory Usage: ${memoryStats.current_usage_mb}MB / ${memoryStats.max_usage_mb}MB`);
        console.log(`  Utilization: ${(memoryStats.utilization * 100).toFixed(1)}%`);
        console.log(`  Loaded Images: ${memoryStats.loaded_images}`);
        
        this.results.memory_efficiency[test.name] = {
          processing_time: processingTime,
          memory_usage_mb: memoryStats.current_usage_mb,
          utilization: memoryStats.utilization,
          loaded_images: memoryStats.loaded_images
        };
        
        // Clear memory for next test
        memoryLoader.clearMemory();
        
      } catch (error) {
        console.log(`  ERROR: ${error.message}`);
      }
    }
  }

  /**
   * Benchmark cache performance
   */
  async benchmarkCachePerformance() {
    console.log('\n📊 Cache Performance Benchmarks');
    console.log('-'.repeat(40));
    
    const cachedAnalyzer = new ImageToText({
      enableIntelligentCaching: true,
      cacheMaxSize: 50 * 1024 * 1024, // 50MB
      verbose: false
    });
    
    const testImage = this.testImages[1]; // Use medium-sized image
    
    // First run (cache miss)
    console.log('\nFirst run (cache miss):');
    const firstStart = Date.now();
    const firstResult = await cachedAnalyzer.analyze(testImage.path);
    const firstTime = Date.now() - firstStart;
    console.log(`  Time: ${firstTime}ms`);
    
    // Second run (cache hit)
    console.log('\nSecond run (cache hit):');
    const secondStart = Date.now();
    const secondResult = await cachedAnalyzer.analyze(testImage.path);
    const secondTime = Date.now() - secondStart;
    console.log(`  Time: ${secondTime}ms`);
    console.log(`  Speedup: ${(firstTime / secondTime).toFixed(2)}x faster`);
    
    this.results.cache_performance = {
      first_run: firstTime,
      cached_run: secondTime,
      speedup: firstTime / secondTime
    };
  }

  /**
   * Benchmark stream processing
   */
  async benchmarkStreamProcessing() {
    console.log('\n📊 Stream Processing Benchmarks');
    console.log('-'.repeat(40));
    
    const streamProcessor = new StreamProcessor({
      maxConcurrent: 4,
      enableCompression: true
    });
    
    // Create dataset for stream testing
    const streamDataset = [];
    for (let i = 0; i < 10; i++) {
      const testImage = this.testImages[i % this.testImages.length];
      streamDataset.push({
        type: 'image',
        imageData: await fs.readFile(testImage.path),
        metadata: { name: `stream_test_${i}`, ...testImage },
        start_time: Date.now()
      });
    }
    
    console.log(`\nProcessing ${streamDataset.length} images via stream:`);
    
    const streamStart = Date.now();
    let processedCount = 0;
    
    try {
      for (const chunk of streamDataset) {
        const result = await streamProcessor.processChunk(chunk);
        processedCount++;
      }
      
      const streamTime = Date.now() - streamStart;
      console.log(`\nStream Processing Complete:`);
      console.log(`  Total Time: ${streamTime}ms`);
      console.log(`  Per Image: ${(streamTime / streamDataset.length).toFixed(1)}ms`);
      console.log(`  Throughput: ${(streamDataset.length / (streamTime / 1000)).toFixed(1)} images/sec`);
      
      this.results.stream_processing = {
        total_time: streamTime,
        per_image: streamTime / streamDataset.length,
        throughput: streamDataset.length / (streamTime / 1000),
        images_processed: processedCount
      };
      
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
  }

  /**
   * Benchmark optimization comparison
   */
  async benchmarkOptimizationComparison() {
    console.log('\n📊 Optimization Comparison Benchmarks');
    console.log('-'.repeat(40));
    
    const testImage = this.testImages[1]; // Use medium image
    
    const configurations = [
      { name: 'baseline', config: { enablePerformanceOptimization: false } },
      { name: 'caching_only', config: { enableIntelligentCaching: true, enableAdaptiveProcessing: false } },
      { name: 'full_optimization', config: { 
        enablePerformanceOptimization: true,
        enableAdaptiveProcessing: true,
        enableIntelligentCaching: true,
        enableMemoryPooling: true
      }}
    ];
    
    console.log(`\nTesting configurations on ${testImage.name} image:`);
    
    for (const config of configurations) {
      const analyzer = new ImageToText({
        ...config.config,
        verbose: false
      });
      
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      try {
        const result = await analyzer.analyze(testImage.path, {
          detailLevel: 'comprehensive'
        });
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const processingTime = endTime - startTime;
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        
        console.log(`  ${config.name.padEnd(20)}: ${processingTime.toString().padStart(6)}ms | ${(memoryDelta / 1024 / 1024).toFixed(1).padStart(6)}MB`);
        
        this.results.optimization_comparison[config.name] = {
          processing_time: processingTime,
          memory_delta_mb: memoryDelta / 1024 / 1024,
          configuration: config.config
        };
        
      } catch (error) {
        console.log(`  ${config.name.padEnd(20)}: ERROR - ${error.message}`);
      }
    }
  }

  /**
   * Generate comprehensive benchmark report
   */
  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE PERFORMANCE REPORT');
    console.log('='.repeat(60));
    
    // Summary statistics
    console.log('\n🏆 PERFORMANCE SUMMARY:');
    
    // Single image performance
    if (this.results.single_image.medium) {
      const mediumResults = this.results.single_image.medium;
      const basicTime = mediumResults.find(r => r.type === 'basic')?.time;
      const optimizedTime = mediumResults.find(r => r.type === 'optimized')?.time;
      
      if (basicTime && optimizedTime) {
        console.log(`  Single Image (1920x1080):`);
        console.log(`    Basic Analysis: ${basicTime}ms`);
        console.log(`    Optimized Analysis: ${optimizedTime}ms`);
        console.log(`    Optimization Speedup: ${(basicTime / optimizedTime).toFixed(2)}x`);
      }
    }
    
    // Cache performance
    if (this.results.cache_performance.speedup) {
      console.log(`\n  Cache Performance:`);
      console.log(`    Cache Hit Speedup: ${this.results.cache_performance.speedup.toFixed(2)}x`);
    }
    
    // Stream processing
    if (this.results.stream_processing.throughput) {
      console.log(`\n  Stream Processing:`);
      console.log(`    Throughput: ${this.results.stream_processing.throughput.toFixed(1)} images/sec`);
      console.log(`    Per Image: ${this.results.stream_processing.per_image.toFixed(1)}ms`);
    }
    
    // System information
    console.log('\n🖥️  SYSTEM INFORMATION:');
    console.log(`  Node.js Version: ${process.version}`);
    console.log(`  Platform: ${process.platform} ${process.arch}`);
    console.log(`  CPU Cores: ${require('os').cpus().length}`);
    console.log(`  Total Memory: ${(require('os').totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB`);
    
    // Save detailed results to file
    const reportPath = path.join(__dirname, 'benchmark-results.json');
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      system: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu_cores: require('os').cpus().length,
        total_memory_gb: require('os').totalmem() / 1024 / 1024 / 1024
      },
      results: this.results
    }, null, 2));
    
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
    console.log('\n' + '='.repeat(60));
    console.log('✅ BENCHMARK COMPLETE');
    console.log('='.repeat(60));
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  (async () => {
    const benchmark = new PerformanceBenchmark();
    
    try {
      await benchmark.initialize();
      await benchmark.runAllBenchmarks();
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = PerformanceBenchmark; 
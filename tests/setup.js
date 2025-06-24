/**
 * Jest Test Setup
 * Configures the testing environment for img-to-text-computational
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Global test configuration
global.TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  testDataDir: path.join(__dirname, 'test-data'),
  tempDir: path.join(os.tmpdir(), 'img-to-text-test'),
  verbose: process.env.NODE_ENV === 'test' && process.env.VERBOSE === 'true'
};

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE) {
  const originalConsole = { ...console };
  
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error; // Keep errors visible
  
  // Restore console for specific tests that need it
  global.restoreConsole = () => {
    Object.assign(console, originalConsole);
  };
}

// Global test utilities
global.testUtils = {
  /**
   * Create a temporary test directory
   */
  async createTempDir(suffix = '') {
    const tempPath = path.join(global.TEST_CONFIG.tempDir, `test-${Date.now()}${suffix}`);
    await fs.mkdir(tempPath, { recursive: true });
    return tempPath;
  },

  /**
   * Clean up temporary test directory
   */
  async cleanupTempDir(tempPath) {
    try {
      await fs.rmdir(tempPath, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  },

  /**
   * Create a test image buffer
   */
  async createTestImage(width = 800, height = 600, format = 'png') {
    const Sharp = require('sharp');
    
    return await Sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .png()
    .toBuffer();
  },

  /**
   * Create a test image file
   */
  async createTestImageFile(filePath, width = 800, height = 600) {
    const buffer = await this.createTestImage(width, height);
    await fs.writeFile(filePath, buffer);
    return filePath;
  },

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition, timeout = 5000, interval = 100) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Measure execution time
   */
  async measureTime(fn) {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    
    return { result, duration };
  },

  /**
   * Generate test data
   */
  generateTestData: {
    /**
     * Generate test color data
     */
    colors: () => ({
      primary: { hex: '#007bff', rgb: { r: 0, g: 123, b: 255 } },
      secondary: { hex: '#6c757d', rgb: { r: 108, g: 117, b: 125 } },
      background: { hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } }
    }),

    /**
     * Generate test component data
     */
    components: () => [
      {
        id: 'component_0',
        type: 'button',
        confidence: 0.89,
        position: { x: 50, y: 200, width: 300, height: 80 },
        text_content: 'Test Button',
        classification_reasoning: 'Test button component'
      },
      {
        id: 'component_1',
        type: 'input',
        confidence: 0.92,
        position: { x: 50, y: 300, width: 400, height: 40 },
        text_content: '',
        classification_reasoning: 'Test input field'
      }
    ],

    /**
     * Generate test text extraction data
     */
    textExtraction: () => ({
      raw_text: 'Test Header\nTest Button\nTest Content',
      confidence: 0.97,
      structured_text: [
        {
          id: 'text_0',
          type: 'header',
          text: 'Test Header',
          position: { x: 50, y: 50, width: 200, height: 30 },
          font_info: { estimated_size: 24, size_category: 'large' }
        }
      ]
    }),

    /**
     * Generate test analysis result
     */
    analysisResult: () => ({
      image_metadata: {
        file_name: 'test-image.png',
        dimensions: '800x600',
        format: 'PNG',
        analyzed_at: new Date().toISOString()
      },
      text_extraction: testUtils.generateTestData.textExtraction(),
      color_analysis: {
        dominant_colors: testUtils.generateTestData.colors(),
        color_harmony: { scheme_type: 'complementary', temperature: 'cool' }
      },
      components: testUtils.generateTestData.components(),
      processing_time: 1250,
      analysis_statistics: {
        components_detected: 2,
        text_elements: 1,
        colors_extracted: 3,
        confidence_scores: { average: 0.91, min: 0.89, max: 0.97 }
      }
    })
  }
};

// Performance monitoring for tests
global.performanceMonitor = {
  measurements: new Map(),
  
  start(label) {
    this.measurements.set(label, { start: Date.now() });
  },
  
  end(label) {
    const measurement = this.measurements.get(label);
    if (measurement) {
      measurement.end = Date.now();
      measurement.duration = measurement.end - measurement.start;
      return measurement.duration;
    }
    return 0;
  },
  
  get(label) {
    return this.measurements.get(label);
  },
  
  clear() {
    this.measurements.clear();
  },
  
  getAll() {
    return Array.from(this.measurements.entries()).map(([label, data]) => ({
      label,
      ...data
    }));
  }
};

// Memory monitoring for tests
global.memoryMonitor = {
  snapshots: [],
  
  snapshot(label = 'unnamed') {
    const usage = process.memoryUsage();
    const snapshot = {
      label,
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024)
    };
    
    this.snapshots.push(snapshot);
    return snapshot;
  },
  
  compare(label1, label2) {
    const snap1 = this.snapshots.find(s => s.label === label1);
    const snap2 = this.snapshots.find(s => s.label === label2);
    
    if (!snap1 || !snap2) {
      return null;
    }
    
    return {
      heapUsedDiff: snap2.heapUsed - snap1.heapUsed,
      heapTotalDiff: snap2.heapTotal - snap1.heapTotal,
      heapUsedDiffMB: snap2.heapUsedMB - snap1.heapUsedMB,
      timeDiff: snap2.timestamp - snap1.timestamp
    };
  },
  
  clear() {
    this.snapshots = [];
  },
  
  getAll() {
    return [...this.snapshots];
  }
};

// Global test matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },

  toHaveValidImageFormat(received) {
    const validFormats = ['PNG', 'JPEG', 'JPG', 'GIF', 'WEBP', 'BMP'];
    const pass = validFormats.includes(received.toUpperCase());
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid image format`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid image format (${validFormats.join(', ')})`,
        pass: false
      };
    }
  },

  toHaveValidColorFormat(received) {
    const hexRegex = /^#[0-9A-F]{6}$/i;
    const pass = hexRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid hex color`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid hex color format`,
        pass: false
      };
    }
  },

  toHaveValidPosition(received) {
    const hasRequiredFields = received && 
      typeof received.x === 'number' && 
      typeof received.y === 'number' && 
      typeof received.width === 'number' && 
      typeof received.height === 'number';
    
    const hasValidValues = hasRequiredFields &&
      received.x >= 0 && 
      received.y >= 0 && 
      received.width > 0 && 
      received.height > 0;
    
    if (hasValidValues) {
      return {
        message: () => `expected position object not to be valid`,
        pass: true
      };
    } else {
      return {
        message: () => `expected position object to have valid x, y, width, height properties`,
        pass: false
      };
    }
  }
});

// Setup and teardown hooks
beforeAll(async () => {
  // Create test data directory
  await fs.mkdir(global.TEST_CONFIG.testDataDir, { recursive: true });
  await fs.mkdir(global.TEST_CONFIG.tempDir, { recursive: true });
  
  if (global.TEST_CONFIG.verbose) {
    console.log('🧪 Test environment initialized');
    console.log(`📁 Test data directory: ${global.TEST_CONFIG.testDataDir}`);
    console.log(`📁 Temporary directory: ${global.TEST_CONFIG.tempDir}`);
  }
});

afterAll(async () => {
  // Cleanup temporary directories
  try {
    await fs.rmdir(global.TEST_CONFIG.tempDir, { recursive: true });
  } catch (error) {
    // Ignore cleanup errors
  }
  
  if (global.TEST_CONFIG.verbose) {
    console.log('🧹 Test environment cleaned up');
  }
});

beforeEach(() => {
  // Clear performance and memory monitors
  global.performanceMonitor.clear();
  global.memoryMonitor.clear();
  
  // Take initial memory snapshot
  global.memoryMonitor.snapshot('test_start');
});

afterEach(() => {
  // Take final memory snapshot
  global.memoryMonitor.snapshot('test_end');
  
  // Log performance data if verbose
  if (global.TEST_CONFIG.verbose) {
    const memoryDiff = global.memoryMonitor.compare('test_start', 'test_end');
    if (memoryDiff && Math.abs(memoryDiff.heapUsedDiffMB) > 10) {
      console.log(`📊 Memory usage changed by ${memoryDiff.heapUsedDiffMB}MB`);
    }
  }
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for integration tests
jest.setTimeout(global.TEST_CONFIG.timeout);

if (global.TEST_CONFIG.verbose) {
  console.log('✅ Jest test setup complete');
} 
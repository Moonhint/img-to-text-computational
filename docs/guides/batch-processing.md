# ⚡ Batch Processing Guide v2.0.6

## Enhanced Parallel Processing with Workers

The v2.0.6 update introduces revolutionary **parallel processing capabilities** with configurable workers, real-time progress tracking, and intelligent memory management.

---

## 🚀 Quick Start

### Basic Batch Processing
```bash
# Process all images in a directory
img-to-text batch ./images/ --output-dir ./results
```

### Enhanced with Workers (NEW v2.0.6)
```bash
# Use 8 parallel workers for maximum speed
img-to-text batch ./images/ --workers 8 --output-dir ./results --progress
```

---

## 🛠️ Command Syntax

### Full Command Options
```bash
img-to-text batch [input] [options]
```

### Input Methods
```bash
# Method 1: Directory as argument
img-to-text batch ./images/ --output-dir ./results

# Method 2: Using --input-dir flag
img-to-text batch -i ./images/ -o ./results

# Method 3: Current directory
img-to-text batch . --output-dir ./results
```

---

## ⚙️ Configuration Options

### Worker Configuration (NEW v2.0.6)
```bash
# Automatic worker detection (recommended)
img-to-text batch ./images/ --workers auto

# Manual worker count (1 to CPU cores)
img-to-text batch ./images/ --workers 8

# Conservative processing (for large images)
img-to-text batch ./images/ --workers 2
```

### Progress Tracking (NEW v2.0.6)
```bash
# Real-time progress display
img-to-text batch ./images/ --progress

# Quiet processing
img-to-text batch ./images/ --quiet
```

### Memory Management (NEW v2.0.6)
```bash
# Chunk size for memory efficiency
img-to-text batch ./images/ --chunk-size 5

# Small chunks for large images
img-to-text batch ./large-images/ --chunk-size 2

# Large chunks for small images
img-to-text batch ./thumbnails/ --chunk-size 10
```

---

## 📊 Performance Optimization

### Optimal Configuration Matrix

| Image Size | Count | Workers | Chunk Size | Example |
|------------|-------|---------|------------|---------|
| Small (<500KB) | <50 | 8 | 10 | Thumbnails, icons |
| Medium (500KB-2MB) | 10-100 | 6 | 5 | Screenshots, photos |
| Large (2MB-10MB) | 10-50 | 4 | 3 | High-res images |
| Extra Large (>10MB) | <20 | 2 | 2 | RAW images, posters |

### Example Configurations
```bash
# Thumbnails/Icons (fast processing)
img-to-text batch ./thumbnails/ --workers 8 --chunk-size 10 --progress

# Standard images (balanced)
img-to-text batch ./screenshots/ --workers 6 --chunk-size 5 --progress

# High-resolution images (memory conservative)
img-to-text batch ./high-res/ --workers 2 --chunk-size 2 --progress
```

---

## 🎯 Real-World Examples

### Example 1: Website Screenshot Analysis
```bash
# Analyze website screenshots with full features
img-to-text batch ./website-screens/ \
  --workers 6 \
  --chunk-size 5 \
  --output-dir ./web-analysis \
  --format json \
  --progress
```

**Output:**
```
🚀 Starting batch processing...
📁 Input: ./website-screens/ (24 images found)
⚡ Workers: 6
📊 Chunk size: 5

Processing: ████████████████████ 100% (24/24)
✅ homepage.png - 1,234ms - 98% confidence
✅ about.png - 987ms - 97% confidence
✅ contact.png - 1,100ms - 99% confidence
...

📈 Batch Summary:
Total: 24 images
Success: 24 (100%)
Failed: 0 (0%)
Average confidence: 98%
Total time: 28.5s
Throughput: 0.84 images/second
```

### Example 2: Mobile App Screenshots
```bash
# Analyze mobile app screens
img-to-text batch ./mobile-screens/ \
  --workers 8 \
  --pattern "**/*.{png,jpg}" \
  --output-dir ./mobile-analysis \
  --enable-optimization \
  --progress
```

### Example 3: Design System Audit
```bash
# Audit design components
img-to-text batch ./design-components/ \
  --workers 4 \
  --format yaml \
  --output-dir ./design-audit \
  --no-patterns \
  --progress
```

### Example 4: Form Processing
```bash
# Process form images with OCR focus
img-to-text batch ./forms/ \
  --workers 6 \
  --enable-multi-lang \
  --lang eng \
  --output-dir ./form-analysis \
  --progress
```

---

## 📈 Performance Monitoring

### Real-Time Progress Display
```bash
img-to-text batch ./images/ --workers 8 --progress
```

**Detailed Progress Output:**
```
🚀 Starting batch processing...
📁 Input: ./images/ (150 images found)
⚡ Workers: 8
📊 Chunk size: 5
🎯 Pattern: **/*.{png,jpg,jpeg,gif,bmp,tiff}

Processing chunk 1/30: ████████████████████ 100% (5/5)
✅ image001.png - 987ms - 98% confidence
✅ image002.jpg - 1,234ms - 97% confidence
✅ image003.png - 876ms - 99% confidence
✅ image004.jpg - 1,100ms - 96% confidence
✅ image005.png - 945ms - 98% confidence

Processing chunk 2/30: ████████████████████ 100% (5/5)
...

Overall Progress: ████████████████████ 100% (150/150)

📈 Final Summary:
╔══════════════════════════════════════════════════════════════╗
║                     BATCH PROCESSING SUMMARY                 ║
╠══════════════════════════════════════════════════════════════╣
║ Total Images: 150                                            ║
║ Successful: 148 (98.7%)                                      ║
║ Failed: 2 (1.3%)                                             ║
║ Average Confidence: 97.8%                                    ║
║ Total Processing Time: 3m 45s                                ║
║ Average Time per Image: 1,500ms                              ║
║ Throughput: 0.67 images/second                               ║
║ Peak Memory Usage: 2.1GB                                     ║
║ Worker Efficiency: 94%                                       ║
╚══════════════════════════════════════════════════════════════╝

Top Performing Images:
🥇 image045.png - 99.8% confidence (892ms)
🥈 image123.jpg - 99.6% confidence (756ms)  
🥉 image089.png - 99.4% confidence (1,023ms)

Failed Images:
❌ corrupted.png - Invalid image format
❌ empty.jpg - Image dimensions too small
```

### Performance Metrics Explanation

| Metric | Description | Good Range |
|--------|-------------|------------|
| **Throughput** | Images processed per second | 0.5-2.0 images/sec |
| **Average Confidence** | Overall detection quality | 90%+ excellent |
| **Worker Efficiency** | Worker utilization rate | 80%+ good |
| **Memory Usage** | Peak memory consumption | <4GB per worker |
| **Success Rate** | Percentage of successful analyses | 95%+ excellent |

---

## 🎛️ Advanced Features

### File Pattern Matching
```bash
# Specific file types
img-to-text batch ./images/ --pattern "*.png"

# Multiple formats
img-to-text batch ./images/ --pattern "**/*.{png,jpg,jpeg}"

# Exclude files
img-to-text batch ./images/ --pattern "**/*.png" | grep -v "thumbnail"
```

### Custom Output Formats
```bash
# JSON output (default)
img-to-text batch ./images/ --format json

# YAML output
img-to-text batch ./images/ --format yaml

# Markdown reports
img-to-text batch ./images/ --format markdown
```

### Analysis Configuration
```bash
# Enable all advanced features
img-to-text batch ./images/ \
  --enable-optimization \
  --enable-multi-lang \
  --workers 6

# Disable heavy features for speed
img-to-text batch ./images/ \
  --no-patterns \
  --no-relationships \
  --no-design-system \
  --workers 8

# OCR-focused processing
img-to-text batch ./documents/ \
  --lang eng \
  --no-shapes \
  --no-colors \
  --workers 4
```

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Issue: "Too many workers for available memory"
```bash
# Reduce workers
img-to-text batch ./images/ --workers 2

# Reduce chunk size
img-to-text batch ./images/ --chunk-size 2

# Check available memory
node -e "console.log(Math.round(require('os').totalmem()/1024/1024/1024)) + 'GB'"
```

#### Issue: "Processing hanging/freezing"
```bash
# Use fewer workers
img-to-text batch ./images/ --workers 1

# Disable problematic features
img-to-text batch ./images/ --no-patterns --workers 4

# Process smaller batches
img-to-text batch ./images/ --chunk-size 1
```

#### Issue: "High memory usage"
```bash
# Conservative memory configuration
img-to-text batch ./images/ \
  --workers 2 \
  --chunk-size 2 \
  --no-relationships

# Check memory usage during processing
top -p $(pgrep node)
```

#### Issue: "Low throughput"
```bash
# Optimize for speed
img-to-text batch ./images/ \
  --workers 8 \
  --chunk-size 8 \
  --no-design-system \
  --progress

# Check CPU utilization
htop  # or Activity Monitor on macOS
```

#### Issue: "Failed images"
```bash
# Check specific failure reasons
img-to-text batch ./images/ --verbose 2>&1 | grep "Error:"

# Skip problematic images
find ./images/ -name "*.png" -exec img-to-text analyze {} \; 2>/dev/null
```

---

## 📊 Benchmarking and Testing

### Performance Testing
```bash
# Benchmark your system
img-to-text test --quick

# Full system test
img-to-text test

# Custom benchmark
time img-to-text batch ./test-images/ --workers 8 --quiet
```

### Worker Scaling Test
```bash
# Test different worker counts
for workers in 1 2 4 6 8; do
  echo "Testing $workers workers:"
  time img-to-text batch ./test-images/ --workers $workers --quiet
  echo "---"
done
```

### Memory Usage Monitoring
```bash
# Monitor memory during batch processing
img-to-text batch ./images/ --workers 8 --progress &
PID=$!
while kill -0 $PID 2>/dev/null; do
  ps -p $PID -o pid,vsz,rss,pcpu,comm
  sleep 5
done
```

---

## 🚀 Best Practices

### 1. **Optimal Worker Configuration**
```bash
# Get CPU count
CPUS=$(node -e "console.log(require('os').cpus().length)")

# Use 75% of cores for mixed workloads
WORKERS=$((CPUS * 3 / 4))

img-to-text batch ./images/ --workers $WORKERS
```

### 2. **Memory-Efficient Processing**
```bash
# For large images (>5MB each)
img-to-text batch ./large-images/ --workers 2 --chunk-size 1

# For many small images (<1MB each)  
img-to-text batch ./thumbnails/ --workers 8 --chunk-size 10
```

### 3. **Progress Monitoring**
```bash
# Always use progress for large batches
img-to-text batch ./images/ --workers 6 --progress > processing.log 2>&1

# Monitor in real-time
tail -f processing.log
```

### 4. **Error Recovery**
```bash
# Retry failed images
img-to-text batch ./images/ --workers 4 2> failed.log
grep "Error:" failed.log | cut -d: -f1 | xargs -I {} img-to-text analyze {}
```

### 5. **Automated Scaling**
```bash
#!/bin/bash
# Auto-scale based on image size
TOTAL_SIZE=$(du -sh ./images/ | cut -f1)
if [[ $TOTAL_SIZE =~ "G" ]]; then
  WORKERS=2  # Large images
else
  WORKERS=8  # Small/medium images
fi

img-to-text batch ./images/ --workers $WORKERS --progress
```

---

## 📈 Performance Results

### v2.0.6 Benchmark Results

| Configuration | Images | Time | Throughput | Memory | Success Rate |
|---------------|--------|------|------------|--------|--------------|
| 1 worker | 100 | 5m 30s | 0.30 img/s | 400MB | 99% |
| 4 workers | 100 | 1m 45s | 0.95 img/s | 1.2GB | 99% |
| 8 workers | 100 | 1m 10s | 1.43 img/s | 2.1GB | 98% |

### Confidence Distribution
- **98% average confidence** maintained across all worker configurations
- **Minimum confidence**: 94% 
- **Maximum confidence**: 99.8%
- **Consistency**: ±2% variance regardless of worker count

---

## 🔗 Related Documentation

- [Getting Started Guide](getting-started.md) - Basic usage and setup
- [Performance Tuning](performance-tuning.md) - Optimize for your system
- [Advanced Configuration](advanced-configuration.md) - Detailed settings
- [Integration Guide](integration.md) - Integrate with applications

---

**🎉 You're now a batch processing expert!** 

The v2.0.6 enhanced parallel processing capabilities will help you analyze thousands of images efficiently with **98% confidence accuracy**.

---

*Last updated: v2.0.6 - Enhanced CLI with Workers Support*

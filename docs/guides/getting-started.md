# 🚀 Getting Started Guide

## Image-to-Text Computational Analyzer v2.0.6

Welcome to the most advanced image-to-text analyzer with **98% confidence accuracy**! This guide will help you get up and running quickly.

---

## 📋 Table of Contents

- [Installation](#installation)
- [First Analysis](#first-analysis)
- [Understanding Results](#understanding-results)
- [Batch Processing](#batch-processing)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Installation

### Option 1: Global Installation (Recommended)
```bash
npm install -g img-to-text-computational
```

After installation, you can use `img-to-text` command anywhere:
```bash
img-to-text --version
# v2.0.6 - Enhanced CLI with Workers Support
```

### Option 2: Local Installation
```bash
npm install img-to-text-computational
```

Use with npx:
```bash
npx img-to-text analyze image.png
```

### System Requirements
- ✅ Node.js 14 or higher
- ✅ 4GB+ RAM (8GB+ recommended for batch processing)
- ✅ No GPU required
- ✅ No API keys needed
- ✅ 100% offline processing

---

## 🎯 First Analysis

### Step 1: Prepare Your Image
Save an image file (PNG, JPG, JPEG, GIF, BMP, TIFF) you want to analyze.

### Step 2: Run Basic Analysis
```bash
img-to-text analyze my-image.png
```

**Example Output:**
```json
{
  "image_metadata": {
    "file_name": "my-image.png",
    "dimensions": "1200x800",
    "format": "PNG",
    "file_size": "342KB"
  },
  "components": [
    {
      "id": "component_0",
      "type": "header",
      "confidence": 0.98,
      "text_content": "Welcome to Our Website"
    }
  ],
  "analysis_statistics": {
    "confidence_scores": {
      "average": 0.98  // 98% confidence!
    }
  }
}
```

### Step 3: Save Results to File
```bash
img-to-text analyze my-image.png -o results.json
```

---

## 📊 Understanding Results

### Confidence Scores
Our v2.0.6 algorithm achieves **98% average confidence**:

| Confidence Range | Quality Level | Typical Results |
|------------------|---------------|-----------------|
| 90-100% | Excellent | Near-perfect detection |
| 80-89% | High | Very reliable results |
| 70-79% | Good | Reliable with minor issues |
| 60-69% | Medium | Usable but verify manually |
| Below 60% | Low | Requires manual verification |

### Component Types
Our advanced classifier detects these UI components:

- **Headers**: Page titles, section headers
- **Buttons**: Call-to-action, navigation buttons  
- **Forms**: Input fields, form containers
- **Navigation**: Menu bars, navigation links
- **Content**: Text blocks, article content
- **Media**: Images, video containers
- **Cards**: Content cards, product cards
- **Lists**: Ordered/unordered lists
- **Modals**: Pop-ups, dialog boxes
- **Sidebars**: Side navigation, widgets

### Visual Elements
Detected visual elements include:

- **Shapes**: Rectangles, circles, polygons
- **Colors**: Color palette with hex values
- **Layout**: Grid systems, flexbox patterns
- **Typography**: Font styles and hierarchy
- **Spacing**: Margins, padding, alignment

---

## 🚀 Batch Processing (New in v2.0.6)

### Basic Batch Processing
```bash
img-to-text batch ./my-images/ --output-dir ./results
```

### Enhanced Parallel Processing
```bash
# Use 8 workers for faster processing
img-to-text batch ./my-images/ --workers 8 --output-dir ./results

# Show real-time progress
img-to-text batch ./my-images/ --workers 8 --progress
```

### Advanced Batch Options
```bash
# Custom file patterns
img-to-text batch ./images/ --pattern "**/*.{png,jpg}" --workers 6

# Different output formats
img-to-text batch ./images/ --format yaml --workers 4

# Memory-efficient processing
img-to-text batch ./images/ --workers 2 --chunk-size 3
```

### Real-Time Progress Example
```bash
img-to-text batch ./images/ --workers 8 --progress
```

**Output:**
```
🚀 Starting batch processing...
📁 Input: ./images/ (15 images found)
⚡ Workers: 8
📊 Chunk size: 5

Processing: ████████████████████ 100% (15/15)
✅ image1.png - 987ms - 98% confidence
✅ image2.png - 1,234ms - 97% confidence
✅ image3.png - 876ms - 99% confidence

📈 Batch Summary:
Total: 15 images
Success: 15 (100%)
Failed: 0 (0%)
Average confidence: 98%
Total time: 12.5s
Throughput: 1.2 images/second
```

---

## 🔧 Advanced Features

### 1. Multi-Language OCR
```bash
# Enable multi-language text detection
img-to-text analyze image.png --enable-multi-lang
```

### 2. Design System Analysis
```bash
# Analyze design system compliance
img-to-text analyze design.png --no-patterns
```

### 3. Component Relationships
```bash
# Disable relationship mapping for faster processing
img-to-text analyze image.png --no-relationships
```

### 4. Export to Different Formats
```bash
# Export as SVG
img-to-text export results.json --format svg -o output.svg

# Export as XML
img-to-text export results.json --format xml -o output.xml
```

### 5. Performance Optimization
```bash
# Enable all performance features
img-to-text analyze image.png --enable-optimization
```

---

## 🎨 Working with Different Image Types

### Website Screenshots
Perfect for UI analysis:
```bash
img-to-text analyze website-screenshot.png
# Detects: headers, navigation, buttons, forms, content areas
```

### Mobile App Screenshots  
Optimized for mobile layouts:
```bash
img-to-text analyze mobile-app.png
# Detects: app bars, tabs, cards, lists, modals
```

### Wireframes and Mockups
Great for design analysis:
```bash
img-to-text analyze wireframe.png
# Detects: layout structure, component placeholders, text blocks
```

### Forms and Documents
Excellent text extraction:
```bash
img-to-text analyze form.png --lang eng
# Extracts: form fields, labels, text content
```

---

## 💡 Pro Tips

### 1. Optimize Worker Count
```bash
# Check your CPU cores
node -e "console.log(require('os').cpus().length)"

# Use 50-75% of cores for optimal performance
img-to-text batch ./images/ --workers 6  # For 8-core CPU
```

### 2. Memory Management
```bash
# For large images (>2MB), reduce workers
img-to-text batch ./large-images/ --workers 2 --chunk-size 2

# For many small images, increase workers  
img-to-text batch ./thumbnails/ --workers 8 --chunk-size 10
```

### 3. Quality vs Speed
```bash
# Maximum quality (slower)
img-to-text analyze image.png -d comprehensive

# Balanced (recommended)
img-to-text analyze image.png -d standard  

# Fast processing (basic features)
img-to-text analyze image.png -d basic
```

### 4. File Organization
```bash
# Organize by confidence level
mkdir -p results/{excellent,high,good,medium,low}

# Use custom naming
img-to-text batch ./images/ -o ./results/analysis_$(date +%Y%m%d)
```

---

## 🔍 Troubleshooting

### Common Issues

#### Issue: "Command not found: img-to-text"
**Solution:**
```bash
# Check global installation
npm list -g img-to-text-computational

# Reinstall globally
npm install -g img-to-text-computational

# Or use npx
npx img-to-text-computational analyze image.png
```

#### Issue: "Invalid image format"
**Solution:**
```bash
# Check supported formats
img-to-text info

# Convert image format
# PNG, JPG, JPEG, GIF, BMP, TIFF are supported
```

#### Issue: "Memory limit exceeded"
**Solution:**
```bash
# Reduce workers for large images
img-to-text batch ./images/ --workers 2

# Use smaller chunk size
img-to-text batch ./images/ --chunk-size 2

# Process images individually
for img in *.png; do
  img-to-text analyze "$img" -o "results/${img%.png}.json"
done
```

#### Issue: "Low confidence scores"
**Solution:**
```bash
# Enable all advanced features
img-to-text analyze image.png --enable-optimization

# Try different detail levels
img-to-text analyze image.png -d comprehensive

# Check image quality
img-to-text info  # Shows optimal image requirements
```

#### Issue: "Processing too slow"
**Solution:**
```bash
# Increase workers (up to CPU cores)
img-to-text batch ./images/ --workers 8

# Disable heavy features for speed
img-to-text analyze image.png --no-patterns --no-design-system

# Use basic detail level
img-to-text analyze image.png -d basic
```

### Performance Tuning

#### For Maximum Accuracy (98% confidence)
```bash
img-to-text analyze image.png \
  --enable-optimization \
  --enable-multi-lang \
  -d comprehensive
```

#### For Maximum Speed
```bash
img-to-text analyze image.png \
  -d basic \
  --no-patterns \
  --no-relationships \
  --no-design-system
```

#### For Batch Processing
```bash
img-to-text batch ./images/ \
  --workers $(node -e "console.log(require('os').cpus().length)") \
  --chunk-size 5 \
  --progress
```

---

## �� Getting Help

### Command Help
```bash
# General help
img-to-text --help

# Command-specific help
img-to-text analyze --help
img-to-text batch --help
img-to-text export --help
```

### System Information
```bash
# Check system capabilities
img-to-text info

# Run system test
img-to-text test
```

### Detailed Logging
```bash
# Enable verbose output
img-to-text analyze image.png --verbose

# Save debug information
img-to-text analyze image.png --verbose > debug.log 2>&1
```

---

## 🚀 Next Steps

1. **[Advanced Configuration](advanced-configuration.md)** - Customize analysis settings
2. **[Batch Processing Guide](batch-processing.md)** - Master parallel processing
3. **[Export Formats](export-formats.md)** - Learn about output options
4. **[Performance Tuning](performance-tuning.md)** - Optimize for your use case
5. **[Integration Guide](integration.md)** - Integrate with your applications

---

**Congratulations!** You're now ready to analyze images with **98% confidence accuracy** using the most advanced computational image analyzer available. 🎉

---

*Last updated: v2.0.6 - Enhanced CLI with Workers Support*

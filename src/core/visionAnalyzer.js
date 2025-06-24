const cv = require('opencv.js');
const sharp = require('sharp');

class VisionAnalyzer {
  constructor(options = {}) {
    this.options = {
      minContourArea: options.minContourArea || 100,
      maxContourArea: options.maxContourArea || 500000,
      rectangularityThreshold: options.rectangularityThreshold || 0.1,
      circularityThreshold: options.circularityThreshold || 0.1,
      ...options
    };
  }

  /**
   * Analyze image for shapes, edges, and visual elements
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Vision analysis results
   */
  async analyze(imageBuffer) {
    try {
      // Convert image buffer to OpenCV Mat
      const mat = await this.bufferToMat(imageBuffer);
      
      const analysis = {
        shapes: await this.detectShapes(mat),
        edges: await this.detectEdges(mat),
        contours: await this.findContours(mat),
        lines: await this.detectLines(mat),
        visual_elements: []
      };

      // Combine all detected elements
      analysis.visual_elements = this.combineVisualElements(analysis);
      
      mat.delete(); // Clean up memory
      
      return analysis;
    } catch (error) {
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Convert image buffer to OpenCV Mat
   */
  async bufferToMat(imageBuffer) {
    // Create Mat from image buffer
    const uint8Array = new Uint8Array(imageBuffer);
    return cv.imdecode(uint8Array, cv.IMREAD_COLOR);
  }

  /**
   * Detect geometric shapes in the image
   */
  async detectShapes(mat) {
    const shapes = {
      rectangles: [],
      circles: [],
      polygons: []
    };

    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_BGR2GRAY);

    // Detect rectangles
    shapes.rectangles = this.detectRectangles(gray);
    
    // Detect circles
    shapes.circles = this.detectCircles(gray);
    
    // Detect other polygons
    shapes.polygons = this.detectPolygons(gray);

    gray.delete();
    return shapes;
  }

  /**
   * Detect rectangular shapes
   */
  detectRectangles(grayMat) {
    const rectangles = [];
    
    // Apply Gaussian blur to reduce noise
    const blurred = new cv.Mat();
    cv.GaussianBlur(grayMat, blurred, new cv.Size(5, 5), 0);

    // Apply Canny edge detection
    const edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Process each contour
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      if (area > this.options.minContourArea && area < this.options.maxContourArea) {
        const rect = cv.boundingRect(contour);
        
        // Check if contour is rectangular
        if (this.isRectangular(contour, rect)) {
          rectangles.push({
            type: 'rectangle',
            position: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            area: area,
            aspect_ratio: rect.width / rect.height,
            confidence: this.calculateRectangleConfidence(contour, rect)
          });
        }
      }
      
      contour.delete();
    }

    // Clean up
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();

    return rectangles.sort((a, b) => b.area - a.area); // Sort by area descending
  }

  /**
   * Check if a contour represents a rectangle
   */
  isRectangular(contour, rect) {
    const contourArea = cv.contourArea(contour);
    const rectArea = rect.width * rect.height;
    const ratio = Math.abs(contourArea - rectArea) / rectArea;
    
    return ratio < this.options.rectangularityThreshold;
  }

  /**
   * Calculate confidence score for rectangle detection
   */
  calculateRectangleConfidence(contour, rect) {
    const contourArea = cv.contourArea(contour);
    const rectArea = rect.width * rect.height;
    const areaRatio = contourArea / rectArea;
    
    // Higher confidence for more rectangular shapes
    return Math.max(0, 1 - Math.abs(1 - areaRatio));
  }

  /**
   * Detect circular shapes
   */
  detectCircles(grayMat) {
    const circles = [];
    
    try {
      // Apply HoughCircles to detect circles
      const circlesMat = new cv.Mat();
      cv.HoughCircles(
        grayMat, 
        circlesMat, 
        cv.HOUGH_GRADIENT, 
        1, 
        50, // min distance between circles
        50, // higher threshold for edge detection
        30, // accumulator threshold
        5,  // min radius
        100 // max radius
      );

      // Process detected circles
      for (let i = 0; i < circlesMat.cols; i++) {
        const x = circlesMat.data32F[i * 3];
        const y = circlesMat.data32F[i * 3 + 1];
        const radius = circlesMat.data32F[i * 3 + 2];
        
        circles.push({
          type: 'circle',
          position: {
            x: Math.round(x - radius),
            y: Math.round(y - radius),
            width: Math.round(radius * 2),
            height: Math.round(radius * 2)
          },
          center: { x: Math.round(x), y: Math.round(y) },
          radius: Math.round(radius),
          area: Math.PI * radius * radius,
          confidence: 0.8 // OpenCV HoughCircles generally reliable
        });
      }

      circlesMat.delete();
    } catch (error) {
      console.warn('Circle detection failed:', error.message);
    }

    return circles.sort((a, b) => b.area - a.area);
  }

  /**
   * Detect other polygon shapes
   */
  detectPolygons(grayMat) {
    const polygons = [];
    
    // Apply threshold
    const thresh = new cv.Mat();
    cv.threshold(grayMat, thresh, 127, 255, cv.THRESH_BINARY);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Process each contour
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      if (area > this.options.minContourArea) {
        // Approximate contour to polygon
        const approx = new cv.Mat();
        const epsilon = 0.02 * cv.arcLength(contour, true);
        cv.approxPolyDP(contour, approx, epsilon, true);
        
        const vertices = approx.rows;
        
        if (vertices >= 3 && vertices <= 10) { // Valid polygon
          const rect = cv.boundingRect(contour);
          
          polygons.push({
            type: 'polygon',
            vertices: vertices,
            position: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            area: area,
            confidence: this.calculatePolygonConfidence(vertices, area)
          });
        }
        
        approx.delete();
      }
      
      contour.delete();
    }

    // Clean up
    thresh.delete();
    contours.delete();
    hierarchy.delete();

    return polygons.sort((a, b) => b.area - a.area);
  }

  /**
   * Calculate confidence for polygon detection
   */
  calculatePolygonConfidence(vertices, area) {
    // Simple heuristic: more vertices = less confidence for UI elements
    if (vertices === 3) return 0.7; // Triangle
    if (vertices === 4) return 0.9; // Quadrilateral
    if (vertices <= 6) return 0.6; // Pentagon/Hexagon
    return 0.4; // Complex polygon
  }

  /**
   * Detect edges in the image
   */
  async detectEdges(mat) {
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_BGR2GRAY);

    const edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);

    // Count edge pixels
    const nonZero = cv.countNonZero(edges);
    const total = edges.rows * edges.cols;
    const edgeRatio = nonZero / total;

    gray.delete();
    edges.delete();

    return {
      edge_pixel_count: nonZero,
      total_pixels: total,
      edge_ratio: edgeRatio,
      complexity: this.classifyComplexity(edgeRatio)
    };
  }

  /**
   * Classify image complexity based on edge ratio
   */
  classifyComplexity(edgeRatio) {
    if (edgeRatio < 0.05) return 'simple';
    if (edgeRatio < 0.15) return 'moderate';
    if (edgeRatio < 0.25) return 'complex';
    return 'very_complex';
  }

  /**
   * Find all contours in the image
   */
  async findContours(mat) {
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_BGR2GRAY);

    const thresh = new cv.Mat();
    cv.threshold(gray, thresh, 127, 255, cv.THRESH_BINARY);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const contourData = [];
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const perimeter = cv.arcLength(contour, true);
      const rect = cv.boundingRect(contour);

      if (area > this.options.minContourArea) {
        contourData.push({
          area: area,
          perimeter: perimeter,
          position: rect,
          aspect_ratio: rect.width / rect.height,
          solidity: area / (rect.width * rect.height)
        });
      }
      
      contour.delete();
    }

    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();

    return contourData.sort((a, b) => b.area - a.area);
  }

  /**
   * Detect lines using Hough transform
   */
  async detectLines(mat) {
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_BGR2GRAY);

    const edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);

    const lines = new cv.Mat();
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);

    const lineData = [];
    for (let i = 0; i < lines.rows; i++) {
      const x1 = lines.data32S[i * 4];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];

      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

      lineData.push({
        type: 'line',
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        length: length,
        angle: angle,
        orientation: this.classifyLineOrientation(angle)
      });
    }

    gray.delete();
    edges.delete();
    lines.delete();

    return lineData;
  }

  /**
   * Classify line orientation
   */
  classifyLineOrientation(angle) {
    const absAngle = Math.abs(angle);
    if (absAngle < 10 || absAngle > 170) return 'horizontal';
    if (absAngle > 80 && absAngle < 100) return 'vertical';
    return 'diagonal';
  }

  /**
   * Combine all visual elements into a unified structure
   */
  combineVisualElements(analysis) {
    const elements = [];

    // Add rectangles
    analysis.shapes.rectangles.forEach((rect, index) => {
      elements.push({
        id: `rect_${index}`,
        ...rect,
        category: 'shape'
      });
    });

    // Add circles
    analysis.shapes.circles.forEach((circle, index) => {
      elements.push({
        id: `circle_${index}`,
        ...circle,
        category: 'shape'
      });
    });

    // Add polygons
    analysis.shapes.polygons.forEach((polygon, index) => {
      elements.push({
        id: `polygon_${index}`,
        ...polygon,
        category: 'shape'
      });
    });

    // Add significant lines (longer than threshold)
    analysis.lines
      .filter(line => line.length > 50)
      .forEach((line, index) => {
        elements.push({
          id: `line_${index}`,
          ...line,
          category: 'line'
        });
      });

    return elements.sort((a, b) => (b.area || 0) - (a.area || 0));
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(analysis) {
    return {
      total_elements: analysis.visual_elements.length,
      rectangles: analysis.shapes.rectangles.length,
      circles: analysis.shapes.circles.length,
      polygons: analysis.shapes.polygons.length,
      lines: analysis.lines.length,
      complexity: analysis.edges.complexity,
      edge_ratio: analysis.edges.edge_ratio
    };
  }
}

module.exports = VisionAnalyzer; 
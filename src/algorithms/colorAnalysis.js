const sharp = require('sharp');
const colorQuantize = require('color-quantize');
const { Stats } = require('fast-stats');

class ColorAnalyzer {
  constructor(options = {}) {
    this.options = {
      maxColors: options.maxColors || 16,
      minPixelThreshold: options.minPixelThreshold || 0.01, // 1% minimum
      contrastThreshold: options.contrastThreshold || 4.5, // WCAG AA
      ...options
    };
  }

  /**
   * Analyze image colors comprehensively
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Complete color analysis
   */
  async analyze(imageBuffer) {
    try {
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();

      // Get raw pixel data
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const analysis = {
        metadata: {
          width: info.width,
          height: info.height,
          channels: info.channels,
          total_pixels: info.width * info.height
        },
        color_palette: await this.extractColorPalette(data, info),
        dominant_colors: await this.findDominantColors(data, info),
        color_statistics: await this.calculateColorStatistics(data, info),
        color_harmony: await this.analyzeColorHarmony(data, info),
        accessibility: await this.analyzeAccessibility(data, info)
      };

      return analysis;
    } catch (error) {
      throw new Error(`Color analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract complete color palette from image
   */
  async extractColorPalette(pixelData, info) {
    const pixels = [];
    const step = info.channels;

    // Sample pixels (every 4th pixel for performance on large images)
    const sampleRate = Math.max(1, Math.floor(info.width * info.height / 100000));

    for (let i = 0; i < pixelData.length; i += step * sampleRate) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];

      if (r !== undefined && g !== undefined && b !== undefined) {
        pixels.push([r, g, b]);
      }
    }

    // Quantize colors to reduce palette size
    const quantizedColors = colorQuantize(pixels, this.options.maxColors);

    // Count occurrences of each color
    const colorCounts = this.countColors(pixelData, info, quantizedColors);

    // Create palette with metadata
    const palette = quantizedColors.map((color, index) => {
      const hex = this.rgbToHex(color[0], color[1], color[2]);
      const count = colorCounts[index] || 0;
      const percentage = (count / (info.width * info.height)) * 100;

      return {
        rgb: { r: color[0], g: color[1], b: color[2] },
        hex,
        hsl: this.rgbToHsl(color[0], color[1], color[2]),
        count,
        percentage,
        name: this.getColorName(color[0], color[1], color[2])
      };
    });

    return palette
      .filter(color => color.percentage >= this.options.minPixelThreshold)
      .sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Find dominant colors with clustering
   */
  async findDominantColors(pixelData, info) {
    const palette = await this.extractColorPalette(pixelData, info);

    // Get top 5 most dominant colors
    const dominant = palette.slice(0, 5);

    // Classify colors by usage
    const primary = dominant[0];
    const secondary = dominant[1] || primary;
    const accent = dominant.find(color =>
      this.getColorBrightness(color.rgb) > 0.7 ||
      this.getColorSaturation(color.hsl) > 0.8
    ) || dominant[2];

    // Find background color (usually most common neutral)
    const background = dominant.find(color =>
      this.getColorSaturation(color.hsl) < 0.2 &&
      (this.getColorBrightness(color.rgb) > 0.8 || this.getColorBrightness(color.rgb) < 0.2)
    ) || primary;

    // Find text colors (high contrast with background)
    const textColors = dominant.filter(color =>
      this.calculateContrast(color.rgb, background.rgb) >= this.options.contrastThreshold
    );

    return {
      primary,
      secondary,
      accent,
      background,
      text_colors: textColors,
      all_dominant: dominant
    };
  }

  /**
   * Calculate comprehensive color statistics
   */
  async calculateColorStatistics(pixelData, info) {
    const step = info.channels;
    const rValues = [];
    const gValues = [];
    const bValues = [];
    const brightnessValues = [];
    const saturationValues = [];

    // Sample every 100th pixel for performance
    for (let i = 0; i < pixelData.length; i += step * 100) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];

      if (r !== undefined && g !== undefined && b !== undefined) {
        rValues.push(r);
        gValues.push(g);
        bValues.push(b);

        brightnessValues.push(this.getColorBrightness({ r, g, b }));
        const hsl = this.rgbToHsl(r, g, b);
        saturationValues.push(hsl.s);
      }
    }

    const rStats = new Stats().push(rValues);
    const gStats = new Stats().push(gValues);
    const bStats = new Stats().push(bValues);
    const brightnessStats = new Stats().push(brightnessValues);
    const saturationStats = new Stats().push(saturationValues);

    return {
      rgb_means: {
        r: Math.round(rStats.amean()),
        g: Math.round(gStats.amean()),
        b: Math.round(bStats.amean())
      },
      rgb_std: {
        r: Math.round(rStats.stddev()),
        g: Math.round(gStats.stddev()),
        b: Math.round(bStats.stddev())
      },
      brightness: {
        mean: brightnessStats.amean(),
        std: brightnessStats.stddev(),
        min: brightnessStats.range()[0],
        max: brightnessStats.range()[1]
      },
      saturation: {
        mean: saturationStats.amean(),
        std: saturationStats.stddev(),
        min: saturationStats.range()[0],
        max: saturationStats.range()[1]
      },
      color_diversity: this.calculateColorDiversity(rStats, gStats, bStats)
    };
  }

  /**
   * Analyze color harmony and relationships
   */
  async analyzeColorHarmony(pixelData, info) {
    const palette = await this.extractColorPalette(pixelData, info);
    const dominant = palette.slice(0, 8);

    const harmony = {
      scheme_type: this.detectColorScheme(dominant),
      temperature: this.analyzeColorTemperature(dominant),
      contrast_level: this.analyzeContrastLevel(dominant),
      color_relationships: this.findColorRelationships(dominant)
    };

    return harmony;
  }

  /**
   * Analyze accessibility compliance
   */
  async analyzeAccessibility(pixelData, info) {
    const dominant = await this.findDominantColors(pixelData, info);

    const accessibility = {
      contrast_ratios: [],
      wcag_aa_compliant: false,
      wcag_aaa_compliant: false,
      recommendations: []
    };

    // Check contrast between potential text and background colors
    const textCandidates = dominant.all_dominant.filter(color =>
      this.getColorBrightness(color.rgb) < 0.3 || this.getColorBrightness(color.rgb) > 0.7
    );

    const backgroundCandidates = dominant.all_dominant.filter(color =>
      this.getColorSaturation(color.hsl) < 0.3
    );

    for (const textColor of textCandidates) {
      for (const bgColor of backgroundCandidates) {
        const contrast = this.calculateContrast(textColor.rgb, bgColor.rgb);

        accessibility.contrast_ratios.push({
          text_color: textColor.hex,
          background_color: bgColor.hex,
          contrast_ratio: contrast,
          wcag_aa: contrast >= 4.5,
          wcag_aaa: contrast >= 7
        });
      }
    }

    // Determine overall compliance
    accessibility.wcag_aa_compliant = accessibility.contrast_ratios.some(ratio => ratio.wcag_aa);
    accessibility.wcag_aaa_compliant = accessibility.contrast_ratios.some(ratio => ratio.wcag_aaa);

    // Generate recommendations
    if (!accessibility.wcag_aa_compliant) {
      accessibility.recommendations.push('Increase contrast between text and background colors');
    }

    return accessibility;
  }

  /**
   * Count color occurrences
   */
  countColors(pixelData, info, quantizedColors) {
    const counts = new Array(quantizedColors.length).fill(0);
    const step = info.channels;

    for (let i = 0; i < pixelData.length; i += step) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];

      if (r !== undefined && g !== undefined && b !== undefined) {
        // Find closest quantized color
        const closestIndex = this.findClosestColorIndex([r, g, b], quantizedColors);
        counts[closestIndex]++;
      }
    }

    return counts;
  }

  /**
   * Find closest color in quantized palette
   */
  findClosestColorIndex(targetColor, palette) {
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < palette.length; i++) {
      const distance = this.colorDistance(targetColor, palette[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  /**
   * Calculate Euclidean distance between colors
   */
  colorDistance(color1, color2) {
    const dr = color1[0] - color2[0];
    const dg = color1[1] - color2[1];
    const db = color1[2] - color2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Convert RGB to Hex
   */
  rgbToHex(r, g, b) {
    return `#${  ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Convert RGB to HSL
   */
  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }

  /**
   * Get color brightness (0-1)
   */
  getColorBrightness(rgb) {
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  }

  /**
   * Get color saturation from HSL
   */
  getColorSaturation(hsl) {
    return hsl.s;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrast(color1, color2) {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);

    const bright = Math.max(l1, l2);
    const dark = Math.min(l1, l2);

    return (bright + 0.05) / (dark + 0.05);
  }

  /**
   * Calculate relative luminance
   */
  getLuminance(rgb) {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Detect color scheme type
   */
  detectColorScheme(colors) {
    if (colors.length < 2) return 'monochromatic';

    const hues = colors.map(color => color.hsl.h);
    const saturations = colors.map(color => color.hsl.s);

    // Check for monochromatic (similar hues)
    const hueRange = Math.max(...hues) - Math.min(...hues);
    if (hueRange < 30) return 'monochromatic';

    // Check for analogous (adjacent hues)
    if (hueRange < 90) return 'analogous';

    // Check for complementary (opposite hues)
    const hasComplementary = hues.some(h1 =>
      hues.some(h2 => Math.abs(h1 - h2) > 150 && Math.abs(h1 - h2) < 210)
    );
    if (hasComplementary) return 'complementary';

    // Check for triadic (120° apart)
    const hasTriadic = hues.some(h1 =>
      hues.some(h2 => hues.some(h3 =>
        Math.abs(h1 - h2) > 110 && Math.abs(h1 - h2) < 130 &&
        Math.abs(h2 - h3) > 110 && Math.abs(h2 - h3) < 130
      ))
    );
    if (hasTriadic) return 'triadic';

    return 'complex';
  }

  /**
   * Analyze color temperature
   */
  analyzeColorTemperature(colors) {
    let warmCount = 0;
    let coolCount = 0;

    colors.forEach(color => {
      const hue = color.hsl.h;
      if ((hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360)) {
        warmCount++; // Red, orange, yellow
      } else if (hue >= 180 && hue <= 240) {
        coolCount++; // Blue, cyan
      }
    });

    if (warmCount > coolCount * 1.5) return 'warm';
    if (coolCount > warmCount * 1.5) return 'cool';
    return 'neutral';
  }

  /**
   * Analyze overall contrast level
   */
  analyzeContrastLevel(colors) {
    const brightnesses = colors.map(color => this.getColorBrightness(color.rgb));
    const minBrightness = Math.min(...brightnesses);
    const maxBrightness = Math.max(...brightnesses);
    const range = maxBrightness - minBrightness;

    if (range > 0.7) return 'high';
    if (range > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Find color relationships
   */
  findColorRelationships(colors) {
    const relationships = [];

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i];
        const color2 = colors[j];
        const relationship = this.getColorRelationship(color1.hsl, color2.hsl);

        if (relationship !== 'unrelated') {
          relationships.push({
            color1: color1.hex,
            color2: color2.hex,
            relationship
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Determine relationship between two colors
   */
  getColorRelationship(hsl1, hsl2) {
    const hueDiff = Math.abs(hsl1.h - hsl2.h);
    const satDiff = Math.abs(hsl1.s - hsl2.s);
    const lightDiff = Math.abs(hsl1.l - hsl2.l);

    if (hueDiff < 15 && satDiff < 0.2 && lightDiff < 0.2) return 'identical';
    if (hueDiff < 30) return 'analogous';
    if (hueDiff > 150 && hueDiff < 210) return 'complementary';
    if (Math.abs(hueDiff - 120) < 15 || Math.abs(hueDiff - 240) < 15) return 'triadic';
    if (Math.abs(hueDiff - 90) < 15 || Math.abs(hueDiff - 270) < 15) return 'square';

    return 'unrelated';
  }

  /**
   * Calculate color diversity score
   */
  calculateColorDiversity(rStats, gStats, bStats) {
    const rVariance = rStats.variance();
    const gVariance = gStats.variance();
    const bVariance = bStats.variance();

    const avgVariance = (rVariance + gVariance + bVariance) / 3;
    const maxVariance = 255 * 255; // Maximum possible variance

    return avgVariance / maxVariance; // Normalized 0-1
  }

  /**
   * Get approximate color name
   */
  getColorName(r, g, b) {
    const hsl = this.rgbToHsl(r, g, b);
    const { h, s, l } = hsl;

    // Very basic color naming
    if (s < 0.1) {
      if (l > 0.9) return 'white';
      if (l < 0.1) return 'black';
      if (l > 0.7) return 'light_gray';
      if (l < 0.3) return 'dark_gray';
      return 'gray';
    }

    if (h < 15 || h > 345) return 'red';
    if (h < 45) return 'orange';
    if (h < 75) return 'yellow';
    if (h < 150) return 'green';
    if (h < 210) return 'blue';
    if (h < 270) return 'purple';
    if (h < 330) return 'pink';

    return 'unknown';
  }
}

module.exports = ColorAnalyzer;
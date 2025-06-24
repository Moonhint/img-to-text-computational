const Tesseract = require('tesseract.js');

class MultiLanguageOCR {
  constructor(options = {}) {
    this.options = {
      defaultLanguage: options.defaultLanguage || 'eng',
      autoDetectLanguage: options.autoDetectLanguage !== false,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      fallbackLanguages: options.fallbackLanguages || ['eng', 'spa', 'fra', 'deu', 'chi_sim'],
      maxRetries: options.maxRetries || 3,
      ...options
    };

    // Language-specific configurations
    this.languageConfigs = this.initializeLanguageConfigs();

    // Initialize workers for different languages
    this.workers = new Map();
    this.workerPromises = new Map();
  }

  /**
   * Initialize language-specific configurations
   */
  initializeLanguageConfigs() {
    return {
      // English
      eng: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          capitalizeProperNouns: false
        }
      },

      // Spanish
      spa: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleAccents: true
        }
      },

      // French
      fra: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleAccents: true,
          fixCedillas: true
        }
      },

      // German
      deu: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleUmlauts: true,
          fixCompoundWords: true
        }
      },

      // Chinese Simplified
      chi_sim: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '0'
        },
        postProcessing: {
          removeExtraSpaces: false,
          fixCommonErrors: true,
          handleVerticalText: true
        }
      },

      // Chinese Traditional
      chi_tra: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '0'
        },
        postProcessing: {
          removeExtraSpaces: false,
          fixCommonErrors: true,
          handleVerticalText: true
        }
      },

      // Japanese
      jpn: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '0'
        },
        postProcessing: {
          removeExtraSpaces: false,
          fixCommonErrors: true,
          handleVerticalText: true,
          separateHiraganaKatakana: true
        }
      },

      // Korean
      kor: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleHangul: true
        }
      },

      // Arabic
      ara: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleRTL: true,
          fixArabicShaping: true
        }
      },

      // Russian
      rus: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleCyrillic: true
        }
      },

      // Hindi
      hin: {
        tesseractOptions: {
          tessedit_char_whitelist: '',
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1'
        },
        postProcessing: {
          removeExtraSpaces: true,
          fixCommonErrors: true,
          handleDevanagari: true
        }
      }
    };
  }

  /**
   * Process image with multi-language OCR
   * @param {Buffer|string} imageInput - Image buffer or path
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} OCR results with language detection
   */
  async processImage(imageInput, options = {}) {
    try {
      const processingOptions = { ...this.options, ...options };

      let detectedLanguage = processingOptions.language || this.options.defaultLanguage;
      let ocrResults = null;
      let languageDetectionResults = null;

      // Auto-detect language if enabled
      if (this.options.autoDetectLanguage && !processingOptions.language) {
        languageDetectionResults = await this.detectLanguage(imageInput);
        detectedLanguage = languageDetectionResults.primary_language;
      }

      // Perform OCR with detected/specified language
      ocrResults = await this.performOCR(imageInput, detectedLanguage, processingOptions);

      // If confidence is low, try fallback languages
      if (ocrResults.confidence < this.options.confidenceThreshold) {
        const fallbackResults = await this.tryFallbackLanguages(
          imageInput,
          detectedLanguage,
          processingOptions
        );

        if (fallbackResults && fallbackResults.confidence > ocrResults.confidence) {
          ocrResults = fallbackResults;
          detectedLanguage = fallbackResults.language;
        }
      }

      // Post-process results based on language
      const processedResults = await this.postProcessResults(ocrResults, detectedLanguage);

      return {
        language: detectedLanguage,
        language_detection: languageDetectionResults,
        raw_text: ocrResults.text,
        processed_text: processedResults.text,
        confidence: ocrResults.confidence,
        words: processedResults.words,
        lines: processedResults.lines,
        paragraphs: processedResults.paragraphs,
        structured_text: processedResults.structured_text,
        language_specific_analysis: processedResults.language_analysis,
        processing_stats: {
          language_used: detectedLanguage,
          processing_time: ocrResults.processing_time,
          fallback_attempts: ocrResults.fallback_attempts || 0,
          post_processing_applied: processedResults.post_processing_applied
        }
      };
    } catch (error) {
      throw new Error(`Multi-language OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Detect language from image
   * @param {Buffer|string} imageInput - Image input
   * @returns {Promise<Object>} Language detection results
   */
  async detectLanguage(imageInput) {
    try {
      const startTime = Date.now();

      // Use multiple detection methods
      const detectionMethods = [
        this.detectLanguageByScript(imageInput),
        this.detectLanguageByFrequency(imageInput),
        this.detectLanguageByPattern(imageInput)
      ];

      const results = await Promise.all(detectionMethods);

      // Combine results with confidence weighting
      const languageScores = {};

      results.forEach((result, index) => {
        const weight = [0.4, 0.4, 0.2][index]; // Script detection gets highest weight

        for (const [lang, score] of Object.entries(result.scores)) {
          languageScores[lang] = (languageScores[lang] || 0) + (score * weight);
        }
      });

      // Sort by confidence
      const sortedLanguages = Object.entries(languageScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      return {
        primary_language: sortedLanguages[0]?.[0] || this.options.defaultLanguage,
        confidence: sortedLanguages[0]?.[1] || 0,
        alternatives: sortedLanguages.slice(1).map(([lang, score]) => ({ language: lang, confidence: score })),
        detection_methods: results,
        processing_time: Date.now() - startTime
      };
    } catch (error) {
      // Fallback to default language
      return {
        primary_language: this.options.defaultLanguage,
        confidence: 0.5,
        alternatives: [],
        error: error.message,
        processing_time: 0
      };
    }
  }

  /**
   * Detect language by script analysis
   */
  async detectLanguageByScript(imageInput) {
    try {
      // Quick OCR with script detection
      const worker = await this.getWorker('osd'); // Orientation and Script Detection
      const result = await worker.detect(imageInput);

      const scriptMappings = {
        'Latin': ['eng', 'spa', 'fra', 'deu', 'ita', 'por'],
        'Han': ['chi_sim', 'chi_tra', 'jpn'],
        'Hiragana': ['jpn'],
        'Katakana': ['jpn'],
        'Hangul': ['kor'],
        'Arabic': ['ara'],
        'Cyrillic': ['rus'],
        'Devanagari': ['hin']
      };

      const scores = {};

      if (result.script && scriptMappings[result.script]) {
        const languages = scriptMappings[result.script];
        const baseScore = result.confidence || 0.7;

        languages.forEach((lang, index) => {
          scores[lang] = baseScore - (index * 0.1);
        });
      }

      return {
        method: 'script_detection',
        detected_script: result.script,
        scores,
        confidence: result.confidence || 0
      };
    } catch (error) {
      return {
        method: 'script_detection',
        scores: {},
        error: error.message
      };
    }
  }

  /**
   * Detect language by character frequency analysis
   */
  async detectLanguageByFrequency(imageInput) {
    try {
      // Perform quick OCR with multiple languages
      const testLanguages = ['eng', 'spa', 'fra', 'deu', 'chi_sim'];
      const results = await Promise.all(
        testLanguages.map(async (lang) => {
          try {
            const worker = await this.getWorker(lang);
            const result = await worker.recognize(imageInput, {
              tessedit_pageseg_mode: Tesseract.PSM.AUTO,
              tessedit_char_confidence: '1'
            });

            return {
              language: lang,
              confidence: result.data.confidence / 100,
              text_length: result.data.text.length
            };
          } catch (error) {
            return {
              language: lang,
              confidence: 0,
              text_length: 0
            };
          }
        })
      );

      const scores = {};
      results.forEach(result => {
        // Score based on confidence and text length (more text usually means better detection)
        scores[result.language] = result.confidence * (1 + Math.min(result.text_length / 100, 0.5));
      });

      return {
        method: 'frequency_analysis',
        scores,
        test_results: results
      };
    } catch (error) {
      return {
        method: 'frequency_analysis',
        scores: {},
        error: error.message
      };
    }
  }

  /**
   * Detect language by pattern matching
   */
  async detectLanguageByPattern(imageInput) {
    try {
      // Quick OCR to get sample text
      const worker = await this.getWorker(this.options.defaultLanguage);
      const result = await worker.recognize(imageInput);
      const text = result.data.text;

      const patterns = {
        eng: [
          /\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|she|use|her|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|she|use)\b/gi,
          /ing\b/gi,
          /tion\b/gi,
          /\b(a|an|the)\s+/gi
        ],
        spa: [
          /\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|sur|sus|les|más|como|pero|sus|del|mis|las|dos|por|qué|muy|sin|nos|hasta|donde|mientras|cada|todos|todo|otra|otros|otras|cual|cuando|tanto|tanto|menos|casi)\b/gi,
          /ción\b/gi,
          /ñ/gi,
          /[áéíóúü]/gi
        ],
        fra: [
          /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|par|grand|où|ou|quoi|nous|vous|leur|quel|dont|sans|sous|entre|pendant|depuis|vers|chez|contre|parmi|selon|malgré|durant|hormis)\b/gi,
          /tion\b/gi,
          /[àâäçéèêëïîôùûüÿñæœ]/gi,
          /\bç[aou]/gi
        ],
        deu: [
          /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|einer|um|am|sind|noch|wie|einem|über|einen|so|zum|war|haben|nur|oder|aber|vor|zur|bis|unter|während|ohne)\b/gi,
          /ung\b/gi,
          /[äöüß]/gi,
          /\bsch/gi
        ],
        chi_sim: [
          /[一二三四五六七八九十]/g,
          /[的了在是我有他这为之大来以个中上们]/g,
          /[你我他她它们]/g
        ],
        jpn: [
          /[ひらがな]/g,
          /[カタカナ]/g,
          /[です、ます、した、する]/g
        ],
        kor: [
          /[가-힣]/g,
          /[ㄱ-ㅎㅏ-ㅣ]/g
        ],
        ara: [
          /[ا-ي]/g,
          /\b(في|من|إلى|على|عن|مع|هذا|هذه|التي|الذي|كان|كانت)\b/gi
        ]
      };

      const scores = {};

      for (const [lang, langPatterns] of Object.entries(patterns)) {
        let score = 0;
        let totalMatches = 0;

        langPatterns.forEach(pattern => {
          const matches = text.match(pattern) || [];
          totalMatches += matches.length;
        });

        // Normalize score by text length
        score = totalMatches / Math.max(text.length / 100, 1);
        scores[lang] = Math.min(score, 1);
      }

      return {
        method: 'pattern_matching',
        scores,
        text_sample: text.substring(0, 200)
      };
    } catch (error) {
      return {
        method: 'pattern_matching',
        scores: {},
        error: error.message
      };
    }
  }

  /**
   * Perform OCR with specific language
   */
  async performOCR(imageInput, language, options = {}) {
    try {
      const startTime = Date.now();
      const worker = await this.getWorker(language);
      const config = this.languageConfigs[language] || this.languageConfigs.eng;

      const tesseractOptions = {
        ...config.tesseractOptions,
        ...options.tesseractOptions
      };

      const result = await worker.recognize(imageInput, tesseractOptions);

      return {
        language,
        text: result.data.text,
        confidence: result.data.confidence / 100,
        words: result.data.words,
        lines: result.data.lines,
        paragraphs: result.data.paragraphs,
        processing_time: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`OCR processing failed for language ${language}: ${error.message}`);
    }
  }

  /**
   * Try fallback languages if primary detection has low confidence
   */
  async tryFallbackLanguages(imageInput, primaryLanguage, options) {
    const fallbackLanguages = this.options.fallbackLanguages.filter(lang => lang !== primaryLanguage);
    let bestResult = null;
    let attempts = 0;

    for (const language of fallbackLanguages) {
      if (attempts >= this.options.maxRetries) break;

      try {
        const result = await this.performOCR(imageInput, language, options);
        attempts++;

        if (!bestResult || result.confidence > bestResult.confidence) {
          bestResult = { ...result, fallback_attempts: attempts };
        }

        // If we get good confidence, stop trying
        if (result.confidence > this.options.confidenceThreshold) {
          break;
        }
      } catch (error) {
        attempts++;
        continue;
      }
    }

    return bestResult;
  }

  /**
   * Post-process OCR results based on language
   */
  async postProcessResults(ocrResults, language) {
    try {
      const config = this.languageConfigs[language] || this.languageConfigs.eng;
      const postProcessing = config.postProcessing;

      let processedText = ocrResults.text;
      const appliedProcessing = [];

      // Remove extra spaces
      if (postProcessing.removeExtraSpaces) {
        processedText = processedText.replace(/\s+/g, ' ').trim();
        appliedProcessing.push('remove_extra_spaces');
      }

      // Fix common OCR errors
      if (postProcessing.fixCommonErrors) {
        processedText = this.fixCommonOCRErrors(processedText, language);
        appliedProcessing.push('fix_common_errors');
      }

      // Language-specific processing
      if (postProcessing.handleAccents && (language === 'spa' || language === 'fra')) {
        processedText = this.fixAccentedCharacters(processedText, language);
        appliedProcessing.push('fix_accents');
      }

      if (postProcessing.handleUmlauts && language === 'deu') {
        processedText = this.fixGermanUmlauts(processedText);
        appliedProcessing.push('fix_umlauts');
      }

      if (postProcessing.handleRTL && language === 'ara') {
        processedText = this.fixArabicText(processedText);
        appliedProcessing.push('fix_rtl');
      }

      if (postProcessing.handleVerticalText && (language === 'chi_sim' || language === 'chi_tra' || language === 'jpn')) {
        processedText = this.fixAsianVerticalText(processedText, language);
        appliedProcessing.push('fix_vertical_text');
      }

      // Process words and lines with language-specific handling
      const processedWords = this.processWords(ocrResults.words, language);
      const processedLines = this.processLines(ocrResults.lines, language);
      const structuredText = this.createStructuredText(processedWords, processedLines, language);

      // Language-specific analysis
      const languageAnalysis = await this.performLanguageSpecificAnalysis(processedText, language);

      return {
        text: processedText,
        words: processedWords,
        lines: processedLines,
        paragraphs: ocrResults.paragraphs,
        structured_text: structuredText,
        language_analysis: languageAnalysis,
        post_processing_applied: appliedProcessing
      };
    } catch (error) {
      // Return original results if post-processing fails
      return {
        text: ocrResults.text,
        words: ocrResults.words,
        lines: ocrResults.lines,
        paragraphs: ocrResults.paragraphs,
        structured_text: [],
        language_analysis: {},
        post_processing_applied: [],
        error: error.message
      };
    }
  }

  /**
   * Fix common OCR errors based on language
   */
  fixCommonOCRErrors(text, language) {
    const commonErrors = {
      eng: [
        [/\b0\b/g, 'O'],  // Zero to O
        [/\bl\b/g, 'I'],  // lowercase l to I
        [/rn/g, 'm'],     // rn to m
        [/vv/g, 'w'],     // vv to w
        [/\|/g, 'l']      // pipe to l
      ],
      spa: [
        [/\b0\b/g, 'O'],
        [/\bl\b/g, 'I'],
        [/rn/g, 'm'],
        [/ñ/g, 'ñ']       // Ensure ñ is preserved
      ],
      fra: [
        [/\b0\b/g, 'O'],
        [/\bl\b/g, 'I'],
        [/rn/g, 'm'],
        [/ç/g, 'ç']       // Ensure ç is preserved
      ]
    };

    const errors = commonErrors[language] || commonErrors.eng;

    let processedText = text;
    errors.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    return processedText;
  }

  /**
   * Fix accented characters for Spanish and French
   */
  fixAccentedCharacters(text, language) {
    const accentFixes = {
      spa: [
        [/a'/g, 'á'], [/e'/g, 'é'], [/i'/g, 'í'], [/o'/g, 'ó'], [/u'/g, 'ú'],
        [/A'/g, 'Á'], [/E'/g, 'É'], [/I'/g, 'Í'], [/O'/g, 'Ó'], [/U'/g, 'Ú'],
        [/n~/g, 'ñ'], [/N~/g, 'Ñ']
      ],
      fra: [
        [/a'/g, 'á'], [/e'/g, 'é'], [/i'/g, 'í'], [/o'/g, 'ó'], [/u'/g, 'ú'],
        [/a`/g, 'à'], [/e`/g, 'è'], [/u`/g, 'ù'],
        [/a\^/g, 'â'], [/e\^/g, 'ê'], [/i\^/g, 'î'], [/o\^/g, 'ô'], [/u\^/g, 'û'],
        [/c,/g, 'ç'], [/C,/g, 'Ç']
      ]
    };

    const fixes = accentFixes[language] || [];
    let processedText = text;

    fixes.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    return processedText;
  }

  /**
   * Fix German umlauts
   */
  fixGermanUmlauts(text) {
    const umlautFixes = [
      [/ae/g, 'ä'], [/oe/g, 'ö'], [/ue/g, 'ü'], [/ss/g, 'ß'],
      [/Ae/g, 'Ä'], [/Oe/g, 'Ö'], [/Ue/g, 'Ü']
    ];

    let processedText = text;
    umlautFixes.forEach(([pattern, replacement]) => {
      processedText = processedText.replace(pattern, replacement);
    });

    return processedText;
  }

  /**
   * Fix Arabic text (RTL handling)
   */
  fixArabicText(text) {
    // Basic Arabic text processing
    // In a real implementation, this would handle proper RTL text direction
    return text.trim();
  }

  /**
   * Fix Asian vertical text
   */
  fixAsianVerticalText(text, language) {
    // Basic processing for vertical text
    // In a real implementation, this would handle vertical text layout
    return text.replace(/\n+/g, '\n').trim();
  }

  /**
   * Process words with language-specific handling
   */
  processWords(words, language) {
    if (!words) return [];

    return words.map(word => ({
      ...word,
      text: this.processWordText(word.text, language),
      language,
      confidence: word.confidence / 100
    }));
  }

  /**
   * Process word text based on language
   */
  processWordText(text, language) {
    // Apply language-specific word processing
    switch (language) {
      case 'deu':
        // German compound word handling
        return this.processGermanCompounds(text);
      case 'chi_sim':
      case 'chi_tra':
        // Chinese word segmentation
        return this.processChineseSegmentation(text);
      default:
        return text;
    }
  }

  /**
   * Process German compound words
   */
  processGermanCompounds(text) {
    // Simplified compound word processing
    // In a real implementation, this would use proper German compound analysis
    return text;
  }

  /**
   * Process Chinese word segmentation
   */
  processChineseSegmentation(text) {
    // Simplified Chinese segmentation
    // In a real implementation, this would use proper Chinese word segmentation
    return text;
  }

  /**
   * Process lines with language-specific handling
   */
  processLines(lines, language) {
    if (!lines) return [];

    return lines.map(line => ({
      ...line,
      text: this.processLineText(line.text, language),
      language,
      confidence: line.confidence / 100
    }));
  }

  /**
   * Process line text based on language
   */
  processLineText(text, language) {
    // Apply language-specific line processing
    return text;
  }

  /**
   * Create structured text elements
   */
  createStructuredText(words, lines, language) {
    const structuredText = [];

    lines.forEach((line, index) => {
      const lineWords = words.filter(word =>
        word.bbox && line.bbox &&
        word.bbox.y0 >= line.bbox.y0 - 5 &&
        word.bbox.y1 <= line.bbox.y1 + 5
      );

      structuredText.push({
        id: `line_${index}`,
        type: this.classifyTextType(line.text, language),
        text: line.text,
        position: {
          x: line.bbox?.x0 || 0,
          y: line.bbox?.y0 || 0,
          width: (line.bbox?.x1 || 0) - (line.bbox?.x0 || 0),
          height: (line.bbox?.y1 || 0) - (line.bbox?.y0 || 0)
        },
        confidence: line.confidence,
        language,
        words: lineWords,
        font_info: {
          estimated_size: this.estimateFontSize(line.bbox),
          size_category: this.categorizeFontSize(this.estimateFontSize(line.bbox))
        }
      });
    });

    return structuredText;
  }

  /**
   * Classify text type based on content and language
   */
  classifyTextType(text, language) {
    // Language-specific text classification patterns
    const patterns = {
      header: {
        eng: /^[A-Z][A-Za-z\s]{2,50}$/,
        spa: /^[A-ZÁÉÍÓÚÑÜ][A-Za-záéíóúñü\s]{2,50}$/,
        fra: /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ][A-Za-zàâäéèêëïîôùûüÿç\s]{2,50}$/
      },
      button: {
        eng: /^(Click|Submit|Send|Save|Login|Register|Continue|Next|Back|Cancel|OK)$/i,
        spa: /^(Hacer clic|Enviar|Guardar|Iniciar sesión|Registrar|Continuar|Siguiente|Atrás|Cancelar)$/i,
        fra: /^(Cliquer|Soumettre|Envoyer|Sauvegarder|Connexion|S'inscrire|Continuer|Suivant|Retour|Annuler)$/i
      }
    };

    // Check header patterns
    const headerPattern = patterns.header[language] || patterns.header.eng;
    if (headerPattern.test(text.trim())) {
      return 'header';
    }

    // Check button patterns
    const buttonPattern = patterns.button[language] || patterns.button.eng;
    if (buttonPattern.test(text.trim())) {
      return 'button';
    }

    // Default classification
    if (text.length < 50) {
      return 'label';
    } else {
      return 'paragraph';
    }
  }

  /**
   * Perform language-specific analysis
   */
  async performLanguageSpecificAnalysis(text, language) {
    const analysis = {
      language,
      character_count: text.length,
      word_count: 0,
      sentence_count: 0,
      language_features: {}
    };

    // Basic word and sentence counting
    const words = text.split(/\s+/).filter(word => word.length > 0);
    analysis.word_count = words.length;

    // Language-specific sentence detection
    const sentencePatterns = {
      eng: /[.!?]+/g,
      spa: /[.!?¿¡]+/g,
      fra: /[.!?]+/g,
      deu: /[.!?]+/g,
      chi_sim: /[。！？]+/g,
      jpn: /[。！？]+/g,
      ara: /[.!؟]+/g
    };

    const sentencePattern = sentencePatterns[language] || sentencePatterns.eng;
    const sentences = text.split(sentencePattern).filter(s => s.trim().length > 0);
    analysis.sentence_count = sentences.length;

    // Language-specific features
    switch (language) {
      case 'spa':
        analysis.language_features = {
          has_tildes: /[ñÑ]/.test(text),
          has_accents: /[áéíóúÁÉÍÓÚ]/.test(text),
          inverted_punctuation: /[¿¡]/.test(text)
        };
        break;
      case 'fra':
        analysis.language_features = {
          has_accents: /[àâäéèêëïîôùûüÿç]/.test(text),
          has_cedillas: /[çÇ]/.test(text)
        };
        break;
      case 'deu':
        analysis.language_features = {
          has_umlauts: /[äöüÄÖÜß]/.test(text),
          compound_words: this.detectGermanCompounds(text)
        };
        break;
      case 'chi_sim':
      case 'chi_tra':
        analysis.language_features = {
          character_density: text.length / words.length,
          has_numbers: /[一二三四五六七八九十]/.test(text)
        };
        break;
    }

    return analysis;
  }

  /**
   * Detect German compound words
   */
  detectGermanCompounds(text) {
    // Simplified compound detection
    const words = text.split(/\s+/);
    return words.filter(word => word.length > 10).length;
  }

  /**
   * Get or create Tesseract worker for language
   */
  async getWorker(language) {
    if (this.workers.has(language)) {
      return this.workers.get(language);
    }

    if (this.workerPromises.has(language)) {
      return await this.workerPromises.get(language);
    }

    const workerPromise = this.createWorker(language);
    this.workerPromises.set(language, workerPromise);

    const worker = await workerPromise;
    this.workers.set(language, worker);
    this.workerPromises.delete(language);

    return worker;
  }

  /**
   * Create new Tesseract worker
   */
  async createWorker(language) {
    const worker = await Tesseract.createWorker();
    await worker.loadLanguage(language);
    await worker.initialize(language);
    return worker;
  }

  /**
   * Estimate font size from bounding box
   */
  estimateFontSize(bbox) {
    if (!bbox) return 12;
    return Math.max(8, Math.min(72, bbox.y1 - bbox.y0));
  }

  /**
   * Categorize font size
   */
  categorizeFontSize(size) {
    if (size < 12) return 'small';
    if (size < 18) return 'medium';
    if (size < 24) return 'large';
    return 'extra_large';
  }

  /**
   * Cleanup workers
   */
  async cleanup() {
    const workers = Array.from(this.workers.values());
    await Promise.all(workers.map(worker => worker.terminate()));
    this.workers.clear();
    this.workerPromises.clear();
  }
}

module.exports = MultiLanguageOCR;
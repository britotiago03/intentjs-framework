// src/utils/inputNormalizer.ts

/**
 * Normalizes user input by removing extra whitespace, fixing common
 * typos, and standardizing certain terms.
 */
export function normalizeInput(input: string): string {
    if (!input) return '';

    // Trim whitespace and convert to lowercase
    let normalized = input.trim();

    // Remove multiple spaces
    normalized = normalized.replace(/\s+/g, ' ');

    // Remove leading articles in commands for more consistent parsing
    normalized = normalized.replace(/^(please|can you|could you|i want to|i would like to)\s+/i, '');

    // Standardize common action terms
    const actionMappings: Record<string, string> = {
        'show me': 'show',
        'go to': 'navigate to',
        'take me to': 'navigate to',
        'open': 'navigate to',
        'navigate': 'navigate to',
        'bring up': 'show',
        'display': 'show',
        'find': 'search for',
        'look for': 'search for',
        'search': 'search for',
        'filter by': 'filter',
        'sort by': 'sort',
        'order by': 'sort',
    };

    // Apply action term standardization
    for (const [pattern, replacement] of Object.entries(actionMappings)) {
        const regExp = new RegExp(`^${pattern}\\s+`, 'i');
        if (regExp.test(normalized)) {
            normalized = normalized.replace(regExp, `${replacement} `);
            break; // Only apply one action mapping
        }
    }

    // Fix common typos for specific terms
    const typoCorrections: Record<string, string> = {
        'dasboard': 'dashboard',
        'dashbord': 'dashboard',
        'setting': 'settings',
        'setings': 'settings',
        'report': 'reports',
        'statistic': 'statistics',
        'analytic': 'analytics',
        'notifcation': 'notification',
        'acount': 'account',
        'proflie': 'profile',
    };

    // Apply typo corrections using word boundaries
    for (const [typo, correction] of Object.entries(typoCorrections)) {
        const regExp = new RegExp(`\\b${typo}\\b`, 'gi');
        normalized = normalized.replace(regExp, correction);
    }

    return normalized;
}

/**
 * Identifies the language of the input text for multilingual support
 * Note: This is a simplified implementation. For production,
 * consider using a proper language detection library.
 */
export function detectLanguage(input: string): string {
    // Basic language detection based on common words
    const langPatterns: Record<string, RegExp[]> = {
        'en': [/\b(the|and|is|in|to|you|for)\b/gi],
        'es': [/\b(el|la|los|las|y|es|en|para|tu)\b/gi],
        'fr': [/\b(le|la|les|et|est|dans|pour|vous)\b/gi],
        'de': [/\b(der|die|das|und|ist|in|für|sie)\b/gi],
        'pt': [/\b(o|a|os|as|e|é|em|para|você)\b/gi],
    };

    const langScores: Record<string, number> = {};

    for (const [lang, patterns] of Object.entries(langPatterns)) {
        langScores[lang] = 0;
        for (const pattern of patterns) {
            const matches = input.match(pattern);
            if (matches) {
                langScores[lang] += matches.length;
            }
        }
    }

    // Return the language with the highest score, or 'en' if none match
    const detectedLang = Object.entries(langScores)
        .sort((a, b) => b[1] - a[1])[0][0];

    return detectedLang || 'en';
}

/**
 * Checks if input contains potentially sensitive or problematic content
 * that should be filtered or flagged before processing.
 */
export function hasSensitiveContent(input: string): boolean {
    // Very basic check for potentially sensitive content
    const sensitivePatterns = [
        /\b(password|credit card|social security|ssn|private key)\b/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(input));
}
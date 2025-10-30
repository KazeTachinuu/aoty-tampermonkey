// AOTY Score Element Inspector
// Copy and paste this into the browser console on albumoftheyear.org
// to discover all score-related elements

(function() {
    console.log('=== AOTY Score Element Inspector ===\n');

    // Common patterns for score elements
    const patterns = {
        byClassName: [
            'rating',
            'albumCriticScore',
            'albumUserScore',
            'artistCriticScore',
            'artistUserScore',
            'trackRating',
            'scoreValue',
            'mustHearButton',
            'ratingBlock',
            'albumReviewRow',
            'red',
            'yellow',
            'green',
            'score',
            'rating-value',
            'user-score',
            'critic-score'
        ],
        byTagAndPattern: [
            { tag: 'div', pattern: /score|rating/i },
            { tag: 'span', pattern: /score|rating/i },
            { tag: 'a', pattern: /score|rating/i }
        ],
        byId: [
            'critics',
            'userScores',
            'albumScore'
        ],
        byDataAttribute: [
            'data-score',
            'data-rating',
            'data-value'
        ]
    };

    const results = {
        classes: new Set(),
        ids: new Set(),
        dataAttributes: new Set(),
        elements: []
    };

    // Check by class name
    console.log('Checking class names...');
    patterns.byClassName.forEach(className => {
        const elements = document.getElementsByClassName(className);
        if (elements.length > 0) {
            results.classes.add(className);
            console.log(`✓ Found ${elements.length} elements with class: ${className}`);
            results.elements.push({ selector: `.${className}`, count: elements.length, sample: elements[0]?.outerHTML?.substring(0, 100) });
        }
    });

    // Check by ID
    console.log('\nChecking IDs...');
    patterns.byId.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            results.ids.add(id);
            console.log(`✓ Found element with ID: ${id}`);
            results.elements.push({ selector: `#${id}`, count: 1, sample: element.outerHTML?.substring(0, 100) });
        }
    });

    // Check by tag and pattern
    console.log('\nChecking elements by pattern...');
    patterns.byTagAndPattern.forEach(({ tag, pattern }) => {
        const elements = document.getElementsByTagName(tag);
        const matches = Array.from(elements).filter(el =>
            pattern.test(el.className) || pattern.test(el.id) || pattern.test(el.textContent)
        );
        if (matches.length > 0) {
            console.log(`✓ Found ${matches.length} ${tag} elements matching pattern: ${pattern}`);
        }
    });

    // Check for data attributes
    console.log('\nChecking data attributes...');
    patterns.byDataAttribute.forEach(attr => {
        const elements = document.querySelectorAll(`[${attr}]`);
        if (elements.length > 0) {
            results.dataAttributes.add(attr);
            console.log(`✓ Found ${elements.length} elements with attribute: ${attr}`);
            results.elements.push({ selector: `[${attr}]`, count: elements.length });
        }
    });

    // Find any numbers that might be scores
    console.log('\nScanning for numeric content (potential scores)...');
    const allElements = document.querySelectorAll('*');
    const scorePatterns = /^\d{1,3}$/;  // 0-999
    const numericElements = [];

    allElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && scorePatterns.test(text) && el.children.length === 0) {
            const classes = el.className || 'no-class';
            const id = el.id || 'no-id';
            numericElements.push({
                text,
                classes,
                id,
                tag: el.tagName.toLowerCase(),
                sample: el.outerHTML?.substring(0, 150)
            });
        }
    });

    if (numericElements.length > 0) {
        console.log(`Found ${numericElements.length} elements with numeric content:`);
        const uniqueClasses = [...new Set(numericElements.map(e => e.classes))].filter(c => c !== 'no-class');
        console.log('Unique classes found:', uniqueClasses);
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('Classes found:', Array.from(results.classes));
    console.log('IDs found:', Array.from(results.ids));
    console.log('Data attributes found:', Array.from(results.dataAttributes));

    console.log('\n=== RECOMMENDED SELECTORS ===');
    results.elements.forEach(({ selector, count, sample }) => {
        console.log(`${selector} (${count} elements)`);
        if (sample) console.log(`  Sample: ${sample}...`);
    });

    console.log('\n=== COPY THIS ARRAY FOR YOUR USERSCRIPT ===');
    const selectors = [
        ...Array.from(results.classes).map(c => `.${c}`),
        ...Array.from(results.ids).map(i => `#${i}`),
        ...Array.from(results.dataAttributes).map(a => `[${a}]`)
    ];
    console.log(JSON.stringify(selectors, null, 2));

    return {
        classes: Array.from(results.classes),
        ids: Array.from(results.ids),
        dataAttributes: Array.from(results.dataAttributes),
        allSelectors: selectors
    };
})();

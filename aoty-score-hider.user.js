// ==UserScript==
// @name         AOTY Score Hider
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Toggle visibility of scores on Album of the Year
// @author       You
// @match        https://www.albumoftheyear.org/*
// @match        https://albumoftheyear.org/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

// Focused on hiding ONLY score numbers, not entire sections or reviews
// Hides: album scores, track ratings, user scores, must-hear badges

(function() {
    'use strict';

    // Get saved state or default to false (scores visible)
    let scoresHidden = GM_getValue('scoresHidden', false);

    // Only target actual score display elements
    const SCORE_SELECTORS = [
        '.albumUserScoreBox',
        '.albumCriticScoreBox',
        '.ratingRowContainer',
        '.albumReviewText',
        '.dist',
        '.distEnd',
        '.rating',                // Rating displays
        '.ratingBar',             // Rating bar graphs
        '.scoreValue',            // Score numbers on list/chart pages
        '.scoreValueContainer',   // Score bar containers on list/chart pages
        '.albumReviewRatingBar',  // Album review rating bars
        '.albumCriticScore',      // Album critic score
        '.albumUserScore',        // Album user score
        '.artistCriticScore',     // Artist critic score
        '.artistUserScore',       // Artist user score
        '.trackRating',           // Track rating numbers
        '.mustHearButton',        // Must-hear badge
        '.songScore',             // Song page main score number
        '.songScoreBox',          // Song page score box
        '.songRatings .cell.score', // User rating scores in lists
        '.albumReviewRating'      // Review rating numbers
    ];

    // Create toggle button
    const button = document.createElement('button');
    button.textContent = scoresHidden ? 'Show Scores' : 'Hide Scores';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 10px 15px;
        background-color: ${scoresHidden ? '#dc3545' : '#28a745'};
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;

    button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });

    // Simple hide/unhide function
    function toggleScores() {
        let totalElementsFound = 0;

        // Hide/show only score elements
        SCORE_SELECTORS.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = scoresHidden ? 'none' : '';
            });
            totalElementsFound += elements.length;
        });

        console.log(`[AOTY Score Hider] ${scoresHidden ? 'HIDDEN' : 'VISIBLE'} - ${totalElementsFound} score elements`);
    }

    // Toggle button click handler
    button.addEventListener('click', function() {
        scoresHidden = !scoresHidden;
        GM_setValue('scoresHidden', scoresHidden);

        button.textContent = scoresHidden ? 'Show Scores' : 'Hide Scores';
        button.style.backgroundColor = scoresHidden ? '#dc3545' : '#28a745';

        toggleScores();
    });

    // Wait for page to be fully loaded
    function init() {
        document.body.appendChild(button);
        toggleScores();
        console.log('[AOTY Score Hider] v1.3 initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Watch for dynamically loaded content (simple throttle)
    let timeout;
    const observer = new MutationObserver(function() {
        clearTimeout(timeout);
        timeout = setTimeout(toggleScores, 100);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();

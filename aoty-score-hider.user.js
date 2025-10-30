// ==UserScript==
// @name         AOTY Score Hider
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Toggle visibility of scores on Album of the Year
// @author       You
// @match        https://www.albumoftheyear.org/*
// @match        https://albumoftheyear.org/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const SCORE_SELECTORS = [
        '.albumUserScoreBox',
        '.albumCriticScoreBox',
        '.ratingRowContainer',
        '.albumReviewText',
        '.dist',
        '.distEnd',
        '.rating',
        '.ratingBar',
        '.scoreValue',
        '.scoreValueContainer',
        '.albumReviewRatingBar',
        '.albumCriticScore',
        '.albumUserScore',
        '.artistCriticScore',
        '.artistUserScore',
        '.trackRating',
        '.mustHearButton',
        '.songScore',
        '.songScoreBox',
        '.songRatings .cell.score',
        '.albumReviewRating'
    ];

    let isHidden = GM_getValue('scoresHidden', false);

    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .aoty-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                padding: 10px 15px;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            }
            .aoty-toggle-btn:hover {
                transform: scale(1.05);
            }
            .aoty-toggle-btn.hidden {
                background-color: #dc3545;
            }
            .aoty-toggle-btn.visible {
                background-color: #28a745;
            }
        `;
        document.head.appendChild(style);
    }

    function createButton() {
        const button = document.createElement('button');
        button.className = `aoty-toggle-btn ${isHidden ? 'hidden' : 'visible'}`;
        button.textContent = isHidden ? 'Show Scores' : 'Hide Scores';
        button.addEventListener('click', handleToggle);
        return button;
    }

    function updateScoreVisibility() {
        const display = isHidden ? 'none' : '';
        SCORE_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.style.display = display);
        });
    }

    function handleToggle() {
        isHidden = !isHidden;
        GM_setValue('scoresHidden', isHidden);

        const button = document.querySelector('.aoty-toggle-btn');
        button.textContent = isHidden ? 'Show Scores' : 'Hide Scores';
        button.className = `aoty-toggle-btn ${isHidden ? 'hidden' : 'visible'}`;

        updateScoreVisibility();
    }

    function init() {
        addStyles();
        document.body.appendChild(createButton());
        updateScoreVisibility();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    let timeout;
    new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(updateScoreVisibility, 100);
    }).observe(document.body, { childList: true, subtree: true });

})();

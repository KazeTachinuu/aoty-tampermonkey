// ==UserScript==
// @name         AOTY Score Hider
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Toggle visibility of scores on Album of the Year
// @author       Hugo Sibony
// @match        https://www.albumoftheyear.org/*
// @match        https://albumoftheyear.org/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/KazeTachinuu/aoty-tampermonkey/master/aoty-score-hider.user.js
// @downloadURL  https://raw.githubusercontent.com/KazeTachinuu/aoty-tampermonkey/master/aoty-score-hider.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        SELECTORS: [
            '.albumUserScoreBox',
            '.albumCriticScoreBox',
            '.albumListScoreContainer',
            '.ratingRowContainer',
            '.albumReviewText',
            '.dist',
            '.distEnd',
            '.rating',
            '.ratingBar',
            '.scoreValue',
            '.scoreValueContainer',
            '.scoreHeader',
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
        ]
    };

    // Inject CSS that hides scores when html has the class (prevents flash on page load)
    GM_addStyle(`html.aoty-hide-scores ${CONFIG.SELECTORS.join(', html.aoty-hide-scores ')} { display: none !important; }`);

    let isHidden = GM_getValue('scoresHidden', false);

    // Apply class immediately if scores should be hidden
    if (isHidden) {
        document.documentElement.classList.add('aoty-hide-scores');
    }

    function getOrCreateContainer() {
        let container = document.querySelector('.aoty-scripts-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'aoty-scripts-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function addStyles() {
        if (document.querySelector('#aoty-shared-styles')) return;

        const style = document.createElement('style');
        style.id = 'aoty-shared-styles';
        style.textContent = `
            .aoty-scripts-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .aoty-btn {
                padding: 7px 12px;
                font-family: "Open Sans", sans-serif;
                font-size: 10.4px;
                font-weight: 400;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                cursor: pointer;
                border-radius: 3px;
                transition: all 0.15s ease;
                white-space: nowrap;
                background: #fff;
                color: #36393f;
                border: 1px solid;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .aoty-btn:hover {
                background: #fafafa;
                box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            }
            .aoty-btn:active {
                transform: translateY(1px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            .aoty-btn.visible {
                border-color: #86E27D;
            }
            .aoty-btn.hidden {
                border-color: #E07D70;
            }
            body.dark .aoty-btn {
                background: rgb(47, 49, 54);
                color: rgb(185, 187, 190);
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            body.dark .aoty-btn:hover {
                background: rgb(54, 57, 63);
                color: rgb(220, 221, 222);
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            }
            body.dark .aoty-btn:active {
                transform: translateY(1px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }
            @media (max-width: 768px) {
                .aoty-scripts-container {
                    top: 10px;
                    right: 10px;
                }
                .aoty-btn {
                    font-size: 9.5px;
                    padding: 6px 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function createButton() {
        const button = document.createElement('button');
        button.className = `aoty-btn ${isHidden ? 'hidden' : 'visible'}`;
        button.textContent = isHidden ? 'Show Scores' : 'Hide Scores';
        button.title = isHidden ? 'Click to show all scores' : 'Click to hide all scores';
        button.addEventListener('click', handleToggle);
        return button;
    }

    function updateScoreVisibility() {
        document.documentElement.classList.toggle('aoty-hide-scores', isHidden);
    }

    function handleToggle(event) {
        isHidden = !isHidden;
        GM_setValue('scoresHidden', isHidden);

        event.target.textContent = isHidden ? 'Show Scores' : 'Hide Scores';
        event.target.className = `aoty-btn ${isHidden ? 'hidden' : 'visible'}`;
        event.target.title = isHidden ? 'Click to show all scores' : 'Click to hide all scores';

        updateScoreVisibility();
    }

    function init() {
        addStyles();
        getOrCreateContainer().appendChild(createButton());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

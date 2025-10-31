// ==UserScript==
// @name         AOTY Page Analyzer
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Analyze AOTY pages to understand structure and find user ratings
// @author       Hugo Sibony
// @match        https://*.albumoftheyear.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const PAGE_TYPES = {
        '/album/': 'Album Page',
        '/artist/': 'List Page',
        '/user/': 'Profile Page',
        '/ratings/': 'List Page',
        '/discover/': 'List Page',
        '/releases/': 'List Page',
        'genre.php': 'List Page',
        '/genre/': 'List Page',
        '/list/': 'List Page'
    };

    function getPageType() {
        const path = window.location.pathname;
        if (path === '/' || path === '') return 'Homepage';
        for (const [key, type] of Object.entries(PAGE_TYPES)) {
            if (path.includes(key)) return type;
        }
        return 'Other';
    }

    const logs = [];

    function log(message, data = null) {
        logs.push({ message, data });
    }

    function analyzeListPage() {
        log('=== LIST PAGE ANALYSIS ===');

        const blocks = document.querySelectorAll('.albumBlock');
        log('Found Album Blocks', blocks.length);

        [...blocks].slice(0, 3).forEach((block, i) => {
            log(`Album Block ${i} HTML`, block.outerHTML);

            const id = block.querySelector('[data-album-id]')?.dataset.albumId;
            const link = block.querySelector('a[href*="/album/"]')?.href;
            const ratings = block.querySelectorAll('.rating');

            log(`Block ${i} Data`, { albumId: id, link, ratingCount: ratings.length });

            ratings.forEach((rating, j) => {
                log(`  Rating ${j}`, {
                    text: rating.textContent.trim(),
                    html: rating.outerHTML,
                    parent: rating.parentElement?.outerHTML.substring(0, 200)
                });
            });
        });
    }

    function analyzeAlbumPage() {
        log('=== ALBUM PAGE ANALYSIS ===');

        const id = window.location.pathname.match(/\/album\/(\d+)/)?.[1];
        const title = document.querySelector('.albumTitle, h1')?.textContent.trim();
        const artist = document.querySelector('.artistTitle, a[href*="/artist/"]')?.textContent.trim();
        const criticScore = document.querySelector('.albumCriticScore, .albumCriticScoreBox .scoreValue')?.textContent.trim();
        const userScore = document.querySelector('.albumUserScore, .albumUserScoreBox .scoreValue')?.textContent.trim();
        const yourRating = document.querySelector('#currentRatingBlock.yourOwn .ratingValue')?.textContent.trim();

        log('Album Info', { id, title, artist, criticScore, userScore, yourRating });

        const ratings = document.querySelectorAll('[class*="rating"], [class*="Rating"]');
        log('Found Rating Elements', ratings.length);
    }

    function analyzeScoreElements() {
        log('=== SCORE ELEMENTS ===');

        const selectors = ['.albumUserScoreBox', '.albumCriticScoreBox', '.scoreValue', '.rating', '[class*="Score"]', '[class*="score"]'];
        selectors.forEach(sel => {
            const count = document.querySelectorAll(sel).length;
            if (count > 0) log(`Selector: ${sel}`, `Found ${count} elements`);
        });
    }

    function getUserInfo() {
        const userLink = document.querySelector('.navUser a[href*="/user/"], .userMenu a[href*="/user/"], nav a[href*="/user/"]');
        return {
            isLoggedIn: !!userLink,
            username: userLink?.textContent.trim() || null,
            userLink: userLink?.href || null
        };
    }

    function analyze() {
        logs.length = 0;

        log('=== PAGE ANALYSIS ===');
        log('URL', window.location.href);
        log('Page Type', getPageType());
        log('User Info', getUserInfo());

        const pageType = getPageType();
        if (pageType === 'List Page' || pageType === 'Homepage') analyzeListPage();
        if (pageType === 'Album Page') analyzeAlbumPage();

        log('=== NETWORK MONITORING ===');
        log('Note: Check browser DevTools Network tab for API calls');
        log('Look for:', 'XHR/Fetch requests to endpoints containing: rating, score, user, album');

        analyzeScoreElements();

        showResults();
    }

    function showResults() {
        let panel = document.querySelector('.aoty-analyzer-panel');
        if (!panel) panel = createPanel();

        const content = panel.querySelector('.aoty-analyzer-content');
        content.innerHTML = '';

        logs.forEach(({ message, data }) => {
            const entry = document.createElement('div');
            entry.className = 'aoty-analyzer-entry';
            entry.innerHTML = data
                ? `<strong>${message}:</strong><pre>${JSON.stringify(data, null, 2)}</pre>`
                : `<div>${message}</div>`;
            entry.dataset.message = message;
            if (data) entry.dataset.data = JSON.stringify(data, null, 2);
            content.appendChild(entry);
        });

        panel.classList.add('visible');
    }

    function createPanel() {
        const panel = document.createElement('div');
        panel.className = 'aoty-analyzer-panel';
        panel.innerHTML = `
            <div class="aoty-analyzer-header">
                <span>AOTY Page Analyzer</span>
                <div>
                    <button class="copy-btn">Copy All</button>
                    <button class="close-btn">Close</button>
                </div>
            </div>
            <div class="aoty-analyzer-content"></div>
        `;

        panel.querySelector('.copy-btn').onclick = () => copyResults(panel);
        panel.querySelector('.close-btn').onclick = () => panel.classList.remove('visible');

        document.body.appendChild(panel);
        return panel;
    }

    function copyResults(panel) {
        const entries = panel.querySelectorAll('.aoty-analyzer-entry');
        let text = 'AOTY Page Analysis\n==================\n\n';
        entries.forEach(e => {
            text += e.dataset.data
                ? `${e.dataset.message}:\n${e.dataset.data}\n\n`
                : `${e.dataset.message}\n\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            const btn = panel.querySelector('.copy-btn');
            btn.textContent = 'Copied!';
            btn.style.background = '#17a2b8';
            setTimeout(() => {
                btn.textContent = 'Copy All';
                btn.style.background = '#28a745';
            }, 2000);
        });
    }

    function addStyles() {
        if (document.querySelector('#aoty-analyzer-styles')) return;

        const style = document.createElement('style');
        style.id = 'aoty-analyzer-styles';
        style.textContent = `
            .aoty-scripts-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .aoty-btn {
                padding: 10px 15px;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                white-space: nowrap;
            }
            .aoty-btn:hover { transform: scale(1.05); }
            .aoty-btn.analyzer { background: #007bff; }
            .aoty-analyzer-panel {
                position: fixed;
                top: 50px;
                left: 20px;
                width: 400px;
                max-height: 80vh;
                background: #1a1a1a;
                color: #00ff00;
                border: 2px solid #00ff00;
                border-radius: 8px;
                padding: 15px;
                z-index: 10000;
                overflow-y: auto;
                font-family: monospace;
                font-size: 12px;
                display: none;
            }
            .aoty-analyzer-panel.visible { display: block; }
            .aoty-analyzer-header {
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #00ff00;
                display: flex;
                justify-content: space-between;
                font-weight: bold;
            }
            .aoty-analyzer-header button {
                background: #28a745;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                margin-left: 5px;
            }
            .aoty-analyzer-header .close-btn { background: #dc3545; }
            .aoty-analyzer-entry {
                margin: 5px 0;
                padding: 5px;
                background: #2a2a2a;
                border-radius: 3px;
            }
            .aoty-analyzer-entry pre {
                margin: 5px 0;
                overflow-x: auto;
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        addStyles();

        let container = document.querySelector('.aoty-scripts-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'aoty-scripts-container';
            document.body.appendChild(container);
        }

        const btn = document.createElement('button');
        btn.className = 'aoty-btn analyzer';
        btn.textContent = 'Analyze Page';
        btn.onclick = analyze;
        container.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ==UserScript==
// @name         AOTY Random Album Picker
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Pick a random album from any user's rated albums on AOTY
// @author       Hugo Sibony
// @match        https://*.albumoftheyear.org/user/*
// @match        https://*.albumoftheyear.org/album/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        MAX_PAGES: 100,
        BANNER_TIMEOUT: 10000,
        BANNER_AUTO_DISMISS: 8000,
        STORAGE_KEY: 'aoty_random_pick'
    };

    // Utility functions
    function isUserProfilePage() {
        return /^\/user\/[^\/]+/.test(window.location.pathname);
    }

    function isAlbumPage() {
        return /^\/album\//.test(window.location.pathname);
    }

    function getUsernameFromUrl() {
        const match = window.location.pathname.match(/^\/user\/([^\/]+)/);
        return match ? match[1] : null;
    }

    function getColorClass(rating) {
        const r = parseInt(rating);
        if (r >= 75) return 'green';
        if (r >= 60) return 'yellow';
        return 'red';
    }

    // Album fetching
    function extractAlbumsFromDoc(doc, seen) {
        const albums = [];

        doc.querySelectorAll('.albumBlock').forEach(block => {
            const link = block.querySelector('a[href*="/album/"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || !href.match(/^\/album\/\d+-.*\.php$/)) return;
            if (seen.has(href)) return;

            seen.add(href);

            const ratingEl = block.querySelector('.ratingBlock .rating');
            const titleEl = block.querySelector('.albumTitle');
            const artistEl = block.querySelector('.artistTitle');

            albums.push({
                href,
                rating: ratingEl ? ratingEl.textContent.trim() : null,
                title: titleEl ? titleEl.textContent.trim() : 'Unknown Album',
                artist: artistEl ? artistEl.textContent.trim() : 'Unknown Artist'
            });
        });

        return albums;
    }

    async function getAllRatedAlbums(username) {
        const allAlbums = [];
        const seen = new Set();
        let page = 1;

        try {
            while (page <= CONFIG.MAX_PAGES) {
                const url = page === 1
                    ? `/user/${username}/ratings/`
                    : `/user/${username}/ratings/?page=${page}`;

                const response = await fetch(url);
                if (!response.ok) break;

                const html = await response.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const pageAlbums = extractAlbumsFromDoc(doc, seen);

                if (pageAlbums.length === 0) break;

                allAlbums.push(...pageAlbums);

                const hasNextPage = doc.querySelector('.pagination a[rel="next"]') ||
                                  doc.querySelector('.pagination .next:not(.disabled)');

                if (!hasNextPage) break;
                page++;
            }
        } catch (error) {
            console.error('Error fetching albums:', error);
        }

        return allAlbums;
    }

    // Random album picker
    async function handleRandomClick(e) {
        e.preventDefault();

        const username = getUsernameFromUrl();
        if (!username) return;

        const link = e.currentTarget;
        const div = link.querySelector('div');
        if (!div) return;

        const originalText = div.textContent;
        div.textContent = 'Loading...';

        const albums = await getAllRatedAlbums(username);

        if (albums.length === 0) {
            alert('No rated albums found for this user.');
            div.textContent = originalText;
            return;
        }

        const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
            rating: randomAlbum.rating,
            username: username,
            timestamp: Date.now()
        }));

        window.location.href = randomAlbum.href;
    }

    function createRandomButton() {
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'aoty-random-link';

        const div = document.createElement('div');
        div.textContent = 'Random';

        link.appendChild(div);
        link.addEventListener('click', handleRandomClick);

        return link;
    }

    // Rating banner
    function showRatingBanner() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!data) return;

        try {
            const info = JSON.parse(data);
            localStorage.removeItem(CONFIG.STORAGE_KEY);

            if (Date.now() - info.timestamp > CONFIG.BANNER_TIMEOUT) return;
            if (!info.rating) return;

            const colorClass = getColorClass(info.rating);

            const banner = document.createElement('div');
            banner.className = 'aoty-random-banner';

            const content = document.createElement('div');
            content.className = 'aoty-random-banner-content';

            const label = document.createElement('span');
            label.className = 'aoty-random-banner-label';
            label.textContent = `Random pick from ${info.username}'s ratings:`;

            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'aoty-random-banner-rating';

            const ratingSpan = document.createElement('span');
            ratingSpan.className = 'rating';
            ratingSpan.textContent = info.rating;

            const ratingBar = document.createElement('div');
            ratingBar.className = `ratingBar ${colorClass}`;
            const ratingBarFill = document.createElement('div');
            ratingBarFill.className = colorClass;
            ratingBarFill.style.width = `${info.rating}%`;
            ratingBar.appendChild(ratingBarFill);

            ratingDiv.appendChild(ratingSpan);
            ratingDiv.appendChild(ratingBar);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'aoty-random-banner-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => dismissBanner(banner));

            content.appendChild(label);
            content.appendChild(ratingDiv);
            content.appendChild(closeBtn);
            banner.appendChild(content);

            document.body.appendChild(banner);

            setTimeout(() => banner.classList.add('visible'), 10);
            setTimeout(() => dismissBanner(banner), CONFIG.BANNER_AUTO_DISMISS);

        } catch (error) {
            console.error('Error showing banner:', error);
        }
    }

    function dismissBanner(banner) {
        if (!banner || !banner.classList.contains('visible')) return;
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 300);
    }

    // Styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .aoty-random-link {
                display: inline-block;
            }
            .aoty-random-link div {
                cursor: pointer;
            }
            .aoty-random-banner {
                position: fixed;
                top: 80px;
                right: 20px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 9999;
                opacity: 0;
                transform: translateX(400px);
                transition: all 0.3s ease;
            }
            .aoty-random-banner.visible {
                opacity: 1;
                transform: translateX(0);
            }
            body.dark .aoty-random-banner {
                background: #2a2a2a;
                border-color: #444;
            }
            .aoty-random-banner-content {
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .aoty-random-banner-label {
                font-size: 14px;
                color: #666;
            }
            body.dark .aoty-random-banner-label {
                color: #999;
            }
            .aoty-random-banner-rating {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .aoty-random-banner-rating .rating {
                font-size: 24px;
                font-weight: bold;
                min-width: 40px;
            }
            .aoty-random-banner-rating .ratingBar {
                width: 100px;
                height: 8px;
                background: #e0e0e0;
                border-radius: 4px;
                overflow: hidden;
            }
            body.dark .aoty-random-banner-rating .ratingBar {
                background: #444;
            }
            .aoty-random-banner-rating .ratingBar div {
                height: 100%;
            }
            .aoty-random-banner-rating .ratingBar .green {
                background: #86E27D;
            }
            .aoty-random-banner-rating .ratingBar .yellow {
                background: #E5C76D;
            }
            .aoty-random-banner-rating .ratingBar .red {
                background: #E07D70;
            }
            .aoty-random-banner-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
                line-height: 1;
            }
            .aoty-random-banner-close:hover {
                color: #333;
            }
            body.dark .aoty-random-banner-close:hover {
                color: #fff;
            }
            @media (max-width: 768px) {
                .aoty-random-banner {
                    right: 10px;
                    left: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Page initialization
    function initUserPage() {
        const profileNav = document.querySelector('.profileNav');
        if (profileNav) {
            profileNav.appendChild(createRandomButton());
        }
    }

    function initAlbumPage() {
        showRatingBanner();
    }

    function init() {
        addStyles();

        if (isUserProfilePage()) {
            initUserPage();
        } else if (isAlbumPage()) {
            initAlbumPage();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

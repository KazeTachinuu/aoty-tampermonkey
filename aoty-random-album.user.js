// ==UserScript==
// @name         AOTY Random Album Picker
// @namespace    http://tampermonkey.net/
// @version      1.14
// @description  Pick a random album from any user's rated albums on AOTY
// @author       Hugo Sibony
// @match        https://*.albumoftheyear.org/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/KazeTachinuu/aoty-tampermonkey/master/aoty-random-album.user.js
// @downloadURL  https://raw.githubusercontent.com/KazeTachinuu/aoty-tampermonkey/master/aoty-random-album.user.js
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        MAX_PAGES: 100,
        BANNER_TIMEOUT: 10000,
        BANNER_AUTO_DISMISS: 8000,
        STORAGE_KEY: 'aoty_random_pick',
        COLOR_THRESHOLDS: { GREEN: 75, YELLOW: 60 }
    };

    const isUserProfilePage = () => /^\/user\/[^\/]+/.test(window.location.pathname);
    const isAlbumPage = () => /^\/album\//.test(window.location.pathname);
    const getUsernameFromUrl = () => window.location.pathname.match(/^\/user\/([^\/]+)/)?.[1] || null;

    const getLoggedInUsername = () => {
        // AOTY uses .accountLinks for desktop and .userLinks for mobile
        const profileLink = document.querySelector('.accountLinks a[href^="/user/"], .userLinks a[href^="/user/"]');
        if (profileLink) {
            const match = profileLink.getAttribute('href').match(/^\/user\/([^\/]+)/);
            if (match) return match[1];
        }
        return null;
    };

    const findUserDropdownMenus = () => {
        // Return both desktop (.accountLinks) and mobile (.userLinks) menus
        return document.querySelectorAll('.accountLinks, .userLinks');
    };

    const getColorClass = rating => {
        const r = parseInt(rating);
        return r >= CONFIG.COLOR_THRESHOLDS.GREEN ? 'green' :
               r >= CONFIG.COLOR_THRESHOLDS.YELLOW ? 'yellow' : 'red';
    };

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

    async function handleRandomClick(e, usernameOverride = null) {
        e.preventDefault();

        const username = usernameOverride || getUsernameFromUrl();
        if (!username) {
            alert('Could not determine username.');
            return;
        }

        const link = e.currentTarget;
        const textEl = link.querySelector('div') || link;
        const originalText = textEl.textContent;
        textEl.textContent = 'Loading...';

        const albums = await getAllRatedAlbums(username);

        if (albums.length === 0) {
            alert('No rated albums found for this user.');
            textEl.textContent = originalText;
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

    function showRatingBanner() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!data) return;

        try {
            const info = JSON.parse(data);
            localStorage.removeItem(CONFIG.STORAGE_KEY);

            if (Date.now() - info.timestamp > CONFIG.BANNER_TIMEOUT || !info.rating) return;

            const colorClass = getColorClass(info.rating);
            const banner = document.createElement('div');
            banner.className = 'aoty-random-banner';
            banner.innerHTML = `
                <div class="aoty-random-banner-content">
                    <span class="aoty-random-banner-label">Random pick from ${info.username}'s ratings:</span>
                    <div class="aoty-random-banner-rating">
                        <span class="rating">${info.rating}</span>
                        <div class="ratingBar ${colorClass}">
                            <div class="${colorClass}" style="width:${info.rating}%"></div>
                        </div>
                    </div>
                    <button class="aoty-random-banner-close">&times;</button>
                </div>
            `;

            banner.querySelector('button').addEventListener('click', () => dismissBanner(banner));
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

    function addStyles() {
        if (document.querySelector('#aoty-random-styles')) return;

        const style = document.createElement('style');
        style.id = 'aoty-random-styles';
        style.textContent = `
            .aoty-random-banner {
                --bg: #fff;
                --border: rgba(54, 57, 63, 0.2);
                --text: #36393f;
                --bar-bg: rgba(54, 57, 63, 0.1);
                --close: #999;
                --close-hover: #36393f;
            }
            body.dark .aoty-random-banner {
                --bg: rgb(47, 49, 54);
                --border: rgba(185, 187, 190, 0.2);
                --text: rgb(185, 187, 190);
                --bar-bg: rgba(185, 187, 190, 0.2);
                --close-hover: rgb(220, 221, 222);
            }
            .aoty-random-link { text-decoration: none; }
            .aoty-random-link div { cursor: pointer; }
            .aoty-random-dropdown-link {
                display: block;
                padding: 8px 15px;
                color: inherit;
                text-decoration: none;
                cursor: pointer;
            }
            .aoty-random-dropdown-link:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            body.dark .aoty-random-dropdown-link:hover {
                background: rgba(255, 255, 255, 0.05);
            }
            .aoty-random-banner {
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--bg);
                border: 1px solid var(--border);
                border-radius: 3px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                opacity: 0;
                transform: translateX(400px);
                transition: all 0.3s ease;
            }
            .aoty-random-banner.visible { opacity: 1; transform: translateX(0); }
            .aoty-random-banner-content { padding: 15px 20px; display: flex; align-items: center; gap: 15px; }
            .aoty-random-banner-label { font-size: 13px; color: var(--text); }
            .aoty-random-banner-rating { display: flex; align-items: center; gap: 10px; }
            .aoty-random-banner-rating .rating { font-size: 24px; font-weight: bold; min-width: 40px; }
            .aoty-random-banner-rating .ratingBar { width: 100px; height: 8px; background: var(--bar-bg); border-radius: 4px; overflow: hidden; }
            .aoty-random-banner-rating .ratingBar div { height: 100%; }
            .aoty-random-banner-rating .ratingBar .green { background: #86E27D; }
            .aoty-random-banner-rating .ratingBar .yellow { background: #E5C76D; }
            .aoty-random-banner-rating .ratingBar .red { background: #E07D70; }
            .aoty-random-banner-close { background: none; border: none; font-size: 24px; color: var(--close); cursor: pointer; padding: 0; margin-left: 10px; line-height: 1; }
            .aoty-random-banner-close:hover { color: var(--close-hover); }
            @media (max-width: 768px) { .aoty-random-banner { right: 10px; left: 10px; } }
        `;
        document.head.appendChild(style);
    }

    function initUserPage() {
        const profileNav = document.querySelector('.profileNav');
        if (profileNav) {
            const lastLink = profileNav.querySelector('a:has(div.last)');
            if (lastLink) {
                profileNav.insertBefore(createRandomButton(), lastLink);
            } else {
                profileNav.appendChild(createRandomButton());
            }
        }
    }

    function initAlbumPage() {
        showRatingBanner();
    }

    function initDropdownMenu() {
        const username = getLoggedInUsername();
        if (!username) return;

        const dropdownMenus = findUserDropdownMenus();
        if (!dropdownMenus.length) return;

        dropdownMenus.forEach(menu => {
            if (menu.querySelector('.aoty-random-dropdown-link')) return;

            // Create wrapper div like other menu items
            const wrapper = document.createElement('div');
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'aoty-random-dropdown-link';
            link.innerHTML = '<i class="fas fa-random"></i>Random Album';
            link.addEventListener('click', (e) => handleRandomClick(e, username));
            wrapper.appendChild(link);

            // Insert before Settings (a[href*="edit.php"]) or at the end
            const settingsLink = menu.querySelector('a[href*="edit.php"]');
            if (settingsLink && settingsLink.parentElement) {
                menu.insertBefore(wrapper, settingsLink.parentElement);
            } else {
                menu.appendChild(wrapper);
            }
        });
    }

    function init() {
        addStyles();
        initDropdownMenu();

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

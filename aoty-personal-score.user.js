// ==UserScript==
// @name         AOTY Personal Score
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Display your personal ratings on artist/list pages
// @author       You
// @match        https://*.albumoftheyear.org/
// @match        https://*.albumoftheyear.org/artist/*
// @match        https://*.albumoftheyear.org/genre/*
// @match        https://*.albumoftheyear.org/genre.php*
// @match        https://*.albumoftheyear.org/list/*
// @match        https://*.albumoftheyear.org/ratings/*
// @match        https://*.albumoftheyear.org/discover/*
// @match        https://*.albumoftheyear.org/releases/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @connect      albumoftheyear.org
// ==/UserScript==

(function() {
    'use strict';

    const cache = {};
    const getColor = r => parseInt(r) >= 75 ? 'green' : parseInt(r) >= 60 ? 'yellow' : 'red';

    function fetchRating(id) {
        if (cache[id] !== undefined) return Promise.resolve(cache[id]);

        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://www.albumoftheyear.org/album/${id}/`,
                onload: r => {
                    cache[id] = new DOMParser()
                        .parseFromString(r.responseText, 'text/html')
                        .querySelector('#currentRatingBlock.yourOwn .ratingValue')
                        ?.textContent.trim() || null;
                    resolve(cache[id]);
                },
                onerror: () => { cache[id] = null; resolve(null); }
            });
        });
    }

    async function inject(block) {
        if (block.dataset.done) return;
        block.dataset.done = 1;

        const id = block.querySelector('[data-album-id]')?.dataset.albumId;
        if (!id) return;

        const rating = await fetchRating(id);
        if (!rating) return;

        const color = getColor(rating);
        const ratingRow = block.querySelector('.ratingRowContainer');
        const scoreBox = block.querySelector('.albumListScoreContainer');

        if (ratingRow?.querySelector('.ratingRow')) {
            const row = document.createElement('div');
            row.className = 'ratingRow';
            row.innerHTML = `<div class="ratingBlock"><div class="rating">${rating}</div><div class="ratingBar ${color}"><div class="${color}" style="width:${rating}%;"></div></div></div><div class="ratingText">your score</div><div class="ratingText"></div>`;
            ratingRow.appendChild(row);
        } else if (scoreBox) {
            scoreBox.insertAdjacentHTML('beforeend', `<div class="scoreHeader" style="margin-top:20px">Your Score</div><div class="scoreValueContainer"><div class="scoreValue">${rating}</div><div class="albumReviewRatingBar ${color}"><div class="${color}" style="width:${rating}%;"></div></div></div>`);
        }
    }

    async function processAll() {
        const blocks = document.querySelectorAll('.albumBlock, .albumListRow');
        for (let i = 0; i < blocks.length; i += 5) {
            await Promise.all([...blocks].slice(i, i + 5).map(inject));
            if (i + 5 < blocks.length) await new Promise(r => setTimeout(r, 500));
        }
    }

    let timer;
    new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(processAll, 250);
    }).observe(document.body, { childList: true, subtree: true });

    processAll();

})();

/**
 * MovieQ - Watch Later UI Controller
 * Renders Watch Later Modal, Nav Badges, Card Bookmark Buttons, and Detail Controls
 */

const StashUI = (function() {
    let currentFilter = 'all'; // 'all' | 'want_to_watch' | 'watched'

    function init() {
        injectModalMarkup();
        setupNavbar();
        setupModalEvents();
        updateNavbarBadge();
        
        // Listen to global updates
        window.addEventListener('stashUpdated', () => {
            updateNavbarBadge();
            renderStashList();
            updateCardButtons();
            updateDetailButton();
        });
    }

    // Inject Watch Later Modal into the DOM if not already present
    function injectModalMarkup() {
        if (document.getElementById('pocketStashModalOverlay')) return;

        const modalHtml = `
            <div class="modal-overlay" id="pocketStashModalOverlay">
                <div class="watch-later-modal pocket-stash-modal">
                    <!-- Modal Header -->
                    <div class="watch-later-header">
                        <div class="watch-later-title-wrap">
                            <span class="watch-later-icon"><i class="fas fa-bookmark"></i></span>
                            <div>
                                <div style="display:flex; align-items:center; gap:0.6rem;">
                                    <h3 class="watch-later-title">WATCH LATER</h3>
                                    <span class="watch-later-tag">OFFLINE</span>
                                </div>
                                <span class="watch-later-header-sub" id="stashTotalCountLabel">0 MOVIES SAVED</span>
                            </div>
                        </div>
                        <button class="watch-later-close-btn" id="closePocketStashModal" aria-label="Close Watch Later modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Filter Tabs & Export Action Bar -->
                    <div class="watch-later-toolbar">
                        <div class="watch-later-tabs stash-tabs">
                            <button class="stash-tab-btn active" data-filter="all">ALL (<span id="countAll">0</span>)</button>
                            <button class="stash-tab-btn" data-filter="want_to_watch">WANT TO WATCH (<span id="countWant">0</span>)</button>
                            <button class="stash-tab-btn" data-filter="watched">WATCHED (<span id="countWatched">0</span>)</button>
                        </div>
                        <button class="stash-export-btn" id="exportStashBtn" title="Export as printable checklist">
                            <i class="fas fa-file-arrow-down"></i> EXPORT LIST
                        </button>
                    </div>

                    <!-- Content List -->
                    <div class="watch-later-body pocket-stash-body" id="pocketStashBody">
                        <!-- Items dynamically injected here -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Setup navbar badge and click listener
    function setupNavbar() {
        const navLinks = document.querySelector('.nav-links');
        let btn = document.getElementById('openStashNavBtn');
        if (navLinks && !btn) {
            const stashNavItem = document.createElement('li');
            stashNavItem.innerHTML = `
                <a href="javascript:void(0)" id="openStashNavBtn" class="nav-stash-link" title="Open Watch Later list">
                    <i class="fas fa-bookmark"></i> Watch Later
                    <span class="stash-badge" id="stashNavBadge">0</span>
                </a>
            `;
            navLinks.appendChild(stashNavItem);
            btn = document.getElementById('openStashNavBtn');
        }

        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                openStashModal();
            };
        }
    }

    // Setup modal open/close and filter tab events
    function setupModalEvents() {
        const modal = document.getElementById('pocketStashModalOverlay');
        const closeBtn = document.getElementById('closePocketStashModal');
        const exportBtn = document.getElementById('exportStashBtn');

        if (closeBtn && modal) {
            closeBtn.onclick = () => modal.classList.remove('active');
            window.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }

        if (exportBtn) {
            exportBtn.onclick = () => StashService.exportChecklist();
        }

        // Tab filters
        const tabs = document.querySelectorAll('.stash-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.filter;
                renderStashList();
            });
        });
    }

    // Open Watch Later Modal
    function openStashModal(filter = 'all') {
        const modal = document.getElementById('pocketStashModalOverlay');
        if (!modal) return;

        currentFilter = filter;
        document.querySelectorAll('.stash-tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === currentFilter);
        });

        renderStashList();
        modal.classList.add('active');
    }

    // Update navbar badge count
    function updateNavbarBadge() {
        const badge = document.getElementById('stashNavBadge');
        if (!badge) return;
        const count = StashService.getCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    // Render list of items in the modal
    function renderStashList() {
        const container = document.getElementById('pocketStashBody');
        const countLabel = document.getElementById('stashTotalCountLabel');
        const countAll = document.getElementById('countAll');
        const countWant = document.getElementById('countWant');
        const countWatched = document.getElementById('countWatched');

        const allItems = StashService.getAllItems();
        const wantItems = allItems.filter(i => i.status === 'want_to_watch');
        const watchedItems = allItems.filter(i => i.status === 'watched');

        if (countAll) countAll.textContent = allItems.length;
        if (countWant) countWant.textContent = wantItems.length;
        if (countWatched) countWatched.textContent = watchedItems.length;
        if (countLabel) countLabel.textContent = `${allItems.length} ${allItems.length === 1 ? 'MOVIE' : 'MOVIES'} SAVED`;

        let displayItems = allItems;
        if (currentFilter === 'want_to_watch') displayItems = wantItems;
        if (currentFilter === 'watched') displayItems = watchedItems;

        if (displayItems.length === 0) {
            container.innerHTML = `
                <div class="stash-empty-state">
                    <div class="empty-icon-box"><i class="fas fa-bookmark"></i></div>
                    <h4>YOUR WATCH LATER LIST IS EMPTY</h4>
                    <p>Click the bookmark icon on any movie card or detail page to save it offline.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = displayItems.map(item => {
            const posterUrl = item.poster_path 
                ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w200${item.poster_path}`)
                : (typeof MovieLoader !== 'undefined' ? MovieLoader.CONFIG.defaultPoster : '');
            
            const isWatched = item.status === 'watched';
            const userRating = item.userRating || 0;
            const ratingStr = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : parseFloat(item.vote_average || 0).toFixed(1);

            return `
                <div class="watch-later-card stash-item-card ${isWatched ? 'is-watched' : 'is-want'}" data-movie-id="${item.id}">
                    <a href="movie_detail.html?id=${item.id}" class="watch-later-poster-wrap stash-poster-wrap">
                        <img src="${posterUrl}" alt="${item.title}" class="watch-later-poster-img stash-poster-img" onerror="if(typeof MovieLoader !== 'undefined') MovieLoader.handlePosterError(this)">
                        <span class="watch-later-rating-badge">★ ${ratingStr}</span>
                    </a>
                    
                    <div class="watch-later-card-body stash-item-details">
                        <div class="watch-later-card-top stash-item-header">
                            <div class="watch-later-title-group stash-title-group">
                                <a href="movie_detail.html?id=${item.id}" class="watch-later-card-title stash-item-title">${item.title}</a>
                                <div class="watch-later-chips stash-item-meta">
                                    <span class="wl-chip wl-chip-year">${item.year}</span>
                                    ${item.genres && item.genres.length ? item.genres.slice(0, 2).map(g => `<span class="wl-chip wl-chip-genre">${g.trim()}</span>`).join('') : ''}
                                </div>
                            </div>
                            
                            <!-- Cross button to remove from Watch Later -->
                            <button class="watch-later-remove-btn stash-remove-btn" title="Remove from Watch Later" data-movie-id="${item.id}" aria-label="Remove from Watch Later">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Status & Action Controls Row -->
                        <div class="watch-later-action-row stash-item-controls">
                            <!-- Status Toggle -->
                            <div class="stash-status-toggle">
                                <button class="status-toggle-btn ${!isWatched ? 'active' : ''}" data-action="set-status" data-status="want_to_watch" data-movie-id="${item.id}">
                                    <i class="far fa-clock"></i> Want to Watch
                                </button>
                                <button class="status-toggle-btn ${isWatched ? 'active' : ''}" data-action="set-status" data-status="watched" data-movie-id="${item.id}">
                                    <i class="fas fa-check"></i> Watched
                                </button>
                            </div>

                            <!-- If Want to Watch: Quick Detail Link -->
                            ${!isWatched ? `
                                <a href="movie_detail.html?id=${item.id}" class="watch-later-detail-btn">
                                    VIEW MOVIE <i class="fas fa-arrow-right"></i>
                                </a>
                            ` : `
                                <!-- If Watched: Rubber Stamp + Star Rating -->
                                <div class="watch-later-review-wrap stash-review-bar">
                                    <div class="rubber-stamp-selector">
                                        <button class="stamp-btn stamp-rec ${item.stamp === 'RECOMMENDED' ? 'stamped' : ''}" data-action="set-stamp" data-stamp="RECOMMENDED" data-movie-id="${item.id}" title="Stamp as Recommended">
                                            ★ RECOMMENDED
                                        </button>
                                        <button class="stamp-btn stamp-skip ${item.stamp === 'SKIP' ? 'stamped' : ''}" data-action="set-stamp" data-stamp="SKIP" data-movie-id="${item.id}" title="Stamp as Skip">
                                            ✕ SKIP
                                        </button>
                                    </div>

                                    <div class="watch-later-star-rating stash-star-rating" data-movie-id="${item.id}" title="Rate 1 to 5 stars">
                                        ${[1, 2, 3, 4, 5].map(star => `
                                            <i class="${star <= userRating ? 'fas fa-star active' : 'far fa-star'}" data-rating="${star}"></i>
                                        `).join('')}
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach action handlers for items
        attachItemHandlers(container);
    }

    // Attach click handlers to items inside modal
    function attachItemHandlers(container) {
        // Cross button to remove from Watch Later
        container.querySelectorAll('.stash-remove-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const movieId = btn.dataset.movieId;
                StashService.removeFromStash(movieId);
            };
        });

        // Status toggle buttons (Want to Watch vs Watched)
        container.querySelectorAll('[data-action="set-status"]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const movieId = btn.dataset.movieId;
                const newStatus = btn.dataset.status;
                StashService.updateItem(movieId, { status: newStatus });
            };
        });

        // Rubber Stamp buttons (RECOMMENDED / SKIP)
        container.querySelectorAll('[data-action="set-stamp"]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const movieId = btn.dataset.movieId;
                const targetStamp = btn.dataset.stamp;
                const current = StashService.getItem(movieId);
                const nextStamp = (current && current.stamp === targetStamp) ? null : targetStamp;
                StashService.updateItem(movieId, { stamp: nextStamp });
            };
        });

        // 5-Star Rating
        container.querySelectorAll('.stash-star-rating i').forEach(starIcon => {
            starIcon.onclick = (e) => {
                e.stopPropagation();
                const parent = starIcon.closest('.stash-star-rating');
                const movieId = parent.dataset.movieId;
                const rating = parseInt(starIcon.dataset.rating, 10);
                const current = StashService.getItem(movieId);
                const nextRating = (current && current.userRating === rating) ? null : rating;
                StashService.updateItem(movieId, { userRating: nextRating });
            };
        });
    }

    // Update bookmark icon state on all visible movie cards on index page
    function updateCardButtons() {
        document.querySelectorAll('.card-stash-btn').forEach(btn => {
            const movieId = btn.dataset.movieId;
            const stashed = StashService.isStashed(movieId);
            btn.classList.toggle('stashed', stashed);
            btn.innerHTML = `<i class="${stashed ? 'fas' : 'far'} fa-bookmark"></i>`;
            btn.title = stashed ? 'In Watch Later (Click to remove)' : 'Save to Watch Later';
        });
    }

    // Update detail page stash button & controls if on movie_detail.html
    function updateDetailButton() {
        const detailBtn = document.getElementById('detailStashBtn');
        const controlsContainer = document.getElementById('detailStashControls');
        if (!detailBtn) return;

        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        if (!movieId) return;

        const stashedItem = StashService.getItem(movieId);
        const isStashed = !!stashedItem;

        detailBtn.classList.toggle('is-stashed', isStashed);
        detailBtn.innerHTML = `
            <i class="${isStashed ? 'fas' : 'far'} fa-bookmark"></i>
            ${isStashed ? 'IN WATCH LATER' : '+ WATCH LATER'}
        `;

        if (controlsContainer) {
            if (!isStashed) {
                controlsContainer.style.display = 'none';
                controlsContainer.innerHTML = '';
            } else {
                controlsContainer.style.display = 'block';
                const isWatched = stashedItem.status === 'watched';
                const userRating = stashedItem.userRating || 0;

                controlsContainer.innerHTML = `
                    <div class="detail-stash-panel">
                        <div class="tape-strip" style="top:-8px; left:20px; width:75px;">SAVED</div>
                        <div class="detail-stash-header">
                            <span class="detail-stash-badge"><i class="fas fa-bookmark"></i> WATCH LATER QUEUE</span>
                            <button class="detail-stash-remove-btn" id="detailRemoveStashBtn" title="Remove from Watch Later">
                                <i class="fas fa-times"></i> REMOVE
                            </button>
                        </div>
                        
                        <div class="detail-stash-body">
                            <!-- Status Switcher -->
                            <div class="stash-status-toggle">
                                <button class="status-toggle-btn ${!isWatched ? 'active' : ''}" id="detailToggleWant">
                                    <i class="far fa-clock"></i> Want to Watch
                                </button>
                                <button class="status-toggle-btn ${isWatched ? 'active' : ''}" id="detailToggleWatched">
                                    <i class="fas fa-check"></i> Watched
                                </button>
                            </div>

                            <!-- Watched Review Options -->
                            ${isWatched ? `
                            <div class="detail-review-section">
                                <div class="rubber-stamp-selector">
                                    <button class="stamp-btn stamp-rec ${stashedItem.stamp === 'RECOMMENDED' ? 'stamped' : ''}" id="detailStampRec">
                                        ★ RECOMMENDED
                                    </button>
                                    <button class="stamp-btn stamp-skip ${stashedItem.stamp === 'SKIP' ? 'stamped' : ''}" id="detailStampSkip">
                                        ✕ SKIP
                                    </button>
                                </div>
                                <div class="stash-star-rating" id="detailStarRating">
                                    ${[1, 2, 3, 4, 5].map(star => `
                                        <i class="${star <= userRating ? 'fas fa-star active' : 'far fa-star'}" data-rating="${star}"></i>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;

                // Wire up detail panel controls
                document.getElementById('detailRemoveStashBtn').onclick = () => {
                    StashService.removeFromStash(movieId);
                };

                document.getElementById('detailToggleWant').onclick = () => {
                    StashService.updateItem(movieId, { status: 'want_to_watch' });
                };

                document.getElementById('detailToggleWatched').onclick = () => {
                    StashService.updateItem(movieId, { status: 'watched' });
                };

                const recBtn = document.getElementById('detailStampRec');
                if (recBtn) {
                    recBtn.onclick = () => {
                        const nextStamp = stashedItem.stamp === 'RECOMMENDED' ? null : 'RECOMMENDED';
                        StashService.updateItem(movieId, { stamp: nextStamp });
                    };
                }

                const skipBtn = document.getElementById('detailStampSkip');
                if (skipBtn) {
                    skipBtn.onclick = () => {
                        const nextStamp = stashedItem.stamp === 'SKIP' ? null : 'SKIP';
                        StashService.updateItem(movieId, { stamp: nextStamp });
                    };
                }

                document.querySelectorAll('#detailStarRating i').forEach(star => {
                    star.onclick = () => {
                        const rating = parseInt(star.dataset.rating, 10);
                        const nextRating = stashedItem.userRating === rating ? null : rating;
                        StashService.updateItem(movieId, { userRating: nextRating });
                    };
                });
            }
        }
    }

    return {
        init,
        openStashModal,
        updateCardButtons,
        updateDetailButton
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', StashUI.init);
} else {
    StashUI.init();
}

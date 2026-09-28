/**
 * MovieQ - Watch Later Service (Watchlist & Personal History)
 * 100% Offline / LocalStorage - Zero Login Required
 */

const StashService = (function() {
    const STORAGE_KEY = 'movieq_watch_later';
    const LEGACY_STORAGE_KEY = 'movieq_pocket_stash';

    // Helper: read raw list map from localStorage with legacy migration
    function readStorage() {
        try {
            let data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                data = localStorage.getItem(LEGACY_STORAGE_KEY);
                if (data) {
                    localStorage.setItem(STORAGE_KEY, data);
                }
            }
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('[MovieQ WatchLater] Failed to read localStorage:', e);
            return {};
        }
    }

    // Helper: write raw list map to localStorage
    function writeStorage(stash) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stash));
            dispatchUpdateEvent();
            return true;
        } catch (e) {
            console.error('[MovieQ WatchLater] Failed to write localStorage:', e);
            return false;
        }
    }

    // Dispatch custom event for UI updates
    function dispatchUpdateEvent() {
        window.dispatchEvent(new CustomEvent('stashUpdated', {
            detail: { count: getCount() }
        }));
    }

    // Get all stashed items as an array sorted by savedAt desc
    function getAllItems() {
        const stash = readStorage();
        return Object.values(stash).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }

    // Get item by movieId
    function getItem(movieId) {
        if (!movieId) return null;
        const stash = readStorage();
        return stash[String(movieId)] || null;
    }

    // Check if a movie is stashed
    function isStashed(movieId) {
        if (!movieId) return false;
        const stash = readStorage();
        return !!stash[String(movieId)];
    }

    // Get total count of stashed items
    function getCount() {
        return Object.keys(readStorage()).length;
    }

    /**
     * Add movie to stash
     * @param {Object} movie - Movie data object
     * @param {string} status - 'want_to_watch' | 'watched'
     * @param {string|null} stamp - 'RECOMMENDED' | 'SKIP' | null
     * @param {number|null} userRating - 1 to 5 star rating
     */
    function addToStash(movie, status = 'want_to_watch', stamp = null, userRating = null) {
        if (!movie || !movie.id) return false;
        const stash = readStorage();
        const id = String(movie.id);

        const existing = stash[id] || {};
        stash[id] = {
            id: movie.id,
            title: movie.title || 'Untitled Movie',
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : (movie.year || 'N/A'),
            vote_average: typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(movie.vote_average || 0),
            poster_path: movie.poster_path || '',
            genres: Array.isArray(movie.genres) ? movie.genres : (typeof movie.genres === 'string' ? movie.genres.split(',') : []),
            status: status || existing.status || 'want_to_watch',
            stamp: stamp !== undefined ? stamp : (existing.stamp || null),
            userRating: userRating !== undefined ? userRating : (existing.userRating || null),
            savedAt: existing.savedAt || Date.now(),
            watchedAt: status === 'watched' ? (existing.watchedAt || Date.now()) : null
        };

        return writeStorage(stash);
    }

    /**
     * Update existing item properties
     */
    function updateItem(movieId, updates) {
        if (!movieId) return false;
        const stash = readStorage();
        const id = String(movieId);
        if (!stash[id]) return false;

        stash[id] = {
            ...stash[id],
            ...updates
        };

        if (updates.status === 'watched' && !stash[id].watchedAt) {
            stash[id].watchedAt = Date.now();
        }

        return writeStorage(stash);
    }

    /**
     * Remove item from stash
     */
    function removeFromStash(movieId) {
        if (!movieId) return false;
        const stash = readStorage();
        const id = String(movieId);
        if (!stash[id]) return false;

        delete stash[id];
        return writeStorage(stash);
    }

    /**
     * Toggle stash state (if not stashed -> add as want_to_watch, if stashed -> remove)
     */
    function toggleStash(movie) {
        if (!movie || !movie.id) return false;
        if (isStashed(movie.id)) {
            removeFromStash(movie.id);
            return false;
        } else {
            addToStash(movie, 'want_to_watch');
            return true;
        }
    }

    /**
     * Export watchlist as a formatted text ticket checklist
     */
    function exportChecklist() {
        const items = getAllItems();
        if (items.length === 0) {
            alert('Your Watch Later list is empty! Add some movies before exporting.');
            return;
        }

        const wantToWatch = items.filter(i => i.status === 'want_to_watch');
        const watched = items.filter(i => i.status === 'watched');

        let text = `==========================================================\n`;
        text += ` MOVIEQ // WATCH LATER LIST\n`;
        text += ` Exported: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
        text += ` Total Titles: ${items.length} (Want to Watch: ${wantToWatch.length} | Watched: ${watched.length})\n`;
        text += `==========================================================\n\n`;

        if (wantToWatch.length > 0) {
            text += `[ ] WANT TO WATCH (${wantToWatch.length} TITLES):\n`;
            text += `----------------------------------------------------------\n`;
            wantToWatch.forEach((m, idx) => {
                const genres = m.genres && m.genres.length ? ` | ${m.genres.slice(0, 2).join(', ')}` : '';
                text += `${(idx + 1).toString().padStart(2, '0')}. [ ] ${m.title} (${m.year}) - Rating: ★ ${m.vote_average.toFixed(1)}${genres}\n`;
            });
            text += `\n`;
        }

        if (watched.length > 0) {
            text += `[X] WATCHED & REVIEWED (${watched.length} TITLES):\n`;
            text += `----------------------------------------------------------\n`;
            watched.forEach((m, idx) => {
                const stamp = m.stamp ? ` [${m.stamp}]` : '';
                const stars = m.userRating ? ` [${'★'.repeat(m.userRating)}${'☆'.repeat(5 - m.userRating)}]` : '';
                text += `${(idx + 1).toString().padStart(2, '0')}. [X] ${m.title} (${m.year}) - Rating: ★ ${m.vote_average.toFixed(1)}${stamp}${stars}\n`;
            });
            text += `\n`;
        }

        text += `==========================================================\n`;
        text += ` Discover great movies & chill at MovieQ // Keep it cozy.\n`;
        text += `==========================================================\n`;

        // Download as text file
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `MOVIEQ_WATCH_LATER_${new Date().toISOString().slice(0, 10)}.txt`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    return {
        getAllItems,
        getItem,
        isStashed,
        getCount,
        addToStash,
        updateItem,
        removeFromStash,
        toggleStash,
        exportChecklist
    };
})();

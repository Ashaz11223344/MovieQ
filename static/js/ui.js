// UI Manager - Handles all UI updates and interactions

const UIManager = (function() {
    // DOM Elements & State
    let elements = {};
    let pendingMood = null;
    let appliedMood = null;

    // Initialize UI
    function initialize() {
        cacheDOM();
        setupEventListeners();
        initializeFilters();
        initAIAssistant();
        initDailyFeaturedPick();
    }

    // Cache DOM elements
    function cacheDOM() {
        elements = {
            // Navigation
            mobileMenuBtn: document.getElementById('mobileMenuBtn'),
            surpriseBtn: document.getElementById('surpriseBtn'),
            footerSurpriseBtn: document.getElementById('footerSurpriseBtn'),
            
            // Search
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            
            // Filters
            moodButtons: document.querySelectorAll('.mood-btn'),
            languageSelect: document.getElementById('languageSelect'),
            genreSelect: document.getElementById('genreSelect'),
            sortSelect: document.getElementById('sortSelect'),
            activeFilters: document.getElementById('activeFilters'),

            // Mood Confirmation Bar
            moodConfirmBar: document.getElementById('moodConfirmBar'),
            moodConfirmStatus: document.getElementById('moodConfirmStatus'),
            moodConfirmIcon: document.getElementById('moodConfirmIcon'),
            moodConfirmCode: document.getElementById('moodConfirmCode'),
            moodConfirmName: document.getElementById('moodConfirmName'),
            moodConfirmNote: document.getElementById('moodConfirmNote'),
            applyMoodBtn: document.getElementById('applyMoodBtn'),
            cancelMoodBtn: document.getElementById('cancelMoodBtn'),
            clearMoodBtn: document.getElementById('clearMoodBtn'),
            
            // Section Actions
            suggestNewBtn: document.getElementById('suggestNewBtn'),
            suggestionBadge: document.getElementById('suggestionBadge'),
            feedStatusTag: document.getElementById('feedStatusTag'),
            
            // Movies
            moviesGrid: document.getElementById('moviesGrid'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            
            // Pagination
            pagination: document.getElementById('pagination'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            pageNumbers: document.getElementById('pageNumbers')
        };
    }

    // Setup event listeners
    function setupEventListeners() {
        // Mobile menu
        if (elements.mobileMenuBtn) {
            elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }

        // Surprise buttons
        if (elements.surpriseBtn) {
            elements.surpriseBtn.addEventListener('click', handleSurpriseMe);
        }
        if (elements.footerSurpriseBtn) {
            elements.footerSurpriseBtn.addEventListener('click', handleSurpriseMe);
        }

        // Search
        if (elements.searchBtn) {
            elements.searchBtn.addEventListener('click', handleSearch);
        }
        if (elements.searchInput) {
            elements.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
        }

        // Mood buttons - stage selection on click (requires confirmation)
        elements.moodButtons.forEach(btn => {
            btn.addEventListener('click', () => handleMoodSelection(btn.dataset.mood));
        });

        // Mood Confirmation Bar Actions
        if (elements.applyMoodBtn) {
            elements.applyMoodBtn.addEventListener('click', confirmMoodFilter);
        }
        if (elements.cancelMoodBtn) {
            elements.cancelMoodBtn.addEventListener('click', cancelMoodSelection);
        }
        if (elements.clearMoodBtn) {
            elements.clearMoodBtn.addEventListener('click', clearMoodFilter);
        }

        // Dropdown filters
        if (elements.languageSelect) {
            elements.languageSelect.addEventListener('change', handleFilterChange);
        }
        if (elements.genreSelect) {
            elements.genreSelect.addEventListener('change', handleFilterChange);
        }
        if (elements.sortSelect) {
            elements.sortSelect.addEventListener('change', handleSortChange);
        }

        // Suggest New Movies
        if (elements.suggestNewBtn) {
            elements.suggestNewBtn.addEventListener('click', handleSuggestNewMovies);
        }

        // Pagination
        if (elements.prevBtn) {
            elements.prevBtn.addEventListener('click', goToPreviousPage);
        }
        if (elements.nextBtn) {
            elements.nextBtn.addEventListener('click', goToNextPage);
        }
    }

    // Initialize filters with dynamic options
// Initialize filters with dynamic options
function initializeFilters() {
    // Populate language filter with actual languages from movies
    setTimeout(() => {
        const languages = MovieLoader.getUniqueLanguages();
        const languageSelect = elements.languageSelect;
        
        if (languageSelect && languages.length > 0) {
            // Keep the "All Languages" option
            const allOption = languageSelect.options[0];
            languageSelect.innerHTML = '';
            languageSelect.appendChild(allOption);
            
            // Add actual languages with full names
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = MovieLoader.getLanguageName(lang);
                languageSelect.appendChild(option);
            });
        }
        
        // Populate genre filter
        const genres = MovieLoader.getUniqueGenres();
        const genreSelect = elements.genreSelect;
        
        if (genreSelect && genres.length > 0) {
            // Keep the "All Genres" option
            const allOption = genreSelect.options[0];
            genreSelect.innerHTML = '';
            genreSelect.appendChild(allOption);
            
            // Add actual genres
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreSelect.appendChild(option);
            });
        }
    }, 1000);
}

    // Toggle mobile menu
    function toggleMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    }

    // Handle search
    function handleSearch() {
        const searchText = elements.searchInput.value.trim();
        
        // Check if it's a "Vibe" search
        const interpreted = interpretVibe(searchText);
        
        if (interpreted.isVibe) {
            showAssistantMessage(interpreted.response);
            updateFilters(interpreted.filters);
        } else {
            updateFilters({ searchText });
        }
    }

    // AI Assistant: Typing Feed (LLM Style)
    let typingInterval;
    function initAIAssistant() {
        const placeholders = [
            'I want to watch a fast-paced movie...',
            'Can you suggest something horror and comedy?',
            'I am in the mood for a feel-good movie...',
            'I want something emotional but not too heavy...',
            'Show me some classic sci-fi masterpieces',
            'Looking for intense mystery thrillers...'
        ];
        
        let pIndex = 0;
        const input = elements.searchInput;
        if (!input) return;

        function typePlaceholder(text, i = 0) {
            if (document.activeElement === input) return;
            if (i <= text.length) {
                input.placeholder = text.substring(0, i);
                typingInterval = setTimeout(() => typePlaceholder(text, i + 1), 50);
            } else {
                setTimeout(cycle, 3000);
            }
        }

        function cycle() {
            if (document.activeElement === input) return;
            pIndex = (pIndex + 1) % placeholders.length;
            typePlaceholder(placeholders[pIndex]);
        }

        typePlaceholder(placeholders[0]);
    }

    function showAssistantMessage(msg) {
        const bubble = document.getElementById('aiResponseBubble');
        if (!bubble) return;
        
        bubble.textContent = msg;
        bubble.classList.add('active');
        
        setTimeout(() => {
            bubble.classList.remove('active');
        }, 5000);
    }

    // AI Assistant: Vibe Interpretation
    function interpretVibe(text) {
        if (!text || text.length < 3) return { isVibe: false };
        
        const lowerText = text.toLowerCase();
        const filters = { searchText: '', mood: null, genre: '', sortBy: 'recommended' };
        let isVibe = false;
        let response = "Resonating with your frequency... finding matches.";

        // Special: User asks for fresh suggestions or new movies
        if (lowerText.includes('new movie') || lowerText.includes('suggest') || lowerText.includes('fresh') || lowerText.includes('change movie') || lowerText.includes('different movie') || lowerText.includes('shuffle')) {
            handleSuggestNewMovies();
            return {
                isVibe: true,
                filters: { sortBy: 'recommended', mood: null, genre: '', language: '', searchText: '' },
                response: "Rolling the algorithm! Loaded 30 fresh recommendations across our 1.5M catalog."
            };
        }

        // Conversational "Training" Data (Expanded 16 Mood Mappings)
        const mappings = [
            { 
                keywords: ['emotional', 'sad', 'touching', 'cry', 'heartbreaking', 'tear', 'tender'], 
                mood: 'sad', genre: 'Drama', 
                responses: ["I feel you. Let's find some beautiful, touching stories.", "Ready for some emotional depth? Drama collection loading..."]
            },
            { 
                keywords: ['feel-good', 'happy', 'uplifting', 'smile', 'joy', 'fun', 'cheerful'], 
                mood: 'happy', genre: 'Comedy', 
                responses: ["Coming right up! Let's brighten your day with these.", "Happiness detected. Here are some feel-good gems!"]
            },
            { 
                keywords: ['fast-paced', 'action', 'adrenaline', 'explosive', 'martial arts', 'superhero'], 
                mood: 'excited', genre: 'Action', 
                responses: ["Hold on tight! These movies are a wild ride.", "Adrenaline rush incoming! Action collection ready."]
            },
            { 
                keywords: ['scary', 'spooky', 'horror', 'creepy', 'nightmare', 'terrifying', 'slasher'], 
                mood: 'scared', genre: 'Horror', 
                responses: ["Turn off the lights. Here are some spine-chilling picks.", "Brave choice! Nightmare fuel coming your way."]
            },
            { 
                keywords: ['relax', 'chill', 'calm', 'peaceful', 'soothing', 'cozy', 'comfort'], 
                mood: 'relaxed', genre: 'Family', 
                responses: ["Time to unwind. These movies have the perfect chill factor.", "Relaxation mode active. Enjoy these peaceful vibes."]
            },
            { 
                keywords: ['mind-bending', 'sci-fi', 'space', 'cyberpunk', 'time travel', 'alien', 'future', 'science fiction', 'matrix'], 
                mood: 'thoughtful', genre: 'Science Fiction', 
                responses: ["Prepare to have your mind blown.", "Exploring deep concepts and futuristic worlds..."]
            },
            { 
                keywords: ['romantic', 'love', 'date', 'passion', 'heart', 'rom-com'], 
                mood: 'romantic', genre: 'Romance', 
                responses: ["Love is in the air. Perfect for a cozy night.", "Found some romantic masterpieces for you!"]
            },
            { 
                keywords: ['detective', 'mystery', 'noir', 'crime', 'whodunit', 'investigation', 'sherlock', 'puzzle'], 
                mood: 'detective', genre: 'Mystery', 
                responses: ["Let's put your detective skills to the test.", "Mystery and intrigue await. Can you solve these?"]
            },
            { 
                keywords: ['epic', 'fantasy', 'magic', 'dragons', 'lord of the rings', 'myth', 'sword'], 
                mood: 'epic', genre: 'Fantasy', 
                responses: ["Journey into legendary realms and grand adventures.", "Epic fantasy worlds are unlocked!"]
            },
            { 
                keywords: ['documentary', 'true story', 'history', 'biography', 'real life', 'historical', 'curious'], 
                mood: 'curious', genre: 'Documentary', 
                responses: ["Fascinating real-world accounts and untold truths.", "Curiosity rewarded: discovering real stories."]
            },
            { 
                keywords: ['intense', 'suspense', 'edge of seat', 'dark thriller', 'late night', 'nail-biting'], 
                mood: 'intense', genre: 'Thriller', 
                responses: ["Late night thrills ready. Keep the door locked.", "High-voltage suspense coming up!"]
            },
            { 
                keywords: ['music', 'concert', 'musical', 'soundtrack', 'songs', 'band', 'rock'], 
                mood: 'musical', genre: 'Music', 
                responses: ["Crank up the volume! Iconic music reels loading...", "Rhythm and melody ready for your ears."]
            },
            { 
                keywords: ['war', 'military', 'soldier', 'battle', 'combat', 'gritty', 'army'], 
                mood: 'gritty', genre: 'War', 
                responses: ["Grit, honor, and harrowing battlefield sagas.", "Historical war chronicles ready."]
            },
            { 
                keywords: ['western', 'cowboy', 'outlaw', 'wild west', 'gunslinger', 'sheriff'], 
                mood: 'western', genre: 'Western', 
                responses: ["Dust off your boots. High noon in the wild west.", "Grit, showdowns, and desert winds."]
            },
            { 
                keywords: ['animated', 'animation', 'anime', 'cartoon', 'pixar', 'ghibli', 'disney'], 
                mood: 'animated', genre: 'Animation', 
                responses: ["Pure visual magic from masters of animation.", "Colorful, inventive worlds loading up!"]
            },
            { 
                keywords: ['bored', 'crazy', 'wild', 'random', 'fun', 'anything', 'surprise'], 
                mood: 'bored', genre: 'Comedy', 
                responses: ["Boredom cure activated! Here's something wild and unpredictable.", "Let's shake things up!"]
            }
        ];

        // Specific sorting/meta requests
        if (lowerText.includes('classic') || lowerText.includes('old') || lowerText.includes('masterpiece')) {
            filters.sortBy = 'date';
            response = "Looking back at the golden age of cinema...";
            isVibe = true;
        }

        if (lowerText.includes('best') || lowerText.includes('top rated') || lowerText.includes('highly')) {
            filters.sortBy = 'vote_average';
            response = "Only the crème de la crème for you.";
            isVibe = true;
        }

        // Search for mood in sentence
        for (const map of mappings) {
            if (map.keywords.some(kw => lowerText.includes(kw))) {
                filters.mood = map.mood;
                filters.genre = map.genre;
                response = map.responses[Math.floor(Math.random() * map.responses.length)];
                isVibe = true;
                break;
            }
        }

        // Friendly "Hello" detection
        if (lowerText.includes('hello') || lowerText.includes('hi ') || lowerText.includes('hey')) {
            response = "Hello! I'm your MovieQ AI. How can I help you find a movie today?";
            isVibe = true;
        }

        if (isVibe) {
            // Update UI to reflect detected mood
            if (filters.mood) {
                setAppliedMood(filters.mood);
            } else {
                clearMoodFilter();
            }
            if (elements.genreSelect) elements.genreSelect.value = filters.genre;
        }

        return { isVibe, filters, response };
    }

    // Select mood (stage for confirmation)
    function handleMoodSelection(mood) {
        // If clicking the currently pending mood, toggle off / cancel
        if (pendingMood === mood) {
            cancelMoodSelection();
            return;
        }

        // If clicking the already applied active mood without a pending change
        if (appliedMood === mood && !pendingMood) {
            showActiveMoodPanel(mood);
            return;
        }

        pendingMood = mood;

        // Visual update on buttons: mark selected (pending confirmation)
        elements.moodButtons.forEach(btn => {
            if (btn.dataset.mood === mood) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        // Update and show confirmation bar
        showMoodConfirmationBar(mood);
    }

    // Display confirmation bar in pending state
    function showMoodConfirmationBar(mood) {
        if (!elements.moodConfirmBar) return;

        const targetBtn = Array.from(elements.moodButtons).find(btn => btn.dataset.mood === mood);
        if (!targetBtn) return;

        const codeSpan = targetBtn.querySelector('.mood-code');
        const codeText = codeSpan ? codeSpan.textContent : '';
        const labelSpan = targetBtn.querySelector('span:last-of-type');
        const labelText = labelSpan ? labelSpan.textContent.trim() : mood;

        // Find icon (Lucide SVG or FontAwesome <i>)
        const btnSvg = targetBtn.querySelector('svg');
        const btnI = targetBtn.querySelector('i');

        if (elements.moodConfirmIcon) {
            if (btnSvg) {
                elements.moodConfirmIcon.innerHTML = btnSvg.outerHTML;
            } else if (btnI) {
                elements.moodConfirmIcon.innerHTML = btnI.outerHTML;
            }
        }

        if (elements.moodConfirmCode) elements.moodConfirmCode.textContent = codeText;
        if (elements.moodConfirmName) elements.moodConfirmName.textContent = labelText;

        if (elements.moodConfirmStatus) {
            elements.moodConfirmStatus.textContent = '[CONFIRMATION REQUIRED]';
            elements.moodConfirmStatus.classList.remove('applied');
        }

        if (elements.moodConfirmNote) {
            if (appliedMood && appliedMood !== mood) {
                const prevBtn = Array.from(elements.moodButtons).find(b => b.dataset.mood === appliedMood);
                const prevLabel = prevBtn ? prevBtn.querySelector('span:last-of-type')?.textContent.trim() : appliedMood;
                elements.moodConfirmNote.textContent = `Ready to switch vibe from "${prevLabel}" to "${labelText}". Click "Apply Mood Filter" to confirm.`;
            } else {
                elements.moodConfirmNote.textContent = `Click "Apply Mood Filter" to load movies matching your "${labelText}" vibe.`;
            }
        }

        if (elements.applyMoodBtn) {
            elements.applyMoodBtn.style.display = 'inline-flex';
            elements.applyMoodBtn.innerHTML = `<i class="fas fa-check"></i> <span>Apply Mood Filter</span>`;
        }

        if (elements.cancelMoodBtn) {
            elements.cancelMoodBtn.style.display = 'inline-flex';
        }

        if (elements.clearMoodBtn) {
            elements.clearMoodBtn.style.display = appliedMood ? 'inline-flex' : 'none';
            elements.clearMoodBtn.innerHTML = `<i class="fas fa-trash-alt"></i> <span>Clear Active Mood</span>`;
        }

        elements.moodConfirmBar.style.display = 'flex';
        elements.moodConfirmBar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Display confirmation bar in active/applied state
    function showActiveMoodPanel(mood) {
        if (!elements.moodConfirmBar) return;

        const targetBtn = Array.from(elements.moodButtons).find(btn => btn.dataset.mood === mood);
        if (!targetBtn) return;

        const codeSpan = targetBtn.querySelector('.mood-code');
        const codeText = codeSpan ? codeSpan.textContent : '';
        const labelSpan = targetBtn.querySelector('span:last-of-type');
        const labelText = labelSpan ? labelSpan.textContent.trim() : mood;

        const btnSvg = targetBtn.querySelector('svg');
        const btnI = targetBtn.querySelector('i');

        if (elements.moodConfirmIcon) {
            if (btnSvg) {
                elements.moodConfirmIcon.innerHTML = btnSvg.outerHTML;
            } else if (btnI) {
                elements.moodConfirmIcon.innerHTML = btnI.outerHTML;
            }
        }

        if (elements.moodConfirmCode) elements.moodConfirmCode.textContent = codeText;
        if (elements.moodConfirmName) elements.moodConfirmName.textContent = labelText;

        if (elements.moodConfirmStatus) {
            elements.moodConfirmStatus.textContent = '[CURRENTLY ACTIVE]';
            elements.moodConfirmStatus.classList.add('applied');
        }

        if (elements.moodConfirmNote) {
            elements.moodConfirmNote.textContent = `Active vibe: "${labelText}". Click "Clear Mood" to remove or pick another vibe above.`;
        }

        if (elements.applyMoodBtn) elements.applyMoodBtn.style.display = 'none';
        if (elements.cancelMoodBtn) elements.cancelMoodBtn.style.display = 'none';
        if (elements.clearMoodBtn) {
            elements.clearMoodBtn.style.display = 'inline-flex';
            elements.clearMoodBtn.innerHTML = `<i class="fas fa-trash-alt"></i> <span>Clear Mood Filter</span>`;
        }

        elements.moodConfirmBar.style.display = 'flex';
    }

    // Confirm and apply the selected pending mood filter
    function confirmMoodFilter() {
        if (!pendingMood) return;

        appliedMood = pendingMood;
        const confirmedMood = pendingMood;
        pendingMood = null;

        // Update button states
        elements.moodButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === confirmedMood) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Apply to filters
        updateFilters({ mood: confirmedMood });

        // Update confirmation bar to active/applied state
        showActiveMoodPanel(confirmedMood);

        const targetBtn = Array.from(elements.moodButtons).find(btn => btn.dataset.mood === confirmedMood);
        const labelSpan = targetBtn ? targetBtn.querySelector('span:last-of-type') : null;
        const labelText = labelSpan ? labelSpan.textContent.trim() : confirmedMood;

        showToast(`Mood confirmed: Applied "${labelText}"!`);

        // Smooth scroll towards movie results
        const moviesSection = document.getElementById('all-movies') || elements.moviesGrid;
        if (moviesSection) {
            moviesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Cancel pending mood selection
    function cancelMoodSelection() {
        pendingMood = null;

        elements.moodButtons.forEach(btn => {
            btn.classList.remove('selected');
        });

        if (appliedMood) {
            showActiveMoodPanel(appliedMood);
        } else {
            if (elements.moodConfirmBar) {
                elements.moodConfirmBar.style.display = 'none';
            }
        }
    }

    // Clear active and pending mood filter
    function clearMoodFilter() {
        pendingMood = null;
        appliedMood = null;

        elements.moodButtons.forEach(btn => {
            btn.classList.remove('selected');
            btn.classList.remove('active');
        });

        if (elements.moodConfirmBar) {
            elements.moodConfirmBar.style.display = 'none';
        }

        updateFilters({ mood: null });
        showToast('Mood filter cleared');
    }

    // Programmatically set applied mood (for URL params, AI assistant, etc.)
    function setAppliedMood(mood) {
        appliedMood = mood;
        pendingMood = null;

        elements.moodButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === mood) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (mood) {
            showActiveMoodPanel(mood);
        } else if (elements.moodConfirmBar) {
            elements.moodConfirmBar.style.display = 'none';
        }
    }

    // Handle filter change
    function handleFilterChange() {
        const language = elements.languageSelect.value;
        const genre = elements.genreSelect.value;
        
        updateFilters({ language, genre });
    }

    // Handle sort change
    function handleSortChange() {
        const sortBy = elements.sortSelect.value;
        updateFilters({ sortBy });
    }

    // Update filters and refresh movies
    function updateFilters(newFilters) {
        // Store current filters
        const currentFilters = getCurrentFilters();
        const filters = { ...currentFilters, ...newFilters };
        if (newFilters.mood !== undefined) {
            appliedMood = newFilters.mood;
        }
        
        // Update active filters display
        updateActiveFilters(filters);
        
        // Apply filters and update UI
        const totalPages = MovieLoader.filterMovies(filters);
        updateMoviesDisplay();
        updatePagination(totalPages);
    }

    // Get current filters from UI
    function getCurrentFilters() {
        const activeMoodBtn = document.querySelector('.mood-btn.active');
        const mood = activeMoodBtn ? activeMoodBtn.dataset.mood : null;
        
        return {
            searchText: elements.searchInput.value.trim(),
            mood: mood,
            language: elements.languageSelect.value,
            genre: elements.genreSelect.value,
            sortBy: elements.sortSelect.value
        };
    }

    // Update active filters display
    function updateActiveFilters(filters) {
        const activeFilters = elements.activeFilters;
        if (!activeFilters) return;
        
        activeFilters.innerHTML = '';
        
        // Add mood filter
        if (filters.mood) {
            const moodTag = createFilterTag(filters.mood, 'mood');
            activeFilters.appendChild(moodTag);
        }
        
        // Add language filter
        if (filters.language) {
            const langTag = createFilterTag(filters.language.toUpperCase(), 'language');
            activeFilters.appendChild(langTag);
        }
        
        // Add genre filter
        if (filters.genre) {
            const genreTag = createFilterTag(filters.genre, 'genre');
            activeFilters.appendChild(genreTag);
        }
        
        // Add search filter
        if (filters.searchText) {
            const searchTag = createFilterTag(`"${filters.searchText}"`, 'search');
            activeFilters.appendChild(searchTag);
        }
        
        // Show/hide active filters container
        if (activeFilters.children.length === 0) {
            activeFilters.style.display = 'none';
        } else {
            activeFilters.style.display = 'flex';
        }
    }

    // Create filter tag element
    function createFilterTag(text, type) {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.dataset.type = type;
        
        const iconMap = {
            mood: 'fas fa-smile',
            language: 'fas fa-globe',
            genre: 'fas fa-tags',
            search: 'fas fa-search'
        };
        
        tag.innerHTML = `
            <i class="${iconMap[type] || 'fas fa-filter'}"></i>
            ${text}
            <button class="remove-filter" onclick="UIManager.removeFilter('${type}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return tag;
    }

    // Remove filter
    function removeFilter(type) {
        switch(type) {
            case 'mood':
                clearMoodFilter();
                return;
            case 'language':
                elements.languageSelect.value = '';
                break;
            case 'genre':
                elements.genreSelect.value = '';
                break;
            case 'search':
                elements.searchInput.value = '';
                break;
        }
        
        handleFilterChange();
    }

    // Update movies display
    function updateMoviesDisplay() {
        const movies = MovieLoader.getMoviesForCurrentPage();
        const moviesGrid = elements.moviesGrid;
        
        if (!moviesGrid) return;
        
        if (movies.length === 0) {
            moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-film fa-3x"></i>
                    <h3>No movies found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }
        
        moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
        
        // Add click handlers to movie cards
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const movieId = card.dataset.movieId;
                viewMovieDetails(movieId);
            });
        });
    }

    // Create movie card HTML with Grunge Collage photocopied aesthetic
    function createMovieCard(movie) {
        const posterUrl = MovieLoader.getPosterUrl(movie);
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : parseFloat(movie.vote_average || 0).toFixed(1);
        const catalogNum = String(movie.id).replace(/\D/g, '').slice(0, 4) || '8012';
        
        return `
            <div class="movie-card" data-movie-id="${movie.id}">
                <div class="movie-poster-wrap">
                    <span class="movie-catalog-num">★ MOVIE</span>
                    <span class="movie-rating-badge">★ ${rating}</span>
                    <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80'">
                </div>
                <div class="movie-info">
                    <div class="movie-meta">
                        <span class="movie-year">${releaseYear}</span>
                        <span class="movie-lang tech-coord">${(movie.original_language || 'EN').toUpperCase()}</span>
                    </div>
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-genres">
                        ${(Array.isArray(movie.genres) ? movie.genres : []).slice(0, 2).map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Update pagination
    function updatePagination(totalPages) {
        const currentPage = MovieLoader.getCurrentPage();
        
        // Update button states
        elements.prevBtn.disabled = currentPage === 1;
        elements.nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        
        // Update page numbers
        elements.pageNumbers.innerHTML = '';
        
        if (totalPages === 0) {
            elements.pagination.style.display = 'none';
            return;
        }
        
        elements.pagination.style.display = 'flex';
        
        // Show up to 5 page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        if (endPage - startPage < 4) {
            if (currentPage < 3) {
                endPage = Math.min(5, totalPages);
            } else {
                startPage = Math.max(1, totalPages - 4);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => goToPage(i));
            elements.pageNumbers.appendChild(pageBtn);
        }
    }

    // Go to specific page
    function goToPage(page) {
        MovieLoader.setPage(page);
        updateMoviesDisplay();
        updatePagination(MovieLoader.getTotalPages());
        window.scrollTo({ top: elements.moviesGrid.offsetTop - 100, behavior: 'smooth' });
    }

    // Go to previous page
    function goToPreviousPage() {
        const currentPage = MovieLoader.getCurrentPage();
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }

    // Go to next page
    function goToNextPage() {
        const currentPage = MovieLoader.getCurrentPage();
        const totalPages = MovieLoader.getTotalPages();
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    }

    // Handle surprise me
    function handleSurpriseMe() {
        const randomMovie = MovieLoader.getRandomMovie();
        if (randomMovie) {
            viewMovieDetails(randomMovie.id);
        }
    }

    // View movie details
    function viewMovieDetails(movieId) {
        // Store current page state in session storage
        const currentFilters = getCurrentFilters();
        const currentPage = MovieLoader.getCurrentPage();
        
        sessionStorage.setItem('movieFilters', JSON.stringify(currentFilters));
        sessionStorage.setItem('currentPage', currentPage);
        
        // Redirect to movie detail page
        window.location.href = `movie_detail.html?id=${movieId}`;
    }

    // Show loading indicator
    function showLoading() {
        if (elements.loadingIndicator) {
            elements.loadingIndicator.style.display = 'flex';
            elements.moviesGrid.style.display = 'none';
            elements.pagination.style.display = 'none';
        }
    }

    // Hide loading indicator
    function hideLoading() {
        if (elements.loadingIndicator) {
            elements.loadingIndicator.style.display = 'none';
            elements.moviesGrid.style.display = 'grid';
            elements.pagination.style.display = 'flex';
        }
    }

    // Initialize Tonight's Pick hero collage with a movie that updates daily based on the calendar date
    function initDailyFeaturedPick() {
        const collageGraphic = document.querySelector('.hero-collage-graphic');
        if (!collageGraphic) return;

        if (typeof MovieLoader === 'undefined' || !MovieLoader.getDailyFeaturedMovie) return;

        const movie = MovieLoader.getDailyFeaturedMovie();
        if (!movie) return;

        const posterUrl = MovieLoader.getPosterUrl(movie.poster_path);
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : (movie.year || 'CLASSIC');
        const rating = (typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(movie.vote_average) || 8.0).toFixed(1);
        const imdb = (typeof movie.imdb_rating === 'number' && movie.imdb_rating > 0 ? movie.imdb_rating : parseFloat(movie.imdb_rating) || rating).toFixed(1);
        
        // Format today's date (e.g. "SEP 25")
        const now = new Date();
        const dateOptions = { month: 'short', day: 'numeric' };
        const dateStr = now.toLocaleDateString('en-US', dateOptions).toUpperCase();

        // 1. Poster background
        const innerImg = collageGraphic.querySelector('.collage-inner-img');
        if (innerImg) {
            innerImg.style.backgroundImage = `url('${posterUrl}')`;
        }

        // 2. Fragment card
        const fragmentCard = collageGraphic.querySelector('.collage-fragment-card');
        if (fragmentCard) {
            fragmentCard.innerHTML = `
                <div class="tape-strip tape-red" style="top:-10px; right:-15px;">TODAY: ${dateStr}</div>
                <h4>TONIGHT'S PICK</h4>
                <p style="font-weight: 700; margin-top: 4px; color: var(--charcoal);">${movie.title} (${releaseYear})</p>
                <p style="font-size: 0.68rem; opacity: 0.95; margin-top: 2px; font-weight: 700; color: var(--crimson);">★ TMDB ${rating} • IMDb ${imdb}</p>
            `;
            fragmentCard.style.cursor = 'pointer';
            fragmentCard.title = `Tonight's Pick: ${movie.title} (${releaseYear}) - TMDB: ${rating}/10, IMDb: ${imdb}/10 - Click for details`;
            fragmentCard.onclick = () => {
                window.location.href = `movie_detail.html?id=${movie.id}`;
            };
        }

        // 3. Frame meta bottom bar
        const frameMeta = collageGraphic.querySelector('.collage-frame-meta');
        if (frameMeta) {
            let firstGenre = 'FEATURED';
            if (Array.isArray(movie.genres) && movie.genres.length > 0) {
                firstGenre = typeof movie.genres[0] === 'string' ? movie.genres[0] : (movie.genres[0].name || 'CINEMA');
            } else if (movie.genre_names) {
                firstGenre = movie.genre_names.split(',')[0].trim();
            }
            frameMeta.innerHTML = `
                <span>★ ${rating} (IMDb ${imdb})</span>
                <span class="tech-cross"></span>
                <span>${firstGenre.toUpperCase()}</span>
                <span class="tech-cross"></span>
                <span>${releaseYear}</span>
            `;
        }

        // 4. Gold circular badge
        const badgeGold = collageGraphic.querySelector('.collage-badge-gold');
        if (badgeGold) {
            badgeGold.innerHTML = `
                <span class="badge-text-top">8+ MASTERPIECE</span>
                <span class="badge-text-main">${rating}</span>
                <span class="badge-text-top">IMDb ${imdb}</span>
            `;
            badgeGold.style.cursor = 'pointer';
            badgeGold.title = `Tonight's Pick: ${movie.title} - TMDB: ${rating}/10, IMDb: ${imdb}/10 - Click to watch/read`;
            badgeGold.onclick = (e) => {
                e.stopPropagation();
                window.location.href = `movie_detail.html?id=${movie.id}`;
            };
        }

        // 5. Main frame click
        const mainFrame = collageGraphic.querySelector('.collage-frame-main');
        if (mainFrame) {
            mainFrame.style.cursor = 'pointer';
            mainFrame.title = `Tonight's Pick: ${movie.title} (${releaseYear}) - Click for details`;
            mainFrame.onclick = () => {
                window.location.href = `movie_detail.html?id=${movie.id}`;
            };
        }

        // 6. Barcode Stamp
        const barcodeStamp = collageGraphic.querySelector('.collage-barcode-stamp');
        if (barcodeStamp) {
            barcodeStamp.innerHTML = `|||||||||||||||||||| DAY #${now.getDate()}`;
        }
    }

    // Toast Notification (Floating Zine Stamp)
    function showToast(message) {
        let toast = document.getElementById('suggestionToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'suggestionToast';
            toast.className = 'suggestion-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fas fa-dice"></i> <span>${message}</span>`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3800);
    }

    // Dynamic Movie Suggestion Handler
    async function handleSuggestNewMovies() {
        if (elements.suggestNewBtn) {
            elements.suggestNewBtn.classList.add('rolling');
        }
        showLoading();

        try {
            const result = await MovieLoader.suggestNewMovies();

            if (elements.sortSelect) {
                elements.sortSelect.value = 'recommended';
            }

            // Clear any active mood button and confirmation bar so the user sees the global fresh suggestions
            pendingMood = null;
            appliedMood = null;
            elements.moodButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('selected');
            });
            if (elements.moodConfirmBar) {
                elements.moodConfirmBar.style.display = 'none';
            }
            if (elements.genreSelect) elements.genreSelect.value = '';
            if (elements.languageSelect) elements.languageSelect.value = '';
            if (elements.searchInput) elements.searchInput.value = '';

            // Update UI with fresh recommendations
            updateFilters({ sortBy: 'recommended', mood: null, genre: '', language: '', searchText: '' });

            if (elements.suggestionBadge) {
                elements.suggestionBadge.textContent = `// SEED #${result.seed.toString().slice(-4)}`;
            }

            if (elements.feedStatusTag) {
                const chunkInfo = result.newlyLoadedChunk ? ` [CHUNK #${result.newlyLoadedChunk} MERGED]` : '';
                elements.feedStatusTag.innerHTML = `<i class="fas fa-satellite-dish"></i> FRESH BATCH ACTIVE (${result.totalMovies.toLocaleString()} TITLES IN POOL)${chunkInfo}`;
            }

            showToast(`Rolled fresh recommendations from 1.5M movie catalog!`);

            const container = document.getElementById('movies-container');
            if (container && window.scrollY > container.offsetTop + 150) {
                container.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Error rolling new suggestions:', err);
        } finally {
            hideLoading();
            setTimeout(() => {
                if (elements.suggestNewBtn) {
                    elements.suggestNewBtn.classList.remove('rolling');
                }
            }, 450);
        }
    }

    // Public API
    return {
        initialize,
        removeFilter,
        showLoading,
        hideLoading,
        updateMoviesDisplay,
        updatePagination,
        initDailyFeaturedPick,
        handleSuggestNewMovies,
        showToast,
        setAppliedMood,
        handleMoodSelection,
        confirmMoodFilter,
        cancelMoodSelection,
        clearMoodFilter
    };
})();
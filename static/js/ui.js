// UI Manager - Handles all UI updates and interactions

const UIManager = (function() {
    // DOM Elements
    let elements = {};

    // Initialize UI
    function initialize() {
        cacheDOM();
        setupEventListeners();
        initializeFilters();
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

        // Mood buttons
        elements.moodButtons.forEach(btn => {
            btn.addEventListener('click', () => handleMoodFilter(btn.dataset.mood));
        });

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
        updateFilters({ searchText });
    }

    // Handle mood filter
    function handleMoodFilter(mood) {
        // Update active state on buttons
        elements.moodButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mood === mood) {
                btn.classList.add('active');
            }
        });
        
        updateFilters({ mood });
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
                elements.moodButtons.forEach(btn => btn.classList.remove('active'));
                break;
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

    // Create movie card HTML
    function createMovieCard(movie) {
        const posterUrl = MovieLoader.getPosterUrl(movie);
        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
        
        return `
            <div class="movie-card" data-movie-id="${movie.id}">
                <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
                <div class="movie-info">
                    <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${releaseYear}</span>
                        <span class="movie-rating">
                            <i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}
                        </span>
                    </div>
                    <div class="movie-genres">
                        ${movie.genres.slice(0, 2).map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('')}
                    </div>
                    <p class="movie-overview" title="${movie.overview}">
                        ${movie.overview.substring(0, 100)}${movie.overview.length > 100 ? '...' : ''}
                    </p>
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

    // Public API
    return {
        initialize,
        removeFilter,
        showLoading,
        hideLoading,
        updateMoviesDisplay,
        updatePagination
    };
})();
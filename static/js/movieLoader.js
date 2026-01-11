// Movie Loader - Handles loading and processing movie data from JSON files

const MovieLoader = (function() {
    // Configuration
    const CONFIG = {
        jsonFilesCount: 222, // Total number of JSON files (movies_1.json to movies_222.json)
        moviesPerPage: 30,
        posterBaseUrl: 'https://image.tmdb.org/t/p/w780',
        defaultPoster: 'https://via.placeholder.com/300x450?text=No+Image'
    };

    // State
    let allMovies = [];
    let filteredMovies = [];
    let currentPage = 1;
    let isLoading = false;
    let moodMapping = {
        'romantic': ['Romance', 'Drama'],
        'happy': ['Comedy', 'Animation', 'Family', 'Music'],
        'sad': ['Drama', 'Romance'],
        'adventure': ['Adventure', 'Action', 'Fantasy'],
        'thriller': ['Thriller', 'Mystery', 'Horror'],
        'comedy': ['Comedy', 'Romance']
    };

    // Genre mapping for your format
    const genreMapping = {
        'Music': 'Music',
        'Drama': 'Drama',
        'Comedy': 'Comedy',
        'Action': 'Action',
        'Adventure': 'Adventure',
        'Animation': 'Animation',
        'Crime': 'Crime',
        'Documentary': 'Documentary',
        'Family': 'Family',
        'Fantasy': 'Fantasy',
        'History': 'History',
        'Horror': 'Horror',
        'Mystery': 'Mystery',
        'Romance': 'Romance',
        'Science Fiction': 'Science Fiction',
        'Thriller': 'Thriller',
        'War': 'War',
        'Western': 'Western'
    };

    // Load movies from JSON files
    async function loadMovies() {
        if (allMovies.length > 0) return allMovies;

        isLoading = true;
        allMovies = [];

        try {
            // Load first 10 files for initial display (for performance)
            const filesToLoad = Array.from({length: Math.min(10, CONFIG.jsonFilesCount)}, (_, i) => i + 1);
            
            const promises = filesToLoad.map(async (fileNum) => {
                try {
                    const response = await fetch(`data/movies_${fileNum}.json`);
                    if (!response.ok) throw new Error(`Failed to load movies_${fileNum}.json`);
                    
                    const movies = await response.json();
                    return Array.isArray(movies) ? movies : [];
                } catch (error) {
                    console.warn(`Error loading movies_${fileNum}.json:`, error);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            allMovies = results.flat();
            
            // Process movies according to your JSON format
            allMovies = allMovies.map(movie => ({
                id: movie.id || Math.random().toString(36).substr(2, 9),
                title: movie.title || 'Unknown Title',
                original_title: movie.original_title || movie.title || '',
                overview: movie.overview || 'No description available.',
                popularity: movie.popularity || 0,
                vote_average: movie.vote_average || 0,
                vote_count: movie.vote_count || 0,
                release_date: movie.release_date || '',
                poster_path: movie.poster_path || '',
                original_language: movie.original_language || 'en',
                // Parse genres from string format
                genres: parseGenres(movie.genres || ''),
                genre_names: movie.genres || '',
                backdrop_path: movie.poster_path || '', // Using poster as backdrop if available
                runtime: movie.runtime || 0,
                tagline: movie.tagline || '',
                imdb_rating: movie.imdb_rating || 0,
                status: movie.status || 'Unknown',
                cast: movie.cast || '',
                director: movie.director || '',
                production_companies: movie.production_companies || ''
            }));

            filteredMovies = [...allMovies];
            return allMovies;

        } catch (error) {
            console.error('Error loading movies:', error);
            // Fallback to sample data if JSON files aren't available
            return generateSampleMovies();
        } finally {
            isLoading = false;
        }
    }

    // Parse genres from your string format
    function parseGenres(genresString) {
        if (!genresString) return [];
        
        // Split by comma and trim
        return genresString.split(',').map(genre => genre.trim()).filter(genre => genre !== '');
    }

    // Generate sample movies for testing
    function generateSampleMovies() {
        const sampleMovies = [];
        const genres = ['Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi', 'Adventure'];
        
        for (let i = 1; i <= 100; i++) {
            const randomGenres = [...new Set([
                genres[Math.floor(Math.random() * genres.length)],
                genres[Math.floor(Math.random() * genres.length)]
            ])];
            
            sampleMovies.push({
                id: i,
                title: `Sample Movie ${i}`,
                original_title: `Sample Movie ${i}`,
                overview: `This is a sample movie description for Movie ${i}. This would normally contain a brief synopsis of the film's plot.`,
                popularity: Math.random() * 100,
                vote_average: (Math.random() * 5 + 5).toFixed(1),
                vote_count: Math.floor(Math.random() * 10000),
                release_date: `${2020 + Math.floor(Math.random() * 3)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                poster_path: '',
                original_language: ['en', 'hi', 'es', 'fr', 'de', 'ja'][Math.floor(Math.random() * 6)],
                genres: randomGenres,
                genre_names: randomGenres.join(', '),
                runtime: Math.floor(Math.random() * 60) + 90,
                tagline: `Tagline for Sample Movie ${i}`,
                imdb_rating: (Math.random() * 3 + 7).toFixed(1),
                status: 'Released',
                cast: 'Sample Actor 1, Sample Actor 2',
                director: 'Sample Director',
                production_companies: 'Sample Studio'
            });
        }
        
        allMovies = sampleMovies;
        filteredMovies = [...sampleMovies];
        return sampleMovies;
    }

    // Get movies for current page
    function getMoviesForCurrentPage() {
        const startIdx = (currentPage - 1) * CONFIG.moviesPerPage;
        const endIdx = startIdx + CONFIG.moviesPerPage;
        return filteredMovies.slice(startIdx, endIdx);
    }

    // Filter movies based on criteria
    function filterMovies(filters = {}) {
        filteredMovies = allMovies.filter(movie => {
            // Text search
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();
                const matches = movie.title.toLowerCase().includes(searchLower) ||
                              movie.overview.toLowerCase().includes(searchLower) ||
                              movie.original_title.toLowerCase().includes(searchLower) ||
                              (movie.cast && movie.cast.toLowerCase().includes(searchLower)) ||
                              (movie.director && movie.director.toLowerCase().includes(searchLower));
                if (!matches) return false;
            }

            // Mood filter
            if (filters.mood && moodMapping[filters.mood]) {
                const moodGenres = moodMapping[filters.mood];
                const hasMoodGenre = moodGenres.some(genre => 
                    movie.genres.some(movieGenre => 
                        movieGenre.toLowerCase().includes(genre.toLowerCase())
                    ) || 
                    movie.genre_names.toLowerCase().includes(genre.toLowerCase())
                );
                if (!hasMoodGenre) return false;
            }

            // Language filter
            if (filters.language && filters.language !== '') {
                if (movie.original_language.toLowerCase() !== filters.language.toLowerCase()) return false;
            }

            // Genre filter
            if (filters.genre && filters.genre !== '') {
                const hasGenre = movie.genres.some(movieGenre => 
                    movieGenre.toLowerCase().includes(filters.genre.toLowerCase())
                ) || movie.genre_names.toLowerCase().includes(filters.genre.toLowerCase());
                
                if (!hasGenre) return false;
            }

            return true;
        });

        // Sort movies
        sortMovies(filters.sortBy || 'popularity');
        
        currentPage = 1; // Reset to first page after filtering
        return getTotalPages();
    }

    // Sort movies
    function sortMovies(sortBy) {
        switch(sortBy) {
            case 'rating':
                filteredMovies.sort((a, b) => b.vote_average - a.vote_average);
                break;
            case 'date':
                filteredMovies.sort((a, b) => {
                    const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
                    const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
                    return dateB - dateA;
                });
                break;
            case 'title':
                filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default: // popularity
                filteredMovies.sort((a, b) => b.popularity - a.popularity);
        }
    }

    // Get total pages
    function getTotalPages() {
        return Math.ceil(filteredMovies.length / CONFIG.moviesPerPage);
    }

    // Get current page
    function getCurrentPage() {
        return currentPage;
    }

    // Set current page
    function setPage(page) {
        const totalPages = getTotalPages();
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
        }
        return currentPage;
    }

    // Get random movie
    function getRandomMovie() {
        if (filteredMovies.length === 0 && allMovies.length > 0) {
            return allMovies[Math.floor(Math.random() * allMovies.length)];
        }
        return filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    }

    // Get movie by ID
    function getMovieById(id) {
        return allMovies.find(movie => movie.id == id); // Use == for string/number comparison
    }

    // Get poster URL
    function getPosterUrl(movie) {
        if (movie.poster_path && movie.poster_path.startsWith('/')) {
            return CONFIG.posterBaseUrl + movie.poster_path;
        } else if (movie.poster_path) {
            return movie.poster_path;
        }
        return CONFIG.defaultPoster;
    }

    // Get backdrop URL
    function getBackdropUrl(movie) {
        if (movie.poster_path && movie.poster_path.startsWith('/')) {
            return CONFIG.posterBaseUrl.replace('w780', 'w1280') + movie.poster_path;
        }
        return '';
    }

    // Get all unique languages from movies
    function getUniqueLanguages() {
        const languages = new Set();
        allMovies.forEach(movie => {
            if (movie.original_language) {
                languages.add(movie.original_language);
            }
        });
        return Array.from(languages).sort();
    }

    // Get all unique genres from movies
    function getUniqueGenres() {
        const genres = new Set();
        allMovies.forEach(movie => {
            if (movie.genres && Array.isArray(movie.genres)) {
                movie.genres.forEach(genre => {
                    if (genre && genre.trim() !== '') {
                        genres.add(genre.trim());
                    }
                });
            }
        });
        return Array.from(genres).sort();
    }

    // Check if movies are loaded
    function isLoaded() {
        return allMovies.length > 0;
    }

    // Parse language code to full name
    function getLanguageName(code) {
        const languageMap = {
            'en': 'English',
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ar': 'Arabic'
        };
        return languageMap[code] || code.toUpperCase();
    }

    // Public API
    return {
        loadMovies,
        getMoviesForCurrentPage,
        filterMovies,
        sortMovies,
        getTotalPages,
        getCurrentPage,
        setPage,
        getRandomMovie,
        getMovieById,
        getPosterUrl,
        getBackdropUrl,
        getUniqueLanguages,
        getUniqueGenres,
        getLanguageName,
        isLoaded,
        CONFIG
    };
})();
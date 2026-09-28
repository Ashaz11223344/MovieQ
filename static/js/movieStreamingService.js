// movieStreamingService.js
// Service for fetching accurate streaming availability data from TMDB (powered by JustWatch)

const MovieStreamingService = (function() {
    let TMDB_API_KEY = null;
    let TMDB_READ_ACCESS_TOKEN = null;
    let isEnvLoaded = false;
    
    const API_BASE_URL = 'https://api.themoviedb.org/3';
    
    // LocalStorage caching helpers (1 day expiry)
    const CACHE_PREFIX = 'movieq_cache_';
    const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day

    function getCachedData(key) {
        try {
            const cached = localStorage.getItem(CACHE_PREFIX + key);
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp > CACHE_EXPIRY_MS) {
                localStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }
            return parsed.data;
        } catch (e) {
            return null;
        }
    }

    function setCachedData(key, data) {
        try {
            const cacheItem = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
        } catch (e) {
            console.warn('LocalStorage is full or unavailable');
        }
    }
    // Standard provider formatting matching our beautiful brutalist UI
    // IDs correspond to TMDB/JustWatch provider IDs
    const PROVIDER_CONFIG = {
        8: { id: 'netflix', name: 'Netflix', badgeText: 'NETFLIX', badgeClass: 'provider-netflix', pillClass: 'pill-netflix', color: '#E50914', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#E50914" aria-hidden="true"><path d="M4 0h4.8l6.4 16.2V0H20v24h-4.8L8.8 7.8V24H4V0z"/></svg>` },
        9: { id: 'prime', name: 'Prime Video', badgeText: 'PRIME', badgeClass: 'provider-prime', pillClass: 'pill-prime', color: '#00A8E1', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#00A8E1" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>` },
        119: { id: 'prime', name: 'Prime Video', badgeText: 'PRIME', badgeClass: 'provider-prime', pillClass: 'pill-prime', color: '#00A8E1', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#00A8E1" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>` }, // Amazon Prime Video
        337: { id: 'disney', name: 'Disney+', badgeText: 'DISNEY+', badgeClass: 'provider-disney', pillClass: 'pill-disney', color: '#113CCF', iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#0063E5" aria-hidden="true"><path d="M12.5 3C7.2 3 3.5 6.5 3.5 11c0 3.2 2 5.5 4.8 6.5l-1.8 3.5h2.5l1.5-3c.5.1 1.1.1 1.6.1 5.5 0 9.4-3.8 9.4-8.6S17.8 3 12.5 3zm.3 12.3c-3.8 0-6.5-2.7-6.5-6.1 0-3.3 2.6-5.9 6.2-5.9 3.5 0 6.2 2.6 6.2 6s-2.6 6-5.9 6z"/><path d="M18.8 6.2l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="#0063E5"/></svg>` },
        2: { id: 'apple', name: 'Apple TV', badgeText: 'APPLE TV', badgeClass: 'provider-apple', pillClass: 'pill-apple', color: '#1A1A1A', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1A1A1A" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.63-.77 1.05-1.83.93-2.84-.91.04-2.02.61-2.67 1.37-.58.67-1.08 1.76-.94 2.8 1.02.08 2.05-.56 2.68-1.33z"/></svg>` },
        350: { id: 'apple', name: 'Apple TV+', badgeText: 'APPLE TV+', badgeClass: 'provider-apple', pillClass: 'pill-apple', color: '#1A1A1A', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1A1A1A" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.63-.77 1.05-1.83.93-2.84-.91.04-2.02.61-2.67 1.37-.58.67-1.08 1.76-.94 2.8 1.02.08 2.05-.56 2.68-1.33z"/></svg>` },
        1899: { id: 'max', name: 'Max', badgeText: 'MAX', badgeClass: 'provider-max', pillClass: 'pill-max', color: '#002BE7', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#002BE7" aria-hidden="true"><path d="M2 7.5h3.6l3.4 5.3 3.4-5.3H16v9h-3.3v-4.8L9.7 16H8.3L5.3 11.7v4.8H2v-9zm15 0h3.5l3.5 9h-3.4l-.5-1.5h-2.7l-.5 1.5H13.5l3.5-9zm1.3 5.4h1.7l-.8-2.4-.9 2.4z"/></svg>` },
        384: { id: 'max', name: 'HBO Max', badgeText: 'MAX', badgeClass: 'provider-max', pillClass: 'pill-max', color: '#002BE7', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#002BE7" aria-hidden="true"><path d="M2 7.5h3.6l3.4 5.3 3.4-5.3H16v9h-3.3v-4.8L9.7 16H8.3L5.3 11.7v4.8H2v-9zm15 0h3.5l3.5 9h-3.4l-.5-1.5h-2.7l-.5 1.5H13.5l3.5-9zm1.3 5.4h1.7l-.8-2.4-.9 2.4z"/></svg>` },
        15: { id: 'hulu', name: 'Hulu', badgeText: 'HULU', badgeClass: 'provider-prime', pillClass: 'pill-prime', color: '#1CE783', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1CE783" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>` }, // Reusing prime pill styling for Hulu green
        531: { id: 'paramount', name: 'Paramount+', badgeText: 'PARAMOUNT+', badgeClass: 'provider-prime', pillClass: 'pill-prime', color: '#0064FF', iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#0064FF" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>` } // Reusing prime pill styling for blue
    };

    /**
     * Load environment variables (Vercel Serverless /api/env or local env.json)
     */
    async function loadEnv() {
        if (isEnvLoaded) return;
        try {
            let response = await fetch('/api/env').catch(() => null);
            if (!response || !response.ok) {
                response = await fetch('/env.json').catch(() => null);
            }
            if (response && response.ok) {
                const config = await response.json();
                if (config.TMDB_API_KEY) TMDB_API_KEY = config.TMDB_API_KEY;
                if (config.TMDB_READ_ACCESS_TOKEN) TMDB_READ_ACCESS_TOKEN = config.TMDB_READ_ACCESS_TOKEN;
            }
        } catch (error) {
            console.warn('[MovieIQ] Warning loading environment credentials:', error);
        }
        isEnvLoaded = true;
    }

    /**
     * Fetch streaming providers from TMDB
     * @param {Object} movie The movie object containing at least `id` and `title`
     * @returns {Promise<Array>} Array of provider objects
     */
    async function getProviders(movie) {
        if (!movie || !movie.id) return [];
        
        await loadEnv();

        const movieId = movie.id;
        const title = movie.title || '';
        
        const cacheKey = `providers_${movieId}`;
        const cachedProviders = getCachedData(cacheKey);
        if (cachedProviders) {
            return cachedProviders;
        }

        if (!TMDB_API_KEY && !TMDB_READ_ACCESS_TOKEN) {
            console.warn(`[MovieIQ] TMDB API Key is missing. Please add your key to the .env file to enable real streaming data for "${title}".`);
            // Return an empty array if key is not configured to avoid throwing errors in UI
            return [];
        }

        try {
            let url = `${API_BASE_URL}/movie/${movieId}/watch/providers`;
            let options = {};

            if (TMDB_API_KEY) {
                url += `?api_key=${TMDB_API_KEY}`;
            } else if (TMDB_READ_ACCESS_TOKEN) {
                options.headers = {
                    'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                };
            }

            const response = await fetch(url, options);
            
            if (!response.ok) {
                if (response.status === 401) {
                    console.error('[MovieIQ] Invalid TMDB API Key. Please verify your credentials in the .env file.');
                }
                throw new Error(`TMDB API Error: ${response.status}`);
            }

            const data = await response.json();
            
            // Detect user's region from browser, default to IN/US
            let countryCode = 'US';
            try {
                if (navigator.language) {
                    const parts = navigator.language.split('-');
                    if (parts.length > 1) {
                        countryCode = parts[1].toUpperCase();
                    }
                }
            } catch (e) {}

            let regionalData = data.results && data.results[countryCode] ? data.results[countryCode] : null;
            
            // Fallback chain if not available in their specific region
            if (!regionalData && data.results) {
                if (data.results['IN']) regionalData = data.results['IN'];
                else if (data.results['US']) regionalData = data.results['US'];
                else if (data.results['GB']) regionalData = data.results['GB'];
                else {
                    const availableRegions = Object.keys(data.results);
                    if (availableRegions.length > 0) {
                        regionalData = data.results[availableRegions[0]];
                    }
                }
            }

            if (!regionalData) {
                // No streaming data available globally for this title
                setCachedData(cacheKey, []);
                return [];
            }

            // We combine flatrate (subscription), rent, and buy options
            const allTMDBProviders = [];
            
            if (regionalData.flatrate) regionalData.flatrate.forEach(p => { p.custom_type = 'Subscription'; allTMDBProviders.push(p); });
            if (regionalData.rent) regionalData.rent.forEach(p => { p.custom_type = 'Rent'; allTMDBProviders.push(p); });
            if (regionalData.buy) regionalData.buy.forEach(p => { p.custom_type = 'Buy'; allTMDBProviders.push(p); });

            // Remove duplicates (e.g. if available on Prime for both Subscription and Rent)
            const uniqueProviders = [];
            const seenIds = new Set();
            
            for (const p of allTMDBProviders) {
                if (!seenIds.has(p.provider_id)) {
                    seenIds.add(p.provider_id);
                    uniqueProviders.push(p);
                }
            }

            // Map TMDB provider data to our app's beautiful visual format
            const formattedProviders = uniqueProviders.map(p => {
                const config = PROVIDER_CONFIG[p.provider_id];
                
                // If it's a known major platform, use our custom styling and SVGs
                if (config) {
                    return {
                        ...config,
                        type: p.custom_type,
                        actionLabel: `Watch on ${config.name}`,
                        // Search URLs for the specific platforms
                        url: getSearchUrlForProvider(config.id, title)
                    };
                }
                
                // For unknown platforms, generate a generic styling using TMDB's logo if possible
                return {
                    id: `provider-${p.provider_id}`,
                    name: p.provider_name,
                    badgeText: p.provider_name.toUpperCase(),
                    type: p.custom_type,
                    actionLabel: `Watch on ${p.provider_name}`,
                    badgeClass: 'provider-generic',
                    pillClass: 'pill-generic',
                    color: '#444444',
                    url: `https://www.google.com/search?q=${encodeURIComponent(title + ' movie ' + p.provider_name)}`,
                    iconSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>`
                };
            });

            // Cache and return
            setCachedData(cacheKey, formattedProviders);
            return formattedProviders;

        } catch (error) {
            console.error(`[MovieIQ] Failed to fetch streaming providers for ${movieId}:`, error);
            return [];
        }
    }

    function getSearchUrlForProvider(providerId, title) {
        const encodedTitle = encodeURIComponent(title);
        switch (providerId) {
            case 'netflix': return `https://www.netflix.com/search?q=${encodedTitle}`;
            case 'prime': return `https://www.amazon.com/s?k=${encodeURIComponent(title + ' movie')}&i=instant-video`;
            case 'disney': return `https://www.disneyplus.com/search?q=${encodedTitle}`;
            case 'apple': return `https://tv.apple.com/search?term=${encodedTitle}`;
            case 'max': return `https://play.max.com/search?q=${encodedTitle}`;
            case 'hulu': return `https://www.hulu.com/search?q=${encodedTitle}`;
            default: return `https://www.google.com/search?q=${encodeURIComponent(title + ' watch')}`;
        }
    }

    /**
     * Fetch YouTube trailer from TMDB
     * @param {Object} movie The movie object
     * @returns {Promise<Object|null>} Trailer video object or null
     */
    async function getTrailer(movie) {
        if (!movie || !movie.id) return null;
        
        await loadEnv();

        const movieId = movie.id;
        const cacheKey = `trailer_${movieId}`;
        
        const cachedTrailer = getCachedData(cacheKey);
        if (cachedTrailer !== null) {
            return cachedTrailer.key ? cachedTrailer : null;
        }

        if (!TMDB_API_KEY && !TMDB_READ_ACCESS_TOKEN) {
            return null;
        }

        try {
            let url = `${API_BASE_URL}/movie/${movieId}/videos`;
            let options = {};

            if (TMDB_API_KEY) {
                url += `?api_key=${TMDB_API_KEY}`;
            } else if (TMDB_READ_ACCESS_TOKEN) {
                options.headers = {
                    'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                };
            }

            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`TMDB API Error: ${response.status}`);

            const data = await response.json();
            
            // Find a YouTube Trailer
            const results = data.results || [];
            let trailer = results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
            
            // Fallback to Teaser if Trailer not found
            if (!trailer) {
                trailer = results.find(v => v.site === 'YouTube' && v.type === 'Teaser');
            }
            
            // Cache the result (even if not found, we cache an empty object to prevent re-fetching)
            setCachedData(cacheKey, trailer || { key: null });

            return trailer || null;
        } catch (error) {
            console.error('[MovieIQ] Error fetching trailer:', error);
            return null;
        }
    }

    // Public API
    return {
        getProviders,
        getTrailer
    };
})();

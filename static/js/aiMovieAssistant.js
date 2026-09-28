/**
 * MovieQ - Advanced AI Movie Assistant & Semantic Search Engine
 * Powered by Natural Language Understanding (LLM Simulation) & TMDB Live Catalog Augmentation
 */

const AIMovieAssistant = (function() {
    let TMDB_CONFIG = { apiKey: null, readToken: null, isLoaded: false };
    let currentAnalysis = null;
    let typingTimer = null;

    // Load TMDB Credentials (Vercel Serverless /api/env or local env.json)
    async function initEnv() {
        if (TMDB_CONFIG.isLoaded) return;
        try {
            let res = await fetch('/api/env').catch(() => null);
            if (!res || !res.ok) {
                res = await fetch('/env.json').catch(() => null);
            }
            if (res && res.ok) {
                const data = await res.json();
                if (data.TMDB_API_KEY) TMDB_CONFIG.apiKey = data.TMDB_API_KEY;
                if (data.TMDB_READ_ACCESS_TOKEN) TMDB_CONFIG.readToken = data.TMDB_READ_ACCESS_TOKEN;
            }
        } catch (e) {
            console.info('[AIMovieAssistant] Running in offline local catalog mode');
        }
        TMDB_CONFIG.isLoaded = true;
    }

    // Comprehensive Cinematic Knowledge Graph (Themes, Tropes, Filmmakers, and References)
    const KNOWLEDGE_GRAPH = {
        themes: [
            {
                id: 'mind-bending',
                label: 'MIND-BENDING & TWISTS',
                keywords: ['mind-bending', 'mind bending', 'mindfuck', 'plot twist', 'twist ending', 'unreliable narrator', 'psychological', 'simulation', 'matrix', 'reality', 'dream', 'memory loss', 'existential', 'hallucination', 'perception', 'subconscious'],
                genres: ['Science Fiction', 'Mystery', 'Thriller'],
                mood: 'thoughtful',
                weight: 3.5
            },
            {
                id: 'time-travel',
                label: 'TEMPORAL & TIME LOOPS',
                keywords: ['time travel', 'time loop', 'timeloop', 'time slip', 'timeline', 'butterfly effect', 'paradox', 'time warp', 'temporal', 'multiverse'],
                genres: ['Science Fiction', 'Mystery', 'Adventure'],
                mood: 'thoughtful',
                weight: 3.2
            },
            {
                id: 'cyberpunk',
                label: 'CYBERPUNK & DYSTOPIA',
                keywords: ['cyberpunk', 'neon', 'dystopian', 'dystopia', 'cyborg', 'android', 'artificial intelligence', 'ai', 'hacker', 'blade runner', 'futuristic', 'surveillance'],
                genres: ['Science Fiction', 'Action', 'Thriller'],
                mood: 'thoughtful',
                weight: 3.0
            },
            {
                id: 'space-epic',
                label: 'SPACE & COSMIC EXPLORATION',
                keywords: ['space', 'interstellar', 'galaxy', 'astronaut', 'cosmos', 'orbit', 'spaceship', 'planetary', 'deep space', 'alien encounter', 'mars', 'black hole'],
                genres: ['Science Fiction', 'Adventure', 'Drama'],
                mood: 'epic',
                weight: 3.0
            },
            {
                id: 'intense-thriller',
                label: 'HIGH-TENSION SUSPENSE',
                keywords: ['intense', 'suspense', 'edge of seat', 'nail-biting', 'tension', 'cat and mouse', 'high stakes', 'conspiracy', 'paranoia', 'hostage', 'countdown'],
                genres: ['Thriller', 'Crime', 'Mystery'],
                mood: 'intense',
                weight: 3.2
            },
            {
                id: 'crime-heist',
                label: 'HEISTS & CRIME SYNDICATES',
                keywords: ['heist', 'robbery', 'bank job', 'caper', 'ocean', 'getaway', 'gangster', 'mafia', 'mob', 'underworld', 'cartel', 'organized crime', 'con artist'],
                genres: ['Crime', 'Action', 'Thriller'],
                mood: 'excited',
                weight: 2.8
            },
            {
                id: 'detective-noir',
                label: 'DETECTIVE & NOIR MYSTERY',
                keywords: ['detective', 'mystery', 'noir', 'neo-noir', 'whodunit', 'investigation', 'murder mystery', 'clue', 'sleuth', 'sherlock', 'private eye', 'crime scene'],
                genres: ['Mystery', 'Crime', 'Drama'],
                mood: 'detective',
                weight: 3.0
            },
            {
                id: 'cozy-wholesome',
                label: 'COZY & WHOLESOME CHILL',
                keywords: ['cozy', 'comfort', 'wholesome', 'feel-good', 'feel good', 'heartwarming', 'uplifting', 'soothing', 'warm', 'peaceful', 'rainy day', 'healing', 'comforting', 'gentle'],
                genres: ['Family', 'Comedy', 'Animation', 'Drama'],
                mood: 'relaxed',
                weight: 3.2
            },
            {
                id: 'dark-horror',
                label: 'DARK HORROR & SPOOKS',
                keywords: ['horror', 'scary', 'spooky', 'creepy', 'terrifying', 'blood', 'slasher', 'haunted', 'ghost', 'possession', 'demon', 'monster', 'nightmare', 'jump scare', 'occult', 'supernatural'],
                genres: ['Horror', 'Thriller', 'Mystery'],
                mood: 'scared',
                weight: 3.0
            },
            {
                id: 'romantic-passion',
                label: 'ROMANCE & EMOTIONAL CONNECTION',
                keywords: ['romantic', 'romance', 'love story', 'fall in love', 'lovers', 'date night', 'soulmate', 'crush', 'passionate', 'heartbreak', 'enemies to lovers', 'slow burn romance'],
                genres: ['Romance', 'Comedy', 'Drama'],
                mood: 'romantic',
                weight: 2.8
            },
            {
                id: 'action-adrenaline',
                label: 'HIGH-OCTANE ACTION',
                keywords: ['fast-paced', 'fast paced', 'action', 'adrenaline', 'explosive', 'martial arts', 'kung fu', 'combat', 'assassin', 'hitman', 'chase', 'superhero', 'gunfight', 'showdown', 'revenge'],
                genres: ['Action', 'Thriller', 'Adventure'],
                mood: 'excited',
                weight: 3.0
            },
            {
                id: 'epic-fantasy',
                label: 'EPIC MYTH & FANTASY',
                keywords: ['epic', 'fantasy', 'magic', 'dragons', 'sword', 'kingdom', 'realm', 'mythology', 'wizard', 'quest', 'sorcery', 'medieval', 'prophecy'],
                genres: ['Fantasy', 'Adventure', 'Action'],
                mood: 'epic',
                weight: 2.9
            },
            {
                id: 'historical-curious',
                label: 'REAL STORIES & UNTOLD TRUTHS',
                keywords: ['true story', 'based on a true story', 'history', 'historical', 'biopic', 'biography', 'documentary', 'real life', 'real events', 'untold', 'investigative journalism'],
                genres: ['History', 'Drama', 'Documentary'],
                mood: 'curious',
                weight: 2.8
            },
            {
                id: 'gritty-war',
                label: 'WAR & BATTLEFIELD GRIT',
                keywords: ['war', 'battlefield', 'soldier', 'military', 'army', 'combat', 'world war', 'trench', 'gritty', 'vietnam', 'heroism', 'wartime'],
                genres: ['War', 'History', 'Drama', 'Action'],
                mood: 'gritty',
                weight: 3.0
            },
            {
                id: 'western',
                label: 'WILD WEST & OUTLAWS',
                keywords: ['western', 'cowboy', 'gunslinger', 'outlaw', 'sheriff', 'wild west', 'saloon', 'frontier', 'bounty hunter', 'spaghetti western', 'high noon'],
                genres: ['Western', 'Action', 'Adventure'],
                mood: 'western',
                weight: 3.0
            },
            {
                id: 'animation-magic',
                label: 'ANIMATION & STUDIO MASTERY',
                keywords: ['animated', 'animation', 'anime', 'cartoon', 'ghibli', 'pixar', 'disney', 'miyazaki', 'hand-drawn', 'stop-motion'],
                genres: ['Animation', 'Family', 'Fantasy'],
                mood: 'animated',
                weight: 3.0
            },
            {
                id: 'wild-bored',
                label: 'WILD & UNPREDICTABLE CHAOS',
                keywords: ['bored', 'crazy', 'wild', 'weird', 'absurd', 'random', 'unpredictable', 'chaotic', 'fun', 'bizarre', 'wacky', 'stoner', 'anything goes'],
                genres: ['Comedy', 'Action', 'Fantasy'],
                mood: 'bored',
                weight: 2.7
            }
        ],

        directors: [
            { name: 'Christopher Nolan', aliases: ['nolan', 'christopher nolan'], genres: ['Science Fiction', 'Thriller', 'Action'], themes: ['mind-bending', 'time-travel'] },
            { name: 'Quentin Tarantino', aliases: ['tarantino', 'quentin tarantino'], genres: ['Crime', 'Drama', 'Western'], themes: ['crime-heist', 'action-adrenaline'] },
            { name: 'Martin Scorsese', aliases: ['scorsese', 'martin scorsese'], genres: ['Crime', 'Drama', 'History'], themes: ['crime-heist', 'gritty-war'] },
            { name: 'David Fincher', aliases: ['fincher', 'david fincher'], genres: ['Thriller', 'Mystery', 'Crime'], themes: ['detective-noir', 'mind-bending', 'intense-thriller'] },
            { name: 'Denis Villeneuve', aliases: ['villeneuve', 'denis villeneuve'], genres: ['Science Fiction', 'Thriller', 'Drama'], themes: ['cyberpunk', 'space-epic', 'mind-bending'] },
            { name: 'Hayao Miyazaki', aliases: ['miyazaki', 'hayao miyazaki', 'ghibli'], genres: ['Animation', 'Fantasy', 'Family'], themes: ['animation-magic', 'cozy-wholesome'] },
            { name: 'Stanley Kubrick', aliases: ['kubrick', 'stanley kubrick'], genres: ['Science Fiction', 'Drama', 'Mystery'], themes: ['mind-bending', 'space-epic'] },
            { name: 'Wes Anderson', aliases: ['wes anderson', 'anderson'], genres: ['Comedy', 'Drama', 'Adventure'], themes: ['cozy-wholesome', 'wild-bored'] },
            { name: 'Bong Joon-ho', aliases: ['bong joon-ho', 'bong joon ho', 'bong joonho'], genres: ['Drama', 'Thriller', 'Comedy'], themes: ['intense-thriller', 'mind-bending'] },
            { name: 'Alfred Hitchcock', aliases: ['hitchcock', 'alfred hitchcock'], genres: ['Thriller', 'Mystery'], themes: ['detective-noir', 'intense-thriller'] },
            { name: 'Steven Spielberg', aliases: ['spielberg', 'steven spielberg'], genres: ['Adventure', 'Science Fiction', 'Drama'], themes: ['epic-fantasy', 'space-epic'] },
            { name: 'Guillermo del Toro', aliases: ['del toro', 'guillermo del toro'], genres: ['Fantasy', 'Horror', 'Drama'], themes: ['epic-fantasy', 'dark-horror'] },
            { name: 'Guy Ritchie', aliases: ['guy ritchie', 'ritchie'], genres: ['Action', 'Comedy', 'Crime'], themes: ['crime-heist', 'action-adrenaline'] },
            { name: 'Ridley Scott', aliases: ['ridley scott'], genres: ['Science Fiction', 'Action', 'Drama'], themes: ['cyberpunk', 'space-epic', 'gritty-war'] }
        ],

        referenceMovies: [
            {
                name: 'Inception',
                aliases: ['inception'],
                themes: ['mind-bending', 'time-travel', 'cyberpunk'],
                genres: ['Science Fiction', 'Action', 'Adventure'],
                mood: 'thoughtful',
                seedKeywords: ['dream', 'subconscious', 'architect', 'reality', 'heist']
            },
            {
                name: 'Interstellar',
                aliases: ['interstellar'],
                themes: ['space-epic', 'mind-bending'],
                genres: ['Science Fiction', 'Drama', 'Adventure'],
                mood: 'epic',
                seedKeywords: ['space', 'black hole', 'wormhole', 'relativity', 'time']
            },
            {
                name: 'Fight Club',
                aliases: ['fight club'],
                themes: ['mind-bending', 'intense-thriller'],
                genres: ['Drama', 'Thriller'],
                mood: 'thoughtful',
                seedKeywords: ['insomnia', 'alter ego', 'rebellion', 'society', 'soap']
            },
            {
                name: 'The Matrix',
                aliases: ['the matrix', 'matrix'],
                themes: ['cyberpunk', 'mind-bending', 'action-adrenaline'],
                genres: ['Science Fiction', 'Action'],
                mood: 'thoughtful',
                seedKeywords: ['simulation', 'neo', 'agents', 'reality', 'oracle']
            },
            {
                name: 'Pulp Fiction',
                aliases: ['pulp fiction'],
                themes: ['crime-heist', 'wild-bored'],
                genres: ['Crime', 'Drama', 'Comedy'],
                mood: 'excited',
                seedKeywords: ['gangster', 'hitman', 'nonlinear', 'tarantino', 'dialogue']
            },
            {
                name: 'Shutter Island',
                aliases: ['shutter island'],
                themes: ['mind-bending', 'detective-noir', 'intense-thriller'],
                genres: ['Mystery', 'Thriller', 'Drama'],
                mood: 'thoughtful',
                seedKeywords: ['asylum', 'investigation', 'island', 'twist', 'patient']
            },
            {
                name: 'Parasite',
                aliases: ['parasite'],
                themes: ['intense-thriller', 'mind-bending'],
                genres: ['Comedy', 'Thriller', 'Drama'],
                mood: 'intense',
                seedKeywords: ['class', 'social', 'house', 'basement', 'family']
            },
            {
                name: 'Spirited Away',
                aliases: ['spirited away'],
                themes: ['animation-magic', 'cozy-wholesome', 'epic-fantasy'],
                genres: ['Animation', 'Family', 'Fantasy'],
                mood: 'animated',
                seedKeywords: ['spirit', 'bathhouse', 'magic', 'journey', 'chihiro']
            },
            {
                name: 'Blade Runner',
                aliases: ['blade runner', 'blade runner 2049'],
                themes: ['cyberpunk', 'detective-noir'],
                genres: ['Science Fiction', 'Mystery', 'Drama'],
                mood: 'thoughtful',
                seedKeywords: ['replicant', 'future', 'neon', 'rain', 'tears in rain']
            },
            {
                name: 'Whiplash',
                aliases: ['whiplash'],
                themes: ['intense-thriller'],
                genres: ['Drama', 'Music'],
                mood: 'intense',
                seedKeywords: ['drummer', 'jazz', 'obsession', 'perfection', 'tempo']
            },
            {
                name: 'Se7en',
                aliases: ['se7en', 'seven'],
                themes: ['detective-noir', 'intense-thriller'],
                genres: ['Crime', 'Mystery', 'Thriller'],
                mood: 'detective',
                seedKeywords: ['deadly sins', 'detective', 'serial killer', 'box']
            },
            {
                name: 'La La Land',
                aliases: ['la la land'],
                themes: ['romantic-passion', 'cozy-wholesome'],
                genres: ['Comedy', 'Drama', 'Romance', 'Music'],
                mood: 'romantic',
                seedKeywords: ['jazz', 'hollywood', 'dreams', 'dance', 'piano']
            },
            {
                name: 'Grand Budapest Hotel',
                aliases: ['grand budapest', 'grand budapest hotel'],
                themes: ['cozy-wholesome', 'wild-bored'],
                genres: ['Comedy', 'Drama'],
                mood: 'happy',
                seedKeywords: ['hotel', 'concierge', 'whimsical', 'adventure', 'pastry']
            },
            {
                name: 'John Wick',
                aliases: ['john wick'],
                themes: ['action-adrenaline'],
                genres: ['Action', 'Thriller', 'Crime'],
                mood: 'excited',
                seedKeywords: ['assassin', 'revenge', 'continental', 'gun fu']
            },
            {
                name: 'Knives Out',
                aliases: ['knives out', 'glass onion'],
                themes: ['detective-noir'],
                genres: ['Comedy', 'Crime', 'Mystery'],
                mood: 'detective',
                seedKeywords: ['whodunit', 'inheritance', 'mansion', 'investigation', 'benoit blanc']
            }
        ],

        languages: [
            { code: 'ko', name: 'Korean', keywords: ['korean', 'korea', 'seoul', 'k-drama'] },
            { code: 'ja', name: 'Japanese', keywords: ['japanese', 'japan', 'tokyo', 'anime'] },
            { code: 'fr', name: 'French', keywords: ['french', 'france', 'paris'] },
            { code: 'es', name: 'Spanish', keywords: ['spanish', 'spain', 'mexico', 'mexican'] },
            { code: 'it', name: 'Italian', keywords: ['italian', 'italy', 'rome'] },
            { code: 'de', name: 'German', keywords: ['german', 'germany', 'berlin'] },
            { code: 'hi', name: 'Hindi', keywords: ['hindi', 'bollywood', 'indian', 'india'] },
            { code: 'en', name: 'English', keywords: ['english', 'hollywood', 'american', 'british'] }
        ],

        genres: [
            { name: 'Science Fiction', aliases: ['sci-fi', 'scifi', 'sci fi', 'science fiction', 'space travel', 'futuristic'] },
            { name: 'Thriller', aliases: ['thriller', 'thrillers', 'suspense', 'psychological thriller', 'mystery thriller'] },
            { name: 'Horror', aliases: ['horror', 'scary', 'spooky', 'creepy', 'slasher', 'nightmare'] },
            { name: 'Action', aliases: ['action', 'martial arts', 'kung fu', 'explosive', 'action-packed'] },
            { name: 'Comedy', aliases: ['comedy', 'comedies', 'funny', 'hilarious', 'laugh', 'humor', 'spoof'] },
            { name: 'Drama', aliases: ['drama', 'dramas', 'dramatic', 'emotional', 'moving'] },
            { name: 'Mystery', aliases: ['mystery', 'mysteries', 'whodunit', 'detective', 'investigation', 'puzzle'] },
            { name: 'Crime', aliases: ['crime', 'gangster', 'mafia', 'mob', 'heist', 'robbery'] },
            { name: 'Romance', aliases: ['romance', 'romantic', 'love story', 'rom-com', 'romcom'] },
            { name: 'Animation', aliases: ['animation', 'animated', 'anime', 'cartoon'] },
            { name: 'Fantasy', aliases: ['fantasy', 'magic', 'magical', 'dragons', 'wizards'] },
            { name: 'Adventure', aliases: ['adventure', 'adventures', 'quest', 'journey'] },
            { name: 'Western', aliases: ['western', 'cowboy', 'wild west'] },
            { name: 'War', aliases: ['war', 'military', 'battlefield', 'world war'] },
            { name: 'Family', aliases: ['family', 'kids', 'children'] },
            { name: 'Documentary', aliases: ['documentary', 'biography', 'biopic'] },
            { name: 'Music', aliases: ['musical', 'music', 'soundtrack', 'concert'] },
            { name: 'History', aliases: ['history', 'historical', 'period piece'] }
        ],

        decades: [
            { id: '1970s', label: '1970s', minYear: 1970, maxYear: 1979, keywords: ['70s', '1970s', 'seventies'] },
            { id: '1980s', label: '1980s', minYear: 1980, maxYear: 1989, keywords: ['80s', '1980s', 'eighties'] },
            { id: '1990s', label: '1990s', minYear: 1990, maxYear: 1999, keywords: ['90s', '1990s', 'nineties'] },
            { id: '2000s', label: '2000s', minYear: 2000, maxYear: 2009, keywords: ['2000s', '00s', 'y2k', 'early 2000s'] },
            { id: '2010s', label: '2010s', minYear: 2010, maxYear: 2019, keywords: ['2010s', 'twenty tens'] },
            { id: '2020s', label: '2020s', minYear: 2020, maxYear: 2026, keywords: ['2020s', 'recent', 'modern', 'new', 'latest'] },
            { id: 'classic', label: 'CLASSICS (PRE-1985)', minYear: 1900, maxYear: 1985, keywords: ['classic', 'classics', 'golden age', 'vintage', 'old school'] }
        ]
    };

    /**
     * Parse raw natural language query into rich semantic intent
     */
    function parseQuery(prompt) {
        if (!prompt || typeof prompt !== 'string') return null;
        const raw = prompt.trim();
        const lower = raw.toLowerCase();

        // 1. Detect negative exclusions
        const exclusions = [];
        if (lower.includes('no horror') || lower.includes('not scary') || lower.includes('without horror')) exclusions.push('Horror');
        if (lower.includes('no romance') || lower.includes('not romantic') || lower.includes('without love')) exclusions.push('Romance');
        if (lower.includes('no violence') || lower.includes('not violent')) { exclusions.push('War'); exclusions.push('Horror'); }
        if (lower.includes('no animation') || lower.includes('not animated') || lower.includes('not cartoon')) exclusions.push('Animation');

        // Positive search text with negated phrases stripped to prevent inverted theme matches
        let positiveText = lower;
        if (exclusions.includes('Horror')) {
            positiveText = positiveText.replace(/\b(no|not|without|never)\s+(horror|scary|gore|jump\s*scare|spooky)\b/gi, '');
        }
        if (exclusions.includes('Romance')) {
            positiveText = positiveText.replace(/\b(no|not|without)\s+(romance|romantic|love|dating)\b/gi, '');
        }
        if (exclusions.includes('Animation')) {
            positiveText = positiveText.replace(/\b(no|not|without)\s+(animation|animated|cartoon|anime)\b/gi, '');
        }

        // 2. Identify Explicit Requested Genres
        const explicitGenres = [];
        for (const g of KNOWLEDGE_GRAPH.genres) {
            if (g.aliases.some(a => positiveText.includes(a))) {
                if (!exclusions.includes(g.name)) {
                    explicitGenres.push(g.name);
                }
            }
        }

        // 3. Identify Themes
        const matchedThemes = [];
        for (const theme of KNOWLEDGE_GRAPH.themes) {
            const hasMatch = theme.keywords.some(kw => positiveText.includes(kw));
            if (hasMatch) {
                // If this theme strictly targets an excluded genre, don't include it
                const isExcludedTheme = exclusions.some(ex => theme.genres.includes(ex) && theme.genres.length === 1);
                if (!isExcludedTheme) {
                    matchedThemes.push(theme);
                }
            }
        }

        // 4. Identify Directors
        let matchedDirector = null;
        for (const dir of KNOWLEDGE_GRAPH.directors) {
            if (dir.aliases.some(a => lower.includes(a))) {
                matchedDirector = dir;
                break;
            }
        }

        // 5. Identify Reference Films ("like Inception", "Interstellar vibes")
        let matchedReference = null;
        for (const ref of KNOWLEDGE_GRAPH.referenceMovies) {
            if (ref.aliases.some(a => lower.includes(a))) {
                matchedReference = ref;
                break;
            }
        }

        // 6. Identify Language / Geography
        let matchedLang = null;
        for (const lang of KNOWLEDGE_GRAPH.languages) {
            if (lang.keywords.some(k => lower.includes(k))) {
                matchedLang = lang;
                break;
            }
        }

        // 7. Identify Decades / Eras
        let matchedDecade = null;
        for (const dec of KNOWLEDGE_GRAPH.decades) {
            if (dec.keywords.some(k => lower.includes(k))) {
                matchedDecade = dec;
                break;
            }
        }

        // 8. Rating Threshold & Quality Intent
        let isMasterpiece = lower.includes('masterpiece') || lower.includes('best') || lower.includes('top rated') || lower.includes('high rating') || lower.includes('acclaimed') || lower.includes('8+') || lower.includes('critically');
        let isHiddenGem = lower.includes('hidden gem') || lower.includes('underrated') || lower.includes('cult classic') || lower.includes('indie') || lower.includes('overlooked');

        // 9. Primary Mood and Genre synthesis
        let primaryMood = null;
        const candidateGenres = new Set(explicitGenres);

        if (matchedReference) {
            primaryMood = matchedReference.mood;
            matchedReference.genres.forEach(g => candidateGenres.add(g));
        } else if (matchedDirector) {
            matchedDirector.genres.forEach(g => candidateGenres.add(g));
        }

        if (matchedThemes.length > 0) {
            if (!primaryMood) primaryMood = matchedThemes[0].mood;
            matchedThemes.forEach(t => t.genres.forEach(g => candidateGenres.add(g)));
        }

        // Clean direct titles (e.g. searching for exact title or person)
        const isConversational = lower.split(' ').length >= 3 || matchedThemes.length > 0 || explicitGenres.length > 0 || matchedReference !== null || matchedDirector !== null || isMasterpiece || isHiddenGem;

        return {
            rawPrompt: raw,
            isConversational,
            explicitGenres,
            themes: matchedThemes,
            director: matchedDirector,
            referenceFilm: matchedReference,
            language: matchedLang,
            decade: matchedDecade,
            isMasterpiece,
            isHiddenGem,
            primaryMood,
            targetGenres: Array.from(candidateGenres),
            exclusions
        };
    }

    /**
     * Compute multi-factor semantic relevance score for a movie against the parsed intent
     */
    function calculateRelevanceScore(movie, parsed) {
        if (!movie) return -9999;
        let score = 0;

        const titleLower = (movie.title || '').toLowerCase();
        const overviewLower = (movie.overview || '').toLowerCase();
        const taglineLower = (movie.tagline || '').toLowerCase();
        const castLower = (movie.cast || '').toLowerCase();
        const directorLower = (movie.director || '').toLowerCase();
        const genreNamesLower = (movie.genre_names || '').toLowerCase();

        // Check exclusions (hard negative filter)
        if (parsed.exclusions && parsed.exclusions.length > 0) {
            const hasExclusion = parsed.exclusions.some(ex => {
                const exLower = ex.toLowerCase();
                if (genreNamesLower.includes(exLower)) return true;
                if (movie.genres) {
                    if (Array.isArray(movie.genres)) {
                        if (movie.genres.some(g => (typeof g === 'string' ? g : g.name || '').toLowerCase().includes(exLower))) return true;
                    } else if (String(movie.genres).toLowerCase().includes(exLower)) {
                        return true;
                    }
                }
                if (exLower === 'horror' && (titleLower.includes('scary movie') || titleLower.includes('horror') || overviewLower.includes('haunted house') || overviewLower.includes('demonic possession'))) {
                    return true;
                }
                return false;
            });
            if (hasExclusion) return -9999;
        }
        const allText = `${titleLower} ${overviewLower} ${taglineLower} ${castLower} ${directorLower} ${genreNamesLower}`;

        // 1. Explicit Genre Enforcement
        if (parsed.explicitGenres && parsed.explicitGenres.length > 0) {
            let matchedCount = 0;
            parsed.explicitGenres.forEach(eg => {
                if (genreNamesLower.includes(eg.toLowerCase()) || 
                    (movie.genres && movie.genres.some(g => g.toLowerCase() === eg.toLowerCase()))) {
                    matchedCount++;
                }
            });

            if (matchedCount === parsed.explicitGenres.length) {
                score += 260; // Has ALL requested genres (e.g. Science Fiction AND Thriller)
            } else if (matchedCount > 0) {
                score += matchedCount * 85;
            } else {
                // If user specifically asked for genres, heavily penalize movies that don't belong to ANY of them
                score -= 220;
            }
        }

        // 2. Director Match
        if (parsed.director) {
            if (directorLower.includes(parsed.director.name.toLowerCase()) || 
                parsed.director.aliases.some(a => directorLower.includes(a) || castLower.includes(a))) {
                score += 180;
            }
        }

        // 3. Reference Movie Match & Keyword DNA
        if (parsed.referenceFilm) {
            if (parsed.referenceFilm.aliases.some(a => titleLower.includes(a))) {
                score += 150;
            }
            parsed.referenceFilm.seedKeywords.forEach(kw => {
                if (allText.includes(kw)) score += 35;
            });
            parsed.referenceFilm.genres.forEach(g => {
                if (genreNamesLower.includes(g.toLowerCase())) score += 30;
            });
        }

        // 4. Theme & Keyword Semantic Overlap
        if (parsed.themes.length > 0) {
            parsed.themes.forEach(theme => {
                let themeHits = 0;
                theme.keywords.forEach(kw => {
                    if (titleLower.includes(kw)) themeHits += 3.5;
                    else if (overviewLower.includes(kw)) themeHits += 2.0;
                    else if (taglineLower.includes(kw)) themeHits += 1.5;
                });
                score += themeHits * (theme.weight || 2.0) * 12;
            });
        }

        // 5. Target Genre Alignment
        if (parsed.targetGenres.length > 0) {
            parsed.targetGenres.forEach(genre => {
                if (genreNamesLower.includes(genre.toLowerCase())) {
                    score += 25;
                }
            });
        }

        // 6. Decade / Era Match
        if (parsed.decade && movie.release_date && movie.release_date.length >= 4) {
            const year = parseInt(movie.release_date.substring(0, 4), 10);
            if (year >= parsed.decade.minYear && year <= parsed.decade.maxYear) {
                score += 55;
            } else {
                score -= 20;
            }
        }

        // 7. Language Match
        if (parsed.language) {
            if (movie.original_language && movie.original_language.toLowerCase() === parsed.language.code) {
                score += 80;
            } else if (parsed.language.code !== 'en') {
                score -= 50;
            }
        }

        // 8. Rating & Quality Modifiers
        const voteAvg = typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(movie.vote_average) || 0;
        const voteCount = typeof movie.vote_count === 'number' ? movie.vote_count : parseInt(movie.vote_count) || 0;

        if (parsed.isMasterpiece) {
            if (voteAvg >= 8.0) score += 75;
            else if (voteAvg >= 7.5) score += 40;
            else score -= 40;
        }

        if (parsed.isHiddenGem) {
            if (voteAvg >= 7.4 && voteCount < 10000) score += 80;
            else if (voteCount > 25000) score -= 30;
        }

        // Confidence Weighting: verified popular acclaim prevents 0-vote junk from surfacing
        if (voteCount >= 1000) {
            score += Math.min(Math.log10(voteCount) * 16.0, 70.0);
        } else if (voteCount < 15 && !parsed.isHiddenGem) {
            score -= 40;
        }
        score += voteAvg * 7.0;

        // Verified poster bonus
        if (movie.poster_path && movie.poster_path.trim().length > 0) {
            score += 30;
        }

        // Exact raw word matching for meaningful non-stop words
        const STOP_WORDS = new Set([
            'movie', 'movies', 'film', 'films', 'watch', 'want', 'with', 'like', 'show', 'find',
            'some', 'good', 'best', 'crazy', 'plot', 'twist', 'ending', 'something', 'great',
            'recommend', 'suggest', 'looking', 'for', 'about', 'from', 'this', 'that', 'there',
            'have', 'been', 'which', 'their', 'very', 'much', 'more', 'give', 'tell', 'need'
        ]);
        const rawWords = parsed.rawPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
        rawWords.forEach(w => {
            if (titleLower.includes(w)) score += 35;
            else if (overviewLower.includes(w)) score += 12;
        });

        return score;
    }

    /**
     * Live TMDB API Augmentation: Fetch live movie suggestions from TMDB if local pool is narrow
     */
    async function fetchLiveTMDBMatches(parsed) {
        await initEnv();
        if (!TMDB_CONFIG.apiKey && !TMDB_CONFIG.readToken) return [];

        try {
            const queryTerms = [];
            if (parsed.referenceFilm) queryTerms.push(parsed.referenceFilm.name);
            else if (parsed.director) queryTerms.push(parsed.director.name);
            else if (parsed.themes.length > 0) queryTerms.push(parsed.themes[0].keywords[0]);
            else queryTerms.push(parsed.rawPrompt);

            const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(queryTerms[0])}&include_adult=false&page=1`;
            const res = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
            if (!res.ok) return [];

            const data = await res.json();
            if (!data.results || !Array.isArray(data.results)) return [];

            const TMDB_GENRES = {
                28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
                99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
                27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
                10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
            };

            return data.results.slice(0, 10).map(m => {
                const genreNames = (m.genre_ids || []).map(gid => TMDB_GENRES[gid]).filter(Boolean);
                return {
                    id: m.id,
                    title: m.title || m.original_title,
                    original_title: m.original_title || m.title,
                    overview: m.overview || '',
                    vote_average: m.vote_average || 0,
                    vote_count: m.vote_count || 0,
                    popularity: m.popularity || 0,
                    release_date: m.release_date || '',
                    poster_path: m.poster_path || '',
                    original_language: m.original_language || 'en',
                    genres: genreNames.join(', '),
                    genre_names: genreNames.join(', ')
                };
            });
        } catch (e) {
            console.warn('[AIMovieAssistant] Live TMDB fetch skipped:', e.message);
            return [];
        }
    }

    /**
     * Synthesize intelligent LLM explanation text
     */
    function generateLLMResponse(parsed, matchCount) {
        if (!parsed.isConversational && parsed.rawPrompt.length < 15 && parsed.themes.length === 0) {
            return `Calibrated search index for "${parsed.rawPrompt}". Found ${matchCount} matching titles in the archives.`;
        }

        const parts = [];
        if (parsed.referenceFilm) {
            parts.push(`Anchored on the cinematic DNA of ${parsed.referenceFilm.name}`);
        }
        if (parsed.director) {
            parts.push(`Tracking visionary auteur ${parsed.director.name}`);
        }
        if (parsed.themes.length > 0) {
            const themeNames = parsed.themes.slice(0, 2).map(t => t.label).join(' & ');
            parts.push(`Identified vibe: ${themeNames}`);
        }
        if (parsed.decade) {
            parts.push(`Filtered era: ${parsed.decade.label}`);
        }
        if (parsed.language) {
            parts.push(`Focused on ${parsed.language.name} cinema`);
        }
        if (parsed.isMasterpiece) {
            parts.push(`Prioritizing 8.0+ critical masterpieces`);
        }
        if (parsed.isHiddenGem) {
            parts.push(`Unearthing high-rated hidden gems`);
        }

        const summary = parts.length > 0 ? parts.join(' // ') : `Calibrated smart matrix for your query`;
        return `[AI CINEMA REASONING] ${summary}. Delivered ${matchCount} tailored recommendations for your movie night.`;
    }

    /**
     * Render typewriter streaming response
     */
    function streamTypewriterText(elementId, fullText, onComplete) {
        const bubble = document.getElementById(elementId);
        if (!bubble) return;

        if (typingTimer) clearInterval(typingTimer);
        bubble.textContent = '';
        bubble.classList.add('active');

        let charIdx = 0;
        typingTimer = setInterval(() => {
            if (charIdx < fullText.length) {
                bubble.textContent = fullText.slice(0, charIdx + 1) + '▊';
                charIdx++;
            } else {
                bubble.textContent = fullText;
                clearInterval(typingTimer);
                typingTimer = null;
                if (typeof onComplete === 'function') onComplete();
            }
        }, 16);
    }

    /**
     * Render extracted insight chips under the bubble
     */
    function renderInsightChips(parsed) {
        const container = document.getElementById('aiExtractedTags');
        if (!container) return;

        const chips = [];
        if (parsed.referenceFilm) chips.push({ icon: 'fas fa-film', label: `SIMILAR: ${parsed.referenceFilm.name.toUpperCase()}` });
        if (parsed.director) chips.push({ icon: 'fas fa-video', label: `DIRECTOR: ${parsed.director.name.toUpperCase()}` });
        if (parsed.themes.length > 0) {
            parsed.themes.slice(0, 2).forEach(t => {
                chips.push({ icon: 'fas fa-bolt', label: t.label });
            });
        }
        if (parsed.decade) chips.push({ icon: 'fas fa-calendar-alt', label: parsed.decade.label });
        if (parsed.language) chips.push({ icon: 'fas fa-globe', label: parsed.language.name.toUpperCase() });
        if (parsed.isMasterpiece) chips.push({ icon: 'fas fa-star', label: '8.0+ MASTERPIECE' });
        if (parsed.isHiddenGem) chips.push({ icon: 'fas fa-gem', label: 'HIDDEN GEM' });

        if (chips.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = chips.map(c => `
            <span class="ai-insight-chip">
                <i class="${c.icon}"></i> ${c.label}
            </span>
        `).join('');
    }

    function getUI() {
        return window.UIManager || window.UI;
    }

    /**
     * Main Search Entrypoint: Executes semantic search across catalog
     */
    async function searchWithAI(prompt) {
        const parsed = parseQuery(prompt);
        if (!parsed) return { totalFound: 0, response: '' };

        // 1. Update UI Status to "Analyzing"
        const statusEl = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        if (statusEl) statusEl.textContent = 'AI Movie Assistant: Processing Reel Matrix...';
        if (statusDot) statusDot.style.background = 'var(--gold)';

        // 2. Ensure movies are loaded
        let pool = MovieLoader.getAllMovies ? MovieLoader.getAllMovies() : [];
        if (!pool || pool.length === 0) {
            pool = await MovieLoader.loadMovies();
        }

        // If very narrow, load an additional chunk from the 301 JSON files to broaden pool
        if (pool.length < 90 && typeof MovieLoader.loadAdditionalChunk === 'function') {
            await MovieLoader.loadAdditionalChunk(Math.floor(Math.random() * 20) + 2);
            pool = MovieLoader.getAllMovies();
        }

        // 3. Live TMDB Fallback if specific reference movie was requested
        if (parsed.referenceFilm || parsed.director) {
            const liveMovies = await fetchLiveTMDBMatches(parsed);
            if (liveMovies.length > 0 && typeof MovieLoader.addMovies === 'function') {
                MovieLoader.addMovies(liveMovies);
                pool = MovieLoader.getAllMovies();
            }
        }

        // 4. Rank movies by multi-factor score
        const scored = pool.map(movie => ({
            movie,
            score: calculateRelevanceScore(movie, parsed)
        })).filter(item => item.score > 0);

        scored.sort((a, b) => b.score - a.score);
        const rankedMovies = scored.map(item => item.movie);

        // 5. Update MovieLoader with the ranked list
        let totalPages = 1;
        if (typeof MovieLoader.setFilteredMovies === 'function') {
            totalPages = MovieLoader.setFilteredMovies(rankedMovies.length > 0 ? rankedMovies : pool);
        } else {
            totalPages = MovieLoader.filterMovies({ searchText: prompt });
        }

        // 6. Update UI status to "Ready" with count
        if (statusEl) statusEl.textContent = `AI Movie Assistant: ${rankedMovies.length} Matches Found`;
        if (statusDot) statusDot.style.background = rankedMovies.length > 0 ? '#1CE783' : 'var(--crimson)';

        // 7. Update Mood in UI if detected
        const ui = getUI();
        if (parsed.primaryMood && ui && typeof ui.setAppliedMood === 'function') {
            ui.setAppliedMood(parsed.primaryMood);
        }

        // 8. Stream LLM Response & Display Insight Chips
        const responseText = generateLLMResponse(parsed, rankedMovies.length);
        streamTypewriterText('aiResponseBubble', responseText);
        renderInsightChips(parsed);

        // 9. Show Clear button in input
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) clearBtn.style.display = 'flex';

        return {
            totalFound: rankedMovies.length,
            totalPages,
            parsed,
            response: responseText
        };
    }

    /**
     * Clear / Reset AI Search
     */
    function resetSearch() {
        const input = document.getElementById('searchInput');
        if (input) input.value = '';

        const bubble = document.getElementById('aiResponseBubble');
        if (bubble) {
            bubble.classList.remove('active');
            bubble.textContent = '';
        }

        const tags = document.getElementById('aiExtractedTags');
        if (tags) {
            tags.style.display = 'none';
            tags.innerHTML = '';
        }

        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) clearBtn.style.display = 'none';

        const statusEl = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        if (statusEl) statusEl.textContent = 'AI Movie Assistant: Ready';
        if (statusDot) statusDot.style.background = 'var(--crimson)';

        if (typeof MovieLoader.resetFilters === 'function') {
            const totalPages = MovieLoader.resetFilters();
            const ui = getUI();
            if (ui) {
                if (typeof ui.updateMoviesDisplay === 'function') ui.updateMoviesDisplay();
                if (typeof ui.updatePagination === 'function') ui.updatePagination(totalPages);
                if (typeof ui.clearMoodFilter === 'function') ui.clearMoodFilter();
            }
        }
    }

    /**
     * Initialize UI Hooks (Starter Chips, Clear Button)
     */
    function init() {
        initEnv();

        // Attach event listener to Starter Chips
        document.querySelectorAll('.ai-starter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.dataset.prompt || chip.textContent.trim();
                const input = document.getElementById('searchInput');
                if (input) {
                    input.value = prompt;
                    input.focus();
                }
                searchWithAI(prompt).then(() => {
                    const ui = getUI();
                    if (ui) {
                        if (typeof ui.updateMoviesDisplay === 'function') ui.updateMoviesDisplay();
                        const totalPages = MovieLoader.getTotalPages ? MovieLoader.getTotalPages() : 1;
                        if (typeof ui.updatePagination === 'function') ui.updatePagination(totalPages);
                    }
                });
            });
        });

        // Attach listener to clear button
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', resetSearch);
        }

        // Toggle clear button on input keystroke
        const input = document.getElementById('searchInput');
        if (input) {
            input.addEventListener('input', () => {
                if (clearBtn) {
                    clearBtn.style.display = input.value.trim().length > 0 ? 'flex' : 'none';
                }
            });
        }
    }

    return {
        init,
        searchWithAI,
        parseQuery,
        resetSearch
    };
})();

// Expose globally on window
window.AIMovieAssistant = AIMovieAssistant;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AIMovieAssistant.init);
} else {
    AIMovieAssistant.init();
}

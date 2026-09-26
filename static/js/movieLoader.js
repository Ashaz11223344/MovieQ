// Movie Loader - Handles loading and processing movie data from JSON files

const MovieLoader = (function() {
    // Configuration
    const CONFIG = {
        jsonFilesCount: 301, // Total number of JSON files (movies_1.json to movies_301.json)
        moviesPerPage: 30,
        posterBaseUrl: 'https://image.tmdb.org/t/p/w780',
        defaultPoster: 'https://via.placeholder.com/300x450?text=No+Image'
    };

    // State
    let allMovies = [];
    let filteredMovies = [];
    let currentPage = 1;
    let isLoading = false;
    let loadedChunks = new Set();
    let currentSeed = (function() {
        const today = new Date();
        return (today.getFullYear() * 10000) + ((today.getMonth() + 1) * 100) + today.getDate();
    })();
    let moodMapping = {
        'happy': ['Comedy', 'Animation', 'Family', 'Music'],
        'sad': ['Drama', 'Romance'],
        'excited': ['Action', 'Adventure', 'Crime', 'Thriller'],
        'relaxed': ['Animation', 'Family', 'Music', 'Comedy'],
        'scared': ['Horror', 'Thriller', 'Mystery'],
        'thoughtful': ['Science Fiction', 'Mystery', 'Fantasy', 'Drama'],
        'romantic': ['Romance', 'Comedy', 'Drama'],
        'detective': ['Mystery', 'Crime', 'Thriller'],
        'epic': ['Fantasy', 'Adventure', 'Action'],
        'curious': ['Documentary', 'History'],
        'intense': ['Thriller', 'Action', 'Crime', 'Mystery'],
        'musical': ['Music', 'Family', 'Comedy'],
        'gritty': ['War', 'History', 'Action', 'Drama'],
        'western': ['Western', 'Action', 'Adventure'],
        'animated': ['Animation', 'Family', 'Fantasy'],
        'bored': ['Comedy', 'Action', 'Adventure', 'Fantasy'],
        // Aliases for robustness
        'action': ['Action', 'Adventure', 'Crime'],
        'horror': ['Horror', 'Thriller', 'Mystery'],
        'mystery': ['Mystery', 'Crime', 'Thriller'],
        'scifi': ['Science Fiction', 'Fantasy', 'Mystery'],
        'comedy': ['Comedy', 'Family', 'Romance'],
        'adventure': ['Adventure', 'Action', 'Fantasy']
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

    // Curated fallback movies with real TMDB posters for immediate offline/fallback rendering
    const CURATED_MOVIES = [
        {
            id: 550,
            title: "Fight Club",
            original_title: "Fight Club",
            overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
            popularity: 88.5,
            vote_average: 8.4,
            vote_count: 27000,
            release_date: "1999-10-15",
            poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            original_language: "en",
            genres: ["Drama", "Thriller"],
            genre_names: "Drama, Thriller",
            runtime: 139,
            tagline: "Mischief. Mayhem. Soap.",
            imdb_rating: 8.8,
            status: "Released",
            cast: "Brad Pitt, Edward Norton, Helena Bonham Carter",
            director: "David Fincher"
        },
        {
            id: 680,
            title: "Pulp Fiction",
            original_title: "Pulp Fiction",
            overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in four tales of violence and redemption.",
            popularity: 92.4,
            vote_average: 8.5,
            vote_count: 26000,
            release_date: "1994-09-10",
            poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            original_language: "en",
            genres: ["Crime", "Drama", "Thriller"],
            genre_names: "Crime, Drama, Thriller",
            runtime: 154,
            tagline: "Just because you are a character doesn't mean that you have character.",
            imdb_rating: 8.9,
            status: "Released",
            cast: "John Travolta, Samuel L. Jackson, Uma Thurman",
            director: "Quentin Tarantino"
        },
        {
            id: 155,
            title: "The Dark Knight",
            original_title: "The Dark Knight",
            overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent, but a psychopathic criminal mastermind known as the Joker unleashes chaos.",
            popularity: 110.2,
            vote_average: 8.5,
            vote_count: 31000,
            release_date: "2008-07-16",
            poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            original_language: "en",
            genres: ["Action", "Crime", "Drama"],
            genre_names: "Action, Crime, Drama",
            runtime: 152,
            tagline: "Why So Serious?",
            imdb_rating: 9.0,
            status: "Released",
            cast: "Christian Bale, Heath Ledger, Aaron Eckhart",
            director: "Christopher Nolan"
        },
        {
            id: 27205,
            title: "Inception",
            original_title: "Inception",
            overview: "Cobb, a skilled thief who steals corporate secrets through the use of dream-sharing technology, is given the inverse task of planting an idea into the mind of a C.E.O.",
            popularity: 95.8,
            vote_average: 8.4,
            vote_count: 35000,
            release_date: "2010-07-15",
            poster_path: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
            original_language: "en",
            genres: ["Action", "Sci-Fi", "Adventure"],
            genre_names: "Action, Sci-Fi, Adventure",
            runtime: 148,
            tagline: "Your mind is the scene of the crime.",
            imdb_rating: 8.8,
            status: "Released",
            cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
            director: "Christopher Nolan"
        },
        {
            id: 496243,
            title: "Parasite",
            original_title: "기생충",
            overview: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
            popularity: 85.3,
            vote_average: 8.5,
            vote_count: 17000,
            release_date: "2019-05-30",
            poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
            original_language: "ko",
            genres: ["Comedy", "Thriller", "Drama"],
            genre_names: "Comedy, Thriller, Drama",
            runtime: 132,
            tagline: "Act like you own the place.",
            imdb_rating: 8.5,
            status: "Released",
            cast: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong",
            director: "Bong Joon-ho"
        },
        {
            id: 129,
            title: "Spirited Away",
            original_title: "千と千尋の神隠し",
            overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free herself and her family.",
            popularity: 78.4,
            vote_average: 8.5,
            vote_count: 15500,
            release_date: "2001-07-20",
            poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
            original_language: "ja",
            genres: ["Animation", "Family", "Fantasy"],
            genre_names: "Animation, Family, Fantasy",
            runtime: 125,
            tagline: "Tunnel to a mysterious world.",
            imdb_rating: 8.6,
            status: "Released",
            cast: "Rumi Hiiragi, Miyu Irino, Mari Natsuki",
            director: "Hayao Miyazaki"
        },
        {
            id: 335984,
            title: "Blade Runner 2049",
            original_title: "Blade Runner 2049",
            overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
            popularity: 82.0,
            vote_average: 7.9,
            vote_count: 12800,
            release_date: "2017-10-04",
            poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
            original_language: "en",
            genres: ["Sci-Fi", "Drama", "Mystery"],
            genre_names: "Sci-Fi, Drama, Mystery",
            runtime: 164,
            tagline: "The key to the future is finally unearthed.",
            imdb_rating: 8.0,
            status: "Released",
            cast: "Ryan Gosling, Harrison Ford, Ana de Armas",
            director: "Denis Villeneuve"
        },
        {
            id: 603,
            title: "The Matrix",
            original_title: "The Matrix",
            overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
            popularity: 84.1,
            vote_average: 8.2,
            vote_count: 24500,
            release_date: "1999-03-30",
            poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            original_language: "en",
            genres: ["Action", "Sci-Fi"],
            genre_names: "Action, Sci-Fi",
            runtime: 136,
            tagline: "Welcome to the Real World.",
            imdb_rating: 8.7,
            status: "Released",
            cast: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss",
            director: "Lana Wachowski, Lilly Wachowski"
        },
        {
            id: 157336,
            title: "Interstellar",
            original_title: "Interstellar",
            overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
            popularity: 115.6,
            vote_average: 8.4,
            vote_count: 33000,
            release_date: "2014-11-05",
            poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
            original_language: "en",
            genres: ["Adventure", "Drama", "Sci-Fi"],
            genre_names: "Adventure, Drama, Sci-Fi",
            runtime: 169,
            tagline: "Mankind was born on Earth. It was never meant to die here.",
            imdb_rating: 8.7,
            status: "Released",
            cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
            director: "Christopher Nolan"
        },
        {
            id: 244786,
            title: "Whiplash",
            original_title: "Whiplash",
            overview: "Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, even his humanity.",
            popularity: 76.5,
            vote_average: 8.4,
            vote_count: 14200,
            release_date: "2014-10-10",
            poster_path: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
            original_language: "en",
            genres: ["Drama", "Music"],
            genre_names: "Drama, Music",
            runtime: 107,
            tagline: "The road to greatness can take you to the edge.",
            imdb_rating: 8.5,
            status: "Released",
            cast: "Miles Teller, J.K. Simmons, Paul Reiser",
            director: "Damien Chazelle"
        },
        {
            id: 103,
            title: "Taxi Driver",
            original_title: "Taxi Driver",
            overview: "A mentally unstable Vietnam War veteran works as a night-time taxi driver in New York City where the perceived decadence and sleaze feeds his urge for violent action.",
            popularity: 65.3,
            vote_average: 8.2,
            vote_count: 11000,
            release_date: "1976-02-09",
            poster_path: "/ekstpH694DaPWAnbr4AmcfQbQdQ.jpg",
            original_language: "en",
            genres: ["Crime", "Drama"],
            genre_names: "Crime, Drama",
            runtime: 114,
            tagline: "On every street in every city, there's a nobody who dreams of being a somebody.",
            imdb_rating: 8.2,
            status: "Released",
            cast: "Robert De Niro, Jodie Foster, Cybill Shepherd",
            director: "Martin Scorsese"
        },
        {
            id: 769,
            title: "Goodfellas",
            original_title: "GoodFellas",
            overview: "The true story of Henry Hill, a half-Irish, half-Sicilian Brooklyn kid who is adopted by neighbourhood gangsters at an early age and climbs the ranks of a Mafia family under the guidance of Jimmy Conway.",
            popularity: 70.1,
            vote_average: 8.5,
            vote_count: 12000,
            release_date: "1990-09-12",
            poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
            original_language: "en",
            genres: ["Drama", "Crime"],
            genre_names: "Drama, Crime",
            runtime: 145,
            tagline: "Three Decades of Life in the Mafia.",
            imdb_rating: 8.7,
            status: "Released",
            cast: "Robert De Niro, Ray Liotta, Joe Pesci",
            director: "Martin Scorsese"
        },
        {
            id: 28,
            title: "Apocalypse Now",
            original_title: "Apocalypse Now",
            overview: "At the height of the Vietnam war, Captain Benjamin L. Willard is sent on a dangerous mission that, officially, 'does not exist, nor will it ever exist.' His goal is to find - and eliminate - a mysterious and renegade Colonel named Kurtz.",
            popularity: 58.7,
            vote_average: 8.3,
            vote_count: 7800,
            release_date: "1979-08-15",
            poster_path: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
            original_language: "en",
            genres: ["Drama", "War"],
            genre_names: "Drama, War",
            runtime: 147,
            tagline: "This is the end...",
            imdb_rating: 8.4,
            status: "Released",
            cast: "Marlon Brando, Martin Sheen, Robert Duvall",
            director: "Francis Ford Coppola"
        },
        {
            id: 101,
            title: "Léon: The Professional",
            original_title: "Léon",
            overview: "Léon, the top hit man in New York, has earned a reputation as an effective 'cleaner'. But when his next-door neighbors are wiped out by a loose-cannon DEA agent, he becomes the unwilling guardian of 12-year-old Mathilda.",
            popularity: 69.2,
            vote_average: 8.3,
            vote_count: 14000,
            release_date: "1994-09-14",
            poster_path: "/yI6X2cQ2ftJyUM7asoxOSwhMsrn.jpg",
            original_language: "fr",
            genres: ["Crime", "Drama", "Action"],
            genre_names: "Crime, Drama, Action",
            runtime: 110,
            tagline: "A Perfect Killer. An Innocent Girl. They have nothing left to lose but each other.",
            imdb_rating: 8.5,
            status: "Released",
            cast: "Jean Reno, Natalie Portman, Gary Oldman",
            director: "Luc Besson"
        },
        {
            id: 348,
            title: "Alien",
            original_title: "Alien",
            overview: "During its return to the earth, commercial spaceship Nostromo intercepts a distress signal from a distant planet. When a three-member team of the crew investigates the source, they encounter a terrifying life form.",
            popularity: 66.8,
            vote_average: 8.1,
            vote_count: 13500,
            release_date: "1979-05-25",
            poster_path: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg",
            original_language: "en",
            genres: ["Horror", "Sci-Fi"],
            genre_names: "Horror, Sci-Fi",
            runtime: 117,
            tagline: "In space no one can hear you scream.",
            imdb_rating: 8.5,
            status: "Released",
            cast: "Sigourney Weaver, Tom Skerritt, John Hurt",
            director: "Ridley Scott"
        },
        {
            id: 694,
            title: "The Shining",
            original_title: "The Shining",
            overview: "Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, along with his wife Wendy and their son Danny, must live isolated from the rest of the world for the winter. But they aren't prepared for the madness within.",
            popularity: 74.3,
            vote_average: 8.2,
            vote_count: 16000,
            release_date: "1980-05-23",
            poster_path: "/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg",
            original_language: "en",
            genres: ["Horror", "Thriller"],
            genre_names: "Horror, Thriller",
            runtime: 146,
            tagline: "A masterpiece of modern horror.",
            imdb_rating: 8.4,
            status: "Released",
            cast: "Jack Nicholson, Shelley Duvall, Danny Lloyd",
            director: "Stanley Kubrick"
        },
        {
            id: 598,
            title: "City of God",
            original_title: "Cidade de Deus",
            overview: "In the slums of Rio, two kids' paths diverge: one struggles to become a photographer, while the other becomes a kingpin.",
            popularity: 52.8,
            vote_average: 8.4,
            vote_count: 7000,
            release_date: "2002-08-30",
            poster_path: "/k7eYdWvhYQMY4st0FgzBn9muL04.jpg",
            original_language: "pt",
            genres: ["Drama", "Crime"],
            genre_names: "Drama, Crime",
            runtime: 130,
            tagline: "Fight and you'll never survive. Run and you'll never escape.",
            imdb_rating: 8.6,
            status: "Released",
            cast: "Alexandre Rodrigues, Leandro Firmino, Phellipe Haagensen",
            director: "Fernando Meirelles, Kátia Lund"
        },
        {
            id: 807,
            title: "Se7en",
            original_title: "Se7en",
            overview: "Two homicide detectives are on a desperate hunt for a serial killer whose crimes are based on the 'seven deadly sins'. The seasoned Det. Somerset researches each sin in an effort to get inside the killer's mind.",
            popularity: 81.1,
            vote_average: 8.4,
            vote_count: 19500,
            release_date: "1995-09-22",
            poster_path: "/6yoghtyTpznpBik8EngEmJskVUO.jpg",
            original_language: "en",
            genres: ["Crime", "Mystery", "Thriller"],
            genre_names: "Crime, Mystery, Thriller",
            runtime: 127,
            tagline: "Seven deadly sins. Seven ways to die.",
            imdb_rating: 8.6,
            status: "Released",
            cast: "Brad Pitt, Morgan Freeman, Gwyneth Paltrow",
            director: "David Fincher"
        },
        {
            id: 149,
            title: "Akira",
            original_title: "AKIRA",
            overview: "A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic psychopath who can only be stopped by two teenagers and a group of psychics.",
            popularity: 45.6,
            vote_average: 8.0,
            vote_count: 3800,
            release_date: "1988-07-16",
            poster_path: "/neZ0nWfZV4E0e9G6a3XwXUo6bO2.jpg",
            original_language: "ja",
            genres: ["Animation", "Sci-Fi", "Action"],
            genre_names: "Animation, Sci-Fi, Action",
            runtime: 124,
            tagline: "Neo-Tokyo is about to E.X.P.L.O.D.E.",
            imdb_rating: 8.0,
            status: "Released",
            cast: "Mitsuo Iwata, Nozomu Sasaki, Mami Koyama",
            director: "Katsuhiro Otomo"
        },
        {
            id: 670,
            title: "Oldboy",
            original_title: "올드보이",
            overview: "After being kidnapped and imprisoned for fifteen years, Oh Dae-Su is released, only to find that he must find his captor in five days.",
            popularity: 54.2,
            vote_average: 8.3,
            vote_count: 8100,
            release_date: "2003-11-21",
            poster_path: "/pWDtHJqTGKO0VNzGL9bt07Gs0BG.jpg",
            original_language: "ko",
            genres: ["Action", "Drama", "Mystery"],
            genre_names: "Action, Drama, Mystery",
            runtime: 120,
            tagline: "15 years of imprisonment, 5 days of vengeance.",
            imdb_rating: 8.4,
            status: "Released",
            cast: "Choi Min-sik, Yoo Ji-tae, Kang Hye-jung",
            director: "Park Chan-wook"
        },
        {
            id: 64690,
            title: "Drive",
            original_title: "Drive",
            overview: "A mysterious Hollywood action film stuntman who moonlights as a getaway driver finds himself in trouble when he helps out his neighbor in this hard-boiled crime thriller.",
            popularity: 56.4,
            vote_average: 7.9,
            vote_count: 12000,
            release_date: "2011-09-15",
            poster_path: "/602vevIURmpCzsrlLmM5263r7Wb.jpg",
            original_language: "en",
            genres: ["Drama", "Thriller", "Crime"],
            genre_names: "Drama, Thriller, Crime",
            runtime: 100,
            tagline: "There are no clean getaways.",
            imdb_rating: 7.8,
            status: "Released",
            cast: "Ryan Gosling, Carey Mulligan, Bryan Cranston",
            director: "Nicolas Winding Refn"
        },
        {
            id: 68718,
            title: "Django Unchained",
            original_title: "Django Unchained",
            overview: "With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
            popularity: 88.0,
            vote_average: 8.2,
            vote_count: 24800,
            release_date: "2012-12-25",
            poster_path: "/7oWY8vdWW7thTzWh3OKYRkWUlD5.jpg",
            original_language: "en",
            genres: ["Drama", "Western"],
            genre_names: "Drama, Western",
            runtime: 165,
            tagline: "Life, liberty and the pursuit of vengeance.",
            imdb_rating: 8.5,
            status: "Released",
            cast: "Jamie Foxx, Christoph Waltz, Leonardo DiCaprio",
            director: "Quentin Tarantino"
        },
        {
            id: 313369,
            title: "La La Land",
            original_title: "La La Land",
            overview: "Mia, an aspiring actress, and Sebastian, a dedicated jazz musician, are struggling to make ends meet in a city known for crushing hopes and breaking hearts.",
            popularity: 63.9,
            vote_average: 7.9,
            vote_count: 15900,
            release_date: "2016-11-29",
            poster_path: "/uDO8zWDhfWwoFdKS4fzkVJb80P5.jpg",
            original_language: "en",
            genres: ["Comedy", "Drama", "Romance", "Music"],
            genre_names: "Comedy, Drama, Romance, Music",
            runtime: 128,
            tagline: "Here's to the fools who dream.",
            imdb_rating: 8.0,
            status: "Released",
            cast: "Ryan Gosling, Emma Stone, John Legend",
            director: "Damien Chazelle"
        },
        {
            id: 205596,
            title: "The Grand Budapest Hotel",
            original_title: "The Grand Budapest Hotel",
            overview: "The adventures of Gustave H, a legendary concierge at a famous European hotel between the wars, and Zero Moustafa, the lobby boy who becomes his most trusted friend.",
            popularity: 58.2,
            vote_average: 8.1,
            vote_count: 13900,
            release_date: "2014-02-26",
            poster_path: "/eWdyYQreja6JGCzqHWX9NZkt5BW.jpg",
            original_language: "en",
            genres: ["Comedy", "Drama"],
            genre_names: "Comedy, Drama",
            runtime: 99,
            tagline: "A story of theft, romance, and murder.",
            imdb_rating: 8.1,
            status: "Released",
            cast: "Ralph Fiennes, F. Murray Abraham, Mathieu Amalric",
            director: "Wes Anderson"
        }
    ];

    // Calculate 3 diverse initial chunks from the 301 files based on current day of year
    function getRotatingInitialChunks() {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const dayOfYear = Math.max(1, Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)));
        const c1 = 1; // Always chunk 1: iconic classics & core catalog
        const c2 = ((dayOfYear * 7 + 11) % CONFIG.jsonFilesCount) + 1;
        const c3 = ((dayOfYear * 17 + 43) % CONFIG.jsonFilesCount) + 1;
        return Array.from(new Set([c1, c2, c3]));
    }

    // Deterministic pseudo-random hash between 0 and 1
    function pseudoRandomHash(id, seed) {
        const str = String(id) + '_' + String(seed);
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return ((h >>> 0) % 10000) / 10000.0;
    }

    // Dynamic Recommendation & Discovery Algorithm
    // Balances popularity, rating quality, poster verification, and dynamic rotation seed
    function calculateSuggestionScore(movie, seed) {
        // Factor 1: Poster presence (verified TMDB posters look stunning on photocopied cards)
        const hasPoster = movie.poster_path && movie.poster_path.trim().length > 0;
        const posterScore = hasPoster ? 45 : -100;

        // Factor 2: Rating quality (vote_average, dampened by log vote_count)
        const voteAvg = typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(movie.vote_average) || 0;
        const voteCount = typeof movie.vote_count === 'number' ? movie.vote_count : parseInt(movie.vote_count) || 0;
        const ratingScore = voteAvg * 6.0; // Up to 60 points
        const countWeight = voteCount > 0 ? Math.min(Math.log10(voteCount + 1) * 8.0, 35.0) : 0; // Up to 35 points

        // Factor 3: Popularity tier (logarithmic so massive scores don't freeze the top)
        const pop = typeof movie.popularity === 'number' ? movie.popularity : parseFloat(movie.popularity) || 0;
        const popScore = Math.min(Math.log10(pop + 1) * 18.0, 45.0); // Up to 45 points

        // Factor 4: Dynamic Rotation Jitter (changes with each seed or session!)
        const hash = pseudoRandomHash(movie.id, seed);
        const rotationJitter = hash * 50.0; // Up to 50 points of dynamic variance

        // Factor 5: Recency subtle touch
        let recencyBoost = 0;
        if (movie.release_date && movie.release_date.length >= 4) {
            const year = parseInt(movie.release_date.substring(0, 4));
            if (year >= 2018) recencyBoost = 6;
            else if (year >= 2000) recencyBoost = 3;
        }

        return posterScore + ratingScore + countWeight + popScore + rotationJitter + recencyBoost;
    }

    // Load movies with triple redundancy: local files -> raw GitHub API -> curated collection
    async function loadMovies() {
        if (allMovies.length > 0) return allMovies;

        isLoading = true;
        allMovies = [];

        try {
            // First attempt: try local files with rotating chunks
            const filesToLoad = getRotatingInitialChunks();
            const localPromises = filesToLoad.map(async (fileNum) => {
                try {
                    const response = await fetch(`data/movies_${fileNum}.json`, { signal: AbortSignal.timeout(1500) });
                    if (!response.ok) return [];
                    const movies = await response.json();
                    if (Array.isArray(movies)) {
                        loadedChunks.add(fileNum);
                        return movies;
                    }
                    return [];
                } catch {
                    return [];
                }
            });

            const localResults = await Promise.all(localPromises);
            const flatLocal = localResults.flat();

            if (flatLocal.length > 0) {
                processRawMovies(flatLocal);
                return allMovies;
            }

            // Second attempt: Fetch from GitHub repository raw URL (online mode)
            try {
                const remoteUrl = 'https://raw.githubusercontent.com/Ashaz11223344/MovieQ/main/data/movies_1.json';
                const remoteResponse = await fetch(remoteUrl, { signal: AbortSignal.timeout(3500) });
                if (remoteResponse.ok) {
                    const remoteMovies = await remoteResponse.json();
                    if (Array.isArray(remoteMovies) && remoteMovies.length > 0) {
                        processRawMovies(remoteMovies);
                        loadedChunks.add(1);
                        return allMovies;
                    }
                }
            } catch (remoteErr) {
                console.info('Remote catalog fetch fallback:', remoteErr.message);
            }

            // Third attempt: Use instant curated iconic cinema catalog
            allMovies = CURATED_MOVIES.map(movie => ({
                ...movie,
                backdrop_path: movie.poster_path || ''
            }));
            filteredMovies = [...allMovies];
            return allMovies;

        } catch (error) {
            console.warn('Fallback to curated cinema archives:', error);
            allMovies = CURATED_MOVIES.map(movie => ({ ...movie, backdrop_path: movie.poster_path || '' }));
            filteredMovies = [...allMovies];
            return allMovies;
        } finally {
            isLoading = false;
        }
    }

    function processRawMovies(rawList, append = false) {
        const mapped = rawList.map(movie => ({
            id: movie.id || Math.random().toString(36).substr(2, 9),
            title: movie.title || 'Untitled Reel',
            original_title: movie.original_title || movie.title || '',
            overview: movie.overview || 'No synopsis logged in tape archive.',
            popularity: typeof movie.popularity === 'number' ? movie.popularity : parseFloat(movie.popularity) || 0,
            vote_average: typeof movie.vote_average === 'number' ? movie.vote_average : parseFloat(movie.vote_average) || 0,
            vote_count: typeof movie.vote_count === 'number' ? movie.vote_count : parseInt(movie.vote_count) || 0,
            release_date: movie.release_date || '',
            poster_path: movie.poster_path || '',
            original_language: movie.original_language || 'en',
            genres: parseGenres(movie.genres || ''),
            genre_names: movie.genres || '',
            backdrop_path: movie.poster_path || '',
            runtime: movie.runtime || 0,
            tagline: movie.tagline || '',
            imdb_rating: typeof movie.imdb_rating === 'number' ? movie.imdb_rating : parseFloat(movie.imdb_rating) || 0,
            status: movie.status || 'Archived',
            cast: movie.cast || '',
            director: movie.director || '',
            production_companies: movie.production_companies || ''
        }));

        if (append) {
            const existingIds = new Set(allMovies.map(m => String(m.id)));
            const uniqueNew = mapped.filter(m => !existingIds.has(String(m.id)));
            allMovies = allMovies.concat(uniqueNew);
        } else {
            allMovies = mapped;
        }
        filteredMovies = [...allMovies];
    }

    // Dynamically load an additional chunk from the 301 files
    async function loadAdditionalChunk(chunkNum) {
        if (!chunkNum || chunkNum < 1 || chunkNum > CONFIG.jsonFilesCount) return false;
        if (loadedChunks.has(chunkNum)) return true;

        try {
            const res = await fetch(`data/movies_${chunkNum}.json`, { signal: AbortSignal.timeout(2000) });
            if (!res.ok) return false;
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                processRawMovies(data, true);
                loadedChunks.add(chunkNum);
                return true;
            }
        } catch (e) {
            console.warn(`Dynamic load of chunk ${chunkNum} failed:`, e);
        }
        return false;
    }

    // Dynamic Suggestion Algorithm: Rotates seed, samples fresh chunk, and surfaces new movie recommendations
    async function suggestNewMovies() {
        // 1. Roll a fresh recommendation seed
        currentSeed = Math.floor(Math.random() * 900000) + 100000;

        // 2. Sample an unloaded chunk from 1..301 to bring fresh movies into memory
        let newlyLoadedChunk = null;
        if (loadedChunks.size < CONFIG.jsonFilesCount) {
            for (let attempts = 0; attempts < 15; attempts++) {
                const randChunk = Math.floor(Math.random() * CONFIG.jsonFilesCount) + 1;
                if (!loadedChunks.has(randChunk)) {
                    const ok = await loadAdditionalChunk(randChunk);
                    if (ok) {
                        newlyLoadedChunk = randChunk;
                        break;
                    }
                }
            }
        }

        // 3. Re-run filters with dynamic suggestion sorting
        filterMovies({ sortBy: 'recommended' });
        currentPage = 1;

        return {
            seed: currentSeed,
            newlyLoadedChunk,
            totalMovies: allMovies.length,
            totalPages: getTotalPages()
        };
    }

    // Parse genres from your string format
    function parseGenres(genresString) {
        if (!genresString) return [];
        return genresString.split(',').map(genre => genre.trim()).filter(genre => genre !== '');
    }

    // Generate sample movies for testing
    function generateSampleMovies() {
        allMovies = [...CURATED_MOVIES];
        filteredMovies = [...allMovies];
        return allMovies;
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

        // Sort movies (defaults to smart dynamic recommendation)
        sortMovies(filters.sortBy || 'recommended');
        
        currentPage = 1; // Reset to first page after filtering
        return getTotalPages();
    }

    // Sort movies
    function sortMovies(sortBy) {
        switch(sortBy) {
            case 'recommended':
            case 'trending':
                filteredMovies.sort((a, b) => calculateSuggestionScore(b, currentSeed) - calculateSuggestionScore(a, currentSeed));
                break;
            case 'hidden_gems':
                filteredMovies.sort((a, b) => {
                    const scoreA = (a.vote_average || 0) * 12 - (a.popularity > 60 ? 25 : 0);
                    const scoreB = (b.vote_average || 0) * 12 - (b.popularity > 60 ? 25 : 0);
                    return scoreB - scoreA;
                });
                break;
            case 'rating':
                filteredMovies.sort((a, b) => {
                    const aWeighted = (a.vote_average || 0) + (a.vote_count > 100 ? 0.5 : 0);
                    const bWeighted = (b.vote_average || 0) + (b.vote_count > 100 ? 0.5 : 0);
                    return bWeighted - aWeighted;
                });
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
            case 'popularity':
                filteredMovies.sort((a, b) => b.popularity - a.popularity);
                break;
            default: // Default to smart recommendation
                filteredMovies.sort((a, b) => calculateSuggestionScore(b, currentSeed) - calculateSuggestionScore(a, currentSeed));
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

    // Get poster URL (accepts movie object or poster path string)
    function getPosterUrl(movieOrPath) {
        if (!movieOrPath) return CONFIG.defaultPoster;
        if (typeof movieOrPath === 'string') {
            if (movieOrPath.startsWith('http')) return movieOrPath;
            if (movieOrPath.startsWith('/')) return CONFIG.posterBaseUrl + movieOrPath;
            return CONFIG.posterBaseUrl + '/' + movieOrPath;
        }
        if (movieOrPath.poster_path) {
            if (movieOrPath.poster_path.startsWith('http')) return movieOrPath.poster_path;
            if (movieOrPath.poster_path.startsWith('/')) return CONFIG.posterBaseUrl + movieOrPath.poster_path;
            return CONFIG.posterBaseUrl + '/' + movieOrPath.poster_path;
        }
        return CONFIG.defaultPoster;
    }

    // Get backdrop URL (accepts movie object or path string)
    function getBackdropUrl(movieOrPath) {
        if (!movieOrPath) return '';
        const path = typeof movieOrPath === 'string' ? movieOrPath : (movieOrPath.backdrop_path || movieOrPath.poster_path);
        if (path && typeof path === 'string') {
            if (path.startsWith('http')) return path;
            const baseUrl = CONFIG.posterBaseUrl.replace('w780', 'w1280');
            return path.startsWith('/') ? (baseUrl + path) : (baseUrl + '/' + path);
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

    // Get daily featured movie based on the current calendar date
    // Get daily featured movie based on the current calendar date
    // Strict criteria: Must have TMDB Rating >= 8.0 AND IMDb Rating >= 8.0, with a valid poster
    function getDailyFeaturedMovie() {
        const pool = (allMovies && allMovies.length > 0) ? allMovies : CURATED_MOVIES;
        if (!pool || pool.length === 0) return null;

        // Filter high quality movies meeting:
        // 1. Valid poster path
        // 2. vote_average (Rating) >= 8.0
        // 3. imdb_rating (IMDb Rating) >= 8.0
        const elitePool = pool.filter(m => {
            const hasPoster = m.poster_path && typeof m.poster_path === 'string' && m.poster_path.trim().length > 0;
            const voteAvg = typeof m.vote_average === 'number' ? m.vote_average : parseFloat(m.vote_average) || 0;
            const imdbRating = typeof m.imdb_rating === 'number' ? m.imdb_rating : parseFloat(m.imdb_rating) || 0;
            return hasPoster && voteAvg >= 8.0 && imdbRating >= 8.0;
        });

        // Curated backup filtered to same 8+ criteria
        let candidatePool = elitePool;
        if (candidatePool.length === 0) {
            candidatePool = CURATED_MOVIES.filter(m => {
                const voteAvg = typeof m.vote_average === 'number' ? m.vote_average : parseFloat(m.vote_average) || 0;
                const imdbRating = typeof m.imdb_rating === 'number' ? m.imdb_rating : parseFloat(m.imdb_rating) || 0;
                return m.poster_path && voteAvg >= 8.0 && imdbRating >= 8.0;
            });
        }
        if (candidatePool.length === 0) return pool[0];

        // Date-based seed (YYYY-MM-DD)
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 1-12
        const day = today.getDate(); // 1-31

        // Murmur3-style 32-bit finalizer hash to ensure every single day selects a unique elite title
        let h = (year * 372) + (month * 31) + day;
        h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
        h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
        const seed = (h ^ (h >>> 16)) >>> 0;

        const selectedIndex = seed % candidatePool.length;
        return candidatePool[selectedIndex];
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
        getDailyFeaturedMovie,
        getMovieById,
        getPosterUrl,
        getBackdropUrl,
        getUniqueLanguages,
        getUniqueGenres,
        getLanguageName,
        isLoaded,
        CONFIG,
        suggestNewMovies,
        loadAdditionalChunk,
        getCurrentSeed: () => currentSeed,
        setSeed: (s) => { currentSeed = s; }
    };
})();
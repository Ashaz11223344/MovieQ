// Main application entry point

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize UI
    UIManager.initialize();
    
    // Show loading indicator
    UIManager.showLoading();
    
    try {
        // Load movies
        await MovieLoader.loadMovies();
        
        // Get initial filters from URL parameters if present
        const urlParams = new URLSearchParams(window.location.search);
        const initialFilters = {};
        
        if (urlParams.has('mood')) {
            initialFilters.mood = urlParams.get('mood');
            // Activate corresponding mood button
            document.querySelectorAll('.mood-btn').forEach(btn => {
                if (btn.dataset.mood === initialFilters.mood) {
                    btn.classList.add('active');
                }
            });
        }
        
        if (urlParams.has('language')) {
            initialFilters.language = urlParams.get('language');
            const languageSelect = document.getElementById('languageSelect');
            if (languageSelect) {
                languageSelect.value = initialFilters.language;
            }
        }
        
        if (urlParams.has('genre')) {
            initialFilters.genre = urlParams.get('genre');
            const genreSelect = document.getElementById('genreSelect');
            if (genreSelect) {
                genreSelect.value = initialFilters.genre;
            }
        }
        
        if (urlParams.has('search')) {
            initialFilters.searchText = urlParams.get('search');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = initialFilters.searchText;
            }
        }
        
        // Apply filters and display movies
        const totalPages = MovieLoader.filterMovies(initialFilters);
        UIManager.updateMoviesDisplay();
        UIManager.updatePagination(totalPages);
        
        // Hide loading indicator
        UIManager.hideLoading();
        
    } catch (error) {
        console.error('Error initializing application:', error);
        UIManager.hideLoading();
        
        // Show error message
        const moviesGrid = document.getElementById('moviesGrid');
        if (moviesGrid) {
            moviesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>Error loading movies</h3>
                    <p>Please check your internet connection and try again</p>
                    <button onclick="location.reload()" class="btn-primary">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
});

// Make UIManager and MovieLoader available globally for debugging
window.UIManager = UIManager;
window.MovieLoader = MovieLoader;

// Enhanced animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle with animation
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);

    // Observe elements to animate
    document.querySelectorAll('.filter-card, .movie-card').forEach(el => {
        observer.observe(el);
    });

    // Enhanced hover effects for movie cards
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.movie-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Loading animation improvements
    const showLoading = (element) => {
        element.style.display = 'flex';
        element.style.animation = 'fadeIn 0.3s ease-out';
    };

    const hideLoading = (element) => {
        element.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    };

    // Add CSS for fade animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .movie-card.animated {
            animation: fadeInUp 0.6s ease-out;
        }
    `;
    document.head.appendChild(style);
});
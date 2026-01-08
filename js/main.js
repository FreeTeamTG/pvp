// ===================================
// MAIN.JS - Core functionality
// ===================================

(function() {
    'use strict';
    
    // State
    const state = {
        theme: localStorage.getItem('theme') || 'dark',
        quietMode: localStorage.getItem('quietMode') === 'true',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);
    
    function init() {
        initTheme();
        initQuietMode();
        initSmoothScroll();
        initIntersectionObserver();
        initVisibilityChange();
        
        console.log('%c🔮 IMPOSSIBLE.STUDIO loaded', 'color: #00f0ff; font-size: 16px; font-weight: bold;');
    }
    
    // ===================================
    // THEME TOGGLE
    // ===================================
    
    function initTheme() {
        const toggle = document.getElementById('themeToggle');
        const valueDisplay = document.getElementById('themeValue');
        
        // Apply saved theme
        document.body.setAttribute('data-theme', state.theme);
        updateThemeDisplay();
        
        if (toggle) {
            toggle.addEventListener('click', toggleTheme);
        }
        
        function toggleTheme() {
            state.theme = state.theme === 'dark' ? 'neon' : 'dark';
            document.body.setAttribute('data-theme', state.theme);
            localStorage.setItem('theme', state.theme);
            updateThemeDisplay();
        }
        
        function updateThemeDisplay() {
            if (valueDisplay) {
                valueDisplay.textContent = state.theme === 'dark' ? 'Dark' : 'Neon';
            }
        }
    }
    
    // ===================================
    // QUIET MODE TOGGLE
    // ===================================
    
    function initQuietMode() {
        const toggle = document.getElementById('quietToggle');
        const valueDisplay = document.getElementById('quietValue');
        
        // Apply saved state
        if (state.quietMode || state.reducedMotion) {
            document.body.classList.add('quiet-mode');
        }
        updateQuietDisplay();
        
        if (toggle) {
            toggle.addEventListener('click', toggleQuietMode);
        }
        
        function toggleQuietMode() {
            state.quietMode = !state.quietMode;
            document.body.classList.toggle('quiet-mode', state.quietMode);
            localStorage.setItem('quietMode', state.quietMode);
            updateQuietDisplay();
            
            // Dispatch event for other modules
            window.dispatchEvent(new CustomEvent('quietModeChange', { 
                detail: { quietMode: state.quietMode } 
            }));
        }
        
        function updateQuietDisplay() {
            if (valueDisplay) {
                const active = state.quietMode || state.reducedMotion;
                valueDisplay.textContent = active ? 'Quiet' : 'Full';
            }
        }
    }
    
    // ===================================
    // SMOOTH SCROLL
    // ===================================
    
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: state.reducedMotion ? 'auto' : 'smooth'
                    });
                }
            });
        });
    }
    
    // ===================================
    // INTERSECTION OBSERVER (Fade in animations)
    // ===================================
    
    function initIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, options);
        
        // Observe elements
        const elementsToObserve = [
            ...document.querySelectorAll('.about__grid'),
            ...document.querySelectorAll('.timeline__item'),
            ...document.querySelectorAll('.projects__grid'),
            ...document.querySelectorAll('.freeteam__benefits'),
            ...document.querySelectorAll('.impossible-grid')
        ];
        
        elementsToObserve.forEach(el => {
            el.classList.add('fade-in-up');
            observer.observe(el);
        });
        
        // Stagger children
        const staggerContainers = document.querySelectorAll('.about__grid, .freeteam__benefits, .impossible-grid');
        staggerContainers.forEach(container => {
            container.classList.add('stagger-children');
        });
    }
    
    // ===================================
    // VISIBILITY CHANGE (Pause animations on hidden tab)
    // ===================================
    
    function initVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('page-hidden');
            } else {
                document.body.classList.remove('page-hidden');
            }
        });
    }
    
})();
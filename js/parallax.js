// ===================================
// PARALLAX EFFECT
// ===================================

(function() {
    'use strict';
    
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let isQuietMode = false;
    let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    document.addEventListener('DOMContentLoaded', init);
    
    function init() {
        if (isReducedMotion) return;
        
        isQuietMode = document.body.classList.contains('quiet-mode');
        
        // Listen for mouse movement
        document.addEventListener('mousemove', handleMouseMove);
        
        // Listen for quiet mode changes
        window.addEventListener('quietModeChange', (e) => {
            isQuietMode = e.detail.quietMode;
        });
        
        // Start animation loop
        animate();
    }
    
    function handleMouseMove(e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    
    function animate() {
        if (!isReducedMotion && !document.hidden) {
            // Smooth follow
            currentX += (mouseX - currentX) * 0.05;
            currentY += (mouseY - currentY) * 0.05;
            
            // Apply to hero background figure
            const heroBg = document.getElementById('heroBgFigure');
            if (heroBg && !isQuietMode) {
                const moveX = currentX * 30;
                const moveY = currentY * 30;
                heroBg.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            }
            
            // Apply subtle parallax to impossible cards
            const cards = document.querySelectorAll('.impossible-card__svg');
            cards.forEach((card, index) => {
                if (!isQuietMode) {
                    const factor = 0.5 + (index % 3) * 0.2;
                    const moveX = currentX * 5 * factor;
                    const moveY = currentY * 5 * factor;
                    card.style.transform = `translate(${moveX}px, ${moveY}px)`;
                }
            });
        }
        
        requestAnimationFrame(animate);
    }
    
})();
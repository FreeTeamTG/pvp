// ===================================
// IMPOSSIBLE OBJECTS GENERATOR
// ===================================

(function() {
    'use strict';
    
    const objects = [
        {
            name: 'Penrose Triangle',
            svg: createPenroseTriangle
        },
        {
            name: 'Impossible Cube',
            svg: createImpossibleCube
        },
        {
            name: 'Impossible Frame',
            svg: createImpossibleFrame
        },
        {
            name: 'Impossible Ring',
            svg: createImpossibleRing
        },
        {
            name: 'Impossible Z-Bar',
            svg: createImpossibleZBar
        },
        {
            name: 'Impossible Star',
            svg: createImpossibleStar
        },
        {
            name: 'Penrose Stairs',
            svg: createPenroseStairs
        },
        {
            name: 'Impossible Trident',
            svg: createImpossibleTrident
        }
    ];
    
    document.addEventListener('DOMContentLoaded', init);
    
    function init() {
        renderGallery();
        renderHeroBackground();
    }
    
    // ===================================
    // RENDER GALLERY
    // ===================================
    
    function renderGallery() {
        const grid = document.getElementById('impossibleGrid');
        if (!grid) return;
        
        objects.forEach(obj => {
            const card = document.createElement('div');
            card.className = 'impossible-card';
            card.setAttribute('role', 'img');
            card.setAttribute('aria-label', obj.name);
            
            const svgContainer = document.createElement('div');
            svgContainer.className = 'impossible-card__svg';
            svgContainer.innerHTML = obj.svg();
            
            const name = document.createElement('div');
            name.className = 'impossible-card__name';
            name.textContent = obj.name;
            
            card.appendChild(svgContainer);
            card.appendChild(name);
            grid.appendChild(card);
        });
    }
    
    // ===================================
    // RENDER HERO BACKGROUND
    // ===================================
    
    function renderHeroBackground() {
        const container = document.getElementById('heroBgFigure');
        if (!container) return;
        
        // Use Penrose Triangle for hero
        container.innerHTML = createPenroseTriangle();
        container.querySelector('svg').style.width = '100%';
        container.querySelector('svg').style.height = '100%';
    }
    
    // ===================================
    // SVG GENERATORS
    // ===================================
    
    function createPenroseTriangle() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <polygon class="face" points="100,30 160,130 130,130 100,75" />
                <polygon class="face-dark" points="100,30 40,130 70,130 100,75" />
                <polygon class="face-darker" points="40,130 160,130 150,150 50,150" />
                <polygon class="face" points="160,130 150,150 120,150 130,130" />
                <polygon class="face-dark" points="40,130 50,150 80,150 70,130" />
                <polygon class="face-darker" points="100,75 130,130 120,150 80,150 70,130" />
            </svg>
        `;
    }
    
    function createImpossibleCube() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <polygon class="face" points="100,50 150,75 150,125 100,100" />
                <polygon class="face-dark" points="100,50 50,75 50,125 100,100" />
                <polygon class="face-darker" points="50,125 100,150 150,125 100,100" />
                <polygon class="face stroke-thick" points="100,50 150,75 100,100 50,75" />
                <line class="stroke-thick" x1="100" y1="100" x2="100" y2="150" stroke="#080808" stroke-width="3"/>
                <line class="stroke-thick" x1="50" y1="75" x2="50" y2="125" stroke="#080808" stroke-width="3"/>
                <line class="stroke-thick" x1="150" y1="75" x2="150" y2="125" stroke="#080808" stroke-width="3"/>
            </svg>
        `;
    }
    
    function createImpossibleFrame() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect class="face" x="40" y="40" width="40" height="120" />
                <rect class="face-dark" x="40" y="40" width="120" height="40" />
                <rect class="face" x="120" y="40" width="40" height="120" />
                <rect class="face-darker" x="40" y="120" width="120" height="40" />
                <rect class="face-dark" x="60" y="60" width="20" height="80" />
                <rect class="face" x="60" y="60" width="80" height="20" />
                <rect class="face-darker" x="120" y="60" width="20" height="80" />
                <rect class="face-dark" x="60" y="120" width="80" height="20" />
            </svg>
        `;
    }
    
    function createImpossibleRing() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <ellipse class="face-darker" cx="100" cy="100" rx="60" ry="40" />
                <ellipse class="face" cx="100" cy="100" rx="40" ry="25" fill="var(--bg-secondary)" />
                <path class="face" d="M 100,60 Q 140,80 120,100 Q 140,120 100,140 Q 60,120 80,100 Q 60,80 100,60 Z" />
                <ellipse class="face-dark" cx="100" cy="100" rx="30" ry="18" />
            </svg>
        `;
    }
    
    function createImpossibleZBar() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect class="face" x="40" y="40" width="80" height="25" />
                <rect class="face-dark" x="40" y="40" width="25" height="80" />
                <polygon class="face-darker" points="115,40 140,65 65,140 40,115" />
                <rect class="face" x="115" y="135" width="25" height="25" />
                <rect class="face-dark" x="115" y="115" width="25" height="45" />
                <rect class="face-darker" x="80" y="135" width="60" height="25" />
            </svg>
        `;
    }
    
    function createImpossibleStar() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <polygon class="face" points="100,30 115,70 155,70 125,95 140,135 100,110" />
                <polygon class="face-dark" points="100,30 85,70 45,70 75,95 60,135 100,110" />
                <polygon class="face-darker" points="60,135 100,110 140,135 125,95 75,95" />
                <polygon class="face" points="125,95 155,70 140,135" />
                <polygon class="face-dark" points="75,95 45,70 60,135" />
            </svg>
        `;
    }
    
    function createPenroseStairs() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect class="face" x="40" y="120" width="40" height="20" />
                <rect class="face-dark" x="40" y="100" width="40" height="20" />
                <rect class="face-darker" x="40" y="80" width="40" height="20" />
                
                <rect class="face-dark" x="80" y="100" width="40" height="20" />
                <rect class="face-darker" x="80" y="80" width="40" height="20" />
                <rect class="face" x="80" y="60" width="40" height="20" />
                
                <rect class="face-darker" x="120" y="80" width="40" height="20" />
                <rect class="face" x="120" y="100" width="40" height="20" />
                <rect class="face-dark" x="120" y="120" width="40" height="20" />
                
                <rect class="face" x="80" y="120" width="40" height="20" />
                <polygon class="face-darker" points="80,140 120,140 120,120 80,120" />
            </svg>
        `;
    }
    
    function createImpossibleTrident() {
        return `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <rect class="face" x="50" y="40" width="15" height="120" />
                <rect class="face-dark" x="92" y="40" width="15" height="120" />
                <rect class="face" x="135" y="40" width="15" height="120" />
                
                <ellipse class="face-darker" cx="57.5" cy="45" rx="10" ry="8" />
                <ellipse class="face-darker" cx="100" cy="45" rx="10" ry="8" />
                <ellipse class="face-darker" cx="142.5" cy="45" rx="10" ry="8" />
                
                <rect class="face-dark" x="50" y="140" width="100" height="20" />
                <path class="face" d="M 50,140 L 65,160 L 135,160 L 150,140 Z" />
            </svg>
        `;
    }
    
})();
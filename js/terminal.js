// ===================================
// TERMINAL ACTIVITY FEED
// ===================================

(function() {
    'use strict';
    
    const activities = [
        'Bot #7821 started: monitoring active',
        'User connected from [REDACTED]',
        'Task completed: data processing 100%',
        'New member joined Free Team',
        'Script executed: automation.py',
        'API call successful: response 200 OK',
        'Database updated: 847 records',
        'Deployment successful: v2.4.1',
        'Webhook received: payload processed',
        'Session started: user @anonymous',
        'Cache cleared: performance optimized',
        'Backup completed: 3.2 GB archived',
        'Security scan: no threats detected',
        'Notification sent: 12 recipients',
        'Parser finished: 1,453 items scraped',
        'Connection established: WebSocket active',
        'Job queued: processing in background',
        'Update available: dependencies check',
        'Log rotated: old entries archived',
        'System health: all services operational'
    ];
    
    let terminalBody;
    let lineCount = 0;
    let maxLines = 50;
    let intervalId;
    
    document.addEventListener('DOMContentLoaded', init);
    
    function init() {
        terminalBody = document.getElementById('terminalBody');
        if (!terminalBody) return;
        
        // Add initial lines
        for (let i = 0; i < 10; i++) {
            addLine();
        }
        
        // Start auto-add
        startAutoAdd();
        
        // Listen for quiet mode changes
        window.addEventListener('quietModeChange', handleQuietModeChange);
        
        // Pause when not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoAdd();
            } else {
                startAutoAdd();
            }
        });
    }
    
    function addLine() {
        const line = document.createElement('div');
        line.className = 'terminal__line';
        
        const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        const activity = activities[Math.floor(Math.random() * activities.length)];
        
        line.textContent = `[${timestamp}] ${activity}`;
        terminalBody.appendChild(line);
        
        lineCount++;
        
        // Remove old lines
        if (lineCount > maxLines) {
            terminalBody.removeChild(terminalBody.firstChild);
            lineCount--;
        }
        
        // Auto-scroll to bottom
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }
    
    function startAutoAdd() {
        stopAutoAdd(); // Clear any existing interval
        const interval = document.body.classList.contains('quiet-mode') ? 5000 : 3000;
        intervalId = setInterval(addLine, interval);
    }
    
    function stopAutoAdd() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
    
    function handleQuietModeChange(e) {
        startAutoAdd(); // Restart with new interval
    }
    
})();
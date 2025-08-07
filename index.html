// TIL (Today I Learned) Content Loader
class TILLoader {
    constructor() {
        this.tilUrl = 'https://m3hr4nn.github.io/TIL/';
        this.loadingElement = document.querySelector('.loading-spinner');
        this.tilItemsElement = document.getElementById('tilItems');
        this.errorElement = document.getElementById('errorMessage');
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async loadTILContent() {
        let retries = 0;
        
        while (retries < this.maxRetries) {
            try {
                // First, try to fetch the main page
                const response = await fetch(this.tilUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'User-Agent': 'Mozilla/5.0 (compatible; PersonalSite/1.0)'
                    },
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const htmlContent = await response.text();
                this.parseTILContent(htmlContent);
                return;

            } catch (error) {
                console.warn(`TIL fetch attempt ${retries + 1} failed:`, error.message);
                retries++;
                
                if (retries < this.maxRetries) {
                    await this.delay(this.retryDelay * retries);
                }
            }
        }

        // If all retries failed, try alternative approaches
        await this.tryAlternativeApproaches();
    }

    async tryAlternativeApproaches() {
        try {
            // Try to fetch README.md or index.md from the repository
            const readmeResponse = await fetch('https://raw.githubusercontent.com/m3hr4nn/TIL/main/README.md');
            
            if (readmeResponse.ok) {
                const readmeContent = await readmeResponse.text();
                this.parseMarkdownContent(readmeContent);
                return;
            }
        } catch (error) {
            console.warn('Alternative README fetch failed:', error.message);
        }

        // Show fallback content
        this.showFallbackContent();
    }

    parseTILContent(htmlContent) {
        try {
            // Create a temporary DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            // Look for common GitHub Pages patterns
            const tilItems = [];
            
            // Try to find TIL entries in various formats
            const listItems = doc.querySelectorAll('li, .entry, .til-item, article');
            
            listItems.forEach((item, index) => {
                if (index >= 5) return; // Limit to first 5 items
                
                const text = item.textContent.trim();
                if (text && text.length > 20) { // Only meaningful content
                    tilItems.push({
                        title: this.extractTitle(text),
                        content: this.extractContent(text),
                        date: this.extractDate(text) || 'Recent'
                    });
                }
            });

            if (tilItems.length > 0) {
                this.displayTILItems(tilItems);
            } else {
                // Try to extract from headings and paragraphs
                this.extractFromHeadings(doc);
            }

        } catch (error) {
            console.error('Error parsing TIL content:', error);
            this.showFallbackContent();
        }
    }

    extractFromHeadings(doc) {
        const tilItems = [];
        const headings = doc.querySelectorAll('h1, h2, h3, h4');
        
        headings.forEach((heading, index) => {
            if (index >= 5) return;
            
            const title = heading.textContent.trim();
            let content = '';
            
            // Get content from next sibling elements
            let next = heading.nextElementSibling;
            while (next && !next.matches('h1, h2, h3, h4') && tilItems.length < 3) {
                if (next.textContent && next.textContent.trim()) {
                    content += next.textContent.trim() + ' ';
                }
                next = next.nextElementSibling;
            }
            
            if (title && content) {
                tilItems.push({
                    title: title,
                    content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                    date: 'Recent'
                });
            }
        });

        if (tilItems.length > 0) {
            this.displayTILItems(tilItems);
        } else {
            this.showFallbackContent();
        }
    }

    parseMarkdownContent(markdown) {
        try {
            const lines = markdown.split('\n');
            const tilItems = [];
            let currentItem = null;

            lines.forEach(line => {
                if (line.startsWith('# ') || line.startsWith('## ')) {
                    if (currentItem) {
                        tilItems.push(currentItem);
                    }
                    currentItem = {
                        title: line.replace(/^#+\s/, ''),
                        content: '',
                        date: 'Recent'
                    };
                } else if (currentItem && line.trim() && !line.startsWith('#')) {
                    currentItem.content += line + ' ';
                }
            });

            if (currentItem) {
                tilItems.push(currentItem);
            }

            // Clean up content and limit items
            const cleanItems = tilItems
                .filter(item => item.content.trim().length > 20)
                .slice(0, 5)
                .map(item => ({
                    ...item,
                    content: item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '')
                }));

            if (cleanItems.length > 0) {
                this.displayTILItems(cleanItems);
            } else {
                this.showFallbackContent();
            }

        } catch (error) {
            console.error('Error parsing markdown:', error);
            this.showFallbackContent();
        }
    }

    extractTitle(text) {
        // Look for common title patterns
        const sentences = text.split(/[.!?]/);
        return sentences[0].substring(0, 60) + (sentences[0].length > 60 ? '...' : '');
    }

    extractContent(text) {
        // Return the full text, truncated if necessary
        return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    }

    extractDate(text) {
        // Simple date extraction
        const dateMatch = text.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
        return dateMatch ? dateMatch[0] : null;
    }

    displayTILItems(items) {
        this.loadingElement.style.display = 'none';
        this.tilItemsElement.style.display = 'block';
        
        this.tilItemsElement.innerHTML = items.map(item => `
            <div class="til-item">
                <h4>${this.escapeHtml(item.title)}</h4>
                <div class="date">📅 ${this.escapeHtml(item.date)}</div>
                <p>${this.escapeHtml(item.content)}</p>
            </div>
        `).join('');
    }

    showFallbackContent() {
        this.loadingElement.style.display = 'none';
        this.tilItemsElement.style.display = 'block';
        
        // Show some sample TIL content as fallback
        const fallbackItems = [
            {
                title: "Kubernetes Pod Scheduling Optimization",
                content: "Learned about advanced pod scheduling strategies using node affinity and anti-affinity rules to optimize resource distribution across clusters.",
                date: "Recent"
            },
            {
                title: "GitLab CI/CD Pipeline Enhancement",
                content: "Implemented dynamic pipeline stages that adapt based on branch patterns, reducing build times by 40% for feature branches.",
                date: "Recent"
            },
            {
                title: "Prometheus Alerting Best Practices",
                content: "Discovered effective alerting rules for monitoring container resource usage and preventing resource exhaustion before it impacts services.",
                date: "Recent"
            }
        ];

        this.tilItemsElement.innerHTML = fallbackItems.map(item => `
            <div class="til-item">
                <h4>${item.title}</h4>
                <div class="date">📅 ${item.date}</div>
                <p>${item.content}</p>
                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    <em>Sample content - visit <a href="${this.tilUrl}" target="_blank" rel="noopener noreferrer">TIL repository</a> for latest updates</em>
                </div>
            </div>
        `).join('');
    }

    showError() {
        this.loadingElement.style.display = 'none';
        this.errorElement.style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Smooth scrolling for internal links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add scroll-based animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections for scroll animations
    document.querySelectorAll('section, .job-card, .skill-category, .til-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add typing effect to header
function initTypingEffect() {
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        const text = subtitle.textContent;
        subtitle.textContent = '';
        subtitle.style.borderRight = '2px solid #667eea';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                subtitle.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                // Remove cursor after typing is complete
                setTimeout(() => {
                    subtitle.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        // Start typing after a brief delay
        setTimeout(typeWriter, 1000);
    }
}

// Add particle background effect
function initParticleBackground() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.1';
    
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            dx: (Math.random() - 0.5) * 0.5,
            dy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        };
    }
    
    function initParticles() {
        particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push(createParticle());
        }
    }
    
    function updateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            
            // Wrap around edges
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.y > canvas.height) particle.y = 0;
            if (particle.y < 0) particle.y = canvas.height;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(102, 126, 234, ${particle.opacity})`;
            ctx.fill();
        });
        
        requestAnimationFrame(updateParticles);
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initParticles();
    updateParticles();
}

// Add click ripple effect
function initRippleEffect() {
    document.querySelectorAll('.social-btn, .tag, .job-card').forEach(element => {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add CSS for ripple effect
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .social-btn, .tag, .job-card {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
}

// Performance monitoring
function initPerformanceMonitoring() {
    // Simple performance logging
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
        
        // Log resource loading times
        const resources = performance.getEntriesByType('resource');
        resources.forEach(resource => {
            if (resource.duration > 100) {
                console.log(`Slow resource: ${resource.name} (${resource.duration.toFixed(2)}ms)`);
            }
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Handle profile image fallback
    initProfileImage();
    
    // Core functionality
    const tilLoader = new TILLoader();
    tilLoader.loadTILContent();
    
    // Enhanced features
    initSmoothScrolling();
    initScrollAnimations();
    initTypingEffect();
    initRippleEffect();
    addRippleStyles();
    
    // Optional performance-friendly features
    if (window.innerWidth > 768) {
        initParticleBackground();
    }
    
    initPerformanceMonitoring();
    
    // Add some interactive feedback
    console.log('🚀 Mehran Naderizadeh\'s portfolio loaded successfully!');
    console.log('💼 DevOps Engineer | Infrastructure Specialist');
    console.log('📊 6+ years managing 5000+ computing resources');
});

// Profile image fallback handler
function initProfileImage() {
    const profileImg = document.querySelector('.profile-pic');
    const fallback = document.querySelector('.image-placeholder');
    
    if (profileImg) {
        profileImg.addEventListener('error', function() {
            this.style.display = 'none';
            if (fallback) {
                fallback.style.display = 'flex';
            }
        });
        
        profileImg.addEventListener('load', function() {
            if (fallback) {
                fallback.style.display = 'none';
            }
        });
    }
}

// Theme Management
const initTheme = () => {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Theme toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
};

// Navigation
const initNavigation = () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
    
    if (!navbar) return;
    
    // Scroll handler
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Hamburger menu
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }
    
    // Update active nav link
    const updateActiveLink = () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    
    window.addEventListener('scroll', updateActiveLink);
};

// Smooth Scrolling
const initSmoothScroll = () => {
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
};

// Simple fade-in animation
const initAnimations = () => {
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
    
    // Add animation to elements
    document.querySelectorAll('.section, .skill-card, .portfolio-card, .timeline-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
};

// Profile Image Fallback
const initProfileImage = () => {
    const profileImg = document.querySelector('.profile-image');
    const fallback = document.querySelector('.image-fallback');
    
    if (profileImg) {
        profileImg.addEventListener('error', function() {
            this.style.display = 'none';
            if (fallback) {
                fallback.style.display = 'flex';
            }
        });
    }
};

// Project Slideshow with Endless Loop
const initProjectSlideshow = () => {
    const track = document.querySelector('.slideshow-track');
    const slides = document.querySelectorAll('.project-slide');
    const prevBtn = document.getElementById('slidePrev');
    const nextBtn = document.getElementById('slideNext');
    const container = document.getElementById('projectSlideshow');
    
    if (!track || !slides.length) return;
    
    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoPlayInterval;
    let isPaused = false;
    let slidesPerView = window.innerWidth <= 768 ? 1 : 3;
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Clone slides for endless effect
    const setupEndlessScroll = () => {
        // Clone all slides and append them for continuous flow
        slides.forEach(slide => {
            const clone = slide.cloneNode(true);
            clone.classList.add('clone');
            track.appendChild(clone);
        });
    };
    
    // Update slide position
    const updatePosition = (animate = true) => {
        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        
        const slideWidth = 100 / slidesPerView;
        const translateX = -(currentIndex * slideWidth);
        track.style.transform = `translateX(${translateX}%)`;
        
        if (!animate) {
            // Force reflow
            track.offsetHeight;
            track.style.transition = '';
        }
    };
    
    // Go to specific slide
    const goToSlide = (index) => {
        currentIndex = index;
        updatePosition();
    };
    
    // Next slide with endless scroll
    const nextSlide = () => {
        currentIndex++;
        
        // Smoothly transition
        updatePosition();
        
        // Reset to beginning when reaching the cloned set
        if (currentIndex >= totalSlides) {
            setTimeout(() => {
                currentIndex = 0;
                updatePosition(false);
            }, 800);
        }
    };
    
    // Previous slide with endless scroll
    const prevSlide = () => {
        currentIndex--;
        
        // If going before first slide, jump to end
        if (currentIndex < 0) {
            currentIndex = totalSlides - 1;
            updatePosition(false);
            setTimeout(() => {
                updatePosition();
            }, 50);
        } else {
            updatePosition();
        }
    };
    
    // Auto play
    const startAutoPlay = () => {
        if (!isPaused) {
            autoPlayInterval = setInterval(nextSlide, 4000); 
        }
    };
    
    const stopAutoPlay = () => {
        clearInterval(autoPlayInterval);
    };
    
    // Event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }
    
    // Pause on hover (desktop)
    if (container) {
        container.addEventListener('mouseenter', () => {
            isPaused = true;
            stopAutoPlay();
        });
        
        container.addEventListener('mouseleave', () => {
            isPaused = false;
            startAutoPlay();
        });
        
        // Touch support for mobile
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isPaused = true;
            stopAutoPlay();
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            touchEndX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        container.addEventListener('touchend', () => {
            if (!touchEndX) return;
            
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            
            // Resume autoplay after 5 seconds on mobile
            setTimeout(() => {
                isPaused = false;
                startAutoPlay();
            }, 5000);
            
            touchEndX = 0;
        });
    }
    
    // Handle resize
    const handleResize = () => {
        const newSlidesPerView = window.innerWidth <= 768 ? 1 : 3;
        if (newSlidesPerView !== slidesPerView) {
            slidesPerView = newSlidesPerView;
            currentIndex = 0;
            updatePosition(false);
        }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initialize
    setupEndlessScroll();
    updatePosition(false);
    startAutoPlay();
};

// Cookie consent
const initCookieConsent = () => {
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('cookieConsent');
    
    if (!consentStatus && cookieConsent) {
        // Show consent banner after 2 seconds
        setTimeout(() => {
            cookieConsent.style.display = 'block';
        }, 2000);
    }
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            if (cookieConsent) cookieConsent.style.display = 'none';
        });
    }
    
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            if (cookieConsent) cookieConsent.style.display = 'none';
        });
    }
};

// Email and Phone obfuscation
const initContactProtection = () => {
    // Email links
    document.querySelectorAll('.email-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const user = link.dataset.user;
            const domain = link.dataset.domain;
            if (user && domain) {
                window.location.href = `mailto:${user}@${domain}`;
            }
        });
        
        // Update display text
        const user = link.dataset.user;
        const domain = link.dataset.domain;
        if (user && domain) {
            link.textContent = `${user}@${domain}`;
        }
    });
    
    // Phone links
    document.querySelectorAll('.phone-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const phone = link.dataset.phone;
            if (phone) {
                window.location.href = `tel:${phone}`;
            }
        });
        
        // Update display text
        const phone = link.dataset.phone;
        if (phone) {
            link.textContent = phone;
        }
    });
};

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initSmoothScroll();
    initAnimations();
    initProfileImage();
    initProjectSlideshow();
    initCookieConsent();
    initContactProtection();
    
    console.log('Portfolio initialized successfully!');
});
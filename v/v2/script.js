// ─── Dynamic Years of Experience ───────────────────────────────────────────
const updateExperience = () => {
    const startYear = 2019;
    const years = new Date().getFullYear() - startYear;
    // Update any element with data-experience="years"
    document.querySelectorAll('[data-experience="years"]').forEach(el => {
        el.textContent = `${years}+`;
    });
    // Also update the about-text h3 if it exists
    document.querySelectorAll('.about-text h3').forEach(el => {
        el.textContent = `DevOps Engineer with ${years}+ Years of Excellence`;
    });
};

// ─── Season Theme ────────────────────────────────────────────────────────────
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

const getSeasonByMonth = () => {
    const m = new Date().getMonth(); // 0-11
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'autumn';
    return 'winter';
};

const applyTheme = (season) => {
    document.documentElement.setAttribute('data-theme', season);
    localStorage.setItem('theme', season);
    // Update active button
    document.querySelectorAll('.season-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.season === season);
    });
};

const initSeasonTheme = () => {
    const saved = localStorage.getItem('theme');
    const season = SEASONS.includes(saved) ? saved : getSeasonByMonth();
    applyTheme(season);

    // Build the season switcher bar (replaces old theme toggle button)
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    // Remove old theme toggle button
    const oldToggle = document.getElementById('themeToggle');
    if (oldToggle) oldToggle.remove();

    // Create season bar
    const bar = document.createElement('div');
    bar.className = 'season-bar';
    bar.setAttribute('aria-label', 'Choose season theme');

    const icons = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
    SEASONS.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'season-btn';
        btn.dataset.season = s;
        btn.title = s.charAt(0).toUpperCase() + s.slice(1);
        btn.setAttribute('aria-label', `${s} theme`);
        btn.textContent = icons[s];
        btn.addEventListener('click', () => applyTheme(s));
        bar.appendChild(btn);
    });

    // Insert before hamburger (if exists) or append
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        navActions.insertBefore(bar, hamburger);
    } else {
        navActions.appendChild(bar);
    }
};

// ─── Navigation ──────────────────────────────────────────────────────────────
const initNavigation = () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');

    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.pageYOffset > 50);
        updateScrollProgress();
    });

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }

    const updateActiveLink = () => {
        const scrollY = window.pageYOffset;
        document.querySelectorAll('section[id]').forEach(section => {
            const top = section.offsetTop - 100;
            if (scrollY > top && scrollY <= top + section.offsetHeight) {
                const id = section.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    };
    window.addEventListener('scroll', updateActiveLink);
};

// ─── Scroll Progress Bar ─────────────────────────────────────────────────────
const updateScrollProgress = () => {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = `${pct}%`;
};

// ─── Smooth Scrolling ────────────────────────────────────────────────────────
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
};

// ─── Fade-in Animations ──────────────────────────────────────────────────────
const initAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section, .skill-card, .portfolio-card, .timeline-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
};

// ─── Profile Image Fallback ──────────────────────────────────────────────────
const initProfileImage = () => {
    const img = document.querySelector('.profile-image');
    const fallback = document.querySelector('.image-fallback');
    if (img) img.addEventListener('error', () => {
        img.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
    });
};

// ─── Project Slideshow ───────────────────────────────────────────────────────
const initProjectSlideshow = () => {
    const track = document.querySelector('.slideshow-track');
    const slides = document.querySelectorAll('.project-slide');
    const prevBtn = document.getElementById('slidePrev');
    const nextBtn = document.getElementById('slideNext');
    const container = document.getElementById('projectSlideshow');

    if (!track || !slides.length) return;

    const total = slides.length;
    let cur = 0, paused = false, interval;
    let spv = window.innerWidth <= 768 ? 1 : 3;
    let touchStart = 0, touchEnd = 0;

    slides.forEach(s => { const c = s.cloneNode(true); c.classList.add('clone'); track.appendChild(c); });

    const move = (animate = true) => {
        track.style.transition = animate ? 'transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
        track.style.transform = `translateX(${-(cur * 100 / spv)}%)`;
        if (!animate) { track.offsetHeight; track.style.transition = ''; }
    };

    const next = () => {
        cur++;
        move();
        if (cur >= total) setTimeout(() => { cur = 0; move(false); }, 800);
    };

    const prev = () => {
        cur--;
        if (cur < 0) { cur = total - 1; move(false); setTimeout(() => move(), 50); }
        else move();
    };

    const start = () => { if (!paused) interval = setInterval(next, 4000); };
    const stop = () => clearInterval(interval);

    prevBtn?.addEventListener('click', () => { prev(); stop(); start(); });
    nextBtn?.addEventListener('click', () => { next(); stop(); start(); });

    container?.addEventListener('mouseenter', () => { paused = true; stop(); });
    container?.addEventListener('mouseleave', () => { paused = false; start(); });
    container?.addEventListener('touchstart', e => { touchStart = e.changedTouches[0].screenX; paused = true; stop(); }, { passive: true });
    container?.addEventListener('touchmove', e => { touchEnd = e.changedTouches[0].screenX; }, { passive: true });
    container?.addEventListener('touchend', () => {
        if (Math.abs(touchStart - touchEnd) > 50) touchStart > touchEnd ? next() : prev();
        setTimeout(() => { paused = false; start(); }, 5000);
        touchEnd = 0;
    });

    window.addEventListener('resize', () => {
        const n = window.innerWidth <= 768 ? 1 : 3;
        if (n !== spv) { spv = n; cur = 0; move(false); }
    });

    move(false);
    start();
};

// ─── Cookie Consent ──────────────────────────────────────────────────────────
const initCookieConsent = () => {
    const banner = document.getElementById('cookieConsent');
    if (!banner || localStorage.getItem('cookieConsent')) return;
    setTimeout(() => banner.style.display = 'block', 2000);
    document.getElementById('acceptCookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted'); banner.style.display = 'none';
    });
    document.getElementById('declineCookies')?.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined'); banner.style.display = 'none';
    });
};

// ─── Contact Protection ──────────────────────────────────────────────────────
const initContactProtection = () => {
    document.querySelectorAll('.email-link').forEach(link => {
        const { user, domain } = link.dataset;
        if (user && domain) {
            link.textContent = `${user}@${domain}`;
            link.addEventListener('click', e => { e.preventDefault(); window.location.href = `mailto:${user}@${domain}`; });
        }
    });
    document.querySelectorAll('.phone-link').forEach(link => {
        const { phone } = link.dataset;
        if (phone) {
            link.textContent = phone;
            link.addEventListener('click', e => { e.preventDefault(); window.location.href = `tel:${phone}`; });
        }
    });
};

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateExperience();
    initSeasonTheme();
    initNavigation();
    initSmoothScroll();
    initAnimations();
    initProfileImage();
    initProjectSlideshow();
    initCookieConsent();
    initContactProtection();
    console.log('Portfolio initialized ✓');
});

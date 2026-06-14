// Cookie Consent Manager for m3hr4n.com
class CookieConsent {
    constructor() {
        this.consentKey = 'cookieConsent';
        this.consentData = this.getConsentData();
        this.init();
    }

    init() {
        if (!this.consentData) {
            this.showConsentBanner();
        } else {
            this.loadAnalytics();
        }
    }

    getConsentData() {
        try {
            const data = localStorage.getItem(this.consentKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    setConsentData(analytics = false) {
        const consentData = {
            analytics: analytics,
            essential: true,
            timestamp: Date.now()
        };
        localStorage.setItem(this.consentKey, JSON.stringify(consentData));
        this.consentData = consentData;
    }

    showConsentBanner() {
        if (document.getElementById('cookieConsentBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'cookieConsentBanner';
        banner.innerHTML = `
            <div class="cookie-consent-overlay">
                <div class="cookie-consent-banner">
                    <div class="cookie-consent-content">
                        <h3><i class="fas fa-cookie-bite"></i> Cookie Preferences</h3>
                        <p>This website uses cookies to enhance your experience and analyze website traffic. You can choose which cookies to accept.</p>

                        <div class="cookie-types">
                            <div class="cookie-type">
                                <label class="cookie-toggle">
                                    <input type="checkbox" checked disabled>
                                    <span class="slider essential"></span>
                                </label>
                                <div class="cookie-info">
                                    <strong>Essential Cookies</strong>
                                    <p>Required for basic functionality and security. Cannot be disabled.</p>
                                </div>
                            </div>

                            <div class="cookie-type">
                                <label class="cookie-toggle">
                                    <input type="checkbox" id="analyticsToggle">
                                    <span class="slider"></span>
                                </label>
                                <div class="cookie-info">
                                    <strong>Analytics Cookies</strong>
                                    <p>Help us understand how visitors use our website to improve user experience.</p>
                                </div>
                            </div>
                        </div>

                        <div class="cookie-actions">
                            <button class="btn-essential" onclick="cookieConsent.acceptEssential()">
                                Accept Essential Only
                            </button>
                            <button class="btn-all" onclick="cookieConsent.acceptAll()">
                                Accept All
                            </button>
                        </div>

                        <div class="cookie-links">
                            <a href="privacy-policy.html" target="_blank">Privacy Policy</a> |
                            <a href="terms-of-service.html" target="_blank">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        const styles = `
            <style>
                .cookie-consent-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                }

                .cookie-consent-banner {
                    background: var(--bg-card, #ffffff);
                    border-radius: 16px;
                    padding: 2rem;
                    max-width: 500px;
                    margin: 1rem;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--border, rgba(99, 102, 241, 0.1));
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .cookie-consent-content h3 {
                    color: var(--text, #1e293b);
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.3rem;
                }

                .cookie-consent-content h3 i {
                    color: var(--accent, #6366f1);
                }

                .cookie-consent-content p {
                    color: var(--text-secondary, #64748b);
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }

                .cookie-types {
                    margin: 1.5rem 0;
                }

                .cookie-type {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 1rem;
                    background: var(--mesh-1, rgba(20, 184, 166, 0.05));
                    border-radius: 8px;
                }

                .cookie-toggle {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }

                .cookie-toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: 0.3s;
                    border-radius: 24px;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.3s;
                    border-radius: 50%;
                }

                .cookie-toggle input:checked + .slider {
                    background-color: var(--accent, #6366f1);
                }

                .cookie-toggle input:checked + .slider:before {
                    transform: translateX(26px);
                }

                .slider.essential {
                    background-color: var(--accent, #6366f1);
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .slider.essential:before {
                    transform: translateX(26px);
                }

                .cookie-info strong {
                    color: var(--text, #1e293b);
                    display: block;
                    margin-bottom: 0.25rem;
                }

                .cookie-info p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary, #64748b);
                }

                .cookie-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .cookie-actions button {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }

                .btn-essential {
                    background: var(--border, #e2e8f0);
                    color: var(--text, #1e293b);
                }

                .btn-essential:hover {
                    background: var(--text-secondary, #64748b);
                    color: white;
                }

                .btn-all {
                    background: linear-gradient(135deg, var(--gradient-1, #14b8a6), var(--gradient-2, #6366f1));
                    color: white;
                }

                .btn-all:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
                }

                .cookie-links {
                    text-align: center;
                    margin-top: 1rem;
                    font-size: 0.8rem;
                }

                .cookie-links a {
                    color: var(--accent, #6366f1);
                    text-decoration: none;
                }

                .cookie-links a:hover {
                    text-decoration: underline;
                }

                @media (max-width: 768px) {
                    .cookie-consent-banner {
                        margin: 0.5rem;
                        padding: 1.5rem;
                    }

                    .cookie-actions {
                        flex-direction: column;
                    }

                    .cookie-type {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(banner);
    }

    acceptEssential() {
        this.setConsentData(false);
        this.hideConsentBanner();
    }

    acceptAll() {
        this.setConsentData(true);
        this.hideConsentBanner();
        this.loadAnalytics();
    }

    hideConsentBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease-out forwards';
            setTimeout(() => banner.remove(), 300);
        }
    }

    loadAnalytics() {
        if (this.consentData && this.consentData.analytics) {
            console.log('Analytics cookies accepted - would load analytics here');
            // Add your analytics code here
            // Example: Google Analytics, etc.
        }
    }

    // Method to reset consent (for testing or settings page)
    resetConsent() {
        localStorage.removeItem(this.consentKey);
        this.consentData = null;
        location.reload();
    }

    // Check if user has consented to analytics
    hasAnalyticsConsent() {
        return this.consentData && this.consentData.analytics;
    }
}

// Initialize cookie consent when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
});

// Add slide down animation
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes slideDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(30px); opacity: 0; }
        }
    </style>
`);
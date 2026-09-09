/**
 * Ù…Ø³Ø§Ø± ÙˆØ«Ø§Ø¦Ù‚ â€” Validation Landing Page
 * Form handling, navigation, validation, and interaction tracking.
 * No external dependencies.
 */

(function () {
    'use strict';

    // ============================================================
    // DEPLOYMENT READINESS MODULE (config, UTM, consent, analytics, lead delivery)
    // ============================================================
    const SRDeploy = (function () {
        // ---- Config (owner-editable before deployment) ----
        const config = {
            // Lead capture endpoint (empty = localStorage only)
            // Set via <meta name="sr-lead-endpoint" content="..."> or window.__SR_LEAD_ENDPOINT
            leadEndpoint: (function () {
                var meta = document.querySelector('meta[name="sr-lead-endpoint"]');
                var metaVal = meta && meta.content ? String(meta.content).trim() : '';
                var winVal = window.__SR_LEAD_ENDPOINT ? String(window.__SR_LEAD_ENDPOINT).trim() : '';
                return winVal || metaVal || '';
            })(),
            // Consent version to record with submissions
            consentVersion: (function () {
                var meta = document.querySelector('meta[name="sr-consent-version"]');
                var metaVal = meta && meta.content ? String(meta.content).trim() : '';
                return metaVal || 'v1.0-2026-09-09';
            })(),
            // Analytics handlers (register via SRDeploy.on)
            analyticsHandlers: [],
            // UTM params to capture
            utmKeys: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'],
            // noindex,nofollow for controlled validation
            noindex: true,
        };

        // ---- UTM capture & first-touch attribution ----
        function initUtm() {
            try {
                const params = new URLSearchParams(window.location.search);
                const utmData = {};
                let hasUtm = false;
                config.utmKeys.forEach(function (key) {
                    const val = params.get(key);
                    if (val) {
                        utmData[key] = val;
                        hasUtm = true;
                    }
                });
                // Add referrer if no UTM (store under configured key "ref")
                if (!hasUtm && document.referrer) {
                    utmData.ref = document.referrer;
                }
                if (Object.keys(utmData).length > 0) {
                    const existing = JSON.parse(localStorage.getItem('sr_utm_first') || '{}');
                    if (Object.keys(existing).length === 0) {
                        localStorage.setItem('sr_utm_first', JSON.stringify(utmData));
                    }
                    // Also store current session UTM
                    localStorage.setItem('sr_utm_session', JSON.stringify(utmData));
                }
            } catch (e) {
                // noop
            }
        }

        function getUtmData() {
            try {
                return {
                    first: JSON.parse(localStorage.getItem('sr_utm_first') || '{}'),
                    session: JSON.parse(localStorage.getItem('sr_utm_session') || '{}'),
                };
            } catch (e) {
                return { first: {}, session: {} };
            }
        }

        // ---- Consent recording ----
        function getConsentPayload(form) {
            try {
                if (!form || !form.querySelector) {
                    return {
                        consent_given: false,
                        consent_version: config.consentVersion,
                        consent_timestamp: new Date().toISOString(),
                    };
                }
                const consent = form.querySelector('input[name="consent"]');
                return {
                    consent_given: consent ? consent.checked : false,
                    consent_version: config.consentVersion,
                    consent_timestamp: new Date().toISOString(),
                };
            } catch (e) {
                return {
                    consent_given: false,
                    consent_version: config.consentVersion,
                    consent_timestamp: new Date().toISOString(),
                };
            }
        }

        // ---- Analytics event bus ----
        function track(eventName, payload) {
            const utm = getUtmData();
            const event = {
                name: eventName,
                payload: Object.assign({}, payload || {}, {
                    _utm_first: utm.first,
                    _utm_session: utm.session,
                }),
                timestamp: new Date().toISOString()
            };

            // Call registered handlers
            config.analyticsHandlers.forEach(function (h) {
                try { h(event); } catch (e) { /* noop */ }
            });

            // Local debug log
            if (window.__SRValidation) {
                console.log('[SRDeploy] track:', eventName, payload);
            }
        }

        function on(handler) {
            if (typeof handler === 'function') {
                config.analyticsHandlers.push(handler);
            }
        }

        function off(handler) {
            const idx = config.analyticsHandlers.indexOf(handler);
            if (idx > -1) config.analyticsHandlers.splice(idx, 1);
        }

        // ---- Lead delivery (POST to endpoint or localStorage fallback) ----
        function submitLead(formType, formData, formEl) {
            const formIdByType = {
                early_access: 'earlyAccessForm',
                demo_request: 'demoForm',
                paid_pilot: 'pilotForm',
                contact: 'contactForm'
            };

            let consentForm = formEl;
            if (!consentForm && formIdByType[formType]) {
                consentForm = document.getElementById(formIdByType[formType]);
            }

            const payload = Object.assign({}, formData, getConsentPayload(consentForm), {
                _utm: getUtmData(),
                _page: window.location.href,
                _ua: navigator.userAgent,
            });

            // Ensure consent_required fields always exist in payload for analytics consistency
            if (payload.consent_given === undefined) payload.consent_given = false;
            if (!payload.consent_version) payload.consent_version = config.consentVersion;

            // Track form submit event
            track('form_submit', { type: formType, payload: payload });

            // If endpoint configured, POST it
            if (config.leadEndpoint) {
                return fetch(config.leadEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true,
                }).then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    track('form_submit_success', { type: formType });
                    return res.json();
                }).catch(function (err) {
                    track('form_submit_error', { type: formType, error: String(err) });
                    // Fallback to localStorage
                    return saveLocal(formType, payload);
                });
            }

            // Default: localStorage only
            return saveLocal(formType, payload);
        }

        function saveLocal(formType, payload) {
            const submission = Object.assign({ _type: formType, _timestamp: new Date().toISOString() }, payload);
            try {
                const existing = JSON.parse(localStorage.getItem('sr_submissions') || '[]');
                existing.push(submission);
                localStorage.setItem('sr_submissions', JSON.stringify(existing));
                track('form_submit_success', { type: formType, local: true });
                return Promise.resolve(submission);
            } catch (e) {
                track('form_submit_error', { type: formType, error: String(e), local: true });
                return Promise.reject(e);
            }
        }

        // ---- Noindex/nofollow for controlled validation ----
        function applyNoindex() {
            if (!config.noindex) return;
            var meta = document.querySelector('meta[name="robots"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'robots';
                document.head.appendChild(meta);
            }
            meta.content = 'noindex, nofollow';
        }

        // ---- Public API ----
        return {
            config: config,
            initUtm: initUtm,
            getUtmData: getUtmData,
            getConsentPayload: getConsentPayload,
            track: track,
            on: on,
            off: off,
            submitLead: submitLead,
            applyNoindex: applyNoindex,
        };
    })();

    // Initialize UTM capture + noindex immediately
    SRDeploy.initUtm();
    SRDeploy.applyNoindex();

    // ============================================================
    // STATE
    // ============================================================
    const state = {
        /** @type {Array<Object>} All form submissions logged locally */
        submissions: JSON.parse(localStorage.getItem('sr_submissions') || '[]'),
        /** @type {Object} CTA click events */
        ctaClicks: JSON.parse(localStorage.getItem('sr_cta_clicks') || '{}'),
    };

    function saveSubmissions() {
        localStorage.setItem('sr_submissions', JSON.stringify(state.submissions));
    }

    function saveCtaClicks() {
        localStorage.setItem('sr_cta_clicks', JSON.stringify(state.ctaClicks));
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    function initNavigation() {
        const navbar = document.getElementById('navbar');
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('navLinks');

        if (!navbar || !toggle || !links) return;

        // Scroll shadow
        let ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    navbar.classList.toggle('scrolled', window.scrollY > 10);
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Mobile toggle
        toggle.addEventListener('click', function () {
            const isOpen = links.classList.toggle('active');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-expanded', isOpen);
        });

        // Close mobile nav on link click
        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                links.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close on outside click
        document.addEventListener('click', function (e) {
            if (!navbar.contains(e.target) && links.classList.contains('active')) {
                links.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ============================================================
    // FORM VALIDATION
    // ============================================================
    const validators = {
        required: function (value) {
            return value && value.trim().length > 0;
        },
        email: function (value) {
            if (!value) return true; // optional
            // Accept email or Saudi phone number
            var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            var phoneRe = /^\+?966[0-9]{9}$/;
            var localPhone = /^05[0-9]{8}$/;
            return emailRe.test(value) || phoneRe.test(value) || localPhone.test(value.replace(/\s/g, ''));
        },
    };

    function validateField(field) {
        var name = field.name || field.id;
        var value = field.value;
        var rules = {};

        // Determine rules from name
        if (name === 'email' || name === 'ea-email' || name === 'demo-email' || name === 'pilot-email' || name === 'contact-email') {
            rules = { required: true, email: true };
        } else if (field.hasAttribute('required')) {
            rules = { required: true };
        }

        var errors = [];
        if (rules.required && !validators.required(value)) {
            errors.push('Ù‡Ø°Ø§ Ø§Ù„Ø­Ù‚Ù„ Ù…Ø·Ù„ÙˆØ¨');
        }
        if (rules.email && !validators.email(value)) {
            errors.push('Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯Ø§Ù‹ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ§Ù‹ ØµØ­ÙŠØ­Ø§Ù‹ Ø£Ùˆ Ø±Ù‚Ù… ØªÙˆØ§ØµÙ„ Ø³Ø¹ÙˆØ¯ÙŠ');
        }

        // Show/hide error
        var errorEl = field.parentElement.querySelector('.error-message');
        if (errors.length > 0) {
            field.classList.add('error');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'error-message';
                field.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = errors[0];
            errorEl.classList.add('visible');
            return false;
        } else {
            field.classList.remove('error');
            if (errorEl) {
                errorEl.classList.remove('visible');
            }
            return true;
        }
    }

    function validateForm(form) {
        var fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        var valid = true;
        fields.forEach(function (f) {
            if (!validateField(f)) valid = false;
        });
        // Check consent checkbox
        var consent = form.querySelector('input[name="consent"]');
        if (consent && !consent.checked) {
            valid = false;
            var consentLabel = consent.closest('.checkbox-label');
            if (consentLabel) {
                consentLabel.style.color = 'var(--color-danger)';
                setTimeout(function () {
                    consentLabel.style.color = '';
                }, 3000);
            }
        }
        return valid;
    }

    // ============================================================
    // FORM SUBMISSION
    // ============================================================
    function getFormType(form) {
        if (form.id === 'earlyAccessForm') return 'early_access';
        if (form.id === 'demoForm') return 'demo_request';
        if (form.id === 'pilotForm') return 'paid_pilot';
        if (form.id === 'contactForm') return 'contact';
        return 'unknown';
    }

    function collectFormData(form) {
        var data = { _type: getFormType(form), _timestamp: new Date().toISOString() };
        var inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(function (input) {
            if (input.name && input.name !== 'consent') {
                data[input.name] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        return data;
    }

    function showModal(type) {
        var modal = document.getElementById('successModal');
        var title = document.getElementById('modal-title');
        var msg = document.getElementById('modal-message');
        if (!modal) return;

        var messages = {
            early_access: {
                title: 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù‡ØªÙ…Ø§Ù…Ùƒ Ø¨Ù†Ø¬Ø§Ø­! âœ…',
                msg: 'Ø³Ù†ÙˆØ§ØµÙ„ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ø­ÙˆÙ„ Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„Ù…Ø¨ÙƒØ± Ù„Ù…Ø³Ø§Ø± ÙˆØ«Ø§Ø¦Ù‚. Ø´ÙƒØ±Ø§Ù‹ Ù„Ø§Ù‡ØªÙ…Ø§Ù…Ùƒ!'
            },
            demo_request: {
                title: 'ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨ Ø§Ù„Ø¹Ø±Ø¶ Ø§Ù„ØªÙˆØ¶ÙŠØ­ÙŠ! ðŸŽ¬',
                msg: 'Ø³Ù†ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ù„ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆØ¹Ø¯ Ù…Ù†Ø§Ø³Ø¨ Ù„Ù„Ø¹Ø±Ø¶. Ø´ÙƒØ±Ø§Ù‹ Ù„Ùƒ!'
            },
            paid_pilot: {
                title: 'ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠ! ðŸš€',
                msg: 'Ø³Ù†Ø±Ø§Ø¬Ø¹ Ø·Ù„Ø¨Ùƒ ÙˆÙ†ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ù„Ù…Ù†Ø§Ù‚Ø´Ø© Ø§Ù„ØªÙØ§ØµÙŠÙ„. Ø´ÙƒØ±Ø§Ù‹ Ù„Ø«Ù‚ØªÙƒ!'
            },
            contact: {
                title: 'ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„ØªÙƒ! ðŸ“©',
                msg: 'Ø³Ù†Ø±Ø¯ Ø¹Ù„ÙŠÙƒ ÙÙŠ Ø£Ù‚Ø±Ø¨ ÙˆÙ‚Øª Ù…Ù…ÙƒÙ†. Ø´ÙƒØ±Ø§Ù‹ Ù„ØªÙˆØ§ØµÙ„Ùƒ!'
            }
        };

        var info = messages[type] || messages.contact;
        title.textContent = info.title;
        msg.textContent = info.msg;
        modal.hidden = false;

        // Trap focus
        var closeBtn = document.getElementById('modalClose');
        if (closeBtn) closeBtn.focus();

        // Close handlers
        closeBtn.onclick = function () { modal.hidden = true; };
        modal.querySelector('.modal-overlay').onclick = function () { modal.hidden = true; };
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                modal.hidden = true;
                document.removeEventListener('keydown', handler);
            }
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        var form = e.target;

        if (!validateForm(form)) {
            // Focus first error
            var firstError = form.querySelector('.error');
            if (firstError) firstError.focus();
            return;
        }

        var data = collectFormData(form);

        // Track CTA conversion (local)
        var type = data._type;
        state.ctaClicks[type] = (state.ctaClicks[type] || 0) + 1;
        saveCtaClicks();

        // Log to console for debugging in local preview
        console.log('[Ù…Ø³Ø§Ø± ÙˆØ«Ø§Ø¦Ù‚] Form submitted:', type, data);

        // Submit via deployment module (POST to endpoint or localStorage fallback)
        SRDeploy.submitLead(type, data, form).then(function (result) {
            // Refresh local debug state
            try {
                state.submissions = JSON.parse(localStorage.getItem('sr_submissions') || '[]');
            } catch (e) { /* noop */ }

            // Show success modal on success
            showModal(type);
            // Reset form
            form.reset();
        }).catch(function (err) {
            // Still show modal for UX, but log error
            console.error('[Ù…Ø³Ø§Ø± ÙˆØ«Ø§Ø¦Ù‚] Form submit error:', err);
            showModal(type);
            form.reset();
        });
    }

    // ============================================================
    // CTA CLICK TRACKING
    // ============================================================
    function trackCtaClicks() {
        var ctaLinks = document.querySelectorAll('a[href="#early-access"], a[href="#demo-request"], a[href="#paid-pilot"]');
        ctaLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                var target = link.getAttribute('href').replace('#', '');
                state.ctaClicks['cta_' + target] = (state.ctaClicks['cta_' + target] || 0) + 1;
                saveCtaClicks();
            });
        });
    }

    // ============================================================
    // INTERSECTION OBSERVER (fade-in animation)
    // ============================================================
    function initAnimations() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        var animateEls = document.querySelectorAll('.value-card, .pain-card, .step-card, .who-card, .category-card, .pricing-card, .benefit-item');
        animateEls.forEach(function (el, i) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease ' + (i % 4) * 0.1 + 's, transform 0.5s ease ' + (i % 4) * 0.1 + 's';
            observer.observe(el);
        });
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        initNavigation();
        trackCtaClicks();
        initAnimations();

        // Attach form handlers
        var forms = document.querySelectorAll('.lead-form');
        forms.forEach(function (form) {
            form.addEventListener('submit', handleFormSubmit);

            // Real-time validation on blur
            form.querySelectorAll('input, select, textarea').forEach(function (field) {
                field.addEventListener('blur', function () {
                    validateField(field);
                });
                field.addEventListener('input', function () {
                    if (field.classList.contains('error')) {
                        validateField(field);
                    }
                });
            });
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging in local preview
    window.__SRValidation = {
        getState: function () { return state; },
        getSubmissions: function () { return state.submissions; },
        getCtaClicks: function () { return state.ctaClicks; },
        clearData: function () {
            state.submissions = [];
            state.ctaClicks = {};
            localStorage.removeItem('sr_submissions');
            localStorage.removeItem('sr_cta_clicks');
            console.log('[Ù…Ø³Ø§Ø± ÙˆØ«Ø§Ø¦Ù‚] Data cleared.');
        }
    };
})();

/**
 * MD Mushfiqur Rahman Robaet - Premium SEO & Web Development Portfolio
 * Interactive Functionality & Accessibility Script
 */

/**
 * Global Application Configuration
 * To activate live Google Analytics 4 tracking across the entire site,
 * provide your G-XXXXXXXXXX Measurement ID here.
 */
const APP_CONFIG = {
  GA_MEASUREMENT_ID: window.GA_MEASUREMENT_ID || 'G-8H94C9NL4G'
};
document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initFaqAccordion();
  initSmoothScroll();
  initContactForm();
  initAnalyticsTracking();
});

/**
 * 1. Sticky Header Elevation on Scroll
 */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * 2. Accessible Mobile Navigation Drawer
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-menu-drawer');
  if (!toggleBtn || !drawer) return;

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !drawer.classList.contains('open');
    drawer.classList.toggle('open', isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  toggleBtn.addEventListener('click', () => toggleMenu());

  // Close on backdrop / drawer link click
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleMenu(false);
      toggleBtn.focus();
    }
  });
}

/**
 * 3. Interactive FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item, index) => {
    const btn = item.querySelector('.faq-question-btn');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    // Accessibility attributes
    const answerId = `faq-answer-${index + 1}`;
    btn.setAttribute('aria-controls', answerId);
    answer.setAttribute('id', answerId);

    btn.addEventListener('click', () => {
      const isCurrentlyOpen = item.classList.contains('active');

      // Close all other FAQs for clean single-focus UX
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.faq-question-btn');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        }
      });

      // Toggle current
      if (isCurrentlyOpen) {
        item.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/**
 * 4. Header-Aware Smooth Scrolling
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * 5. Contact Form UX with Direct Email (mdmushfiq883@gmail.com) and WhatsApp (01970271398) Integration
 */
function initContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = btn ? btn.innerHTML : 'Send Message';

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        Sending Message...
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spin-icon" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
      `;
    }

    const name = (document.querySelector('#fullName')?.value || '').trim();
    const email = (document.querySelector('#emailAddr')?.value || '').trim();
    const phone = (document.querySelector('#phoneNumber')?.value || '').trim() || 'Not provided';
    const serviceSelect = document.querySelector('#serviceInterest');
    const serviceText = serviceSelect && serviceSelect.selectedOptions && serviceSelect.selectedOptions[0]
      ? serviceSelect.selectedOptions[0].text
      : 'SEO / Web Development';
    const details = (document.querySelector('#projectDetails')?.value || '').trim();

    // 1. Prepare WhatsApp formatted text
    const waText = 
      `👋 Hello MD Mushfiqur Rahman Robaet,\n\n` +
      `I just submitted a project inquiry through your website:\n\n` +
      `👤 *Name:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      `📱 *Phone/WhatsApp:* ${phone}\n` +
      `🎯 *Service:* ${serviceText}\n\n` +
      `📝 *Project Details:*\n${details}\n\n` +
      `Looking forward to your response!`;

    const waUrl = `https://wa.me/8801970271398?text=${encodeURIComponent(waText)}`;

    // Try to open WhatsApp in a new tab immediately within user gesture
    try {
      window.open(waUrl, '_blank');
      trackAnalyticsEvent('whatsapp_click', {
        source: 'contact_form_auto_redirect'
      });
    } catch (err) {
      console.warn('Popup blocked by browser:', err);
    }

    // 2. Send email via FormSubmit AJAX to mdmushfiq883@gmail.com
    const emailPayload = {
      'Client Name': name,
      'Email Address': email,
      'Phone or WhatsApp': phone,
      'Service Requested': serviceText,
      'Project Details': details,
      '_subject': `New SEO Inquiry from ${name} - (${serviceText})`,
      '_template': 'table',
      '_captcha': 'false'
    };

    fetch('https://formsubmit.co/ajax/mdmushfiq883@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })
    .then(response => {
      if (response.ok) {
        trackAnalyticsEvent('contact_form_submit', {
          form_name: 'contact_section',
          service: serviceText,
          status: 'success'
        });
      }
      return response.json();
    })
    .catch(err => {
      console.warn('Background email dispatch:', err);
    })
    .finally(() => {
      // 3. Render elegant success state with direct WhatsApp button
      form.innerHTML = `
        <div class="contact-success-wrap" style="text-align: center; padding: 40px 24px; background: #FFFFFF; border-radius: 16px; border: 1px solid #D1FAE5; box-shadow: 0 10px 30px rgba(5,150,105,0.08);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #ECFDF5; color: #059669; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; border: 2px solid #A7F3D0;">✓</div>
          <h3 style="font-size: 1.6rem; color: #0B1325; margin-bottom: 12px; font-weight: 700;">Thank You, ${escapeHtml(name)}!</h3>
          <p style="color: #475569; font-size: 1.05rem; max-width: 540px; margin: 0 auto 20px auto; line-height: 1.7;">
            Your message has been dispatched to <strong>mdmushfiq883@gmail.com</strong>. MD Mushfiqur Rahman Robaet will review your project and get back to you promptly.
          </p>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 18px 20px; max-width: 520px; margin: 0 auto 26px auto; text-align: left;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <span style="font-size: 1.3rem;">💬</span>
              <strong style="color: #065F46; font-size: 0.98rem;">Direct WhatsApp Notification</strong>
            </div>
            <p style="color: #047857; font-size: 0.92rem; margin: 0; line-height: 1.5;">
              If WhatsApp didn't open automatically, click the button below to send your details directly to <strong>+880 1970271398</strong>.
            </p>
          </div>

          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background: #25D366; border-color: #25D366; box-shadow: 0 4px 14px rgba(37,211,102,0.35); padding: 14px 28px; font-size: 1rem; color: #ffffff;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Chat on WhatsApp Now
            </a>
            <button onclick="window.location.reload()" class="btn btn-secondary" style="color: #0B1325; border-color: #CBD5E1; padding: 14px 24px; font-size: 1rem;">
              Send Another Message
            </button>
          </div>
        </div>
      `;
    });
  });
}

/**
 * 6. Google Analytics 4 (GA4) Architecture & Conversion Event Tracking
 * Supports dynamic ID injection via window.GA_MEASUREMENT_ID without breaking offline/dev mode.
 * Tracks:
 * - whatsapp_click
 * - email_click
 * - phone_click
 * - contact_form_submit
 * - portfolio_outbound_click
 */
function initAnalyticsTracking() {
  const GA_ID = APP_CONFIG.GA_MEASUREMENT_ID || window.GA_MEASUREMENT_ID || null;

  // Dynamically load Google Analytics tag if a valid Measurement ID is configured
  if (GA_ID && /^G-[A-Za-z0-9]+$/.test(GA_ID)) {
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', GA_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    }
  }

  // Delegated click listener for interactive conversion elements
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';

    // 1. WhatsApp click tracking
    if (href.includes('wa.me') || href.includes('whatsapp.com')) {
      trackAnalyticsEvent('whatsapp_click', {
        link_url: href,
        link_text: link.innerText ? link.innerText.trim() : 'whatsapp_button',
        page_location: window.location.pathname
      });
      return;
    }

    // 2. Direct email click tracking
    if (href.startsWith('mailto:')) {
      trackAnalyticsEvent('email_click', {
        email_address: href.replace('mailto:', ''),
        link_text: link.innerText ? link.innerText.trim() : 'email_link',
        page_location: window.location.pathname
      });
      return;
    }

    // 3. Direct phone click tracking
    if (href.startsWith('tel:')) {
      trackAnalyticsEvent('phone_click', {
        phone_number: href.replace('tel:', ''),
        page_location: window.location.pathname
      });
      return;
    }

    // 4. Portfolio external outbound click tracking
    if (link.classList.contains('portfolio-live-link') || (href.startsWith('http') && !href.includes(window.location.hostname))) {
      trackAnalyticsEvent('portfolio_outbound_click', {
        outbound_url: href,
        link_text: link.innerText ? link.innerText.trim() : 'outbound_link',
        page_location: window.location.pathname
      });
    }
  }, { passive: true });
}

/**
 * Global helper to dispatch analytics events cleanly across dev and production
 */
function trackAnalyticsEvent(eventName, eventParams = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventParams);
    }
    // Debug logging for local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`[GA4 Event] ${eventName}:`, eventParams);
    }
  } catch (err) {
    console.warn('Analytics event dispatch error:', err);
  }
}


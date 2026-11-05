/**
 * MD Mushfiqur Rahman Robaet - Premium SEO & Web Development Portfolio
 * Interactive Functionality & Accessibility Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initFaqAccordion();
  initSmoothScroll();
  initContactForm();
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
 * 5. Contact Form UX
 */
function initContactForm() {
  const form = document.querySelector('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = 'Sending Message...';

    setTimeout(() => {
      form.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: #ECFDF5; color: #059669; font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">✓</div>
          <h3 style="font-size: 1.5rem; color: #0B1325; margin-bottom: 8px;">Thank You for Reaching Out!</h3>
          <p style="color: #475569; font-size: 1.05rem; max-width: 500px; margin: 0 auto 20px auto;">
            Your message has been received. MD Mushfiqur Rahman Robaet will review your project requirements and respond within 24 hours.
          </p>
          <button onclick="window.location.reload()" class="btn btn-primary">Send Another Message</button>
        </div>
      `;
    }, 900);
  });
}

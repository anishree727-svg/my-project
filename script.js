const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
const header = document.getElementById('header');
const progress = document.getElementById('scrollProgress');
const topBtn = document.getElementById('topBtn');
const year = document.getElementById('year');

if (year) year.textContent = new Date().getFullYear();

menuBtn?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('open');
  menuBtn.classList.toggle('open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(Boolean(isOpen)));
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  });
});

function updateScrollState() {
  const page = document.documentElement;
  const maxScroll = page.scrollHeight - page.clientHeight;
  const scrollPercent = maxScroll > 0 ? (page.scrollTop / maxScroll) * 100 : 0;

  if (progress) progress.style.width = `${scrollPercent}%`;
  if (header) header.style.boxShadow = window.scrollY > 12 ? '0 8px 28px rgba(18, 61, 44, .08)' : 'none';
  topBtn?.classList.toggle('show', window.scrollY > 600);
}

window.addEventListener('scroll', updateScrollState, { passive: true });
updateScrollState();

topBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const counters = document.querySelectorAll('[data-count]');
if (counters.length > 0) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.count || 0);
      const suffix = element.dataset.suffix || '';
      const start = performance.now();

      function animate(now) {
        const progressValue = Math.min((now - start) / 1000, 1);
        const eased = 1 - Math.pow(1 - progressValue, 3);
        element.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progressValue < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
      observer.unobserve(element);
    });
  }, { threshold: .6 });
  counters.forEach((counter) => counterObserver.observe(counter));
}

// Nav link active observer for hash links on sections
const sections = document.querySelectorAll('main section[id]');
const navHashLinks = document.querySelectorAll('.nav a[href^="#"]');
if (sections.length > 0 && navHashLinks.length > 0) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navHashLinks.forEach((link) => {
        link.classList.toggle('active', link.hash === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));
}

// Scroll reveal observer
const revealItems = document.querySelectorAll('.product-card, .product-more, .process-step, .quote-grid, .contact-form, .catalog-card');
if (revealItems.length > 0) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => {
    item.classList.add('reveal-item');
    revealObserver.observe(item);
  });
}

// Toast notification helper
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMsg');
const toastIcon = toast?.querySelector('.toast-icon');
let toastTimer;

function showToast(message, isError = false) {
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  if (toastIcon) {
    toastIcon.textContent = isError ? '!' : '✓';
  }
  toast.classList.toggle('toast-error', isError);
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 5000);
}

// Prefill requirement field from URL or card clicks
const form = document.getElementById('contactForm');
const requirementInput = form?.querySelector('input[name="requirement"]');
const nameInput = form?.querySelector('input[name="name"]');
const emailInput = form?.querySelector('input[name="email"]');

if (form && requirementInput) {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedProduct = urlParams.get('product');
  if (requestedProduct) {
    requirementInput.value = `Enquiry for ${requestedProduct}`;
  }

  document.querySelectorAll('a[data-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prodName = btn.getAttribute('data-product');
      if (prodName) {
        requirementInput.value = `Enquiry for ${prodName}`;
      }
    });
  });
}

// Real Netlify contact form submission
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Validation check
    const nameVal = nameInput ? nameInput.value.trim() : '';
    const emailVal = emailInput ? emailInput.value.trim() : '';

    if (!nameVal) {
      showToast('Please enter your name.', true);
      nameInput?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      showToast('Please enter a valid work email address.', true);
      emailInput?.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '<span>Send enquiry</span> <span>↗</span>';

    // Prevent duplicate submissions & show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending enquiry...</span> <span class="spinner" aria-hidden="true">⏳</span>';
    }

    try {
      const payload = {
        name: nameVal,
        email: emailVal,
        requirement: requirementInput ? requirementInput.value.trim() : '',
        message: form.querySelector('textarea[name="message"]')?.value.trim() || '',
        'bot-field': form.querySelector('input[name="bot-field"]')?.value || ''
      };

      let response;
      try {
        response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (fetchErr) {
        response = await fetch('/.netlify/functions/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (response && response.status === 404) {
        response = await fetch('/.netlify/functions/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      const resData = await response.json().catch(() => null);

      if (response.ok && resData && resData.success) {
        showToast(resData.message || 'Thank you! Your enquiry has been received. We will be in touch soon.', false);
        form.reset();
      } else {
        const errorMsg = (resData && resData.error) ? resData.error : `Submission error (${response.status}). Please email info@theteagroimpex.com directly.`;
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      showToast(err.message || 'Unable to submit enquiry right now. Please email info@theteagroimpex.com directly.', true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });
}

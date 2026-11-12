/**
 * SB SHOLA WOOD FLOWERS - Main Interactive Scripts
 * Lightweight, accessible, performance-focused vanilla JS
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileNav();
  initScrollReveal();
  initBotanicalCanvas();
  initGallery();
  initProductEnquiryModal();
  initContactForm();
  initScrollToTop();
});

/* ==========================================================================
   1. NAVBAR STICKY & ACTIVE HIGHLIGHT
   ========================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.site-navbar');
  const navLinks = document.querySelectorAll('.nav-link-item');
  const sections = document.querySelectorAll('section[id]');
  const sectionLinks = Array.from(navLinks).filter(link => link.getAttribute('href')?.startsWith('#'));

  window.addEventListener('scroll', () => {
    if (navbar && window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else if (navbar) {
      navbar.classList.remove('scrolled');
    }

    if (!sectionLinks.length) return;

    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    sectionLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   2. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.nav-mobile-toggle');
  const closeBtn = document.querySelector('.mobile-nav-close');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const backdrop = document.querySelector('.mobile-drawer-backdrop');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  function openMenu() {
    drawer.classList.add('open');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* ==========================================================================
   3. SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-fade-up');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }
}

/* ==========================================================================
   4. SUBTLE BOTANICAL CANVAS (Floating Petal Motes)
   ========================================================================== */
function initBotanicalCanvas() {
  const canvas = document.getElementById('botanical-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = 24;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 3.5 + 1.5;
      this.speedY = Math.random() * 0.4 + 0.15;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.35 + 0.15;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 0.015;
      this.color = Math.random() > 0.5 ? '#B98B68' : '#E8D6C3';
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2;
      this.rotation += this.rotSpeed;

      if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      // Draw delicate curved seed/petal mote
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 1.8, this.size * 0.8, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   5. GALLERY FILTERING & LIGHTBOX
   ========================================================================== */
function initGallery() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close-btn');

  // Filter functionality
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 50);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Lightbox click
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption');
      if (img && lightbox) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Shola Flower Artwork';
        if (lightboxCaption && caption) {
          lightboxCaption.textContent = caption.textContent;
        }
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* ==========================================================================
   6. PRODUCT ENQUIRY MODAL (WITH PREFILLED WHATSAPP & FORM)
   ========================================================================== */
function initProductEnquiryModal() {
  const modal = document.getElementById('product-enquiry-modal');
  const modalClose = document.querySelector('.enquiry-modal-close');
  const enquireButtons = document.querySelectorAll('.product-enquire-btn');
  const productNameInput = document.getElementById('modal-product-name');
  const modalForm = document.getElementById('quick-enquiry-form');

  enquireButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productName = btn.getAttribute('data-product') || 'Handcrafted Shola Wood Flower';
      if (productNameInput) {
        productNameInput.value = productName;
      }
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const product = productNameInput ? productNameInput.value : 'Shola Wood Flowers';
      const name = document.getElementById('modal-client-name')?.value || 'Valued Client';
      const phone = document.getElementById('modal-client-phone')?.value || '';
      const notes = document.getElementById('modal-client-notes')?.value || '';

      const whatsappText = `Hello SB Shola Wood Flowers,\n\nI would like to enquire about: *${product}*.\nName: ${name}\nPhone: ${phone}\nRequirements: ${notes}\n\nDelivery: All India Delivery Available`;
      const whatsappUrl = `https://wa.me/919564001936?text=${encodeURIComponent(whatsappText)}`;

      closeModal();
      window.open(whatsappUrl, '_blank');
    });
  }
}


/* ==========================================================================
   7. CONTACT PAGE FORM HANDLER
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('main-contact-form');
  if (!contactForm) return;

  const statusMsgBox = document.getElementById('contact-status-message');

  // 1. Handle URL status parameter on page load
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');

  if (status && statusMsgBox) {
    statusMsgBox.style.display = 'block';
    if (status === 'success') {
      statusMsgBox.style.backgroundColor = '#edf7ed';
      statusMsgBox.style.color = '#1e4620';
      statusMsgBox.style.border = '1px solid #c8e6c9';
      statusMsgBox.innerHTML = '<i class="fas fa-check-circle" style="color: #2e7d32; margin-right: 8px;"></i> Thank you! Your enquiry has been sent successfully. Our support team will contact you shortly.';
    } else {
      statusMsgBox.style.backgroundColor = '#fde8e8';
      statusMsgBox.style.color = '#9b1c1c';
      statusMsgBox.style.border = '1px solid #f8b4b4';
      statusMsgBox.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #c62828; margin-right: 8px;"></i> Sorry, your enquiry could not be sent. Please try again or contact us directly.';
    }

    // Smooth scroll to the status message so visitor notices it
    statusMsgBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Clean URL so refreshing the page does not repeatedly show the status
    try {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
    } catch (e) {
      // Ignore if history API is restricted
    }
  }

  // 2. Form field selectors
  const nameInput = document.getElementById('contact-name');
  const phoneInput = document.getElementById('contact-phone');
  const emailInput = document.getElementById('contact-email');
  const requirementSelect = document.getElementById('contact-requirement');
  const messageInput = document.getElementById('contact-message');
  const submitBtn = document.getElementById('contact-submit-btn');

  function setFieldError(field, errorText) {
    if (!field) return;
    field.style.borderColor = '#c62828';
    field.setAttribute('aria-invalid', 'true');
    const parent = field.closest('.form-group');
    if (!parent) return;

    let errorElem = parent.querySelector('.field-error-message');
    if (!errorElem) {
      errorElem = document.createElement('div');
      errorElem.className = 'field-error-message';
      errorElem.style.cssText = 'color: #c62828; font-size: 0.75rem; margin-top: 0.35rem; line-height: 1.3; font-weight: 500;';
      parent.appendChild(errorElem);
    }
    errorElem.textContent = errorText;
    errorElem.style.display = 'block';
  }

  function clearFieldError(field) {
    if (!field) return;
    field.style.borderColor = '';
    field.removeAttribute('aria-invalid');
    const parent = field.closest('.form-group');
    if (!parent) return;
    const errorElem = parent.querySelector('.field-error-message');
    if (errorElem) {
      errorElem.textContent = '';
      errorElem.style.display = 'none';
    }
  }

  // Clear validation styling when user interacts with field
  [nameInput, phoneInput, emailInput, requirementSelect, messageInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => clearFieldError(input));
    input.addEventListener('change', () => clearFieldError(input));
  });

  // 3. Form submission validation & state management
  let isSubmitting = false;

  contactForm.addEventListener('submit', function (e) {
    if (isSubmitting) {
      e.preventDefault();
      return;
    }

    let isValid = true;
    let firstInvalidField = null;

    // Validate Name (Required)
    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (!nameVal) {
      setFieldError(nameInput, 'Please enter your full name.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = nameInput;
    } else {
      clearFieldError(nameInput);
    }

    // Validate Phone (Required, Indian / International format)
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
    const digitsOnly = phoneVal.replace(/\D/g, '');
    if (!phoneVal) {
      setFieldError(phoneInput, 'Please enter your phone number.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = phoneInput;
    } else if (!phoneRegex.test(phoneVal) || digitsOnly.length < 7 || digitsOnly.length > 15) {
      setFieldError(phoneInput, 'Please enter a valid phone number (at least 7 digits).');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = phoneInput;
    } else {
      clearFieldError(phoneInput);
    }

    // Validate Email (Optional, but if entered must be valid)
    const emailVal = emailInput ? emailInput.value.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailVal !== '' && !emailRegex.test(emailVal)) {
      setFieldError(emailInput, 'Please enter a valid email address.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = emailInput;
    } else {
      clearFieldError(emailInput);
    }

    // Validate Requirement Type (Required)
    const requirementVal = requirementSelect ? requirementSelect.value.trim() : '';
    if (!requirementVal) {
      setFieldError(requirementSelect, 'Please select your requirement type.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = requirementSelect;
    } else {
      clearFieldError(requirementSelect);
    }

    // Validate Message (Required)
    const messageVal = messageInput ? messageInput.value.trim() : '';
    if (!messageVal) {
      setFieldError(messageInput, 'Please enter your requirement message.');
      isValid = false;
      if (!firstInvalidField) firstInvalidField = messageInput;
    } else {
      clearFieldError(messageInput);
    }

    // If validation fails: prevent submission, focus first invalid field, restore button
    if (!isValid) {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>SEND ENQUIRY</span> <i class="fas fa-paper-plane" style="margin-left: 4px;"></i>';
      }
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
      return;
    }

    // If validation succeeds:
    // Update button text to "SENDING...", prevent duplicate submits, and let normal POST submission proceed to mailvalidation.php
    isSubmitting = true;

    if (submitBtn) {
      submitBtn.innerHTML = '<span>SENDING...</span> <i class="fas fa-paper-plane" style="margin-left: 4px;"></i>';
      setTimeout(() => {
        submitBtn.disabled = true;
      }, 50);
    }
  });
}

/* ==========================================================================
   8. SCROLL TO TOP
   ========================================================================== */
function initScrollToTop() {
  const scrollTopBtn = document.getElementById('scroll-to-top');
  if (!scrollTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}



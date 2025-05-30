/**
 * Open-Source Chatbots Platform
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('nav');
  
  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      
      // Animate hamburger to X
      const spans = mobileMenuToggle.querySelectorAll('span');
      if (nav.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Close mobile menu if open
        if (nav && nav.classList.contains('active')) {
          nav.classList.remove('active');
          const spans = mobileMenuToggle.querySelectorAll('span');
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.transform = 'none';
        }
        
        // Scroll to target
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Account for header height
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Copy code button functionality
  const copyButtons = document.querySelectorAll('.copy-button');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-clipboard-target');
      const codeElement = document.querySelector(targetId) || this.previousElementSibling.querySelector('code');
      
      if (codeElement) {
        const textToCopy = codeElement.textContent;
        
        // Create a temporary textarea element to copy from
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        // Select and copy the text
        textarea.select();
        document.execCommand('copy');
        
        // Remove the temporary textarea
        document.body.removeChild(textarea);
        
        // Show copied feedback
        const originalIcon = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
          this.innerHTML = originalIcon;
        }, 2000);
      }
    });
  });
  
  // Intersection Observer for animations
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.feature-card, .doc-card, .community-link, .contribution-way, .step');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    
    elements.forEach(element => {
      observer.observe(element);
    });
  };
  
  // Add animation classes to CSS
  const addAnimationStyles = function() {
    const style = document.createElement('style');
    style.textContent = `
      .feature-card, .doc-card, .community-link, .contribution-way, .step {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease-out, transform 0.5s ease-out;
      }
      
      .feature-card.animate, .doc-card.animate, .community-link.animate, .contribution-way.animate, .step.animate {
        opacity: 1;
        transform: translateY(0);
      }
      
      .feature-card:nth-child(2), .doc-card:nth-child(2), .community-link:nth-child(2), .contribution-way:nth-child(2) {
        transition-delay: 0.1s;
      }
      
      .feature-card:nth-child(3), .doc-card:nth-child(3), .community-link:nth-child(3), .contribution-way:nth-child(3) {
        transition-delay: 0.2s;
      }
      
      .feature-card:nth-child(4), .doc-card:nth-child(4), .community-link:nth-child(4), .contribution-way:nth-child(4) {
        transition-delay: 0.3s;
      }
      
      .feature-card:nth-child(5), .doc-card:nth-child(5) {
        transition-delay: 0.4s;
      }
      
      .feature-card:nth-child(6), .doc-card:nth-child(6) {
        transition-delay: 0.5s;
      }
    `;
    document.head.appendChild(style);
  };
  
  addAnimationStyles();
  animateOnScroll();
  
  // Sticky header shadow
  const header = document.querySelector('header');
  
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 10) {
        header.style.boxShadow = 'var(--shadow-md)';
      } else {
        header.style.boxShadow = 'var(--shadow-sm)';
      }
    });
  }
});

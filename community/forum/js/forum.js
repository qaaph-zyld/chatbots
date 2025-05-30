/**
 * Open-Source Chatbots Platform
 * Community Forum JavaScript
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
  
  // Form validation
  const joinForm = document.querySelector('.join-form');
  
  if (joinForm) {
    joinForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple validation
      let isValid = true;
      const requiredFields = joinForm.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
        } else {
          field.classList.remove('error');
        }
      });
      
      // Email validation
      const emailField = joinForm.querySelector('input[type="email"]');
      if (emailField && emailField.value.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
          isValid = false;
          emailField.classList.add('error');
        }
      }
      
      // Password validation (at least 8 characters)
      const passwordField = joinForm.querySelector('input[type="password"]');
      if (passwordField && passwordField.value.trim()) {
        if (passwordField.value.length < 8) {
          isValid = false;
          passwordField.classList.add('error');
          
          // Show password error message if it doesn't exist
          if (!document.querySelector('.password-error')) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message password-error';
            errorMessage.textContent = 'Password must be at least 8 characters long';
            passwordField.parentNode.appendChild(errorMessage);
          }
        } else {
          passwordField.classList.remove('error');
          const errorMessage = document.querySelector('.password-error');
          if (errorMessage) {
            errorMessage.remove();
          }
        }
      }
      
      if (isValid) {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Account created successfully! Redirecting to login...';
        
        joinForm.innerHTML = '';
        joinForm.appendChild(successMessage);
        
        // In a real application, you would submit the form data to the server here
        // For demo purposes, we're just showing a success message
        
        // Redirect after a delay
        setTimeout(() => {
          // This would redirect to the login page in a real application
          window.location.href = '#';
        }, 3000);
      }
    });
  }
  
  // Intersection Observer for animations
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.category-card, .discussion-item, .member-card');
    
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
      .category-card, .discussion-item, .member-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease-out, transform 0.5s ease-out;
      }
      
      .category-card.animate, .discussion-item.animate, .member-card.animate {
        opacity: 1;
        transform: translateY(0);
      }
      
      .category-card:nth-child(2), .discussion-item:nth-child(2), .member-card:nth-child(2) {
        transition-delay: 0.1s;
      }
      
      .category-card:nth-child(3), .discussion-item:nth-child(3), .member-card:nth-child(3) {
        transition-delay: 0.2s;
      }
      
      .category-card:nth-child(4), .discussion-item:nth-child(4), .member-card:nth-child(4) {
        transition-delay: 0.3s;
      }
      
      .category-card:nth-child(5), .discussion-item:nth-child(5) {
        transition-delay: 0.4s;
      }
      
      .category-card:nth-child(6), .discussion-item:nth-child(6) {
        transition-delay: 0.5s;
      }
      
      .error {
        border-color: #ef4444 !important;
      }
      
      .error-message {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
      
      .success-message {
        color: #10b981;
        font-size: 1.125rem;
        text-align: center;
        padding: 2rem;
      }
      
      .success-message i {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
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
  
  // Multi-select enhancement
  const interestsSelect = document.getElementById('interests');
  if (interestsSelect) {
    // Create a custom multi-select
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    
    // Create selected options display
    const selectedDisplay = document.createElement('div');
    selectedDisplay.className = 'selected-display';
    selectedDisplay.textContent = 'Select your interests';
    
    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // Add options from the original select
    Array.from(interestsSelect.options).forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'option';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `option-${option.value}`;
      checkbox.value = option.value;
      
      const label = document.createElement('label');
      label.htmlFor = `option-${option.value}`;
      label.textContent = option.textContent;
      
      optionElement.appendChild(checkbox);
      optionElement.appendChild(label);
      optionsContainer.appendChild(optionElement);
      
      // Handle option selection
      checkbox.addEventListener('change', function() {
        updateSelectedDisplay();
      });
    });
    
    // Add custom select to the DOM
    customSelect.appendChild(selectedDisplay);
    customSelect.appendChild(optionsContainer);
    interestsSelect.style.display = 'none';
    interestsSelect.parentNode.insertBefore(customSelect, interestsSelect);
    
    // Toggle options container
    selectedDisplay.addEventListener('click', function() {
      optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
      customSelect.classList.toggle('active');
    });
    
    // Close options when clicking outside
    document.addEventListener('click', function(e) {
      if (!customSelect.contains(e.target)) {
        optionsContainer.style.display = 'none';
        customSelect.classList.remove('active');
      }
    });
    
    // Update selected display
    function updateSelectedDisplay() {
      const selectedOptions = Array.from(optionsContainer.querySelectorAll('input:checked'));
      
      if (selectedOptions.length === 0) {
        selectedDisplay.textContent = 'Select your interests';
        selectedDisplay.classList.add('placeholder');
      } else {
        selectedDisplay.textContent = selectedOptions.map(option => {
          return option.nextElementSibling.textContent;
        }).join(', ');
        selectedDisplay.classList.remove('placeholder');
      }
      
      // Update the original select for form submission
      Array.from(interestsSelect.options).forEach(option => {
        option.selected = selectedOptions.some(selected => selected.value === option.value);
      });
    }
    
    // Add styles for custom select
    const customSelectStyles = document.createElement('style');
    customSelectStyles.textContent = `
      .custom-select {
        position: relative;
        width: 100%;
      }
      
      .selected-display {
        padding: 0.75rem;
        border: 1px solid var(--gray-300);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        transition: border-color var(--transition-fast);
      }
      
      .selected-display.placeholder {
        color: var(--gray-500);
      }
      
      .custom-select.active .selected-display {
        border-color: var(--primary-color);
      }
      
      .options-container {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: white;
        border: 1px solid var(--gray-300);
        border-radius: var(--border-radius-md);
        margin-top: 0.25rem;
        max-height: 200px;
        overflow-y: auto;
        z-index: 10;
        box-shadow: var(--shadow-md);
      }
      
      .option {
        padding: 0.5rem 0.75rem;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .option:hover {
        background-color: var(--gray-100);
      }
      
      .option input {
        margin-right: 0.5rem;
      }
    `;
    document.head.appendChild(customSelectStyles);
  }
});

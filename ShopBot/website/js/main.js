// ShopBot Marketing Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Demo form handling with analytics tracking
    const demoForm = document.querySelector('#demo form');
    if (demoForm) {
        demoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            // Simple email validation
            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address');
                return;
            }

            // Track demo request in Google Analytics
            if (typeof gtag !== 'undefined') {
                trackDemoRequest(email);
            }

            // Show success message
            const button = this.querySelector('button');
            const originalText = button.textContent;
            button.textContent = 'Sending...';
            button.disabled = true;

            // Send to lead capture system (placeholder for email service integration)
            const leadData = {
                email: email,
                source: 'website_demo_form',
                timestamp: new Date().toISOString(),
                page: window.location.href
            };
            
            // Store lead locally for now (will integrate with email service)
            localStorage.setItem('shopbot_lead_' + Date.now(), JSON.stringify(leadData));

            // Simulate form submission
            setTimeout(() => {
                alert('Thank you! We\'ll send you a demo link shortly. Check your email in the next few minutes.');
                this.reset();
                button.textContent = originalText;
                button.disabled = false;
                
                // Track successful conversion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'conversion', {
                        event_category: 'lead_generation',
                        event_label: 'demo_request_completed',
                        value: 1
                    });
                }
            }, 1500);
        });
    }

    // Track pricing plan clicks
    const pricingButtons = document.querySelectorAll('[href="#demo"]');
    pricingButtons.forEach(button => {
        button.addEventListener('click', function() {
            const planCard = this.closest('.bg-gray-50, .bg-blue-600');
            let planName = 'unknown';
            
            if (planCard) {
                const planTitle = planCard.querySelector('h3');
                if (planTitle) {
                    planName = planTitle.textContent.toLowerCase();
                }
            }
            
            if (typeof gtag !== 'undefined') {
                trackPricingView(planName);
            }
        });
    });

    // Mobile menu toggle (if needed)
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Scroll-based navbar styling
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('nav');
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-lg');
        } else {
            navbar.classList.remove('shadow-lg');
        }
    });

    // Animate stats on scroll
    const statsSection = document.querySelector('.grid-cols-1.md\\\\\\\:grid-cols-4');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stats = entry.target.querySelectorAll('.text-3xl');
                    stats.forEach((stat, index) => {
                        setTimeout(() => {
                            stat.style.opacity = '0';
                            stat.style.transform = 'translateY(20px)';
                            stat.style.transition = 'all 0.6s ease';
                            
                            setTimeout(() => {
                                stat.style.opacity = '1';
                                stat.style.transform = 'translateY(0)';
                            }, 100);
                        }, index * 200);
                    });
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(statsSection);
    }
});

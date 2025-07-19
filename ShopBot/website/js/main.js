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

    // Demo form handling
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

            // Show success message
            const button = this.querySelector('button');
            const originalText = button.textContent;
            button.textContent = 'Sending...';
            button.disabled = true;

            // Simulate form submission
            setTimeout(() => {
                alert('Thank you! We\'ll send you a demo link shortly.');
                this.reset();
                button.textContent = originalText;
                button.disabled = false;
            }, 1500);
        });
    }

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
    const statsSection = document.querySelector('.grid-cols-1.md\\:grid-cols-4');
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

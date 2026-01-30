// Enhanced UI Interactions and Animations
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add ripple effect to buttons
    function createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    }

    // Add ripple effect to all buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', createRipple);
    });

    // Enhanced form validation
    function validateForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            const value = input.value.trim();
            const parent = input.closest('.form-group');
            
            // Remove existing error states
            parent.classList.remove('error');
            const existingError = parent.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            // Validate based on input type
            if (!value) {
                showFieldError(parent, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !isValidEmail(value)) {
                showFieldError(parent, 'Please enter a valid email address');
                isValid = false;
            } else if (input.type === 'password' && value.length < 6) {
                showFieldError(parent, 'Password must be at least 6 characters');
                isValid = false;
            }
        });

        return isValid;
    }

    function showFieldError(parent, message) {
        parent.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: var(--error-color);
            font-size: 0.875rem;
            margin-top: 0.25rem;
            animation: fadeIn 0.3s ease;
        `;
        parent.appendChild(errorDiv);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Add real-time validation to forms
    document.querySelectorAll('form').forEach(form => {
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                const parent = this.closest('.form-group');
                const value = this.value.trim();
                
                // Remove existing error states
                parent.classList.remove('error');
                const existingError = parent.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }

                // Validate on blur
                if (this.hasAttribute('required') && !value) {
                    showFieldError(parent, 'This field is required');
                } else if (this.type === 'email' && value && !isValidEmail(value)) {
                    showFieldError(parent, 'Please enter a valid email address');
                } else if (this.type === 'password' && value && value.length < 6) {
                    showFieldError(parent, 'Password must be at least 6 characters');
                } else {
                    parent.classList.add('success');
                }
            });

            // Add focus effects
            input.addEventListener('focus', function() {
                this.closest('.form-group').classList.add('focused');
            });

            input.addEventListener('blur', function() {
                this.closest('.form-group').classList.remove('focused');
            });
        });
    });

    // Add loading states to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.classList.add('loading');
            }
        });
    });

    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.glass-card, .document-card').forEach(el => {
        observer.observe(el);
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // ESC key to close modals or reset states
        if (e.key === 'Escape') {
            // Close any open dropdowns or modals
            document.querySelectorAll('.dropdown-open').forEach(el => {
                el.classList.remove('dropdown-open');
            });
        }

        // Enter key on buttons
        if (e.key === 'Enter' && e.target.classList.contains('btn')) {
            e.target.click();
        }
    });

    // Add touch support for mobile
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartY - touchEndY;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe up - could trigger refresh or load more
                console.log('Swipe up detected');
            } else {
                // Swipe down - could trigger refresh
                console.log('Swipe down detected');
            }
        }
    }

    // Add performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData.loadEventEnd - perfData.loadEventStart > 3000) {
                    console.warn('Page load time is slow:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                }
            }, 0);
        });
    }

    // Add error boundary for JavaScript errors
    window.addEventListener('error', function(e) {
        console.error('JavaScript error:', e.error);
        
        // Show user-friendly error message
        const errorToast = document.createElement('div');
        errorToast.className = 'status status-error';
        errorToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        errorToast.textContent = '⚠ Something went wrong. Please refresh the page.';
        
        document.body.appendChild(errorToast);
        
        setTimeout(() => {
            errorToast.remove();
        }, 5000);
    });
});

// Utility functions
window.utils = {
    // Debounce function for performance
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for performance
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format file size
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Format date
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (days === 1) {
            return 'Yesterday ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (days < 7) {
            return days + ' days ago';
        } else {
            return date.toLocaleDateString();
        }
    },

    // Show toast notification
    showToast: function(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `status status-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Add CSS for additional animations
const additionalStyles = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .form-group.focused .form-input {
        border-color: rgba(79, 172, 254, 0.5);
        box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
    }

    .form-group.success .form-input {
        border-color: rgba(16, 185, 129, 0.5);
    }

    .form-group.error .form-input {
        border-color: rgba(239, 68, 68, 0.5);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .btn.loading {
        position: relative;
        color: transparent;
    }

    .btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
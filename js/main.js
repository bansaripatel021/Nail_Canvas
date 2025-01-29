const galleryImages = [
    { 
        src: './images/chrome-nails.jpeg', 
        caption: 'Chrome Nails',
        description: 'Mirror-like finish with a stunning metallic effect. Perfect for a bold, modern look.',
    },
    { 
        src: './images/manicures.jpeg', 
        caption: 'Manicure',
        description: 'Classic nail care and polish. Includes shaping, cuticle care, and your choice of color.',
    },
    { 
        src: './images/frenchies.jpeg', 
        caption: 'Frenchies',
        description: 'Timeless French manicure with a clean, elegant white tip design.',
    },
    { 
        src: './images/gel-art.jpeg', 
        caption: 'Gel Art',
        description: 'Custom designs using long-lasting gel polish. Unlimited creativity and shine.',
    },
    { 
        src: './images/bling-set.webp', 
        caption: 'Bling Set',
        description: 'Sparkle and shine with crystals and glitter. Make a statement with every gesture.',
    },
    { 
        src: './images/freestyle.jpeg', 
        caption: 'Freestyle',
        description: 'Unique patterns and designs customized to your style. Let your imagination run wild.',
    },
    { 
        src: './images/glitter-nail.png', 
        caption: 'Glitter Nail',
        description: 'Add some sparkle to your life with our signature glitter applications.',
    },
    { 
        src: './images/charms.jpeg', 
        caption: 'Charms',
        description: 'Adorable 3D decorations and charms for a playful, eye-catching look.',
    },
    { 
        src: './images/nail-art.jpeg', 
        caption: 'Nail Art',
        description: 'Hand-painted designs and patterns. Each nail becomes a tiny canvas.',
    }
];

const preloadImages = () => {
    let loadedImages = 0;
    const totalImages = galleryImages.length;
    
    return new Promise((resolve) => {
        galleryImages.forEach(image => {
            const img = new Image();
            img.onload = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    resolve();
                }
            };
            img.onerror = () => {
                loadedImages++;
                console.error(`Failed to load image: ${image.src}`);
                if (loadedImages === totalImages) {
                    resolve();
                }
            };
            img.src = image.src;
        });
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await preloadImages();
        initGallery();
    } catch (error) {
        console.error('Error initializing gallery:', error);
    }
    const galleryWrapper = document.querySelector('.gallery-wrapper');
    let activeIndex = 0;
    let items;

    const createGalleryItem = (image, index) => {
        const div = document.createElement('div');
        div.className = `gallery-item ${index === activeIndex ? 'active' : ''}`;
        div.innerHTML = `
            <div class="gallery-content">
                <img src="${image.src}" alt="${image.caption}" loading="lazy">
                <div class="gallery-text">
                    <h3>${image.caption}</h3>
                    <p class="gallery-description">${image.description}</p>
                </div>
            </div>
        `;

        return div;
    };

    const initGallery = () => {
        galleryWrapper.innerHTML = ''; // Clear existing items
        
        galleryImages.forEach((image, index) => {
            const div = createGalleryItem(image, index);
            galleryWrapper.appendChild(div);
        });

        items = document.querySelectorAll('.gallery-item');
        updateGallery();
        attachEventListeners();
    };

    function updateGallery() {
        items.forEach((item, index) => {
            item.classList.remove('active', 'prev', 'next', 'prev-2', 'next-2');
            
            // Calculate the shortest path to the active index
            let diff = index - activeIndex;
            const length = items.length;
            
            // Adjust diff to get the shortest path
            if (diff > length / 2) diff -= length;
            if (diff < -length / 2) diff += length;
            
            // Assign classes based on position relative to active
            if (diff === 0) {
                item.classList.add('active');
            } else if (diff === 1) {
                item.classList.add('next');
            } else if (diff === -1) {
                item.classList.add('prev');
            } else if (diff === 2) {
                item.classList.add('next-2');
            } else if (diff === -2) {
                item.classList.add('prev-2');
            }
        });
    }

    function attachEventListeners() {
        items.forEach((item, index) => {
            // Handle card click for info display
            item.addEventListener('click', (e) => {
                if (item.classList.contains('active')) {
                    // Toggle info display when clicking active card
                    item.classList.toggle('show-info');
                } else {
                    // Navigate to card if clicking non-active card
                    const diff = (index - activeIndex + items.length) % items.length;
                    if (diff === 0 || diff === 1 || diff === -1) {
                        // Close any open info panels
                        items.forEach(i => i.classList.remove('show-info'));
                        activeIndex = index;
                        updateGallery();
                    }
                }
            });

            // Close info when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.gallery-item')) {
                    items.forEach(item => item.classList.remove('show-info'));
                }
            });
        });

        // Add smooth transition when clicking navigation buttons
        const prevBtn = document.querySelector('.gallery-nav.prev');
        const nextBtn = document.querySelector('.gallery-nav.next');
        
        function navigateWithFeedback(button, direction) {
            // Add click feedback
            button.classList.add('clicked');
            setTimeout(() => button.classList.remove('clicked'), 200);

            // Update active index
            activeIndex = (activeIndex + direction + items.length) % items.length;
            updateGallery();
        }

        nextBtn.addEventListener('click', () => navigateWithFeedback(nextBtn, 1));
        prevBtn.addEventListener('click', () => navigateWithFeedback(prevBtn, -1));

        // Improve touch handling
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;
        
        function handleGestureStart(event) {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
            isSwiping = true;
        }
        
        function handleGestureMove(event) {
            if (!isSwiping) return;
            
            const touchEndX = event.touches[0].clientX;
            const touchEndY = event.touches[0].clientY;
            
            // Calculate both horizontal and vertical distance
            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);
            
            // If vertical scrolling is more prominent, stop handling swipe
            if (deltaY > Math.abs(deltaX)) {
                isSwiping = false;
                return;
            }
            
            // Prevent page scroll while swiping gallery
            event.preventDefault();
            
            // Add visual feedback during swipe
            const swipePercentage = Math.min(Math.abs(deltaX) / 100, 1);
            items.forEach(item => {
                if (item.classList.contains('active')) {
                    item.style.transform = `translate(-50%, -50%) scale(1) translateX(${deltaX * 0.2}px)`;
                }
            });
        }
        
        function handleGestureEnd() {
            if (!isSwiping) return;
            
            const deltaX = touchEndX - touchStartX;
            const swipeThreshold = 50;
            
            // Reset any transform applied during swipe
            items.forEach(item => {
                item.style.transform = '';
            });
            
            if (Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0) {
                    navigateWithFeedback(prevBtn, -1);
                } else {
                    navigateWithFeedback(nextBtn, 1);
                }
            }
            
            isSwiping = false;
        }

        galleryWrapper.addEventListener('touchstart', handleGestureStart, { passive: true });
        galleryWrapper.addEventListener('touchmove', handleGestureMove, { passive: false });
        galleryWrapper.addEventListener('touchend', handleGestureEnd);

        // Add keyboard navigation with visual feedback
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                navigateWithFeedback(prevBtn, -1);
            } else if (e.key === 'ArrowRight') {
                navigateWithFeedback(nextBtn, 1);
            }
        });
    }

    // Update the gallery when resizing
    window.addEventListener('resize', () => {
        // Remove the setupMobileCardFlip call
    });

    initGallery();
});

// Clean up intervals on page change
window.addEventListener('beforeunload', () => {
    clearInterval(window.flipInterval);
});

// About section text animation
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.3
    });

    document.querySelectorAll('.about-text-paragraph').forEach(paragraph => {
        observer.observe(paragraph);
    });
});

// Mobile Menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');

    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenu.classList.toggle('transform');
        mobileMenu.classList.toggle('-translate-x-full');
    });

    mobileMenuClose?.addEventListener('click', () => {
        mobileMenu.classList.add('transform');
        mobileMenu.classList.add('-translate-x-full');
    });

    // Close menu when clicking outside or scrolling
    document.addEventListener('click', (e) => {
        if (!mobileMenu?.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
            mobileMenu.classList.add('transform');
            mobileMenu.classList.add('-translate-x-full');
        }
    });

    window.addEventListener('scroll', () => {
        if (!mobileMenu?.classList.contains('-translate-x-full')) {
            mobileMenu.classList.add('transform');
            mobileMenu.classList.add('-translate-x-full');
        }
    });

    // Mobile gallery functionality
    function setupMobileCardFlip() {
        // Remove the setupMobileCardFlip function entirely
    }

    // Call setupMobileCardFlip after gallery initialization
    const galleryWrapper = document.querySelector('.gallery-wrapper');
    if (galleryWrapper) {
        setupMobileCardFlip();
        
        // Re-run setup when navigation happens
        const navButtons = document.querySelectorAll('.gallery-nav');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(setupMobileCardFlip, 100);
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Remove existing mobile menu event listeners
    
    // Add mobile navigation active state handling
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Update active state on scroll for home page
    if (window.location.pathname === '/' || window.location.pathname.includes('index')) {
        window.addEventListener('scroll', () => {
            const sections = ['home', 'about', 'gallery'];
            const currentSection = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return rect.top <= 100 && rect.bottom >= 100;
                }
                return false;
            });

            if (currentSection) {
                mobileNavItems.forEach(item => {
                    item.classList.toggle('active', 
                        item.getAttribute('href').includes(currentSection));
                });
            }
        });
    }
});

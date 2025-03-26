/**
 * Carousel Functionality
 * Handles automatic rotation of images in the login page carousel
 */

// Initialize the carousel when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing carousel");
    initCarousel();
});

/**
 * Initializes the carousel and starts automatic rotation
 */
function initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) {
        console.error("Carousel element not found");
        return;
    }
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    if (!slides.length) {
        console.error("No carousel slides found");
        return;
    }
    
    console.log(`Found ${slides.length} carousel slides`);
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Force display of the first slide
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.opacity = 0;
        slides[i].classList.remove('active');
    }
    
    slides[0].style.opacity = 1;
    slides[0].classList.add('active');
    
    // Update the carousel indicators if they exist
    updateIndicators(0);
    
    // Set interval for automatic sliding
    setInterval(() => {
        // Hide current slide
        slides[currentSlide].style.opacity = 0;
        slides[currentSlide].classList.remove('active');
        
        // Increment slide counter and wrap around if needed
        currentSlide = (currentSlide + 1) % totalSlides;
        
        // Show next slide
        slides[currentSlide].style.opacity = 1;
        slides[currentSlide].classList.add('active');
        
        // Update indicators
        updateIndicators(currentSlide);
        
        console.log(`Carousel changed to slide ${currentSlide + 1} of ${totalSlides}`);
    }, 4000); // Change slide every 4 seconds
}

/**
 * Updates the active state of carousel indicators
 * @param {number} activeIndex - The index of the currently active slide
 */
function updateIndicators(activeIndex) {
    const indicators = document.querySelectorAll('.carousel-indicator');
    if (!indicators.length) return;
    
    // Remove active class from all indicators
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
    });
    
    // Add active class to current indicator
    indicators[activeIndex].classList.add('active');
} 
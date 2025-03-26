/**
 * Firebase Authentication Configuration
 * Sets up the Firebase UI for authentication and handles user data in Firestore
 */

// Initialize Firebase UI Authentication
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Firebase UI configuration object
var uiConfig = {
    callbacks: {
        /**
         * Callback fired after successful sign-in
         * Creates/updates user document in Firestore and handles redirect
         * @param {Object} authResult - Firebase auth result object
         * @param {string} redirectUrl - URL to redirect to after sign-in
         * @returns {boolean} false to prevent default redirect
         */
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // Get the user object and set display name
            const user = authResult.user;
            const displayName = user.displayName || 'Anonymous';
            
            // Get country selection for new users
            let country = 'Unknown';
            if (authResult.additionalUserInfo.isNewUser) {
                country = document.querySelector('select[name="country"]') ? 
                        document.querySelector('select[name="country"]').value : 'Unknown';
            }
            
            // Create or update user document in Firestore
            db.collection("Users").doc(user.uid).set({
                email: user.email,
                name: displayName,
                country: country,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                darkMode: true,  // Default theme preference
                Categories: []   // Initialize empty categories array
            }, { merge: true })  // Update existing or create new document
            .then(() => {
                console.log("User document created/updated in Firestore");
                window.location.href = "main.html";
            })
            .catch((error) => {
                console.error("Error creating user document:", error);
            });

            return false; // Prevent default redirect behavior
        },

        /**
         * Callback fired when the auth UI widget is rendered
         * Adds country selector for new account creation
         */
        uiShown: function() {
            // Hide loading indicator
            document.getElementById('loader').style.display = 'none';
            
            // Fix for the country selector display bug
            setTimeout(fixCountrySelector, 100);
            
            // Set up mutation observer to add country selector
            const observer = new MutationObserver((mutations, obs) => {
                const nameInput = document.querySelector('input[name="name"]');
                if (nameInput && !document.querySelector('select[name="country"]')) {
                    // Create country selector container
                    const countryDiv = document.createElement('div');
                    countryDiv.className = 'firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label';
                    countryDiv.style.width = '100%';
                    countryDiv.style.marginBottom = '24px';
                    
                    // Create and configure country dropdown
                    const countrySelect = document.createElement('select');
                    countrySelect.name = 'country';
                    countrySelect.className = 'firebaseui-input mdl-textfield__input';
                    countrySelect.required = true;
                    
                    // Define available countries
                    const countries = [
                        { value: '', label: 'Select your country' },
                        { value: 'CA', label: 'Canada' },
                        { value: 'US', label: 'United States' },
                        { value: 'UK', label: 'United Kingdom' },
                        { value: 'AU', label: 'Australia' },
                        { value: 'FR', label: 'France' },
                        { value: 'DE', label: 'Germany' },
                        { value: 'IT', label: 'Italy' },
                        { value: 'ES', label: 'Spain' },
                        { value: 'BR', label: 'Brazil' },
                        { value: 'IN', label: 'India' },
                        { value: 'CN', label: 'China' },
                        { value: 'JP', label: 'Japan' },
                        { value: 'KR', label: 'South Korea' },
                        { value: 'Other', label: 'Other' }
                    ];
                    
                    // Add country options to select element
                    countries.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country.value;
                        option.textContent = country.label;
                        countrySelect.appendChild(option);
                    });
                    
                    // Create and add label
                    const label = document.createElement('label');
                    label.className = 'mdl-textfield__label';
                    label.textContent = 'Country';
                    
                    // Assemble and insert the country selector
                    countryDiv.appendChild(countrySelect);
                    countryDiv.appendChild(label);
                    nameInput.parentElement.parentElement.insertAdjacentElement('afterend', countryDiv);
                    
                    // Fix display of select
                    setTimeout(fixCountrySelector, 100);
                    
                    // Stop observing once country selector is added
                    obs.disconnect();
                }
            });

            // Start observing the document for changes
            observer.observe(document.body, { childList: true, subtree: true });
        }
    },
    // Use popup for authentication instead of redirect
    signInFlow: 'popup',
    signInSuccessUrl: "main.html",
    // Configure available sign-in providers
    signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // URLs for terms of service and privacy policy
    tosUrl: '<your-tos-url>',
    privacyPolicyUrl: '<your-privacy-policy-url>'
};

/**
 * Fix for country selector display bug
 * Removes problematic label elements and fixes styling on select elements
 */
function fixCountrySelector() {
    // Target all country selectors
    const countrySelectors = document.querySelectorAll('.firebaseui-country-selector select, select.firebaseui-input, select[name="country"]');
    
    countrySelectors.forEach(select => {
        // Force background transparency
        select.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        select.style.color = 'rgba(255, 255, 255, 0.9)';
        
        // Find and fix parent elements
        const textfieldWrapper = select.closest('.mdl-textfield');
        if (textfieldWrapper) {
            // ONLY remove labels within country select wrappers
            const labels = textfieldWrapper.querySelectorAll('.mdl-textfield__label');
            labels.forEach(label => {
                label.remove();
            });
            
            // Remove any placeholder attribute
            select.removeAttribute('placeholder');
            
            // Ensure select has higher z-index than any remaining elements
            select.style.position = 'relative';
            select.style.zIndex = '5';
            
            // Set text styles directly to improve visibility
            select.style.fontSize = '15px';
            select.style.fontWeight = '400';
            
            // Remove any floating label class that might cause issues
            textfieldWrapper.classList.remove('mdl-textfield--floating-label');
            
            // Add custom non-interfering label if needed
            if (!textfieldWrapper.querySelector('.custom-select-label')) {
                const customLabel = document.createElement('div');
                customLabel.className = 'custom-select-label';
                customLabel.textContent = 'Country';
                customLabel.style.position = 'absolute';
                customLabel.style.top = '-20px';
                customLabel.style.left = '0';
                customLabel.style.fontSize = '12px';
                customLabel.style.color = 'rgba(255, 255, 255, 0.7)';
                customLabel.style.pointerEvents = 'none';
                textfieldWrapper.appendChild(customLabel);
            }
        }
    });
    
    // Also fix any elements with the country-selector class
    const countrySelectionElements = document.querySelectorAll('.firebaseui-country-selector');
    countrySelectionElements.forEach(element => {
        // Clear any text nodes directly in the element
        Array.from(element.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.textContent = '';
            }
        });
        
        // Force a clean background
        element.style.background = 'transparent';
    });
}

// Initialize the Firebase UI Auth widget
ui.start('#firebaseui-auth-container', uiConfig);

// Add event listener to fix country selector whenever the DOM changes
document.addEventListener('DOMNodeInserted', function(e) {
    // Only run the fix for country selector elements or containers
    if (e.target.classList && (
        e.target.classList.contains('firebaseui-country-selector') ||
        e.target.tagName === 'SELECT' ||
        (e.target.classList.contains('mdl-textfield') && e.target.querySelector('select'))
    )) {
        setTimeout(fixCountrySelector, 100);
    }
});
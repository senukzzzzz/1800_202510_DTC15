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
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
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
                categories: []   // Initialize empty categories array
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
        uiShown: function () {
            // Hide loading indicator
            document.getElementById('loader').style.display = 'none';

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

// Initialize the Firebase UI Auth widget
ui.start('#firebaseui-auth-container', uiConfig);
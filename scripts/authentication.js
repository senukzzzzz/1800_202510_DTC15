var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Get the user object from the auth result
        const user = authResult.user;
        const displayName = user.displayName || 'Anonymous';
        
        // Get the country from the form data only if it's a new user
        let country = 'Unknown';
        if (authResult.additionalUserInfo.isNewUser) {
          country = document.querySelector('select[name="country"]') ? 
                    document.querySelector('select[name="country"]').value : 'Unknown';
        }
        
        // Create/update user document in Firestore
        db.collection("Users").doc(user.uid).set({
          email: user.email,
          name: displayName,
          country: country,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          darkMode: true  // Default to dark mode
        }, { merge: true })  // merge: true will update existing doc or create new one
        .then(() => {
          console.log("User document created/updated in Firestore");
          window.location.href = "main.html";
        })
        .catch((error) => {
          console.error("Error creating user document:", error);
        });

        return false; // Prevent default redirect
      },
      uiShown: function() {
        // The widget is rendered.
        // Hide the loader.
        document.getElementById('loader').style.display = 'none';
        
        // Add country selector after the widget is shown, but only for new account creation
        const observer = new MutationObserver((mutations, obs) => {
          const nameInput = document.querySelector('input[name="name"]');
          if (nameInput && !document.querySelector('select[name="country"]')) {
            const countryDiv = document.createElement('div');
            countryDiv.className = 'firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label';
            countryDiv.style.width = '100%';
            countryDiv.style.marginBottom = '24px';
            
            const countrySelect = document.createElement('select');
            countrySelect.name = 'country';
            countrySelect.className = 'firebaseui-input mdl-textfield__input';
            countrySelect.required = true;
            
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
            
            countries.forEach(country => {
              const option = document.createElement('option');
              option.value = country.value;
              option.textContent = country.label;
              countrySelect.appendChild(option);
            });
            
            const label = document.createElement('label');
            label.className = 'mdl-textfield__label';
            label.textContent = 'Country';
            
            countryDiv.appendChild(countrySelect);
            countryDiv.appendChild(label);
            
            // Insert after the name field
            nameInput.parentElement.parentElement.insertAdjacentElement('afterend', countryDiv);
            obs.disconnect(); // Stop observing once we've added the country selector
          }
        });

        // Start observing the document with the configured parameters
        observer.observe(document.body, { childList: true, subtree: true });
      }
    },
    // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
    signInFlow: 'popup',
    signInSuccessUrl: "main.html",
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    tosUrl: '<your-tos-url>',
    // Privacy policy url.
    privacyPolicyUrl: '<your-privacy-policy-url>'
  };

  ui.start('#firebaseui-auth-container', uiConfig);
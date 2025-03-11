document.addEventListener('DOMContentLoaded', function () {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');

    // Set initial state
    dropdownMenu.style.opacity = '0';
    dropdownMenu.style.display = 'none';
    dropdownMenu.style.transform = 'translateY(-10px)';

    // Toggle dropdown menu when clicking the profile button
    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        
        if (dropdownMenu.style.display === 'none') {
            // Show dropdown
            dropdownMenu.style.display = 'block';
            // Force a reflow to enable the transition
            dropdownMenu.offsetHeight;
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.transform = 'translateY(0)';
            dropdownMenu.classList.add('show');
        } else {
            // Hide dropdown
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.transform = 'translateY(-10px)';
            dropdownMenu.classList.remove('show');
            // Wait for transition to finish before hiding
            setTimeout(() => {
                dropdownMenu.style.display = 'none';
            }, 200);
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!dropdownMenu.contains(e.target) && !profileBtn.contains(e.target) && dropdownMenu.style.display === 'block') {
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.transform = 'translateY(-10px)';
            dropdownMenu.classList.remove('show');
            setTimeout(() => {
                dropdownMenu.style.display = 'none';
            }, 200);
        }
    });

    // Sign out functionality
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            firebase.auth().signOut().then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error signing out:', error);
            });
        });
    }
}); 
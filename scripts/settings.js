// Profile dropdown functionality
document.addEventListener('DOMContentLoaded', function () {
    const profileBtn = document.getElementById('profileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const signOutBtn = document.getElementById('signOutBtn');

    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!dropdownMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Sign out functionality
    signOutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
}); 
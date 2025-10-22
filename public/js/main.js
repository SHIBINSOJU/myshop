document.addEventListener('DOMContentLoaded', () => {

  // --- Wishlist Toggle ---
  const wishlistButtons = document.querySelectorAll('.btn-wishlist');

  wishlistButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.dataset.id;
      
      try {
        const response = await fetch(`/wishlist/toggle/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // If not logged in, the server redirect (handled by auth)
          // will be caught here, but easiest is to just reload.
          // Or server sends 401/403
          if (response.status === 401 || response.status === 403) {
             window.location.href = '/login';
             return;
          }
          throw new Error('Network response was not ok');
        }

        const result = await response.json();

        if (result.success) {
          // Toggle the 'active' class on the button
          if (result.action === 'added') {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
        }

      } catch (error) {
        console.error('Error toggling wishlist:', error);
      }
    });
  });

});

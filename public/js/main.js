document.addEventListener('DOMContentLoaded', () => {
  
  // --- Mobile Menu Toggle ---
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', () => {
      // This adds/removes the "active" class we made in the CSS
      navbarMenu.classList.toggle('active');
    });
  }

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
          if (response.status === 401 || response.status === 403) {
             window.location.href = '/login';
             return;
          }
          throw new Error('Network response was not ok');
        }

        const result = await response.json();

        if (result.success) {
          if (result.action === 'added') {
            button.classList.add('active');
          } else {
            button.classList.remove('active');

            // --- THIS IS THE UPDATE ---
            // If we are on the wishlist page, make the card disappear
            if (window.location.pathname === '/wishlist') {
              // Find the closest parent '.product-card' and hide it
              const card = button.closest('.product-card');
              if (card) {
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '0';
                // Hide after fade out
                setTimeout(() => {
                  card.style.display = 'none'; 
                }, 300);
              }
            }
            // --- END OF UPDATE ---
          }
        }

      } catch (error) {
        console.error('Error toggling wishlist:', error);
      }
    });
  });

});

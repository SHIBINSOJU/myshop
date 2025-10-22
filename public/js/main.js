document.addEventListener('DOMContentLoaded', () => {

  // --- Form Loading State ---
  const allForms = document.querySelectorAll('form');
  allForms.forEach(form => {
    // Exclude the filter form from this logic
    if (form.id === 'filter-form') return; 
    
    form.addEventListener('submit', (e) => {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Loading...';
      }
    });
  });

  // --- NEW: Product Filter Auto-Submit ---
  const filterForm = document.querySelector('#filter-form');
  const filterSelects = document.querySelectorAll('.filter-select');

  if (filterForm && filterSelects.length > 0) {
    filterSelects.forEach(select => {
      select.addEventListener('change', () => {
        filterForm.submit(); // Submit the form when a dropdown changes
      });
    });
  }
  
  // --- Mobile Menu Toggle ---
  const navbarToggle = document.querySelector('.navbar-toggle');
  const navbarMenu = document.querySelector('.navbar-menu');

  if (navbarToggle && navbarMenu) {
    navbarToggle.addEventListener('click', () => {
      navbarMenu.classList.toggle('active');
    });
  }

  // --- Wishlist Toggle ---
  const wishlistButtons = document.querySelectorAll('.btn-wishlist');

  wishlistButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.dataset.id;
      
      try {
        // Disable button to prevent double-click
        button.disabled = true; 

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

            if (window.location.pathname === '/wishlist') {
              const card = button.closest('.product-card');
              if (card) {
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '0';
                setTimeout(() => {
                  card.style.display = 'none'; 
                }, 300);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error toggling wishlist:', error);
      } finally {
        // Re-enable button after action is complete
        button.disabled = false; 
      }
    });
  });

});

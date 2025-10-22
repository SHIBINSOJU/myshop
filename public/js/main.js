document.addEventListener('DOMContentLoaded', () => {

  // --- Theme Toggle Functionality ---
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const body = document.body;
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  // Check for saved theme preference or default to 'light'
  const currentTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', currentTheme);
  
  // Update icon based on current theme
  if (currentTheme === 'dark') {
    themeIcon.className = 'fas fa-sun';
  } else {
    themeIcon.className = 'fas fa-moon';
  }

  // Theme toggle event listener
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = body.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update icon
      if (newTheme === 'dark') {
        themeIcon.className = 'fas fa-sun';
      } else {
        themeIcon.className = 'fas fa-moon';
      }
    });
  }

  // Mobile menu toggle
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

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

  // --- Navbar Live Search ---
  const navbarSearch = document.getElementById('navbar-search');
  if (navbarSearch) {
    let searchTimeout;
    navbarSearch.addEventListener('input', () => {
      const query = navbarSearch.value.trim();
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        // Navigate to products with search query; server will process
        const url = new URL(window.location.origin + '/products');
        if (query) url.searchParams.set('q', query);
        window.location.href = url.toString();
      }, 300);
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

  // --- Add to Cart ---
  const addToCartButtons = document.querySelectorAll('.btn-add-cart');

  addToCartButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.dataset.productId;
      
      try {
        // Disable button to prevent double-click
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        const response = await fetch('/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId: productId, quantity: 1 })
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
          // Update cart count in navbar
          const cartCount = document.getElementById('cart-count');
          if (cartCount) {
            cartCount.textContent = result.cartCount;
          }

          // Show success feedback
          button.innerHTML = '<i class="fas fa-check"></i> Added!';
          button.style.background = 'var(--accent-color)';
          button.style.color = 'white';
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
            button.style.color = '';
          }, 2000);
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        button.innerHTML = '<i class="fas fa-exclamation"></i> Error';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      } finally {
        // Re-enable button after action is complete
        button.disabled = false;
      }
    });
  });

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

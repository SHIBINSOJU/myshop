// In productRoutes.js
// This route MUST be AFTER routes like '/products/new'
router.get('/products/:id', productController.getProductDetails);

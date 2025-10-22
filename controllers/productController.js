// In productController.js
exports.getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    // You would also find reviews here
    // const reviews = await Review.find({ product: productId });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Render a NEW EJS file and pass the product data to it
    res.render('product-detail', {
      title: product.name,
      product: product
      // reviews: reviews
    });

  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
};

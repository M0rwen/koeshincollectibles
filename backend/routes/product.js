const express = require('express');
const router = express.Router();

const {
    newProduct,
    getSingleProduct,
    getProducts,
    getAdminProducts,

    updateProduct,
    deleteProduct,
    restoreProduct,
    getProductReviews,
    createProductReview,
    deleteReview,
    productSales,
    bulkDeleteProducts,

} = require('../controllers/product');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.post('/admin/product/new', isAuthenticatedUser, authorizeRoles('admin'), newProduct);
router.get('/product/:id', getSingleProduct)
router.get('/admin/products', isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);

router.put('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), updateProduct);
router.delete('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.put('/admin/product/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), restoreProduct);

router.get('/products', getProducts)

router.put('/review', isAuthenticatedUser, createProductReview);
router.get('/reviews', isAuthenticatedUser, getProductReviews)
router.delete('/reviews', isAuthenticatedUser, authorizeRoles('admin'), deleteReview)
router.get('/admin/product-sales', productSales);
router.delete('/admin/products/bulk', isAuthenticatedUser, authorizeRoles('admin'), bulkDeleteProducts);
module.exports = router
const router = require('express').Router();
const c = require('../controllers/productController');

router.get('/categories', c.categories);
router.get('/brands', c.brands);
router.get('/products', c.list);
router.get('/products/:id', c.detail);

module.exports = router;
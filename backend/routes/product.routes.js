const router = require('express').Router();
const c = require('../controllers/productController');

router.get('/categories', c.categories);
router.get('/brands', c.brands);

module.exports = router;
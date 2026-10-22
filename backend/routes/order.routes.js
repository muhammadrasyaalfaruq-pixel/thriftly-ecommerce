const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/orderController');

router.get('/checkout/:storeId', auth, c.preview);
router.post('/orders', auth, c.create);

module.exports = router;
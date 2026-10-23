const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/orderController');

router.get('/checkout/:storeId', auth, c.preview);
router.post('/orders', auth, c.create);
router.get('/orders', auth, c.list);
router.get('/orders/:id', auth, c.detail);
router.post('/orders/:id/cancel', auth, c.cancel);

module.exports = router;
const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/cartController');

router.get('/cart', auth, c.list);
router.post('/cart', auth, c.add);
router.delete('/cart/:productId', auth, c.remove);

module.exports = router;
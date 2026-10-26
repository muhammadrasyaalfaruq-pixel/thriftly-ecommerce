const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/wishlistController');

router.get('/wishlist', auth, c.list);
router.post('/wishlist', auth, c.add);
router.delete('/wishlist/:productId', auth, c.remove);

module.exports = router;
const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/addressController');

router.get('/addresses', auth, c.list);
router.post('/addresses', auth, c.add);
router.patch('/addresses/:id/default', auth, c.setDefault);
router.delete('/addresses/:id', auth, c.remove);

module.exports = router;
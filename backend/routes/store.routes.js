const router = require('express').Router();
const c = require('../controllers/storeController');

router.get('/stores/:slug', c.profile);

module.exports = router;
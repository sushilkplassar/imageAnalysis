let express = require('express');
let router = express.Router();

// @route   POST /logout
// @desc    Logout current user and redirect to the sign in page
// @access  Private
router.post('/', function (req, res, next) {
    req.logOut();
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
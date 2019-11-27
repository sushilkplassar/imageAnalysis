const db = require('../database/db');
let express = require('express');
let router = express.Router();

// @route   GET /home
// @desc    Retrieve all the experiment created by the user
// @access  Private
router.get('/', function (req, res, next) {
    console.log('in home.js');
    if (req.isAuthenticated()) {
        let user = req.user;

        db.query('SELECT experiment_images.exp_id, experiment_images.user_id, experiments.exp_title, MIN(experiment_images.exp_images) AS exp_images '
            + 'FROM experiments, experiment_images '
            + 'WHERE experiments.users_id = experiment_images.user_id AND experiments.exp_id = experiment_images.exp_id AND experiments.users_id = ' + user.user_id + ' '
            + 'GROUP BY experiment_images.exp_id, experiments.exp_title;', function (error, results, fields) {
            if (error) throw error;
        console.log('user authenticated');
            res.render('home', {uname: user.user_name, data: results});
        });
    } else {
        res.redirect('/');
    }
});

// Add mideleware to the route
router.get('/', authenticationMiddleware(), function (req, res) {
    res.render('home');
});

// Auth middleware
function authenticationMiddleware() {
    return (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/')
    }
}

module.exports = router;
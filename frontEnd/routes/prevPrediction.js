const db = require('../database/db');
let express = require('express');
let router = express.Router();
let multer = require('multer');
let path = require('path');
let res = require("express");
let ImageUrl = "http://localhost:3000/uploads/";

// Setting up upload function using multer
let upload = multer({
    dest: './public/uploads',
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/uploads');
        },
        filename: (req, file, cb) => {
            console.log(file.originalname);
            let ext = path.extname(file.originalname);
            cb(null, Date.now().toString() + ".jpg");
        }
    })
});

// apply filter by date
router.post('/:id/filter', function (req, res, next) {
    let user = req.user;
    let id = req.params.id;
    const bodydata = req.body;
    const paramsdata = req.params;
    console.log("user_id: " + user.user_id);
    let prevdate = req.body.prevdate;
    var prevdateonly =  "'" + prevdate + "'";

    db.query('SELECT * FROM prediction_type WHERE exp_id = ' + id + ' AND DATE(created_at) = ' + prevdateonly + ';', function (error, results, fields) {
        if (error) throw error;

        res.render('filterPrediction', {uname: user.user_name, data: results,id: id});

    });

});

// @route   GET /:id
// @desc    Get previous prediction of the selected images by experiment id
// @access  Private
router.get('/:id', function (req, res, next) {
    if (req.isAuthenticated()) {
        let user = req.user;
        let id = req.params.id;
        console.log(id);
        const labelNameewrew = req.params.prevdate;
        console.log("Datepicke1111: " + labelNameewrew);

        console.log(req.params);

        db.query('SELECT * FROM prediction_type WHERE exp_id = ' + id + ';', function (error, results, fields) {
            if (error) throw error;

            res.render('prevprediction', {uname: user.user_name, data: results,id: id});
        });
    } else {
        res.redirect('/');
    }
});

// Add mideleware to the route
router.get('/:id', authenticationMiddleware(), function (req, res) {
    res.render('prevprediction');
});

// Auth middleware
function authenticationMiddleware() {
    return (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/')
    }
}

module.exports = router;
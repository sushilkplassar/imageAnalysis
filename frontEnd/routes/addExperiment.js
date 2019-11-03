const db = require('../database/db');
let express = require('express');
let router = express.Router();
let multer = require('multer');
let path = require('path');

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

// @route   GET /addExperiment
// @desc    Render add experiment form
// @access  Private
router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        let user = req.user;

        db.query('SELECT * FROM experiments WHERE users_id= ' + user.user_id + '', function (error, results, fields) {
            if (error) throw error;

            res.render('addExperiment', {uname: user.user_name, data: results});
        });
    } else {
        res.redirect('/');
    }
});

// Add middleware to the route
router.get('/', authenticationMiddleware(), function (req, res) {
    res.render('addExperiment');
});

// @route   POST /addExperiment
// @desc    Create new experiment, after add experiment form submission
// @access  Private
router.post('/', upload.array('expImage', 40), function (req, res, next) {
    let user = req.user;

    expTitle = req.body.expTitle;
    expBirthDate = req.body.expBirthDate;
    expImagingDate = req.body.expImagingDate;
    expAntibody = req.body.expAntibody;
    expChannel = req.body.expChannel;
    expDescription = req.body.expDescription;
    expImage = req.body.expImage;

    let body = req.body;

    let fileInfo = req.files;

    let fileLength = req.files.length;

    let text = "";
    for (let i = 0; i < fileLength; i++) {
        let fileName = req.files[i].filename;
        console.log(text += fileName + ",");
    }

    let removedLastComma = text.substring(0, text.length - 1);

    let array = removedLastComma.split(',');

    for (let i = 0; i < array.length; i++) {
        console.log(array[i]);
    }

    let formattedString = removedLastComma.split(",").join("\n");

    db.query('INSERT INTO experiments (users_id, exp_title, exp_birth_date, exp_imaging_date, exp_antibody, exp_description) VALUES (?, ?, ?, ?, ?, ?)',
        [user.user_id, expTitle, expBirthDate, expImagingDate, expAntibody, expDescription], function (error, results, fields) {
            if (error) throw error;

            for (let k = 0; k < array.length; k++) {
                let now = new Date(new Date().toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0].replace('T', '-');
                db.query('INSERT INTO experiment_images (exp_id, user_id, exp_images, created_at, channel) VALUES (?, ?, ?, ?, ?)',
                    [results.insertId, user.user_id, array[k], now, expChannel])
            }

            db.query('SELECT * FROM experiments WHERE users_id= ' + user.user_id + '', function (error, results, fields) {
                if (error) throw error;
                db.query('SELECT  * FROM experiment_images', function (err, results2, field2) {
                    if (error) throw error;

                    res.redirect('/home');
                })
            });
        });
});

// Auth middleware
function authenticationMiddleware() {
    return (req, res, next) => {
        if (req.isAuthenticated()) return next();
        res.redirect('/')
    }
}

module.exports = router;
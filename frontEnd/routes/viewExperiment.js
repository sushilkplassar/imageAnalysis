const db = require('../database/db');
let express = require('express');
let router = express.Router();
let multer = require('multer');
let path = require('path');
let res = require("express");
let ImageUrl = "http://localhost:5000/uploads/";

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

let sharp = require('sharp');
let probe = require('probe-image-size');

let fs = require('fs');
let request = require('request');

let download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

// @route   GET /viewExperiment/:id
// @desc    Retrieve images by experiment id
// @access  Private
router.get('/:id', function (req, res, next) {
    if (req.isAuthenticated()) {
        let user = req.user;
        let id = req.params.id;

        db.query('SELECT * FROM experiments, experiment_images '
            + 'WHERE experiments.users_id = ' + user.user_id + ' AND experiments.exp_id= ' + id + ' AND experiment_images.exp_id= ' + id + ' ;', function (error, results, fields) {
            if (error) throw error;

            for (let i=0; i< results.length; i++) {
                if (results[i].rect) {
                    results[i].rectArr = results[i].rect.split('|');
                } else {
                    results[i].rectArr = [];
                }
            }
            res.render('viewExperiment', {uname: user.user_name, data: results,id:id});
        });
    } else {
        res.redirect('/');
    }
});

// Add middleware to the route
router.get('/:id', authenticationMiddleware(), function (req, res) {
    res.render('viewExperiment');
});

// @route   POST /:id/deleteImages
// @desc    Delete images from the experiment by image id
// @access  Private
router.post('/:id/deleteImages', function (req, res) {
    try {
        const images = JSON.parse(req.body.images).join(',');
        db.query('DELETE FROM experiment_images WHERE ID IN (' + images + ');', function (err, result) {
        })
    } catch (err) {
        console.log(err)
    }
    res.sendStatus(200);
});

// @route   POST /:id/cropImages
// @desc    Crop images from the experiment by image id
// @access  Private
router.post('/:id/cropImages', function (req, res) {

    try {
        const id = JSON.parse(req.body.id).join(',');
        const rect = req.body.rect;
        const labelName = req.body.labelName;

        db.query('select * from experiment_images WHERE ID IN (' + id + ');', function (err, result) {
            for (let i=0; i< result.length; i++) {

                let resRect = "";

                if (result[i].rect !== null && result[i].rect !=='') {
                    resRect = result[i].rect+'|'+rect;
                } else {
                    resRect = rect;
                }

                if (typeof rect !== 'undefined' ) {
                    db.query('UPDATE experiment_images SET rect="' + resRect + '" WHERE ID = ' + result[i].id + ';', function (err, updateResult) {

                        let cropImg = Math.floor(Math.random() * 1000000000) +'.jpg';
                        let outputImage = 'public/uploads/'+ cropImg;

                        probe(ImageUrl+result[i].exp_images, function (err, result1) {

                            let rectData = rect.replace('rect(', '');
                            rectData = rectData.replace(/px/gi, '');
                            rectData = rectData.replace(')', '');
                            let rectDataNew = rectData.split(',');

                            if (rectDataNew.length > 2) {
                                let ratio;
                                if (result1){
                                    if (result1.width > 280) {
                                        ratio = 280 / result1.width;
                                    } else {
                                        ratio = 1;
                                    }
                                }

                                let topVal = Math.round(rectDataNew[0]/ratio),
                                    widthVal = Math.round((rectDataNew[1] - rectDataNew[3]) /ratio),
                                    heightVal = Math.round((rectDataNew[2] - rectDataNew[0])/ratio),
                                    leftVal = Math.round(rectDataNew[3]/ratio);

                                let tempFilename = Math.floor(Math.random() * 1000000000)+'.jpg';

                                download(ImageUrl+result[i].exp_images, tempFilename, function() {

                                    sharp(tempFilename).extract({ top: topVal, width: widthVal, height: heightVal, left: leftVal }).toFile(outputImage)
                                        .then(function(new_file_info) {

                                            fs.unlinkSync(tempFilename);
                                            let now = new Date(new Date().toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0].replace('T', '-');

                                            db.query('INSERT INTO experiment_cropped_images (exp_id, user_id, exp_img_id, exp_crop_img, created_at, rect, exp_label_name) VALUES (?, ?, ?, ?, ?, ?, ?)',[result[i].exp_id, result[i].user_id, result[i].id, cropImg , now, rect, labelName]);
                                        })
                                        .catch(function(err) {
                                            console.log('Error err', err);
                                        });
                                });
                            }
                        });

                    })
                }
            }
        })

    } catch (err) {
        console.log(err);
    }
    res.sendStatus(200);
});

// @route   POST /:id
// @desc    Add new images to the experiment by experiment id
// @access  Private
router.post('/:id', upload.array('expImage', 40), function (req, res, next) {
    let user = req.user;
    let id = req.params.id;

    expChannel = req.body.expChannel;

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

    db.query('SELECT * FROM experiments WHERE users_id = ' + user.user_id + ' AND exp_id=' + id + ' ', function (error, results, fields) {
        if (error) throw error;

        db.query('SELECT * FROM experiment_images WHERE exp_id=' + id + '', function (err, results2, field2) {
            if (error) throw error;

            for (let k = 0; k < array.length; k++) {
                let now = new Date(new Date().toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0].replace('T', '-');
                db.query('INSERT INTO experiment_images (exp_id, user_id, exp_images, created_at, channel) VALUES (?, ?, ?, ?, ?)',
                    [id, user.user_id, array[k], now, expChannel])
            }

            res.redirect('/viewExperiment/' + id + '');
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
const db = require('../database/db');
let express = require('express');
let router = express.Router();
let request = require("request");
let _ = require("underscore");
const apiBaseUrl = 'http://127.0.0.1:8000/upload/';
let ImageUrl = "http://localhost:5000/uploads/";

// @route   POST /getImagePrediction
// @desc    Call Python Script, to get the image prediction for the selected images
// @access  Private
router.post('/getImagePrediction', function (req, res) {
    try {
        const id = JSON.parse(req.body.id).join(',');
        let data = [];

        // Fetch crop id and location of the cropped images from the experiment_cropped_images table and store in a variable responseJson
        db.query('SELECT * FROM experiment_cropped_images WHERE exp_img_id IN (' + id + ');', function (err, result) {
            let exp_img_id;

            // _.map() -> Underscore function
            let responseJson = _.map(_.groupBy(result, "exp_img_id"), (value, key) => {
                // exp_img_id: value[0].exp_img_id;

                return{
                    exp_img_id:value[0].exp_img_id,
                    [value[0].exp_img_id] :_.map(value, (value) => {
                        return{
                            link:ImageUrl+value.exp_crop_img,
                            crop_id:value.exp_img_id
                        }
                    })
                }
            });

            let resultExImag1 = [];

            // Get the original images (images without cropping) and store that data in a variable resultExImag1
            db.query('SELECT * FROM experiment_images WHERE id IN (' + id + ');', function (err, resultExImag) {
                resultExImag1 = resultExImag;
            });

            console.log('Python ML Api called');
            console.log(JSON.stringify(responseJson));

            // Call the python API, passing the responseJson data
            request({
                    method: 'POST',
                    uri: apiBaseUrl,
                    form: { data: JSON.stringify(responseJson) },
                    rejectUnauthorized: false,
                },
                function(error, response, body) {
                    if (error) {
                        console.error('upload failed:', error);
                        req.session.predictionDataerror = error;
                        req.session.predictionData = '';
                        res.send(error);
                        console.log(response);
                    } else {
                        let n = body.search("not found");

                        if (n > 0) {
                            req.session.predictionDataerror = 'Api url not found';
                            req.session.predictionData = '';
                            res.send(error);
                        } else{
                            try {
                                console.log(body);

                                // Everything went right, and we get a response from the Python API
                                let pyResponse = JSON.parse(body);
                                console.log(body);
                                console.log(pyResponse);

                                let now = new Date(new Date().toString().split('GMT')[0] + ' UTC').toISOString().split('.')[0].replace('T', '-');

                                let dataImage = [];

                                console.log(resultExImag1);

                                let exp_id = '';
                                let crop_id= '';

                                // Get data from resultExImag1 for each original images selected by the user
                                for (let i=0; i< resultExImag1.length; i++) {
                                    dataImage[resultExImag1[i].id] = resultExImag1[i].exp_images;
                                    exp_id = resultExImag1[i].exp_id;
                                    user_id = resultExImag1[i].user_id;
                                    created_at= resultExImag1[i].created_at;
                                    updated_at = resultExImag1[i].updated_at;
                                }

                                // Insert the prediction received from the Python API, into the prediction table
                                for(let k = 0; k < pyResponse.length; k++){
                                    let type = pyResponse[k].type;

                                    db.query('SELECT * FROM experiment_cropped_images WHERE exp_img_id in ('+pyResponse[k].exp_img_id+') AND exp_id in ('+exp_id+')',function(err,results){

                                        if(results) {
                                            results.forEach(function(result) {

                                                db.query('INSERT INTO prediction (user_id, exp_img_id, exp_id, name, img, crop_id, exp_type, created_at, updated_at) VALUES (?, ?, ?,?, ?, ?,?,?,?)',
                                                    [user_id, result.exp_img_id, exp_id, result.exp_label_name, result.exp_crop_img, result.id, type, created_at, updated_at])
                                            });
                                        }
                                    });
                                }

                                for(let k = 0; k < pyResponse.length; k++) {
                                    db.query('INSERT INTO prediction_type (exp_img_id, exp_id, exp_type, img, created_at) VALUES (?, ?, ?,?, ?)',
                                        [pyResponse[k].exp_img_id, exp_id, pyResponse[k].type, dataImage[pyResponse[k].exp_img_id], now])
                                }

                                req.session.predictionData = '';
                                req.session.predictionData = pyResponse;
                                res.redirect('/prediction/view');
                            } catch (e) {
                                console.log("Error",e);
                                req.session.predictionDataerror = e;
                                req.session.predictionData = '';
                                res.send(error);
                            }
                        }
                    }
                })
        });
    } catch(e) {
        console.log('Error', e);
        res.send(e);
    }
});

// @route   GET /prediction/view
// @desc    Display predictions on the web interface
// @access  Private
router.get('/view', function (req, res) {
    if (req.isAuthenticated()) {
        let user = req.user;

        if (req.session.predictionData) {
            let responseData = req.session.predictionData;
            console.log('Response Data: ',responseData);
            setTimeout(function() {
                req.session.predictionData = '';
            },2000);

            let smallArr = [];

            for(let i = 0; i < responseData.length; i++){
                let image_id = responseData[i].exp_img_id;
                smallArr.push(image_id);
            }

            let array = smallArr.toString();

            // Get prediction to be displayed on the web interface
            db.query('SELECT exp_images FROM experiment_images WHERE id IN ('+array+');',function(err,resultImg){
                if(resultImg) {
                    res.render('viewPrediction',{
                        uname: user.user_name,
                        data: responseData,
                        dataImg: resultImg

                    });
                }
            });
        } else {
            res.redirect('back');
        }
    }
});

// @route   POST /checkCrop
// @desc    Enable Predict button, if image is previously cropped
// @access  Private
router.post('/checkCrop', function(req,res) {
    const id = JSON.parse(req.body.id).join(',');

    if ("undefined" !== id && id !== '' && id !== null) {
        db.query('SELECT * FROM experiment_cropped_images WHERE exp_img_id IN ('+id+')',function(err,results){

            if (results.length > 0) {
                res.json({data:200});
            } else {
                res.json({data:500});
            }
        });
    } else {
        res.json({data:500});
    }
});

module.exports = router;
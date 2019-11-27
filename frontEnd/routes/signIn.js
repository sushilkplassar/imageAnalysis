let express = require("express");
let router = express.Router();
const db = require("../database/db");
let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let bcrypt = require("bcrypt");

// @route   GET /
// @desc    Render Sign In Form
// @access  Public
router.get("/", function(req, res, next) {
  res.render("signIn");
});

// @route   POST /signIn
// @desc    Get user data, verify credentials, if valid, redirect to the home page
// @access  Public
router.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/"
  }),
  function(req, res) {
    res.redirect("/home");
  }
);

// Verify user credentials using passport.js's local strategy
passport.use(
  new LocalStrategy(function(username, password, done) {
    debugger;
    console.log("username is:  " + username);
    console.log(password);

    db.query("SELECT * from users WHERE username = ?", [username], function(
      err,
      results,
      fields
    ) {
      if (err) {
        done(err);
      }

      // If username does not exist in db
      if (results.length === 0) {
        return done(null, false);
      }

      const hash = results[0].password;
      console.log(results[0]);

      bcrypt.compare(password, hash, function(err, response) {
        if (response === true) {
          return done(null, {
            user_id: results[0].id,
            user_name: results[0].username
          });
        } else {
          return done(null, false);
        }
      });
    });
  })
);

module.exports = router;

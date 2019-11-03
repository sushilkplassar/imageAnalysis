let createError = require('http-errors');
let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let multer = require('multer');
let dotenv = require('dotenv');
let cors = require('cors');
let processImage = require('express-processimage');

dotenv.config();

// Auth packages
let session = require('express-session');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let MySQLStore = require('express-mysql-session')(session);

let signUpRouter = require('./routes/signUp');
let signInRouter = require('./routes/signIn');
let homeRouter = require('./routes/home');
let logoutRouter = require('./routes/logout');
let addExperimentRouter = require('./routes/addExperiment');
let viewExperimentRouter = require('./routes/viewExperiment');
let viewPredictionRouter = require('./routes/viewPrediction');
let prevPredictionRouter = require('./routes/prevPrediction');

let app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(processImage('public'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
//app.use(bodyParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Allow access control, i.e., avoid CORS error
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
    next();
});

let options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'refdfssadadsa',
    resave: false,
    store: sessionStore,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', signInRouter);
app.use('/signUp', signUpRouter);
app.use('/home', homeRouter);
app.use('/logout', logoutRouter);
app.use('/addExperiment', addExperimentRouter);
app.use('/viewExperiment', viewExperimentRouter);
app.use('/prediction', viewPredictionRouter);
app.use('/prevprediction', prevPredictionRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
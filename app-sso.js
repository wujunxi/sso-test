const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

let ticketDB = [];

let app = express();
app.use(session({
    key: 'sessionID',
    secret: 'sso-test',
    cookie: { maxAge: 1800000 }, // 30 minutes = 1000 * 60 * 30
    resave: true,
    saveUninitialized: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

let router = express.Router();
router.get('/', function(req, res, next) {
    console.log(req.body, req.query, req.originalUrl);
    console.log(req.get('Referer'));
    res.write('sso');
    res.end();
});
router.get('/checkTicket', function(req, res, next) {
    if(!req.query.ssoTicket){
        res.json({retCode:0,retMsg:'缺少参数ssoTicket'});
        return;
    }
    if(ticketDB.includes(req.query.ssoTicket)){
        
        res.json({retCode:1,retMsg:'success'});
        return;
    }
});


app.use('/', router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.write(err.message);
    res.end();
});

let port = process.argv[2] || 80;

let server = app.listen(port, function() {
    console.log('Example app listening at http://localhost:%s', port);
});
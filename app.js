const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

let app = express();

app.set('view engine', 'pug');
app.set('views', './views');

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


// console.log(path.resolve(__dirname,'./public/login.html'));
// 定义登录过滤器
let loginFilter = express.Router();
loginFilter.all('*', function(req, res, next) {
    if (req.session.user && req.session.user.uid && req.session.user.uid != "") {
        next();
    } else {
        res.redirect('/login');
    }
});

// 登录路由 /login 
let loginRouter = express.Router();
loginRouter.get('/', function(req, res, next) {
    if (req.session.user && req.session.user.uid && req.session.user.uid != "") {
        res.redirect('/');
        return;
    }
    res.render('login');
});

loginRouter.post('/', function(req, res, next) {
    console.log(req.body);
    req.session.user = {
        uid:'001'
    }
    
    res.rendJson({retCode:'1',retMsg:'success'});

    // res.rendJson({retCode:'1',retMsg:'success'});
});

// 主页路由 /
let indexRouter = express.Router();
indexRouter.get('/', function(req, res, next) {
    res.sendFile(path.resolve(__dirname, './public/index.html'));
});


app.use('/login', loginRouter);
app.use('/', loginFilter, indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
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

var server = app.listen(8080, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://localhost:8080');
});
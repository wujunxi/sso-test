const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { checkTicket } = require('./sso/sso');

let app = express();

app.set('views', './views');
app.set('view engine', 'pug');

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

// 定义登录过滤器
let loginFilter = express.Router();
loginFilter.all('*', function(req, res, next) {
    if (req.session.user) {
        // console.log(req.session.user);
        next();
    } else {
        res.redirect('/login');
    }
});

// 登录路由 /login 
let loginRouter = express.Router();
loginRouter.get('/', function(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    let ticket = req.query.ssoTicket;
    // 没有ticket，跳转到单点登录
    if (typeof ticket == 'undefined') {
        res.redirect('http://www.c.com');
        return;
    // ticket 为空，返回登录页
    } else if (ticket == '') {
        res.render('login');
        return;
    } else {
        // 检查ticket是否有效
        checkTicket(ticket,function(err,result){
            if(!err && result.retCode == 1){
                req.session.user = result.user;
                res.redirect('/');
            }else{
                res.render('login');
            }
        });
    }
});

loginRouter.post('/', function(req, res, next) {
    // console.log(req.body);
    if (req.body.username == 'admin' && req.body.password == '123456') {
        req.session.user = {
            uid: '001'
        }
        res.json({ retCode: '1', retMsg: 'success' });
    } else {
        res.json({ retCode: '0', retMsg: '用户名或密码错误！' });
    }
});

// 注销路由
let logoutRouter = express.Router();
logoutRouter.get('/', function(req, res, next) {
    if (req.session.user) {
        delete req.session.user;
    }
    res.redirect('/');
});

// 主页路由 /
let indexRouter = express.Router();
indexRouter.get('/', function(req, res, next) {
    res.render('index');
});


// 设置静态资源目录
app.use(express.static('public'));
// 路由配置
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/', loginFilter, indexRouter);

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

// console.log(process.argv[2]);

let port = process.argv[2] || 80;

let server = app.listen(port, function() {
    console.log('Example app listening at http://localhost:%s', port);
});
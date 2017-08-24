const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { getTicket, checkTicket, SSO_URL } = require('./sso/sso');

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
    let ticket = req.query.ticket;
    // 没有ticket，跳转到单点登录
    if (typeof ticket == 'undefined') {
        res.redirect(SSO_URL);
        return;
        // ticket 为空，返回登录页
    } else if (ticket == '') {
        res.render('login');
        return;
    } else {
        // 检查ticket是否有效
        checkTicket(ticket, function(err, result) {
            if (!err && result.retCode == 1) {
                req.session.user = result.data.user;
                res.redirect('/');
            } else {
                res.render('login');
            }
        });
    }
});

loginRouter.post('/', function(req, res, next) {
    if (typeof req.body.username == 'undefined' || typeof req.body.password == 'undefined') {
        res.json({ retCode: 0, retMsg: '缺少入参 username/password' });
        return;
    }
    getTicket(req.body, function(err, result) {
        if (err) {
            res.json({ retCode: 0, retMsg: '系统繁忙，请稍后再试' });
            return;
        }
        if (result.retCode == 1) {
            req.session.user = result.data.user;
            res.json({
                retCode: 1,
                retMsg: 'success',
                data: { sso_url: SSO_URL, ticket: result.data.ticket, backurl:req.url }
            });
        } else {
            res.json(result);
        }
    });
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
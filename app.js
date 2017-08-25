const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const { getTicket, checkTicket, SSO_URL } = require('./sso/sso');

const LOGIN_URL = '/login';
const INDEX_URL = '/';

const PORT = process.argv[2] || 80;
const DOMAIN = process.argv[3];

let app = express();
// 设置模板引擎
app.set('views', './views');
app.set('view engine', 'pug');
// 设置中间件
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
// 设置静态资源目录
app.use(express.static('public'));

// 定义登录过滤器
let loginFilter = express.Router();
loginFilter.all('*', function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        log('未登录，跳转到登录页 ' + LOGIN_URL);
        res.redirect(LOGIN_URL);
    }
});

// 登录路由 /login 
let loginRouter = express.Router();
loginRouter.get('/', function(req, res, next) {
    let backurl = req.protocol + '://' + DOMAIN + LOGIN_URL;
    if (req.session.user) {
        log('已登录，跳转到主页 ' + INDEX_URL);
        res.redirect(INDEX_URL);
        return;
    }
    let ticket = req.query.ticket;
    // 没有ticket，跳转到单点登录
    if (typeof ticket == 'undefined') {
        log('没有ticket，跳转到单点登录 backurl=' + backurl);
        res.redirect(SSO_URL + '?backurl=' + backurl);
        return;
        // ticket 为空，返回登录页
    } else if (ticket == '') {
        log('sso未登录，渲染登录页');
        res.render('login');
        return;
    } else {
        // 检查ticket是否有效
        checkTicket(ticket, function(err, result) {
            if (!err && result.retCode == 1) {
                log('有效ticket，跳转到主页 ' + JSON.stringify(result.data.user));
                req.session.user = result.data.user;
                res.redirect(INDEX_URL);
            } else {
                log('无效ticket');
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
    let backurl = req.protocol + '://' + DOMAIN + LOGIN_URL;
    getTicket(req.body, function(err, result) {
        if (err) {
            log(err);
            res.json({ retCode: 0, retMsg: '系统繁忙，请稍后再试' });
            return;
        }
        if (result.retCode == 1) {
            log('登录成功' + JSON.stringify(result.data.user));
            req.session.user = result.data.user;
            res.json({
                retCode: 1,
                retMsg: 'success',
                data: { sso_url: SSO_URL, ticket: result.data.ticket, backurl: backurl }
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
    res.redirect(INDEX_URL);
});

// 主页路由 /
let indexRouter = express.Router();
indexRouter.get('/', function(req, res, next) {
    res.render('index');
});

// 路由配置
app.use('/$', loginFilter, indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);

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

let server = app.listen(PORT, function() {
    console.log('Example app listening at http://localhost:%s', PORT);
});

server.on('error', function(err) {
    console.log(err.message);
});

function log(text) {
    console.log(`${DOMAIN}: ${text}`);
}
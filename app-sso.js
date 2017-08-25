const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { URL } = require('url');

const ticketManager = require('./sso/ticket-manager');
const userManager = require('./sso/user-manager');

const SESSION_KEY = 'sessionID';

let app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.use(session({
    key: SESSION_KEY,
    secret: 'sso-test',
    cookie: { maxAge: 1800000 }, // 30 minutes = 1000 * 60 * 30
    resave: true,
    saveUninitialized: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//  内部访问过滤器，限定IP
let innerFilter = express.Router();
innerFilter.all('*', function(req, res, next) {
    if (req.hostname == 'localhost') {
        next();
    } else {
        res.writeHead(403);
        res.json({ retCode: 0, retMsg: '禁止访问' });
    }
});

// ticket校验，成功返回用户信息
let checkTicketRouter = express.Router();
checkTicketRouter.get('/', function(req, res, next) {
    let resData = {};
    if (!req.query.ticket) {
        resData = { retCode: 0, retMsg: '缺少参数 ticket' };
    } else {
        let result = ticketManager.check(req.query.ticket);
        if (result) {
            resData = { retCode: 1, retMsg: 'success', data: result.data };
        } else {
            resData = { retCode: 0, retMsg: '无效ticket' };
        }
    }
    log(`内部通讯-验证票据 ${JSON.stringify(resData)}`);
    res.json(resData);
});

// 使用用户名密码获取ticket
let getTicketRouter = express.Router();
getTicketRouter.get('/', function(req, res, next) {
    let resData = {};
    let user = userManager.login(req.query.username, req.query.password);
    if (user) {
        let ticket = ticketManager.push({ user });
        resData = { retCode: 1, retMsg: 'success', data: { ticket, user } };
    } else {
        resData = { retCode: 0, retMsg: '用户名或密码错误' };
    }
    log(`内部通讯-获取票据 ${JSON.stringify(resData)}`);
    res.json(resData);
});

// 登录态校验
let loginRouter = express.Router();
loginRouter.get('/', function(req, res, next) {
    if (!req.query.backurl) {
        res.json({ retCode: 0, retMsg: '缺少参数 backurl' });
        return;
    }
    let url;
    try {
        url = new URL(req.query.backurl);
    } catch (e) {
        res.json({ retCode: 0, retMsg: 'backurl 不是有效的url' });
        return;
    }
    // 带ticket，表示同步状态，验证 ticket 并更新 session
    if (req.query.ticket) {
        let result = ticketManager.check(req.query.ticket);
        if (result) {
            log('同步成功' + JSON.stringify(result));
            req.session.user = result.data.user;
        } else {
            log('无效ticket');
        }
    } else if (req.session.user) {
        // 已登录,在 backurl 后附加 ticket
        let ticket = ticketManager.push({ user: req.session.user });
        url.searchParams.append('ticket', ticket);
        log('sso已登录 ' + ticket);
    } else {
        // 未登录,在 backurl 后附加 空ticket
        url.searchParams.append('ticket', '');
        log('sso未登录');
    }
    res.redirect(url.toString());
});

app.use('/login', loginRouter);
app.use('/getTicket', innerFilter, getTicketRouter);
app.use('/checkTicket', innerFilter, checkTicketRouter);

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
let domain = process.argv[3];

let server = app.listen(port, function() {
    console.log('Example app listening at http://localhost:%s', port);
});

function log(text) {
    console.log(`${domain}: ${text}`);
}
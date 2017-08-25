const http = require('http');

const SSO_URL = 'http://www.c.com/login';
const SSO_CHECK_TICKET_URL = 'http://localhost:8082/checkTicket';
const SSO_GET_TICKET_URL = 'http://localhost:8082/getTicket';

/**
 * 校验票据
 * 
 * @param {any} ticket 
 * @param {any} callback 
 */
function checkTicket(ticket, callback) {
    getJson(`${SSO_CHECK_TICKET_URL}?ticket=${ticket}`, callback);
}

/**
 * 获取sso登录用户信息票据
 * 
 * @param {any} { username, password } 登录账户密码
 * @param {any} callback 
 */
function getTicket({ username, password }, callback) {
    getJson(`${SSO_GET_TICKET_URL}?username=${username}&password=${password}`, callback);
}

/**
 * get请求返回json
 * 
 * @param {any} url 请求url
 * @param {any} callback 
 */
function getJson(url, callback) {
    const req = http.request(url, function(res) {
        if (res.statusCode == 200) {
            let chunks = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                chunks += chunk;
            });
            res.on('end', () => {
                let jsonData = JSON.parse(chunks);
                callback(null, jsonData);
            });
        }
    });
    req.on('error', (e) => {
        callback(e);
    });
    req.end();
}


module.exports = {
    getTicket,
    checkTicket,
    SSO_URL
};
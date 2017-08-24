const http = require('http');

const SSO_URL = 'http://www.c.com/login';
const SSO_CHECK_TICKET_URL = 'http://localhost:8083/checkTicket';
const SSO_GET_TICKET_URL = 'http://localhost:8083/getTicket';


function checkTicket(ticket, callback) {
    getJson(`${SSO_CHECK_TICKET_URL}?ticket=${ticket}`, callback);
}

function getTicket({ username, password }, callback) {
    getJson(`${SSO_GET_TICKET_URL}?username=${username}&password=${password}`, callback);
}

function getJson(url, callback) {
    const req = http.request(url, function(res) {
        if (res.statusCode == 200) {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                let jsonData = JSON.parse(data);
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
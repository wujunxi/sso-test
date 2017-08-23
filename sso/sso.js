const http = require('http');

function checkTicket(ticket, callback) {
    get(`http://localhost:8083/checkTicket?ticket=${ticket}`, callback);
}

function get(url, callback) {
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
    checkTicket
};
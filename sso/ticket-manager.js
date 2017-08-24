const uuid = require('uuid/v1');
const db = [];

// to-do 换成redis管理

function includes(ticket) {
    return db.includes((item) => {
        return item.ticket == ticket;
    });
}

function check(ticket) {
    let index = db.findIndex(item => item.ticket == ticket);
    if (index > -1) {
        return db.splice(index, 1);
    }
    return null;
}

function push(data) {
    let ticket = uuid();
    db.push({
        ticket,
        data
    });
    return ticket;
}

module.exports = {
    includes,
    check,
    push
};
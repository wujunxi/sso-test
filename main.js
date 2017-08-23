const { fork } = require('child_process');

const child1 = fork('app.js', ['8080']);
const child2 = fork('app.js', ['8081']);

// child.on('message', function(message) {
//     console.log('Served: ' + message);
// });

// console.log(process.execPath);
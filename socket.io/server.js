let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let path = require('path');

app.use(express.static(path.join(__dirname, '/public')));

server.listen(80);

let users = [];
let messages = [];

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

  socket.emit('connection', 'Server connected');
  socket.on('answer', function (str) {
    console.log(str);
  });

  let socketId = socket.id;
  let user;


  // Rerender users list
  function refreshUsers () {
    io.emit('get users', users);
  }

  
  // Rerender messages list
  function refreshMessages () {
    io.emit('get messages', messages);
  }


  // New user
  var timerId = null;

  socket.on('new user', function (socket, cb) {
    user = socket;
    user.id = socketId;
    users.push(user);
    cb(user);
    refreshMessages();
    refreshUsers();
    timerId = setTimeout(function () {
      user.status = 'online';
      console.log(user.status);
      refreshUsers();
    }, 60000);
  });


  // New message
  socket.on('new message', function (socket, cb) {
    let message = socket;
    message.id = Date.now();
		if (messages.length === 100) {
			messages.shift();
			messages.push(message);
		} else {
			messages.push(message);
		}
    refreshMessages();
    cb(message);
  });


  // Typing
  socket.on('on typing', function (user) {
      socket.broadcast.emit('typing', user);
  });


  // Disconnection
  socket.on('disconnect', function () {
    socket.broadcast.emit('exit', user);
    for (var i = 0; i < users.length; i++) {
      if (user.id == users[i].id) {
        users[i].status = 'offline';
      }
    }
    clearTimeout(timerId);
    refreshUsers();
  });

});
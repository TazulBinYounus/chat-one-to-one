var createError = require('http-errors');
var express = require('express');
const cors = require('cors');

var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');



var app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'sessi0nS3cr3t',
  saveUninitialized: true,
  resave: false
}))


const chatServer = require('http').createServer(app);

global.users = [];
// const io = require('socket.io')(chatServer);
const socketIo = require('socket.io');
// const server = http.createServer(app);

// Middleware for CORS
app.use(cors({
  origin: 'http://localhost:3000',
}));

// Initialize Socket.IO with CORS support
const io = socketIo(chatServer, {
  cors: {
    origin: "http://localhost:3000",
  }
});



io.use((socket, next) => {
  // credentials: true;
  let token = socket.handshake.query.username;
  if (token) {
    return next();
  }
  return next(new Error('authentication error'));
});

io.on('connection', (client) => {
  let token = client.handshake.query.username;
  client.on('disconnect', () => {
    var clientid = client.id;
    for (var i = 0; i < users.length; i++)
      if (users[i].id && users[i].id == clientid) {
        users.splice(i, 1);
        break;
      }
  });
  users.push({
    id: client.id,
    name: token
  });
  client.on('typing', (data) => {
    io.emit("typing", data)
  });

  client.on('stoptyping', (data) => {
    io.emit("stoptyping", data)
  });

  client.on('message', (data) => {
    io.emit("message", data)
  });

  io.emit("newuser", {
    id: client.id,
    name: token
  })
});
chatServer.listen(3001);


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
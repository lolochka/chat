var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');

var port = process.env.PORT || 3000;

app.set('view engine','ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function(req,res){
    if(!req.cookies.login){
        res.redirect(302, '/login');
    }
    else {res.render('index')};
});

app.get('/login',function(req,res){
    res.render('login');
});

app.post('/login',function(req,res){
    res.cookie('login', req.body.login,{maxAge : 86400000, expire : new Date() + 86400000}).redirect('/');
});

var names = {};

io.on('connection', function(socket){
    names[socket.id] = socket.handshake.query['login'];
    socket.broadcast.emit('join',names[socket.id],socket.id);
    socket.emit('users',names);
    socket.on('disconnect',function(){
        socket.broadcast.emit('left', names[socket.id],socket.id);
        delete names[socket.id];
    });
    
    socket.on('chat message', function(msg,id) {
        if (id) {            
            io.to('/#' + id).emit('chat message', names[socket.id],socket.id,msg,true);
            socket.emit('chat message', names[socket.id],socket.id,msg,true);
        } else {
            io.emit('chat message', names[socket.id],socket.id,msg);
        }
    });
});

http.listen(port,function(){
    console.log('listening on *:' + port);
});
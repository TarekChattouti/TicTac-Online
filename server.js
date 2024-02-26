const { Socket } = require('engine.io');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const players = {};
let Player = 'X';
let data = [['', '', ''], ['', '', ''], ['', '', '']];
let gameEnd = false;

io.on('connection', (socket) => {
  console.log('A user connected');
  
  io.emit('userList', Object.keys(players));
  
  players[socket.id] = Player;
  

  
  socket.emit('initialData', { Player, data });

  socket.on('updateBoard', ({ Player, data }) => {
    
    io.emit('updateBoard', { Player, data });
    checkWin();
  });

  socket.on('resetGame', () => {
    data = [['', '', ''], ['', '', ''], ['', '', '']];
    gameEnd = false;
    io.emit('resetGame');
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    console.log('A user disconnected');
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function checkWin() {
  // Your existing checkWin logic here...
}

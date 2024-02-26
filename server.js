const { Socket } = require('engine.io');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  
const app = express();
const corsOptions = {
  origin: 'https://tiktak-online.azurewebsites.net/',  
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));


let currentGames = []


const players = {};
let Player = 'X';
let data = [['', '', ''], ['', '', ''], ['', '', '']];
let gameEnd = false;


function generateInvite() {

  const inviteCode = generateUniqueIdentifier(6);

  const inviteLink = `https://tiktak-online.azurewebsites.net/?invite=${inviteCode}`;


  return inviteCode;
  
}

function generateUniqueIdentifier(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


io.on('connection', (socket) => {
  const { room } = socket.handshake.query;
  if (room) {
    gameCode = room;
  } 
  else {
    gameCode = generateInvite();
  }
  console.log('A user connected');

  io.emit('userList', Object.keys(players));
  
  players[socket.id] = Player;
  let gameFound = false;
  function searchGame(game){
    if (game == gameCode) {
      gameFound=true;
    }
  }
  currentGames.forEach(searchGame);
  if (gameFound) {
    socket.join(gameCode);
  } else {
    currentGames.push(gameCode);
    socket.join(gameCode);
  }
  console.log(currentGames);

  

  io.to(gameCode).emit('initialData', {gameCode, Player, data });

  socket.on('updateBoard', ({gameCode, Player, data }) => {
    
    io.to(gameCode).emit('updateBoard', { Player, data });
    checkWin();
    
  });

  socket.on('resetGame', () => {
    data = [['', '', ''], ['', '', ''], ['', '', '']];
    gameEnd = false;
    io.to(gameCode).emit('resetGame');
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

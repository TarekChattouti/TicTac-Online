//server.js
const { Socket } = require('engine.io');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  
const app = express();




const corsOptions = {
  origin: '*',  
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};



function generateGuestName() {
  const adjectives = ['Happy', 'Sunny', 'Jolly', 'Radiant', 'Gleaming', 'Lively', 'Cheerful', 'Playful'];
  const nouns = ['Explorer', 'Adventurer', 'Wanderer', 'Dreamer', 'Nomad', 'Voyager', 'Pioneer', 'Roamer'];

  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  
  const guestName = `${randomAdjective} ${randomNoun}#${generateUniqueIdentifier(4)}`;

  return guestName;
}

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = require('socket.io')(server, {'pingTimeout': 7000, 'pingInterval': 3000});

app.use(express.static('public'));


let currentGames = {}


const players = {};
let Player = 'X';
let data = [['', '', ''], ['', '', ''], ['', '', '']];
let gameEnd = false;


function generateInvite() {

  const inviteCode = generateUniqueIdentifier(6);

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
  
  const { room , url , hasJoined} = socket.handshake.query;
  console.log(url);
  if (url == "/public.html") {
    io.emit('gameList', { currentGames });
    return;
  }
  let socketId = socket.id;
  let playerData = {
    id : "",
    name : "",
    room : ""
  }
  let roomData = {
    name : "TicTac#"+generateUniqueIdentifier(4),
    players : {
      player0 : null,
      player1 : null
    },
    isPrivate : false,
    privatePassword : null,
    isStarted : false,
    haveJoin : false
  }
  let error = 0;
  
  let gameFound = false;
  playerData["id"] = socketId;
  playerData['name'] = generateGuestName();
  let isInvited = false;
  
  if (room != "false" && url != "/") {
    console.log(room);
    if (currentGames[room]) {
      if (currentGames[room]["players"]['player0'] != null && currentGames[room]["players"]['player1'] != null){
        error = 6;
        gameCode = null;
      }
      else {
        
        gameCode = room;
        isInvited = true;
        currentGames[gameCode]['haveJoin'] = true;
        gameFound = true;
        if (currentGames[gameCode]['players']['player0'] == null) {
          
          currentGames[gameCode]['players']['player0'] = socketId;
          
        } else {

          currentGames[gameCode]['players']['player1'] = socketId;
        }
      }
    }
    else {
      error = 3;
      gameCode = null;
    }
  }
  
  else {
    gameFound=true;
    gameCode = generateInvite();
  }
  if (gameCode != null && !isInvited) {
    currentGames[gameCode] = roomData;
  }
  playerData["room"] = gameCode;
  players[socketId] = playerData;

  console.log('A user connected',players[socketId]);

  
  
  
  socket.join(gameCode);
  
  gameData = currentGames[gameCode];
  io.to(gameCode).emit('initialData', {gameData, error , playerData , Player, data });

  socket.on('updateBoard', ({gameCode, Player, data }) => {
    currentGames[gameCode]["isStarted"] == true;
    
    io.to(gameCode).emit('updateBoard', { Player, data });
    
  });

  socket.on('resetGame', () => {
    socketId = socket.id;
    data = [['', '', ''], ['', '', ''], ['', '', '']];
    gameEnd = false;
    io.to(players[socketId]["room"]).emit('resetGame');
  });

  socket.on('disconnect', () => {
    
    let disconnect = true;
    socketId = socket.id;
    if (players[socketId]["room"] != null){
      if (currentGames[players[socketId]["room"]]["players"]["player0"] == null && currentGames[players[socketId]["room"]]["players"]["player1"] == null && currentGames[gameCode]['haveJoin'] == true) {
        delete currentGames[players[socketId]["room"]];
      }else {
        if (currentGames[players[socketId]["room"]]["players"]["player0"] == socketId) {
          currentGames[players[socketId]["room"]]["players"]["player0"] = null;
        }else {
          currentGames[players[socketId]["room"]]["players"]["player1"] = null;
        }
        if (true) {
          io.to(players[socketId]["room"]).emit('disconnected', { disconnect });

        }
      }
      
    }

    deleteEmptyGames();
    delete players[socketId];
    
    console.log('A user disconnected',socketId);
  });
});
function deleteEmptyGames() {
  for (const [gameCode, gameData] of Object.entries(currentGames)) {
    const { players } = gameData;
    if (players.player0 === null && players.player1 === null && gameData.haveJoin) {
      delete currentGames[gameCode];
      console.log(`Deleted empty game with code: ${gameCode}`);
    }
  }
}
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


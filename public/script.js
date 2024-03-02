function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

const jsonFilePath = 'Errors.json';
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function redirect(msg,path) {
  alert(msg);
  await sleep(1000); 
  window.location.href = path;
}
let hasJoin = sessionStorage.getItem('hasJoined');
const socket = io('https://tiktak-online.azurewebsites.net/', {
  query: {
    room: getURLParameter('invite'),
    url: window.location.pathname
  }
});
let isLocked = true;
let playerId = 0;
let currentPlayer = "";
let gameEnd = false;
let gameData = [["", "", ""], ["", "", ""], ["", "", ""]];
let turn = 0;
let hasPlayed = false;
let gameId = "";
function unlockBoard() {
  document.getElementById('lockOverlay').style.display = 'none';
  document.getElementById('board').style.filter = 'blur(0)';
  document.getElementById('board').style.pointerEvents = 'auto';
}
function DisableBoard() {
  document.getElementById('lockOverlay').style.display = 'block';
  document.getElementById('board').style.filter = 'blur(5px)';
  document.getElementById('board').style.pointerEvents = 'auto';
}
socket.on('initialData', ({gameData, error , playerData, Player, data }) => {
  if (error != 0) {
    fetch(jsonFilePath)
    .then(response => response.json())
    .then(data => {
      sessionStorage.removeItem('hasJoined');
      redirect(data[`${error}`],"https://tiktak-online.azurewebsites.net/")

    })
    .catch(error => console.error('Error fetching JSON:', error));
  }

  if (sessionStorage.getItem('hasJoined') == null && error == 0) {
    sessionStorage.setItem('hasJoined', 'true');
    sessionStorage.setItem('gameLink', `https://tiktak-online.azurewebsites.net/game.html?invite=${playerData["room"]}`);
  }
  document.querySelector('.name').innerHTML = gameData['name'];

  console.log(gameData);
  if ((gameData["players"]["player0"] != null && gameData["players"]["player1"] != null)) {
    
    isLocked = false;
    unlockBoard();

  }
  updateGame(Player, data);
  currentPlayer = Player;
  document.getElementById("invite-link").value = `https://tiktak-online.azurewebsites.net/game.html?invite=${playerData["room"]}`;
  gameId = playerData["room"];
  document.querySelector('.message').innerHTML = "You play as " + currentPlayer;
});
socket.on('userList', (users) => {
  
});
socket.on('disconnected', (disconnect) => {
  
  DisableBoard();
  isLocked = true;
  
  
});
socket.on('updateBoard', ({ Player, data }) => {
  
  if (turn == 0 && hasPlayed ) {
    turn += 1;
  } else if (turn == 1) {
    turn -= 1;
    hasPlayed = false;
  }
  currentPlayer = Player;
  updateGame(currentPlayer, data);
  checkWin();
});

socket.on('resetGame', () => {
  resetGame();
  gameEnd = false;
});

function checkGame(block) {
  if (isLocked) {
    document.querySelector('.message').innerHTML = "Wait for another participant !";
    return;
  }
  if (!block.textContent && !gameEnd && turn == playerId && turn == 0 && !hasPlayed) {
    hasPlayed = true;
    isReset = false;
    console.log(gameData.length)
    block.textContent = currentPlayer;
    let cell = block.dataset.cell.split(' ');
    gameData[Number(cell[0])][Number(cell[1])] = currentPlayer;
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    if (!checkWin()) {
      document.querySelector('.message').innerHTML = "Turn: " + currentPlayer;
    }
    let data = gameData;
    let Player = currentPlayer;
    let gameCode = gameId;
    socket.emit('updateBoard', ({gameCode, Player, data }));
  }
}


function checkWin(){
  
  let x = 0;
  let o = 0;
  
  for (let i=0;i<3;i++){
      if (gameData[i][i] == "X") {
          x += 1;
      } else if (gameData[i][i] == "O") {
          o += 1;
      } else {
          continue;
      }
  }

  if (x==3) {
      document.querySelector('.message').innerHTML = ("Congratulations! Player X wins!");
      gameEnd = true;
      return true;
  } else if(o == 3) {
      gameEnd = true;
      document.querySelector('.message').innerHTML = ("Congratulations! Player O wins!");
      return true;
  } else {
      x = 0;
      o = 0;
      let j = 2;
      for (let i=0;i<3;i++){
          
          if (gameData[j][i] == "X") {
              x += 1;
          } else if (gameData[j][i] == "O") {
              o += 1;
          } else {
              continue;
          }
          j--;
      }
      if (x==3) {
          document.querySelector('.message').innerHTML = ("Congratulations! Player X wins!");
          gameEnd = true;
          return true;
      } else if(o == 3) {
          document.querySelector('.message').innerHTML = ("Congratulations! Player O wins!");
          gameEnd = true;
          return true;
          
      } else {
          x = 0;
          o = 0;
          let j = 0;
          for (let i=0;i<3;i++){
              x = 0;
              o = 0;
              for (let j = 0; j < 3; j++) {

                  if (gameData[i][j] == "X") {
                      x += 1;
                  } else if (gameData[i][j] == "O") {
                      o += 1;
                  } else {
                      continue;
                  }
              }
              if (x == 3 || o == 3) {
                  break;
              } else {
                  x = 0;
                  o = 0;
                  for (let j = 0; j < 3; j++) {
                      if (gameData[j][i] == "X") {
                          x += 1;
                      } else if (gameData[j][i] == "O") {
                          o += 1;
                      } else {
                          continue;
                      }
                  }
              }
              if (x == 3 || o == 3) {
                  break;
              }
          }
          if (x==3) {
              document.querySelector('.message').innerHTML = ("Congratulations! Player X wins!");
              gameEnd = true;
              return true;
          } else if(o == 3) {
              document.querySelector('.message').innerHTML = ("Congratulations! Player O wins!");
              gameEnd = true;
              return true;
              
          } 
      }
  }
  let count = 0;
  for (let i=0;i<3;i++){
      for (let j=0;j<3;j++){
          if (gameData[i][j] != "") {
              count += 1;
          } 
      }
  }
  if (count == 9) {
      document.querySelector('.message').innerHTML = "Draw! No one wins.";
  }
  return false;

}

function updateGame(currentPlayer, data) {
  document.querySelector('.message').innerHTML = "Turn: " + currentPlayer;
  const cells = document.querySelectorAll('td');
  let i = 0;
  let j = 0;
  gameData = data;

  cells.forEach(cell => {
    cell.textContent = gameData[i][j];
    j++;
    if (j >= 3) {
      j = 0;
      i++;
    }
  });
  
}

let isReset = false;
function resetGame() {
  gameData = [["", "", ""], ["", "", ""], ["", "", ""]];
  if (isReset) {
    return false;
  }
  isReset = true;
  socket.emit('resetGame');
  const cells = document.querySelectorAll('td');
  cells.forEach(cell => {
    cell.textContent = '';
  });
  currentPlayer = 'X';
  
}

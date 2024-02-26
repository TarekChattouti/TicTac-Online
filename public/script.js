function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

const socket = io('https://tiktak-online.azurewebsites.net', {
  query: {
    room: getURLParameter('invite')
  }
});
let playerId = 0;
let currentPlayer = "";
let gameEnd = false;
let gameData = [["", "", ""], ["", "", ""], ["", "", ""]];
let turn = 0;
let hasPlayed = false;
let gameId = "";
socket.on('initialData', ({gameCode, Player, data }) => {
  
  updateGame(Player, data);
  currentPlayer = Player;
  document.getElementById("invite-link").value = `https://tiktak-online.azurewebsites.net/game.html?invite=${gameCode}`;
  gameId = gameCode;
  document.querySelector('.message').innerHTML = "You play as " + currentPlayer;
});
socket.on('userList', (users) => {
  console.log('Connected users:', users[0]);
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

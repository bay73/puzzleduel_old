var util = require('util');
var config = require('../config');
var Match = require('../models/match').Match;

if(typeof(module) != 'undefined')
var  BaySudoku = require('./sudoku.js');

var queue = [];
var matches = [];

var SudokuServer = function(socket){
   socket.emit('register',{});

   socket.on('choose',function(data){
      socket.name = data.name;
      socket.size = data.size;
      socket.emit('wait',{});
      var rival;
      if(queue.length > 0){
         rival = queue.splice(0,1)[0];
      }
      if(!rival){
         queue.push(socket);
         var interval = config.get("bots:waitingtime");
         interval += Math.floor(Math.random()*6*interval);
         socket.waitTimeout = setTimeout(function(){
            var botSocket = new BaySocket(BayBotBuilder(data.size));
            SudokuServer(botSocket);
         },interval);
      } else {
         clearTimeout(rival.waitTimeout);
         clearTimeout(socket.waitTimeout);
         var match = new BayMatch(socket, rival);
         matches.push(match);
      }
   });

   socket.on('playerready',function(){
      socket.playerready = true;
      if(socket.match)
         socket.match.start();
   });

   socket.on('click',function(data){
      if(socket.match)
         socket.match.onClick(socket, data);
   });

   socket.on('disconnect',function(data){
      clearTimeout(socket.waitTimeout);
      var index = queue.indexOf(socket);
      if(index >= 0){
         queue.splice(index, 1);
      }
      if(socket.match){
         socket.match.interrupt(socket);
      }
   });
};

var BayMatch = function(socket1, socket2){
   this.socket = [];
   this.socket[0] = socket1;
   this.socket[1] = socket2;
   socket1.match = this;
   socket2.match = this;
   socket1.rival = socket2;
   socket2.rival = socket1;
   this.sudoku = new BaySudoku(socket1.size);
   this.sudoku.random(Math.floor(Math.random()*7));
   this.emit(0,'serverready',{opponent: socket2.name});
   this.emit(1,'serverready',{opponent: socket1.name});
   this.score=[0, 0];
};

BayMatch.prototype.interrupt = function(socket){
   if(socket==this.socket[1]){
      this.emit(0,'rivalclosed',{});
      if(this.started){
         Match.addMatch(this.started, this.socket, [this.score[0], this.score[1]], true, 'interrupted', function(){});
      }
   }else{
      this.emit(1,'rivalclosed',{});
      if(this.started){
         Match.addMatch(this.started, this.socket, [this.score[1], this.score[0]], false, 'interrupted', function(){});
      }
   }
   var index = matches.indexOf(this);
   matches.splice(index, 1);
};

BayMatch.prototype.start = function(){
   var self = this;
   this.emptyCount = 0;
   if(self.socket[0].playerready && self.socket[1].playerready){
      var timer = 5;
      var interval = setInterval(function(){
         self.emitAll('start', {timer: timer});
         timer--;
         if(timer === 0){
            clearInterval(interval);
            setTimeout(function(){
               self.emitAll('start', {timer: 0});
               var cells = [];
               for(var r = 0; r < self.sudoku.cellData.length; r++){
                  for(var c = 0; c < self.sudoku.cellData[r].length; c++){
                     if (self.sudoku.cellData[r][c]){
                        if(self.sudoku.cellData[r][c].type || self.sudoku.cellData[r][c].value){
                           var cell = {row: r, col: c, value: self.sudoku.cellData[r][c].value, type: self.sudoku.cellData[r][c].type};
                           cells.push(cell);
                        }
                     }
                  }
               }
               self.started = Date.now();
               self.emptyCount = self.sudoku.sudokuSize*self.sudoku.sudokuSize - cells.length;
               self.emitAll('celldata', cells);
               self.emitScore();
               console.log('Match started: ', self.socket[0].user, self.socket[1].user);
            },1000);
         }
      },1000);
   }
};

BayMatch.prototype.emitAll = function(event, data){
   this.emit(0, event, data);
   this.emit(1, event, data);
};

BayMatch.prototype.emit = function(index, event, data){
   if(this.socket[index]){
      this.socket[index].emit(event, data);
   }
};

BayMatch.prototype.emitScore = function(){
   this.emit(0, 'info',{score: {mine: this.score[0], rivals: this.score[1]}});
   this.emit(1, 'info',{score: {mine: this.score[1], rivals: this.score[0]}});
};

BayMatch.prototype.setCellValue = function(cell, value){
   if(!cell.value){
      if(cell.answer == value){
         cell.value = value;
         this.emptyCount--;
      }
   }
};

BayMatch.prototype.onClick = function(socket, data){
   if(!this.started) return;
   var player;
   if(socket == this.socket[0]) player = 0;
   if(socket == this.socket[1]) player = 1;
   var row = data.row;
   var col = data.col;
   var self = this;
   var cell;
   if(this.sudoku.cellData[row]){
      if(this.sudoku.cellData[row][col]){
         cell = this.sudoku.cellData[row][col];
         this.setCellValue(cell, data.value);
         if(typeof(cell.player)=='undefined'){
            if(cell.answer == data.value){
               this.score[player]++;
               cell.player = player;
               self.emitCell(row, col, cell);
            }else{
               this.score[1-player]++;
               cell.player = 1 - player;
               self.emitCell(row, col, cell);
            }
         }else if(cell.player==player){
            if(cell.answer != data.value){
               this.score[1-player]++;
               this.score[player]--;
               cell.player = 1 - player;
            }
            self.emitCell(row, col, cell);
         }else if(cell.player!=player){
            self.emitCell(row, col, cell);
         }
      }
   }
   self.emitScore();
   if(this.emptyCount===0){
      var size = this.sudoku.sudokuSize;
      var counter = [0, 0];
      for(var i=0;i<size;i++){
         for(var j=0;j<size;j++){
            cell = this.sudoku.cellData[i][j];
            if(typeof(cell.player) != 'undefined'){
               counter[cell.player]++;
            }
         }
      }
      if(counter[0] == counter[1]){
         self.emitAll('finish', {state: 'draw'});
         Match.addMatch(this.started, this.socket, counter, undefined, 'finish', function(){});
      } else if(counter[0] > counter[1]) {
         self.emit(0, 'finish', {state: 'win'});
         self.emit(1, 'finish', {state: 'loose'});
         Match.addMatch(this.started, this.socket, counter, true, 'finish', function(){});
      } else if(counter[0] < counter[1]) {
         self.emit(0, 'finish', {state: 'loose'});
         self.emit(1, 'finish', {state: 'win'});
         Match.addMatch(this.started, this.socket, counter, false, 'finish', function(){});
      }
      this.socket[0].playerready = false;
      this.socket[1].playerready = false;
      this.sudoku = new BaySudoku(size);
      this.sudoku.random(Math.floor(Math.random()*7));
      this.score=[0, 0];
      this.emit(0,'serverready',{opponent: this.socket[1].name});
      this.emit(1,'serverready',{opponent: this.socket[0].name});
      this.started = undefined;
   }
};

BayMatch.prototype.emitCell = function(row, col, cell){
   var cellType = function(player, cell){
      if(typeof(cell.player)=='undefined'){
         return '';
      } else {
         return cell.player==player?'mine':'others';
      }
   };
   if(cell.value){
      this.emit(0, 'celldata',[{row: row, col: col, value: cell.answer, type: cellType(0, cell)}]);
      this.emit(1, 'celldata',[{row: row, col: col, value: cell.answer, type: cellType(1, cell)}]);
   }else{
      this.emit(0, 'celldata',[{row: row, col: col, type: cellType(0, cell)}]);
      this.emit(1, 'celldata',[{row: row, col: col, type: cellType(1, cell)}]);
   }
};

var BaySocket = function(bot){
   this.bot = bot;
   this.callbacks = {};
   this.user = { type: 'bot', id: bot.name, displayName: bot.name };
   bot.server = this;
};

BaySocket.prototype.on = function(event, callback){
   this.callbacks[event] = callback;
};

BaySocket.prototype.emit = function(event, data){
//   console.log(event + ' to bot at ' + (new Date().getTime() - start));
//   console.log(data);
   if(this.bot.callbacks[event]){
      var func = this.bot.callbacks[event];
      setTimeout(function(){ func(data);},1);
   }
};

var BaySudokuBot = function(size, botData){
   this.start = new Date().getTime();
   this.gameCount = 0;
   this.gameResult = 0;
   this.thinktime = botData.delay;
   this.name = botData.name;
   this.callbacks = {};
   this.size = size;
   this.sudoku = new BaySudoku(size);
   this.sudoku.initSudoku();
   this.clueCount = 0;
   var self = this;

   this.on('register', function(){
      self.emit('choose', {name: self.name, size: self.size});
   });
   this.on('serverready', function(){
      self.moveTimeout = setTimeout(function(){
         self.ready();
      }, 5000);
   });
   this.on('celldata', function(cellData){
      self.onCelldata(cellData);
   });
   this.on('start', function(data){
      clearTimeout(self.rivalWaitTimeout);
      if(data.timer === 0){
         self.onStart();
      }
   });
   this.on('finish',function(data){
      self.onFinish();
   });
   this.on('info',function(data){
      if(data.score){
         self.mine = data.score.mine;
         self.rivals = data.score.rivals;
      }
   });
   this.on('rivalclosed',function(data){
      clearTimeout(self.moveTimeout);
      delete self.server;
   });
   this.on('disconnect',function(data){
      clearTimeout(self.moveTimeout);
      delete self.server;
   });
};

BaySudokuBot.prototype.on = function(event, callback){
   this.callbacks[event] = callback;
};

BaySudokuBot.prototype.ready = function(){
   var self = this;
   self.emit('playerready', {});
   var interval = config.get("bots:waitingtime") * 5;
   interval += Math.floor(interval * Math.random());
   self.rivalWaitTimeout = setTimeout(function(){
      self.emit('disconnect');
   }, interval);
};

BaySudokuBot.prototype.emit = function(event, data){
//   console.log(event + ' from bot at ' + (new Date().getTime() - this.start));
//   console.log(data);
   if(this.server && this.server.callbacks && this.server.callbacks[event]){
      var func = this.server.callbacks[event];
      setTimeout(function(){ func(data);},1);
   }
};

BaySudokuBot.prototype.onCelldata = function(cellData){
   for(var i in cellData){
      var data = cellData[i];
      var cell = this.sudoku.cellData[data.row][data.col];
      if(data.value){
         if(!cell.type || cell.type != 'clue'){
            this.clueCount++;
         }
         cell.type = 'clue';
         cell.value = data.value;
      }
      if(this.processCellData){
         this.processCellData(cell, data);
      }
   }
};

BaySudokuBot.prototype.onFinish = function(){
   var self = this;
   self.sudoku = new BaySudoku(self.size);
   self.sudoku.initSudoku();
   self.clueCount = 0;
   self.gameResult += (self.mine - self.rivals);
   clearTimeout(self.moveTimeout);
   var duration = new Date().getTime() - this.start;
   var maxGame = 5 + Math.random()*20;
   if(self.mine > self.rivals * 3 ||
         self.rivals > self.mine * 1.5 ||
         this.gameCount > maxGame ||
         self.gameResult < -40 ||
         duration > 600000) {
      setTimeout(function(){
         self.emit('disconnect');
      }, 4000);
   }
};


BaySudokuBot.prototype.onStart = function(){
   this.start = new Date().getTime();
   this.gameCount++;
   var self = this;
   var interval = Math.random()*this.sudoku.sudokuSize*this.thinktime*4 + this.sudoku.sudokuSize*this.thinktime*2;
   this.moveTimeout = setTimeout(function(){self.makeMove();}, interval);
};

BaySudokuBot.prototype.makeMove = function(){
   var size = this.sudoku.sudokuSize;
   var empty = 0;
   if(this.clueCount > size*size/5){
      this.sudoku.solve();
      var cells = [];
      for(var i=0;i<size;i++){
         for(var j=0;j<size;j++){
            var cell = this.sudoku.cellData[i][j];
            if(cell && !cell.type){
               cells.push({row:i, col:j, answer:cell.answer});
            }
         }
      }
      empty = cells.length;
      if(cells.length > 0){
         var rnd = cells[Math.floor(Math.random()*cells.length)];
         this.emit('click', {row: rnd.row, col: rnd.col, value: rnd.answer});
      }
   }
   var self = this;
   var interval = (Math.random()*3 + 1)*this.thinktime*(empty+size)/size;
   if(self.rivals > 0){
      interval = interval * (self.mine + self.rivals)/ self.rivals;
   }
   this.moveTimeout = setTimeout(function(){self.makeMove();}, interval);
};


var BaySmartBot = function(size, botData){
   BaySudokuBot.call(this, size, botData);
};
util.inherits(BaySmartBot, BaySudokuBot);

BaySmartBot.prototype.onStart = function(){
   BaySmartBot.super_.prototype.onStart.apply(this, arguments);
   this.lastMove = null;
   this.empty = this.size*this.size;
   for(var i=0;i<this.size;i++){
      for(var j=0;j<this.size;j++){
         var cell = this.sudoku.cellData[i][j];
         cell.possibleValues = [];
         for(var v=1;v<=this.size;v++){
            cell.possibleValues.push(v);
         }
      }
   }
};

BaySmartBot.prototype.excludeValue = function(x, y, v){
   var area = this.sudoku.gridData.rows[x].cells[y];
   for(var i=0;i<this.size;i++){
      for(var j=0;j<this.size;j++){
         var cell = this.sudoku.cellData[i][j];
         if(cell){
            var bDelete = false;
            if( i == x ) bDelete = true;
            if( j == y ) bDelete = true;
            if(area==this.sudoku.gridData.rows[i].cells[j]) bDelete = true;
            if(bDelete){
               if(cell.possibleValues.indexOf(v)>=0){
                  cell.possibleValues.splice(cell.possibleValues.indexOf(v), 1);
               }
            }
         }
      }
   }
};


BaySmartBot.prototype.processCellData = function(cell, data){
   if(data.value) {
      this.excludeValue(data.row, data.col, data.value);
      cell.possibleValues = [];
      this.empty--;
      if(this.empty < 0) this.empty = 0;
   }
};


BaySmartBot.prototype.findMove = function(){
   var rowCounter = [];
   var colCounter = [];
   var areaCounter = [];
   var unique,a,v,i,j,cell;
   for(a=0; a<this.size; a++){
      rowCounter[a] = [];
      colCounter[a] = [];
      areaCounter[a+1] = [];
      for(v=1; v<=this.size; v++){
         rowCounter[a][v] = 0;
         colCounter[a][v] = 0;
         areaCounter[a+1][v] = 0;
      }
   }
   for(i=0;i<this.size;i++){
      for(j=0;j<this.size;j++){
         cell = this.sudoku.cellData[i][j];
         if(cell){
            if(!cell.value) {
               if(cell.possibleValues.length==1){
                  unique = {row: i, col: j, value: cell.possibleValues[0]};
               }
               for(v=0;v<cell.possibleValues.length;v++){
                  rowCounter[i][cell.possibleValues[v]]++;
                  colCounter[j][cell.possibleValues[v]]++;
                  areaCounter[this.sudoku.gridData.rows[i].cells[j]][cell.possibleValues[v]]++;
               }
            }
         }
      }
   }
   var area;
   if(this.lastMove){
      area = this.sudoku.gridData.rows[this.lastMove.row].cells[this.lastMove.col];
   }
   for(a=1; a<=this.size; a++){
      if (!this.lastMove || a == area){
         for(v=1; v<=this.size; v++){
            if(areaCounter[a][v] == 1){
               for(i=0;i<this.size;i++){
                  for(j=0;j<this.size;j++){
                     if(this.sudoku.gridData.rows[i].cells[j]==a){
                        cell = this.sudoku.cellData[i][j];
                        if(!cell.value && cell.possibleValues.indexOf(v)>=0){
                           return {row: i, col: j, value: v};
                        }
                     }
                  }
               }
            }
         }
      }
   }
   for(a=0; a<this.size; a++){
      if (!this.lastMove || a == this.lastMove.row){
         for(v=1; v<=this.size; v++){
            if(rowCounter[a][v] == 1){
               for(i=0;i<this.size;i++){
                  cell = this.sudoku.cellData[a][i];
                  if(!cell.value && cell.possibleValues.indexOf(v)>=0){
                     return {row: a, col: i, value: v};
                  }
               }
            }
         }
      }
      if (!this.lastMove || a == this.lastMove.col){
         for(v=1; v<=this.size; v++){
            if(colCounter[a][v] == 1){
               for(i=0;i<this.size;i++){
                  cell = this.sudoku.cellData[i][a];
                  if(!cell.value && cell.possibleValues.indexOf(v)>=0){
                     return {row: i, col: a, value: v};
                  }
               }
            }
         }
      }
   }
   return unique;
};

BaySmartBot.prototype.guessMove = function(){
   var minSize = this.size + 1;
   var move;
   for(var i=0;i<this.size;i++){
      for(var j=0;j<this.size;j++){
         var cell = this.sudoku.cellData[i][j];
         if(cell){
            if(!cell.value) {
               if(cell.possibleValues.length < minSize){
                  minSize = cell.possibleValues.length;
                  move = {row: i, col: j, value: cell.possibleValues[0]};
               }
            }
         }
      }
   }
   return move;
};

BaySmartBot.prototype.makeMove = function(){
   var move = this.findMove();
   if(!move && !this.lastMove){
      move = this.guessMove();
   }
   if (move) {
      this.emit('click', move);
      var cell = this.sudoku.cellData[move.row][move.col];
      if(cell.possibleValues.indexOf(move.value) >= 0){
         cell.possibleValues.splice(cell.possibleValues.indexOf(move.value), 1);
      }
   }
   this.lastMove = move;
   var self = this;
   var interval = (Math.random()*3 + 1)*this.thinktime*(self.empty + self.size)/self.size;
   if(self.rivals > 0){
      interval = interval * (self.mine + self.rivals)/ self.rivals;
   }
   this.moveTimeout = setTimeout(function(){self.makeMove();}, interval);
};

var bots = [
   {name: 'Leong Guotin', delay: 250, type: BaySudokuBot, hours: [{min: 0, max: 16}]},
   {name: 'イザナギ', delay: 300, type: BaySudokuBot, hours: [{min: 12, max: 24}, {min: 0, max: 4}]},
   {name: 'Alice Greenwell', delay: 350, type: BaySudokuBot, hours: [{min: 8, max: 24}]},
   {name: 'Wart', delay: 400, type: BaySudokuBot, hours: [{min: 16, max: 24}, {min: 0, max: 8}]},
   {name: 'Crazy', delay: 300, type: BaySmartBot, hours: [{min: 12, max: 24}, {min: 0, max: 4}]},
   {name: 'Okazaki', delay: 330, type: BaySmartBot, hours: [{min: 0, max: 16}]},
   {name: 'Yoko Tokawa', delay: 350, type: BaySmartBot, hours: [{min: 0, max: 16}]},
   {name: 'Martin J.', delay: 380, type: BaySmartBot, hours: [{min: 8, max: 24}]},
   {name: 'Matej Balenovic', delay: 400, type: BaySmartBot, hours: [{min: 4, max: 20}]},
   {name: 'Radik', delay: 420, type: BaySmartBot, hours: [{min: 20, max: 24}, {min: 0, max: 12}]},
   {name: 'Hua Qiang', delay: 450, type: BaySmartBot, hours: [{min: 0, max: 16}]},
   {name: 'Hamersley', delay: 480, type: BaySmartBot, hours: [{min: 12, max: 24}, {min: 0, max: 4}]},
   {name: 'Игорь Веселов', delay: 500, type: BaySmartBot, hours: [{min: 4, max: 20}]},
   {name: 'Curt McKnight', delay: 520, type: BaySmartBot, hours: [{min: 8, max: 24}]},
   {name: 'Aragorn', delay: 550, type: BaySmartBot, hours: [{min: 4, max: 20}]},
   {name: 'Masha Marinovic', delay: 580, type: BaySmartBot, hours: [{min: 16, max: 24}, {min: 0, max: 8}]},
   {name: 'Lénárd', delay: 600, type: BaySmartBot, hours: [{min: 8, max: 24}]},
   {name: 'Maïténa', delay: 620, type: BaySmartBot, hours: [{min: 16, max: 24}, {min: 0, max: 8}]},
   {name: 'Claude Houdin', delay: 650, type: BaySmartBot, hours: [{min: 20, max: 24}, {min: 0, max: 12}]},
];

var BayBotBuilder = function(size){
   var hour = new Date().getHours();
   var readyBots = [];
   var playerList = getPlayerList();
   var currentPlay = function(id){
      for(var p=0;p<playerList.length;p++){
         if(playerList[p].type=='bot' && playerList[p].id==id){
            return true;
         }
      }
      return false;
   };
   var checkTime = function(hours){
      for(var h=0;h<hours.length;h++){
         if(hours[h].min <= hour && hours[h].max > hour){
            return true;
         }
      }
      return false;
   };
   for(var i=0;i<bots.length;i++){
      if(checkTime(bots[i].hours) && !currentPlay(bots[i].name)){
         readyBots.push(bots[i]);
      }
   }
   if(readyBots.length===0){
      readyBots=bots;
   }
   var index = Math.floor(Math.random()*readyBots.length);
   var botData = readyBots[index];
   return new botData.type(size, botData);
};

var getUserData = function(socket){
   if(socket.user){
      return {
         id: socket.user.id,
         type: socket.user.type,
         displayName: socket.user.displayName
      };
   }else{
      return {
         type: 'anonym',
         displayName: socket.name
      };
   }
};

var getQueueData = function(){
   var queueData = [];
   for(var i=0;i<queue.length;i++){
      queueData.push(getUserData(queue[i]));
   }
   return queueData;
};

var getMatchData = function(){
   var matchData = [];
   for(var i=0;i<matches.length;i++){
      var status = 'playing';
      if(!matches[i].emptyCount && matches[i].score[0]===0 && matches[i].score[1]===0){
         status='waiting';
      }
      matchData.push({status: status, cellsLeft: matches[i].emptyCount, score: matches[i].score, 
                      users: [getUserData(matches[i].socket[0]),getUserData(matches[i].socket[1])]});
   }
   return matchData;
};

var getPlayerList = function(){
   var playerList = [];
   for(var i=0;i<matches.length;i++){
      playerList.push(getUserData(matches[i].socket[0]));
      playerList.push(getUserData(matches[i].socket[1]));
   }
   return playerList;
};

if(typeof(module) != 'undefined')
  module.exports=SudokuServer;
  module.exports.matchData=getMatchData;
  module.exports.queueData=getQueueData;

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
      if(queue.length > 0){
         var rival = queue.splice(0,1)[0];
      }
      if(!rival){
         queue.push(socket);
         socket.waitTimeout = setTimeout(function(){
            var botSocket = new BaySocket(BayBotBuilder(data.size));
            SudokuServer(botSocket);
         },config.get("bots:waitingtime"));
      } else {
         clearTimeout(rival.waitTimeout);
         clearTimeout(socket.waitTimeout);
         var match = new BayMatch(socket, rival);
         matches.push(match);
      }
   });

   socket.on('playerready',function(){
      socket.playerready = true;
      socket.match.start();
   });

   socket.on('click',function(data){
      socket.match.onClick(socket, data);
   });

   socket.on('disconnect',function(data){
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
         Match.addMatch(this.started, this.socket, [0, 0], true, 'interrupted', function(){});
      }
   }else{
      this.emit(1,'rivalclosed',{});
      if(this.started){
         Match.addMatch(this.started, this.socket, [0, 0], false, 'interrupted', function(){});
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
         if(timer==0){
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
   if(socket == this.socket[0]) var player = 0;
   if(socket == this.socket[1]) player = 1;
   var row = data.row;
   var col = data.col;
   var self = this;
   if(this.sudoku.cellData[row]){
      if(this.sudoku.cellData[row][col]){
         var cell = this.sudoku.cellData[row][col];
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
   if(this.emptyCount==0){
      var size = this.sudoku.sudokuSize;
      var counter = [0, 0];
      for(var i=0;i<size;i++){
         for(var j=0;j<size;j++){
            var cell = this.sudoku.cellData[i][j];
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
      self.emit('playerready', {});
   });
   this.on('celldata', function(cellData){
      self.onCelldata(cellData);
   });
   this.on('start', function(data){
      if(data.timer == 0){
         self.onStart();
      }
   });
   this.on('finish',function(data){
      self.sudoku = new BaySudoku(self.size);
      self.sudoku.initSudoku();
      self.clueCount = 0;
      clearTimeout(self.moveTimeout);
   });
   this.on('info',function(data){
      if(data.score){
         self.mine = data.score.mine;
         self.rivals = data.score.rivals;
      }
   });
   this.on('disconnect',function(data){
      clearTimeout(self.moveTimeout);
      self.server.delete();
      self.delete();
   });
};

BaySudokuBot.prototype.on = function(event, callback){
   this.callbacks[event] = callback;
};

BaySudokuBot.prototype.emit = function(event, data){
//   console.log(event + ' from bot at ' + (new Date().getTime() - start));
//   console.log(data);
   if(this.server.callbacks[event]){
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

BaySudokuBot.prototype.onStart = function(){
   var self = this;
   var interval = Math.random()*this.sudoku.sudokuSize*this.thinktime*4 + this.sudoku.sudokuSize*this.thinktime*2;
   this.moveTimeout = setTimeout(function(){self.makeMove()}, interval);
};

BaySudokuBot.prototype.makeMove = function(){
   var size = this.sudoku.sudokuSize;
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
      var empty = cells.length;
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
}

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
   for(var a=0; a<this.size; a++){
      rowCounter[a] = [];
      colCounter[a] = [];
      areaCounter[a+1] = [];
      for(var v=1; v<=this.size; v++){
         rowCounter[a][v] = 0;
         colCounter[a][v] = 0;
         areaCounter[a+1][v] = 0;
      }
   }
   for(var i=0;i<this.size;i++){
      for(var j=0;j<this.size;j++){
         var cell = this.sudoku.cellData[i][j];
         if(cell){
            if(!cell.value) {
               if(cell.possibleValues.length==1){
                  var unique = {row: i, col: j, value: cell.possibleValues[0]};
               }
               for(var v=0;v<cell.possibleValues.length;v++){
                  rowCounter[i][cell.possibleValues[v]]++;
                  colCounter[j][cell.possibleValues[v]]++;
                  areaCounter[this.sudoku.gridData.rows[i].cells[j]][cell.possibleValues[v]]++;
               }
            }
         }
      }
   }
   if(this.lastMove){
      var area = this.sudoku.gridData.rows[this.lastMove.row].cells[this.lastMove.col];
   }
   for(var a=1; a<=this.size; a++){
      if (!this.lastMove || a == area){
         for(var v=1; v<=this.size; v++){
            if(areaCounter[a][v] == 1){
               for(var i=0;i<this.size;i++){
                  for(var j=0;j<this.size;j++){
                     if(this.sudoku.gridData.rows[i].cells[j]==a){
                        var cell = this.sudoku.cellData[i][j];
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
   for(var a=0; a<this.size; a++){
      if (!this.lastMove || a == this.lastMove.row){
         for(var v=1; v<=this.size; v++){
            if(rowCounter[a][v] == 1){
               for(var i=0;i<this.size;i++){
                  var cell = this.sudoku.cellData[a][i];
                  if(!cell.value && cell.possibleValues.indexOf(v)>=0){
                     return {row: a, col: i, value: v};
                  }
               }
            }
         }
      }
      if (!this.lastMove || a == this.lastMove.col){
         for(var v=1; v<=this.size; v++){
            if(colCounter[a][v] == 1){
               for(var i=0;i<this.size;i++){
                  var cell = this.sudoku.cellData[i][a];
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
   for(var i=0;i<this.size;i++){
      for(var j=0;j<this.size;j++){
         var cell = this.sudoku.cellData[i][j];
         if(cell){
            if(!cell.value) {
               if(cell.possibleValues.length < minSize){
                  minSize = cell.possibleValues.length;
                  var move = {row: i, col: j, value: cell.possibleValues[0]};
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
   {name: 'イザナギ', delay: 500, type: BaySudokuBot},
   {name: 'Alice Greenwell', delay: 600, type: BaySudokuBot},
   {name: 'Игорь Веселов', delay: 400, type: BaySudokuBot},
   {name: 'Yoko Tokawa', delay: 300, type: BaySmartBot},
   {name: 'Leong Guoti', delay: 550, type: BaySudokuBot},
   {name: 'Crazy', delay: 200, type: BaySmartBot},
   {name: 'Wart', delay: 700, type: BaySudokuBot},
   {name: 'Martin J.', delay: 350, type: BaySmartBot},
   {name: 'Masha Marinovic', delay: 600, type: BaySmartBot},
   {name: 'Okazaki DAI', delay: 250, type: BaySmartBot},
   {name: 'Matej Balenovic', delay: 350, type: BaySmartBot},
   {name: 'Curt McKnight', delay: 500, type: BaySmartBot},
   {name: 'Hua Qiang', delay: 400, type: BaySmartBot},
   {name: 'Maïténa', delay: 700, type: BaySmartBot},
   {name: 'Radik', delay: 350, type: BaySmartBot},
   {name: 'Lénárd', delay: 600, type: BaySmartBot},
   {name: 'Aragorn', delay: 500, type: BaySmartBot},
   {name: 'Claude Houdin', delay: 450, type: BaySmartBot},
   {name: 'Hamersley', delay: 400, type: BaySmartBot},
   ];

var BayBotBuilder = function(size){
   var index = Math.floor(Math.random()*bots.length);
   var botData = bots[index];
   return new botData.type(size, botData);
};


if(typeof(module) != 'undefined')
  module.exports=SudokuServer;

var config = require('../config');

var Match = require('../models/match').Match;

if(typeof(module) != 'undefined')
  BaySudoku = require('./sudoku.js');

var start = new Date().getTime()
var queue = [];
var matches = [];

SudokuServer = function(socket){
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
            var botSocket = new BaySocket(new BaySudokuBot(data.size));
            SudokuServer(botSocket);
         },config.get("bots:waitingtime"));
      } else {
         clearTimeout(rival.waitTimeout);
         clearTimeout(socket.waitTimeout);
         match = new BayMatch(socket, rival);
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
   })
}

BayMatch = function(socket1, socket2){
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
}

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
}

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
            },1000);
         }
      },1000);
   }
}

BayMatch.prototype.emitAll = function(event, data){
   this.emit(0, event, data);
   this.emit(1, event, data);
}

BayMatch.prototype.emit = function(index, event, data){
   if(this.socket[index]){
      this.socket[index].emit(event, data);
   }
}

BayMatch.prototype.emitScore = function(){
   this.emit(0, 'info',{score: {mine: this.score[0], rivals: this.score[1]}});
   this.emit(1, 'info',{score: {mine: this.score[1], rivals: this.score[0]}});
}

BayMatch.prototype.setCellValue = function(cell, value){
   if(!cell.value){
      if(cell.answer == value){
         cell.value = value;
         this.emptyCount--;
      }
   }
}

BayMatch.prototype.onClick = function(socket, data){
   if(!this.started) return;
   if(socket == this.socket[0]) var player = 0;
   if(socket == this.socket[1]) var player = 1;
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
}

BayMatch.prototype.emitCell = function(row, col, cell){
   var cellType = function(player, cell){
      if(typeof(cell.player)=='undefined'){
         return '';
      } else {
         return cell.player==player?'mine':'others';
      }
   }
   if(cell.value){
      this.emit(0, 'celldata',[{row: row, col: col, value: cell.answer, type: cellType(0, cell)}])
      this.emit(1, 'celldata',[{row: row, col: col, value: cell.answer, type: cellType(1, cell)}])
   }else{
      this.emit(0, 'celldata',[{row: row, col: col, type: cellType(0, cell)}])
      this.emit(1, 'celldata',[{row: row, col: col, type: cellType(1, cell)}])
   }
}

BaySocket = function(bot){
   this.bot = bot;
   this.callbacks = {};
   this.user = { type: 'bot', id: bot.name, displayName: bot.name }
   bot.server = this;
}

BaySocket.prototype.on = function(event, callback){
   this.callbacks[event] = callback;
}

BaySocket.prototype.emit = function(event, data){
//   console.log(event + ' to bot at ' + (new Date().getTime() - start));
//   console.log(data);
   if(this.bot.callbacks[event]){
      var func = this.bot.callbacks[event];
      setTimeout(function(){ func(data);},1);
   }
}

BaySudokuBot = function(size){
   this.thinktime = 500;
   this.callbacks = {};
   this.size = size;
   this.sudoku = new BaySudoku(size);
   this.sudoku.initSudoku();
   this.clueCount = 0;
   this.names = ['イザナギ', 'Alice Greenwell', 'Игорь Веселов', 'Yoko Tokawa', 'Leong Guotin', 'Crazy', 'Wart']
   this.speeds = [500, 600, 400, 300, 550, 200, 700]
   var index = Math.floor(Math.random()*this.names.length);
   this.name = this.names[index];
   this.thinktime = this.speeds[index];
   var self = this;

   this.on('register', function(){
      self.emit('choose', {name: self.name, size: self.size})
   });
   this.on('serverready', function(){
      self.emit('playerready', {})
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
}

BaySudokuBot.prototype.on = function(event, callback){
   this.callbacks[event] = callback;
}

BaySudokuBot.prototype.emit = function(event, data){
//   console.log(event + ' from bot at ' + (new Date().getTime() - start));
//   console.log(data);
   if(this.server.callbacks[event]){
      var func = this.server.callbacks[event];
      setTimeout(function(){ func(data);},1);
   }
}

BaySudokuBot.prototype.onCelldata = function(cellData){
   for(var i in cellData){
      var data = cellData[i];
      if(data.value){
         var cell = this.sudoku.cellData[data.row][data.col];
         if(!cell.type || cell.type != 'clue'){
            this.clueCount++;
         }
         cell.type = 'clue';
         cell.value = data.value;
      }
   }
}

BaySudokuBot.prototype.onStart = function(){
   var self = this;
   var interval = Math.random()*this.sudoku.sudokuSize*this.thinktime*4 + this.sudoku.sudokuSize*this.thinktime*2;
   this.moveTimeout = setTimeout(function(){self.makeMove()}, interval);
}

BaySudokuBot.prototype.makeMove = function(){
   var size = this.sudoku.sudokuSize;
   var length = 0;
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
}

if(typeof(module) != 'undefined')
  module.exports=SudokuServer;

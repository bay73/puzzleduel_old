var BayColorScheme;
var translate;
var io;
var server;
var board;

var SquareCell = function(x,y,width,height){
   this.x = x;
   this.y = y;
   this.width = width;
   this.height = height;
   this.type = 'cell';
   this.dependants = [];
};

SquareCell.prototype.draw = function(canvas, colorScheme){
   var centerX = this.x * canvas.width() + this.width * canvas.width() / 2;
   var centerY = this.y * canvas.height() + this.height * canvas.height() / 2;
   if(this.isCell){
      canvas.clearCanvas({
                     x: centerX,
                     y: centerY,
                     width: this.width * canvas.width(),
                     height: this.height * canvas.height()
      });
   }
   var lineWidth = colorScheme[this.type].borderWidth * canvas.width() / 400;
   var borderColor = colorScheme[this.type].borderColor;
   var fillColor = colorScheme[this.type].fillColor;
   canvas.drawRect({
                     strokeWidth: borderColor?lineWidth:0, 
                     strokeStyle: borderColor?borderColor:'transparent',
                     fillStyle: fillColor?fillColor:'transparent',
                     x: centerX,
                     y: centerY,
                     width: this.width * canvas.width() - lineWidth,
                     height: this.height * canvas.height() - lineWidth
                  });
   if(this.isActive){
      lineWidth = colorScheme['active'].borderWidth * canvas.width() / 400;
      borderColor = colorScheme['active'].borderColor;
      fillColor = colorScheme['active'].fillColor;
      var margin = colorScheme['active'].borderMargin * canvas.width() / 400;
      canvas.drawRect({
                        strokeWidth: lineWidth, 
                        strokeStyle: borderColor,
                        fillStyle: fillColor?fillColor:'transparent',
                        x: centerX,
                        y: centerY,
                        width: this.width * canvas.width() - margin * 2,
                        height: this.height * canvas.height() - margin * 2,
                     });
   }
   if(this.value){
      canvas.drawText({
         fillStyle: colorScheme[this.type].fontColor,
         x: centerX,
         y: centerY,
         fontSize: this.height * canvas.height() * colorScheme[this.type].fontSize / 10,
         fontStyle: colorScheme[this.type].fontStyle,
         fontFamily: colorScheme[this.type].fontFamily,
         text: this.value
      });
   }
};

var SquareGridGenerator = function(properties){
};

SquareGridGenerator.prototype.generate = function(properties){
   if(!properties.colorScheme){
      properties.colorScheme = BayColorScheme.classic;
   }
   var width = properties.width;
   var height = properties.height;
   var gridData = {};
   gridData.cells = new Array(width);
   for(var i = 0; i < gridData.size; i++) gridData.cellData[i] = new Array(height);
   gridData.elements = [];
   for (var i = 0; i < width; i++) {
      gridData.cells[i] = new Array(height);
      for (var j = 0; j < properties.height; j++) {
         gridData.cells[i][j] = new SquareCell(i/width, j/height, 1/width, 1/height);
         gridData.cells[i][j].row = j;
         gridData.cells[i][j].col = i;
         gridData.cells[i][j].isCell = true;
         gridData.elements.push(gridData.cells[i][j]);
      }
   }
   var createBigCell = function(x,y,w,h){
      var bigCell = new SquareCell(x*w/width, y*h/height, w/width, h/height);
      bigCell.type = 'frame';
      for(var i = x*w; i < (x+1)*w; i++){
         for(var j = y*h; j < (y+1)*h; j++){
            gridData.cells[i][j].dependants.push(bigCell);
         }
      }
      return bigCell;
   };
   if (properties.sudoku){
      var addBigCells = function(n,m){
         for (var i = 0; i < width / n; i++) {
            for (var j = 0; j < height / m; j++) {
               var bigCell = createBigCell(i, j, n, m);
               gridData.elements.push(bigCell);
            }
         }
      };
      if(width == 9 && height == 9){
         addBigCells(3,3);
      }
      if(width == 4 && height == 4){
         addBigCells(2,2);
      }
      if(width == 6 && height == 6){
         addBigCells(3,2);
      }
      if(width == 8 && height == 8){
         addBigCells(4,2);
      }
   }
   var grid = createBigCell(0, 0, width, height);
   grid.type = 'doubleframe';
   gridData.elements.push(grid);
   gridData.getCell = function(x,y){
      if(gridData.cells[Math.floor(x*width, 0)])
         return gridData.cells[Math.floor(x*width, 0)][Math.floor(y*height, 0)];
      else
         return undefined;
   };
   return gridData;
};

var BayPuzzle = function(properties){
   this.properties = properties;
   this.size = properties.width;
   var self = this;
   rippleButton($('#connect'), function(){self.connect();});
   rippleButton($('#rulesclose'), function(){closeDialog($('#rulesDialog'), function(){self.changeState();});});
   rippleButton($('#skinsclose'), function(){closeDialog($('#skinsDialog'), function(){self.changeState();});});
   $('#connect').attr('disabled', 'disabled');
   rippleButton($('#ready'), function(){self.ready();});
   self.name = $('#name').val();
   $('#name').keyup(function(){
      if($('#name').val()){
         $('#connect').removeAttr('disabled');
      }else{
         $('#connect').attr('disabled', 'disabled');
      }
   });
   $('#name').blur(function(){
      self.setName($('#name').val());
   });
   this.generator = properties.generator;
   this.grid = this.generator.generate(properties);
   this.socket = io();
   this.changeState('initializing');
   this.socket.on('register',function(data){self.onRegister(data);});
   this.socket.on('wait',function(data){self.onWait(data);});
   this.socket.on('serverready',function(data){self.onReady(data);});
   this.socket.on('start',function(data){self.onStart(data);});
   this.socket.on('celldata',function(cellData){self.onCellData(cellData);});
   this.socket.on('info',function(data){self.onInfo(data);});
   this.socket.on('finish',function(data){self.onFinish(data);});
   this.socket.on('rivalclosed',function(data){self.onRivalclosed(data);});
   if(typeof(server) != 'undefined'){
      this.socket.connect(server);
   }
};

BayPuzzle.prototype.getElements = function(){
   return this.grid.elements;
};

BayPuzzle.prototype.getCell = function(x, y){
   return this.grid.getCell(x, y);
};

BayPuzzle.prototype.setBoard = function(board){
   this.board = board;
   board.socket = this.socket;
};

BayPuzzle.prototype.setScorePanel = function(panel){
   this.scorePanel = panel;
   board.socket = this.socket;
};

BayPuzzle.prototype.setInfoPanel = function(panel){
   this.infoPanel = panel;
};


BayPuzzle.prototype.onRegister = function(data){
   this.changeState('choosing');
};

BayPuzzle.prototype.onWait = function(data){
   this.state = 'connecting';
};

BayPuzzle.prototype.onReady = function(data){
   if(data.opponent) {
      this.peername = data.opponent;
      this.showInfo(translate["Versus"] + ' : ' + data.opponent);
   }
   if(this.state == 'connecting'){
      this.changeState('connected');
   }
};

BayPuzzle.prototype.onStart = function(data){
   this.timer = data.timer;
   if(data.timer === 0){
      this.board.setState('on');
      this.changeState('game');
   } else {
      if(this.scorePanel) {
         this.scorePanel.text = '> ' + data.timer + ' <';
         this.scorePanel.reDraw();
      }
      this.changeState('starting');
   }
   this.board.reDraw();
};

BayPuzzle.prototype.onCellData = function(cellData){
   if(this.state=='starting'){
      this.changeState('game');
   }
   if(this.state=='game'){
      var cells = [];
      for(var i in cellData){
         var data = cellData[i];
         var cell = this.grid.cells[data.col][data.row];
         cell.type = data.type;
         cell.value = data.value;
         cells.push(cell);
      }
      if(this.board){
         this.board.reDraw(cells);
      }
   }
};

BayPuzzle.prototype.onRivalclosed = function(data){
   this.board.setState('off');
   this.grid = this.generator.generate(this.properties);
   this.changeState('peer_closed');
};

BayPuzzle.prototype.onInfo = function(data){
   if(data.score && this.scorePanel) {
      this.scorePanel.text = data.score.mine + ' : ' + data.score.rivals;
      this.scorePanel.reDraw();
   }
   if(data.info && this.infoPanel) {
      this.showInfo(data.info);
   }
};

BayPuzzle.prototype.onFinish = function(data){
   this.board.setState('off');
   this.grid = this.generator.generate(this.properties);
   this.changeState(data.state);
};

BayPuzzle.prototype.showInfo = function(text){
   if(this.infoPanel) {
      this.infoPanel.text = text;
      this.infoPanel.reDraw();
   }
};

BayPuzzle.prototype.changeState = function(state){
   if(state){
      this.state = state;
   }
   state = this.state;
   $('#rulestext').html(translate["RulesText"]);
   if(state == 'game')
      closeDialog($('#connectDialog'));
   else {
      if($('#connectDialog').css('display')=='none'){
         showDialog($('#connectDialog'),{
            start: {
               top: 0,
               left: 0,
               width: 0,
               height: 0
            },
            height: 220,
            width: 310
         });
      }      
   }
   $('#info').toggle(state == 'peer_not_found' || state == 'peer_closed' || state == 'win' || state == 'loose' || state == 'draw');
   if(state == 'peer_closed')
      $('#info').text(translate["PeerDisconnected"]);
   else if(state == 'peer_not_found')
      $('#info').text(translate["PeerNotFound"]);
   else if(state == 'win')
      $('#info').text(translate["Win"]);
   else if(state == 'loose')
      $('#info').text(translate["Loose"]);
   else if(state == 'draw')
      $('#info').text(translate["Draw"]);
   $('.fb-share-button').toggle(state == 'win');
   $('#name').toggle(state == 'choosing' || state == 'peer_not_found');
   $('#namelabel').text(translate["AskName"]);
   $('#namelabel').toggle(state == 'choosing');
   var peerName = this.peername;
   if(peerName){
      $('#peerName').empty();
      $('<span>').text(translate["Versus"] + ' : ').appendTo($('#peerName'));
      $('<span id="rivalname">').text(peerName).appendTo($('#peerName'));
      $('#peerName').show();
   }else{
      $('#peerName').hide();
   }
   $('#connect').toggle(state == 'choosing' || state == 'peer_not_found' || state == 'connecting' || state == 'peer_closed');
   if(state == 'peer_not_found') $('#connect').html(translate["RepeatSearch"]);
   if(!$('#name').val() || state == 'connecting' ) $('#connect').attr('disabled', 'disabled');
   else $('#connect').removeAttr('disabled');
   $('#spinner').toggle(state == 'connecting' || state == 'waiting' || state == 'starting');

   $('#ready').toggle(state == 'connected' || state == 'win' || state == 'loose' || state == 'draw');

   $('#waitingforready').toggle(state == 'waiting' || state == 'starting');
   if(state == 'starting')
      $('#waitingforready').text(translate["StartAt"] + ' ' + this.timer);
   else
      $('#waitingforready').text(translate["Waiting"]);
   if(state == 'go')
      closeDialog($('#connectDialog'));
   else if(state == 'peer_closed' || state == 'win' || state == 'loose' || state == 'draw')
      if($('#connectDialog').css('display')=='none'){
         showDialog($('#connectDialog'),{
            start: {
               top: 0,
               left: 0,
               width: 0,
               height: 0
            },
            height: 220,
            width: 310
         });
      }      
   $('#rules').text(translate["Rules"]);
};

BayPuzzle.prototype.showRules = function() {
   if($('#rulesDialog').css('display')=='none'){
      showDialog($('#rulesDialog'),{
         start: {
            left: 1,
            width: 1,
            height: 400
         },
         height: 400,
         width: 400
      });
   }      
};

BayPuzzle.prototype.showSkins = function() {
   if($('#skinsDialog').css('display')=='none'){
      showDialog($('#skinsDialog'),{
         start: {
            width: 0,
            height: 400,
            left: 0
         },
         height: 400,
         width: 400
      });
   }
};

BayPuzzle.prototype.setName = function(name) {
   this.name = name;
};

BayPuzzle.prototype.connect = function() {
   this.socket.emit('choose',{game: 'sudoku', size:this.size, name: this.name});
   this.changeState('connecting');
};

BayPuzzle.prototype.ready = function() {
   this.socket.emit('playerready',{});
   this.changeState('waiting');
};

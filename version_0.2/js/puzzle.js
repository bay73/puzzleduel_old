SquareCell = function(x,y,width,height){
   this.x = x;
   this.y = y;
   this.width = width;
   this.height = height;
   this.type = 'cell';
   this.dependants = [];
}

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
   var lineWidth = colorScheme[this.type].borderWidth;
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
                  })
   if(this.isActive){
      var lineWidth = colorScheme['active'].borderWidth;
      var borderColor = colorScheme['active'].borderColor;
      var fillColor = colorScheme['active'].fillColor;
      var margin = colorScheme['active'].borderMargin;
      canvas.drawRect({
                        strokeWidth: lineWidth, 
                        strokeStyle: borderColor,
                        fillStyle: fillColor?fillColor:'transparent',
                        x: centerX,
                        y: centerY,
                        width: this.width * canvas.width() - margin * 2,
                        height: this.height * canvas.height() - margin * 2,
                     })
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
      })
   }
}

SquareGridGenerator = function(properties){
}

SquareGridGenerator.prototype.generate = function(properties){
   if(!properties.colorScheme){
      properties.colorScheme = BayColorScheme.classic;
   }
   var width = properties.width;
   var height = properties.height;
   gridData = {};
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
      };
   };
   createBigCell = function(x,y,w,h){
      var bigCell = new SquareCell(x*w/width, y*h/height, w/width, h/height);
      bigCell.type = 'frame';
      for(var i = x*w; i < (x+1)*w; i++){
         for(var j = y*h; j < (y+1)*h; j++){
            gridData.cells[i][j].dependants.push(bigCell);
         }
      }
      return bigCell;
   }
   if (properties.sudoku){
      addBigCells = function(n,m){
         for (var i = 0; i < width / n; i++) {
            for (var j = 0; j < height / m; j++) {
               var bigCell = createBigCell(i, j, n, m);
               gridData.elements.push(bigCell);
            }
         }
      }
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
   gridData.getCell = function(x,y){
      if(gridData.cells[Math.floor(x*width, 0)])
         return gridData.cells[Math.floor(x*width, 0)][Math.floor(y*height, 0)];
      else
         return undefined;
   }
   return gridData;
}

BayPuzzle = function(properties){
   this.properties = properties;
   this.size = properties.width;
   var self = this;
   $('#connect').button();
   $('#connect').click(function(){self.connect();})
   $('#ready').button();
   $('#ready').click(function(){self.ready();})
   $('#connectDialog').dialog({
      title: '',
      autoOpen: false,
      closeOnEscape: false,
      height: 350,
      width: 500,
      modal: true,
      dialogClass: "no-close"
   });
   $('#rulesDialog').dialog({
      title: translate["GameRules"],
      autoOpen: false,
      width: 600,
      modal: true
   });
   $('#name').keyup(function(){
      if($('#name').val()){
         $('#connect').button('enable');
      }else{
         $('#connect').button('disable');
      }
   });
   $('#name').blur(function(){
      self.setName($('#name').val());
   })
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
}

BayPuzzle.prototype.getElements = function(){
   return this.grid.elements;
}

BayPuzzle.prototype.getCell = function(x, y){
   return this.grid.getCell(x, y);
}

BayPuzzle.prototype.setBoard = function(board){
   this.board = board;
   board.socket = this.socket;
}

BayPuzzle.prototype.setScorePanel = function(panel){
   this.scorePanel = panel;
   board.socket = this.socket;
}

BayPuzzle.prototype.setInfoPanel = function(panel){
   this.infoPanel = panel;
}


BayPuzzle.prototype.onRegister = function(data){
   this.changeState('choosing');
   
}

BayPuzzle.prototype.onWait = function(data){
   this.state = 'connecting';
}

BayPuzzle.prototype.onReady = function(data){
   if(data.opponent) {
      this.peername = data.opponent;
      this.showInfo(translate["Versus"] + ' : ' + data.opponent);
   }
   if(this.state == 'connecting'){
      this.changeState('connected');
   }
//   this.socket.emit('playerready',{});
}

BayPuzzle.prototype.onStart = function(data){
   this.timer = data.timer;
   if(data.timer == 0){
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
}

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
}

BayPuzzle.prototype.onRivalclosed = function(data){
   this.changeState('peer_closed');
}

BayPuzzle.prototype.onInfo = function(data){
   if(data.score && this.scorePanel) {
      this.scorePanel.text = data.score.mine + ' : ' + data.score.rivals;
      this.scorePanel.reDraw();
   }
   if(data.info && this.infoPanel) {
      this.showInfo(data.info);
   }
}

BayPuzzle.prototype.onFinish = function(data){
   this.board.setState('off');
   this.grid = this.generator.generate(this.properties);
   this.changeState(data.state);
}

BayPuzzle.prototype.showInfo = function(text){
   if(this.infoPanel) {
      this.infoPanel.text = text;
      this.infoPanel.reDraw();
   }
}


BayPuzzle.prototype.changeState = function(state){
   if(state){
      this.state = state;
   }
   var state = this.state;
   $('#rulesDialog').html(translate["RulesText"])
   $('#connectDialog').dialog('close');
   if(state == 'game')
      $('#connectDialog').dialog('close');
   else
      $('#connectDialog').dialog('open');
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
   $('#name').toggle(state == 'choosing' || state == 'peer_not_found');
   $('#namelabel').text(translate["AskName"]);
   $('#namelabel').toggle(state == 'choosing');
   var peerName = this.peername;
   if(peerName){
      $('#peerName').html(translate["Versus"] + ' : <span id="rivalname">' + peerName + '</span>');
      $('#peerName').show();
   }else{
      $('#peerName').hide();
   }
   $('#connect').button({label: translate["SearchRivals"]});
   $('#connect').toggle(state == 'choosing' || state == 'peer_not_found' || state == 'connecting' || state == 'peer_closed');
   if(state == 'peer_not_found') $('#connect').button({ label: translate["RepeatSearch"] });
   if(!$('#name').val() || state == 'connecting' ) $('#connect').button('disable');
   else $('#connect').button('enable');
   $('#spinner').toggle(state == 'connecting' || state == 'waiting' || state == 'starting');
   $('#ready').button({label: translate["Start"]});
   $('#ready').toggle(state == 'connected' || state == 'win' || state == 'loose' || state == 'draw');
   $('#waitingforready').toggle(state == 'waiting' || state == 'starting');
   if(state == 'starting')
      $('#waitingforready').text(translate["StartAt"] + ' ' + this.timer);
   else
      $('#waitingforready').text(translate["Waiting"]);
   if(state == 'go')
      $('#connectDialog').dialog('close');
   else if(state == 'peer_closed' || state == 'win' || state == 'loose' || state == 'draw')
      $('#connectDialog').dialog('open');
   $('#rules').text(translate["Rules"]);
}

BayPuzzle.prototype.showRules = function() {
   $('#rulesDialog').dialog({title: translate["GameRules"]});
   $('#rulesDialog').dialog('open');
}


BayPuzzle.prototype.setName = function(name) {
   this.name = name;
}

BayPuzzle.prototype.connect = function() {
   this.socket.emit('choose',{game: 'sudoku', size:this.size, name: this.name});
   this.changeState('connecting');
}

BayPuzzle.prototype.ready = function() {
   this.socket.emit('playerready',{});
   this.changeState('waiting');
}

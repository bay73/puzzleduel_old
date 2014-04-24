var consolelog = function(){
   var currentDate = '[' + new Date().toUTCString() + '] ';
   console.log(currentDate, arguments[0], arguments[1])
}
      var Game = Backbone.Model.extend({
         initialize: function(){
            this.changeState('init');
            var size = sudoku.getData().size;
         },
         findPeer: function(){
            var self = this;
            self.changeState('look_for_peer');
            var mainPeerId;
            var peer = new Peer({key: peerJSKey});
            connectRandom(peer,
               function(connection, isMain) {
                  self.set('connection', connection);
                  self.changeState('connected');
                  self.set('isMain', isMain);
                  connection.on('data', function(data) {
	                  consolelog('data', data);
                     if(data.type=='startconnection'){
                        self.onStartConnecton(data);
                     }else if(data.type=='peer_name'){
                        self.onPeerName(data);
                     }else if(data.type=='start'){
                        self.onPeerStart(data);
                     }else if(data.type=='griddata'){
                        self.onGridData(data);
                     }else if(data.type=='shot'){
                        self.onPeerShot(data);
                     }else if(data.type=='complete'){
                        self.onPeerComplete(data);
                     }
                  });
                  connection.on('close', function(data) {
                     consolelog('close', data);
                     self.onCloseConnection(data);
                  });
                  if(isMain){
                     connection.send({type: "startconnection"});
                     connection.send({type: "peer_name", name: self.get("name")});
                  }
               },
               function() {
                  self.changeState('peer_not_found');
                  console.log('Error!!! Cannot connect');
               }
            );
         },
         onStartConnecton: function(data){
            this.get('connection').send({type: "peer_name", name: this.get("name")});
         },
         onCloseConnection: function(data){
            this.set('peername', "");
            this.set('counter', 0);
            this.set('ready', false);
            this.set('peerready', false);
            this.set('connected', false);
            this.set('sudokudata', false);
            this.set('connection', null);
            this.set('isMain', null);
            this.changeState('peer_closed');
         },
         onPeerName: function(data){
            this.set('peername', data.name);
            events.trigger('game:peer_name');
         },
         onPeerStart: function(data){
            this.set('peerready', true);
            this.ready();
         },
         onPeerComplete: function(data){
            this.set('peerready', false);
            this.changeState('loose');
         },
         onPeerShot: function(data){
            var grid = sudoku.getData().cellData;
            var size = sudoku.getData().size;
            var row = data.row;
            var col = data.col;
            var value = data.value;
            if(value > 0){
               if(grid[row][col].answer == value){
                  grid[row][col].value = value;
                  if(grid[row][col].type == "green") {
                     if(data.our == true){
                        grid[row][col].type = "both";
                     }
                  } else {
                     if(data.our == true){
                        grid[row][col].type = "red";
                     }
                  }
               }else{
                  if(grid[row][col].type != "both"){
                     grid[row][col].type = "green";
                  }
               }
            }
            sudoku.redraw();
            this.checkFinish();
         },
         onGridData: function(data){
            this.set('sudokudata', true);
            sudoku.gridData = data.data;
            this.countClues();
            this.ready();
         },
         changeState: function(state){
            this.set('state', state);
            events.trigger('game:changestate', state);
         },
         startGame: function(){
            if(this.get('isMain')){
               sudoku.random();
               this.get('connection').send({type: "griddata", data: sudoku.getData()});
               this.set('sudokudata', true);
               this.countClues();
            }
            this.set('ready', true);
            this.get('connection').send({type: "start"});
            this.ready();
         },
         ready: function(){
            if(this.get('peerready') && this.get('ready') && this.get('sudokudata')){
               this.set('counter', 5);
               sudoku.redraw();
               this.changeState('ready');
               self = this;
               var intervalId = setInterval(function(){
                  var counter = self.get('counter');
                  if(counter <= 1){
                     clearInterval(intervalId);
                     self.changeState('go');
                  }else{
                     self.set('counter', counter - 1);
                     self.changeState('ready');
                  }
               },
               1000);
               this.checkFinish();
            }else if(this.get('ready')){
               this.changeState('waiting');
            }
         },
         shot: function(row, col, value){
            var grid = sudoku.getData().cellData;
            var isOur = false;
            if(value > 0){
               if(grid[row][col].answer == value){
                  if(grid[row][col].type == "common"){
                     grid[row][col].type = "green";
                     isOur = true;
                  }
               }else{
                  grid[row][col].type = "red";
                  grid[row][col].value = "";
               }
            }
            this.get('connection').send({type: "shot", row: row, col: col, value: value, our: isOur});
            sudoku.redraw();
            this.checkFinish();
         },
         checkFinish: function(){
            var grid = sudoku.getData().cellData;
            var size = sudoku.getData().size;
            var empty = 0;
            var both = 0;
            var green = 0;
            var red = 0;
            for(var i = 0; i < size; i++){
               for(var j = 0; j < size; j++){
                  if(!grid[i][j].value) empty++;
                  if(grid[i][j].type=="both") both++;
                  if(grid[i][j].type=="green") green++;
                  if(grid[i][j].type=="red") red++;
               }
            }
            sudoku.showHeader(translate["Score"] + ' <span class="ourscore">' + (green + both/2) + '</span> : <span class="otherscore">' + (red + both/2) + '</span>');
            if(empty == 0){
               this.set('counter', 0);
               this.set('ready', false);
               this.set('peerready', false);
               this.set('sudokudata', false);
               if(green > red)
                  this.changeState('win');
               else if (green==red)
                  this.changeState('draw');
               else
                  this.changeState('loose');
            }
         },
         countClues: function(){
            var clueCount = 0;
            var data = sudoku.getData().cellData;
            var size = sudoku.getData().size;
            for(var i = 0; i < size; i++){
               for(var j = 0; j < size; j++){
                  if(data[i][j].type == "clue") clueCount++;
               }
            }
            this.set('initialClueCount', clueCount);
            this.set('clueCount', clueCount);
         },
         removeClue: function(){
            var clues = this.get('clueCount');
            var rndVal = Math.floor(Math.random()*clues);
            var counter = 0;
            var data = sudoku.getData().cellData;
            var size = sudoku.getData().size;
            for(var i = 0; i < size; i++){
               for(var j = 0; j < size; j++){
                  if(data[i][j].type == "clue") {
                     counter++;
                     if(counter > rndVal){
                        data[i][j].type = "";
                        data[i][j].value = "";
                        sudoku.redraw();
                        this.set('clueCount', clues - 1);
                        return;
                     }
                  }
               }
            }
         }
      });

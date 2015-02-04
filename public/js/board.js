var BayColorScheme;

var BayBoard = function(properties){
   this.properties = properties;
   this.element = $('<div style="margin-left:auto;margin-right:auto;width:600px;height:600px;position:relative;">');
   this.canvas = $('<canvas style="position:absolute;width:500px;height:500px;left:50px;top:50px;">');
   this.palletCanvas = $('<canvas z-index=10 style="position:absolute;width:600px;height:600px;left:0px;top:0px;">');
   this.element.appendTo($('body'));
   this.canvas.appendTo(this.element);
   this.palletCanvas.appendTo(this.element);
   this.puzzle = properties.puzzle;
   this.puzzle.setBoard(this);
   this.hSize = this.canvas.width();
   this.wSize = this.canvas.height();
   this.state = 'off';
   if(properties.colorScheme){
      this.colorScheme = properties.colorScheme;
   } else {
      this.colorScheme = BayColorScheme.classic;
   }
   this.pallet = new Pallet(this.puzzle.properties.digits);
   this.reDraw();
   var self = this;
   this.palletCanvas.click(function(event){
      self.onClick(event);
   });
};

BayBoard.prototype.draw = function(){
   this.canvas.clearCanvas();
   var elements = this.puzzle.getElements();
   for (var i = 0; i < elements.length; i++) {
      elements[i].draw(this.canvas, this.colorScheme);
   }
   this.pallet.draw(this.canvas, this.palletCanvas, this.colorScheme);
};

BayBoard.prototype.setState = function(state){
   this.state = state;
   if(state=='off'){
      if(this.activeCell){
         this.activeCell.isActive = false;
         this.activeCell = undefined;
      }
      this.pallet.visible = false;
   }
};

BayBoard.prototype.reDraw = function(elements){
   if(!elements){
      this.draw();
      return;
   }
   var length = elements.length;
   for (var i = 0; i < length; i++) {
      for(var deps in elements[i].dependants){
         if(elements.indexOf(elements[i].dependants[deps]) === -1){
            elements.push(elements[i].dependants[deps]);
         }
      }
   }
   for (var i = 0; i < elements.length; i++) {
      elements[i].draw(this.canvas, this.colorScheme);
   }
};

BayBoard.prototype.onClick = function(event){
   if(this.state == 'on'){
      var clickX = event.offsetX/this.hSize - this.pallet.palletSize;
      var clickY = event.offsetY/this.wSize - this.pallet.palletSize;
      var palletAnswer = this.pallet.processClick(clickX, clickY);
      if(palletAnswer && this.activeCell){
         this.activeCell.value = palletAnswer.value;
         this.activeCell.isActive = false;
         this.pallet.visible = false;
         this.reDraw([this.activeCell]);
         this.pallet.draw(this.canvas, this.palletCanvas, this.colorScheme);
         if(this.socket){
            this.socket.emit('click', {row:this.activeCell.row, col: this.activeCell.col, value: palletAnswer.value});
         }
         this.activeCell = undefined;
         return;
      }
      var cell;
      if(clickX >=0 && clickY >=0){
         cell = this.puzzle.getCell(clickX, clickY);
      }
      if(cell){
         if(this.activeCell){
            this.activeCell.isActive = false;
            this.reDraw([this.activeCell]);
         }
         if(!cell.value){
            cell.isActive = true;
            this.activeCell = cell;
            this.reDraw([cell]);
            this.pallet.visible = true;
            this.pallet.x = cell.x + cell.width / 2;
            this.pallet.y = cell.y + cell.height / 2;
            this.pallet.draw(this.canvas, this.palletCanvas, this.colorScheme);
         }else{
            this.activeCell = undefined;
            this.pallet.visible = false;
            this.pallet.draw(this.canvas, this.palletCanvas, this.colorScheme);
         }
      }
   }
};

var Pallet = function(digits){
   this.palletSize = 0.15;
   this.digits = digits;
   this.x = 0;
   this.y = 0;
   this.visible = false;
};

Pallet.prototype.draw = function(canvas, palletCanvas, colorScheme){
   var size = canvas.width() * this.palletSize;
   palletCanvas.clearCanvas();
   var centerX = (this.x + this.palletSize) * canvas.width();
   var centerY = (this.y + this.palletSize) * canvas.height();
   palletCanvas.drawArc({
      visible: this.visible,
      strokeStyle: colorScheme['pallet'].borderColorDark,
      strokeWidth: colorScheme['pallet'].borderWidth,
      opacity: colorScheme['pallet'].opacity,
      x: centerX,
      y: centerY,
      radius: 1.35 * size,
      start: 90,
      end: 270
   });
   palletCanvas.drawEllipse({
      visible: this.visible,
      fillStyle: colorScheme['pallet'].fillColor,
      opacity: colorScheme['pallet'].opacity,
      x: centerX,
      y: centerY,
      width: 2.7 * size,
      height: 2.7 * size
   });
   palletCanvas.drawArc({
      visible: this.visible,
      strokeStyle: colorScheme['pallet'].borderColorLight,
      strokeWidth: colorScheme['pallet'].borderWidth,
      opacity: colorScheme['pallet'].opacity,
      x: centerX,
      y: centerY,
      radius: 1.35 * size,
      start: -90,
      end: 90
   });
   for(var d=1;d<=this.digits;d++){
      palletCanvas.drawArc({
         visible: this.visible,
         strokeStyle: colorScheme['pallet'].borderColorDark,
         strokeWidth: colorScheme['pallet'].borderWidth,
         opacity: colorScheme['pallet'].opacity,
         x: centerX + size * Math.sin(Math.PI * 2 * d / this.digits),
         y: centerY - size * Math.cos(Math.PI * 2 * d / this.digits),
         radius: 0.32 * size,
         start: -90,
         end: 90
      });
      palletCanvas.drawEllipse({
         visible: this.visible,
         fillStyle: colorScheme['pallet'].fillColor,
         opacity: colorScheme['pallet'].opacity,
         x: centerX + size * Math.sin(Math.PI * 2 * d / this.digits),
         y: centerY - size * Math.cos(Math.PI * 2 * d / this.digits),
         width: 0.65*size,
         height: 0.65*size
      });
      palletCanvas.drawArc({
         visible: this.visible,
         strokeStyle: colorScheme['pallet'].borderColorLight,
         strokeWidth: colorScheme['pallet'].borderWidth,
         opacity: colorScheme['pallet'].opacity,
         x: centerX + size * Math.sin(Math.PI * 2 * d / this.digits),
         y: centerY - size * Math.cos(Math.PI * 2 * d / this.digits),
         radius: 0.32 * size,
         start: 90,
         end: 270
      });
      palletCanvas.drawText({
         visible: this.visible,
         fillStyle: colorScheme['pallet'].fontColor,
         x: centerX + size * Math.sin(Math.PI * 2 * d / this.digits),
         y: centerY - size * Math.cos(Math.PI * 2 * d / this.digits),
         fontSize: size * colorScheme['pallet'].fontSize / 10,
         fontStyle: colorScheme['pallet'].fontStyle,
         fontFamily: colorScheme['pallet'].fontFamily,
         text: d
      });
   }
};

Pallet.prototype.processClick = function(clickX, clickY){
   if(!this.visible){
      return undefined;
   }
   var d = (clickX-this.x)*(clickX-this.x) + (clickY-this.y)*(clickY-this.y);
   if(d > 1.5 * this.palletSize*this.palletSize){
      return undefined;
   }
   var angle;
   if(clickY == this.y){
      angle = Math.atan(Math.sign(clickX-this.x)*1000);
   }else{
      angle = Math.atan((clickX-this.x)/(this.y-clickY));
   }
   if(this.y < clickY) angle = angle  + Math.PI;
   else if(this.x > clickX)  angle = angle  + 2*Math.PI;
   var value = Math.round(angle * this.digits / (2*Math.PI), 0);
   if(value===0){
      value = this.digits;
   }
   return {value:value};
};


BayBoard.prototype.onResize = function(parent){
   var wWidth = $(parent).innerWidth();
   var wHeight = $(parent).innerHeight();
   var size = Math.min(wWidth, wHeight);
   this.palletCanvas.parent().width(size);
   this.palletCanvas.parent().height(size);
   this.palletCanvas.width(size);
   this.palletCanvas.height(size);
   this.palletCanvas.attr('width',size);
   this.palletCanvas.attr('height',size);
   this.wSize = size /(1 + 2 * this.pallet.palletSize);
   this.hSize = size /(1 + 2 * this.pallet.palletSize);
   this.canvas.width(this.wSize);
   this.canvas.height(this.hSize);
   this.canvas.css({left: this.wSize * this.pallet.palletSize, top: this.hSize * this.pallet.palletSize});
   this.canvas.attr('width',this.wSize);
   this.canvas.attr('height',this.hSize);
   this.draw();
};

BayBoard.prototype.Area = function(w,h){
   if(w < h){return 100*w*w;}
   else {return 100*h*h;}
};

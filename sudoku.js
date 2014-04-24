// global variable to store all used elements
var sudoku = {
}

// initialization of layout elements
sudoku.init = function(parentElement, properties){
   sudoku.parentElement = parentElement;
   // extend properties with default values
   var prop =
   {
      minGridSize:      400,
      maxGridSize:      600,
      sudokuSize:       9,
      gridlineColor:    "lightGrey",       // color and width of common grid lines
      gridLineWidth:    2,
      borderColor:      "lightGrey",   // color and width of outlined grid lines
      borderWidth:      8,
      sightColor:       "black",       // color and line width for sight "image"
      sightLineWidth:   1,
      common: {                        // text proprties for common cells
         textColor:     "black",
         textFont:      $('body').css('font-family')
      },
      both: {                        // text proprties for common cells
         textColor:     "black",
         textFont:      $('body').css('font-family')
      },
      green: {                        // proprties for green cells
         textColor:     "black",
         textFont:      $('body').css('font-family'),
         color:         "palegreen"
      },
      red: {                        // proprties for red cells
         textColor:     "black",
         textFont:      $('body').css('font-family'),
         color:         "lightpink"
      },
      clue: {                          // color and text properties for clue cells
         textFont:      "bold " + $('body').css('font-family'),
         textColor:     "darkBlue"
      },
      symmetry:         5
   }
   $.extend(true, prop, properties);
   sudoku.prop = prop;
   // create table frame and game elements
   var table = $("<table style='width: 100%'></table>");
   // header element
   sudoku.headerPanel = $("<div id='headerPanel'></div>");
   sudoku.header = $("<td align=center></td>").append(sudoku.headerPanel);
   var row = $("<tr></tr>");
   sudoku.header.appendTo(row);
   row.appendTo(table);
   row = $("<tr></tr>");
   // main grid panel
   sudoku.gridPanel = $("<div id='gridPanel' style='text-align:center;'></div>");
   sudoku.mainCell = $("<td align=center valign=top width=100%></td>").append(sudoku.gridPanel);
   sudoku.mainCell.appendTo(row);
   row.appendTo(table);
   row = $("<tr></tr>");
   // footer element
   sudoku.footerPanel = $("<div id='footerPanel'></div>");
   sudoku.footerCell = $("<td align=center></td>").append(sudoku.footerPanel);;
   sudoku.footerCell.appendTo(row);
   row.appendTo(table);
   table.appendTo($(sudoku.parentElement));

   // canvas element (for main grid)
   var size = sudoku.gridSize();
   sudoku.puzzleGrid = $("<canvas id=puzzleGrid_ width=" + size + " height=" + size + " style='cursor: none;'>");
   sudoku.headerPanel.width(size);
   sudoku.footerPanel.width(size);
   sudoku.gridPanel.append(sudoku.puzzleGrid);
   sudoku.puzzleGrid.attr("tabindex","1");
   sudoku.showRules();
   sudoku.showSudoku();
}

sudoku.showRules = function(){
   sudoku.headerPanel.html('Ваша задача - заполнить сетку цифрами от 1 до 9 так, чтобы цфиры в столбцах, строках и выделенных квадратах 3x3 не повторялись. Часть цифр уже расставлена. '+
      'Ваш соперник одновременно решает точно такую же задачу. Клетка закрашивается зеленым, если вы поставили в нее цифру раньше соперника и красным - в противном случае. Вы видите цфиры поставленные и вами и соперником. <br>' +
      'Для ввода цифры наведите прицел на требуемую клетку и нажмите клавишу с цифрой, которую хотите вставить.')
}

sudoku.gridSize = function(){
   var wwidth = $(window).width();
   var wheight = $(window).height();
   if (wheight < wwidth){
      var pwidth = (wheight - 40) * 0.7;
   }else{
      var pwidth = wwidth * 0.7;
   }
   // restrict the size with given bounds
   if (pwidth < sudoku.prop.minGridSize) pwidth = sudoku.prop.minGridSize;
   if (pwidth > sudoku.prop.maxGridSize) pwidth = sudoku.prop.maxGridSize;
   return pwidth;
}

sudoku.getInitData = function(){
   if (sudoku.prop.sudokuSize==4){
      return {
        "size":  4 ,
         "rows": [
          {
            "cells": [ 1 , 1 , 2 , 2]
          },
          {
            "cells": [ 1 , 1 , 2 , 2 ]
          },
          {
            "cells": [ 3 , 3 , 4 , 4 ]
          },
          {
            "cells": [ 3 , 3 , 4 , 4 ]
          }
        ]
      };
   }
   if (sudoku.prop.sudokuSize==6){
      return {
        "size":  6 ,
         "rows": [
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2]
          },
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 ]
          },
          {
            "cells": [ 3 , 3 , 3 , 4 , 4 , 4 ]
          },
          {
            "cells": [ 3 , 3 , 3 , 4 , 4 , 4 ]
          },
          {
            "cells": [ 5 , 5 , 5 , 6 , 6 , 6 ]
          },
          {
            "cells": [ 5 , 5 , 5 , 6 , 6 , 6 ]
          }
        ]
      };
   }
   if (sudoku.prop.sudokuSize==9){
      return {
        "size":  9 ,
         "rows": [
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 , 3 , 3 , 3 ]
          },
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 , 3 , 3 , 3 ]
          },
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 , 3 , 3 , 3 ]
          },
          {
            "cells": [ 4 , 4 , 4 , 5 , 5 , 5 , 6 , 6 , 6 ]
          },
          {
            "cells": [ 4 , 4 , 4 , 5 , 5 , 5 , 6 , 6 , 6 ]
          },
          {
            "cells": [ 4 , 4 , 4 , 5 , 5 , 5 , 6 , 6 , 6 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 8 , 8 , 8 , 9 , 9 , 9 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 8 , 8 , 8 , 9 , 9 , 9 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 8 , 8 , 8 , 9 , 9 , 9 ]
          }
        ]
      };
   }
}

sudoku.initSudoku = function(){
   gridData = sudoku.getInitData();
   // fill in grd's array
   gridData.cellData = new Array(gridData.size);
   for(var i = 0; i < gridData.size; i++) gridData.cellData[i] = new Array(gridData.size);
   // save property to DOM object
   sudoku.gridData = gridData;
}

sudoku.getData = function(){
   return sudoku.gridData;
}

sudoku.showSudoku = function(){
   gridCanvas = sudoku.puzzleGrid;
   prop = sudoku.prop;
   sudoku.initSudoku();
   gridData = sudoku.gridData;
   // save property to DOM object
   sudoku.sightX = null;
   sudoku.sightY = null;
   sudoku.sightRow = null;
   sudoku.sightColumn = null;
   sudoku.draw(gridCanvas);
   gridCanvas.mousemove(function(event){
      sudoku.draw(event.pageX - gridCanvas.offset().left, event.pageY - gridCanvas.offset().top);
   });

   gridCanvas.mouseout(function(event){
      sudoku.draw();
   });

   gridCanvas.keydown(function(event){
      sudoku.shoot(event.which);
   });
}

   // draw function
sudoku.draw = function(sightX, sightY){
   gridCanvas = sudoku.puzzleGrid;
   // get property
   var prop = sudoku.prop;
   var gridData = sudoku.gridData;
   var width = parseInt(gridCanvas.width()) - prop.borderWidth;
   var height = parseInt(gridCanvas.height()) - prop.borderWidth;
   var cellheight = height / gridData.size;
   var cellwidth = width / gridData.size;
   gridCanvas.clearCanvas();
   // draw special cells
   for(var r = 0; r < gridData.size; r++){
      for(var c = 0; c < gridData.size; c++){
         if (gridData.cellData[r][c]){
            var cellType = gridData.cellData[r][c].type;
            // if color is defined for type, then fill in the cell with the color
            if (prop[cellType] && prop[cellType].color){
               gridCanvas.drawRect({
                  fillStyle: prop[cellType].color,
                  x: prop.borderWidth/2 + c * cellwidth + prop.gridLineWidth/2,
                  y: prop.borderWidth/2 + r * cellheight + prop.gridLineWidth/2,
                  width: cellwidth - prop.gridLineWidth,
                  height: cellheight - prop.gridLineWidth,
                  fromCenter: false
               })
            }
            // if value is defined for cell, then digit
            var value = gridData.cellData[r][c].value;
            if (value){
               if (!cellType) cellType = "common";
               gridCanvas.drawText({
                  fillStyle: prop[cellType].textColor,
                  font: (cellType=="clue"?cellheight*2/3:cellheight*3/5) + "pt " + prop[cellType].textFont,
                  x: c * cellwidth + cellwidth/2 + prop.borderWidth/2,
                  y: r * cellheight + cellheight/2 + prop.borderWidth/2,
                  text: value
               })
            }
         }
      }
   }
   // draw grid lines (only internal lines)
   for(var i = 1; i < gridData.size; i++){
      // horisontal line
      gridCanvas.drawLine({
         strokeStyle: prop.gridlineColor,
         strokeWidth: prop.gridLineWidth,
         x1: prop.borderWidth/2, y1: prop.borderWidth/2 + i * cellheight,
         x2: prop.borderWidth/2 + width, y2: prop.borderWidth/2 + i * cellheight
      });
      // vertical line
      gridCanvas.drawLine({
         strokeStyle: prop.gridlineColor,
         strokeWidth: prop.gridLineWidth,
         x1: prop.borderWidth/2 + i * cellwidth, y1: prop.borderWidth/2,
         x2: prop.borderWidth/2 + i * cellwidth, y2: prop.borderWidth/2 + height
      });
   }
   // draw outside borders
   gridCanvas.drawRect({
      strokeStyle: prop.borderColor,
      strokeWidth: prop.borderWidth,
      x: prop.borderWidth/2, y: prop.borderWidth/2,
      width: width,
      height: height,
      fromCenter: false,
      cornerRadius: width/40
   })
   // draw borders of area (for each cell sompare area with areas below and at the right)
   for(var i = 0; i < gridData.size; i++){
      for(var j = 0; j < gridData.size; j++){
         var thisArea = gridData.rows[i].cells[j];
         if (i < gridData.size - 1){
            // check square below
            var downArea = gridData.rows[i + 1].cells[j];
            if (downArea != thisArea){
               gridCanvas.drawLine({
                  strokeStyle: prop.borderColor,
                  strokeWidth: prop.borderWidth,
                  x1: j * cellwidth, y1: prop.borderWidth/2 + (i + 1) * cellheight,
                  x2: prop.borderWidth + (j + 1) * cellwidth, y2: prop.borderWidth/2 + (i + 1) * cellheight
               });

            }
         }
         if (j < gridData.size - 1){
            // check square at right
            var rightArea = gridData.rows[i].cells[j + 1];
            if (rightArea != thisArea){
               gridCanvas.drawLine({
                  strokeStyle: prop.borderColor,
                  strokeWidth: prop.borderWidth,
                  x1: prop.borderWidth/2 + (j + 1) * cellwidth, y1: i * cellheight,
                  x2: prop.borderWidth/2 + (j + 1) * cellwidth, y2: prop.borderWidth + (i + 1) * cellheight
               });

            }
         }
      }
   }
   if (sightX) {
      if(sightX >= 0){
         sudoku.sightX = sightX;
         sudoku.sightY = sightY;
         sudoku.sightRow = Math.floor((sightY - prop.borderWidth / 2) / cellheight);
         sudoku.sightColumn = Math.floor((sightX - prop.borderWidth / 2) / cellwidth);
      } else {
         sightX = sudoku.sightX;
         sightY = sudoku.sightY;
      }
      // draw sight if coordinates are given
      for(var i = 0; i < 5; i++){
         // four circles
         gridCanvas.drawEllipse({
            strokeStyle: prop.sightColor,
            strokeWidth: prop.sightLineWidth,
            x: sightX - cellwidth * i / 10, y: sightY - cellheight * i / 10,
            width: cellwidth * i / 5,
            height: cellheight * i / 5,
            fromCenter: false
         });
      }
      // two lines
      gridCanvas.drawLine({
         strokeStyle: prop.sightColor,
         strokeWidth: prop.sightLineWidth,
         x1: sightX - cellwidth / 2, y1: sightY,
         x2: sightX + cellwidth / 2, y2: sightY
      });
      gridCanvas.drawLine({
         strokeStyle: prop.sightColor,
         strokeWidth: prop.sightLineWidth,
         x1: sightX, y1: sightY  - cellheight / 2,
         x2: sightX, y2: sightY + cellheight / 2
      });
      gridCanvas.focus();
   }else{
      gridCanvas.blur();
      sudoku.sightRow = null;
      sudoku.sightColumn = null;
   }
};

sudoku.redraw = function(){
   sudoku.draw(-1);
}

sudoku.shoot = function(keyCode){
   gridCanvas = sudoku.puzzleGrid;
   var value = null;
   if (keyCode >= 48 && keyCode <= 57) value = keyCode - 48;
   if (keyCode >= 96 && keyCode <= 105) value = keyCode - 96;
   if (keyCode == 45 || keyCode == 32) value = 0;
   if (keyCode == 35) value = 1;
   if (keyCode == 40) value = 2;
   if (keyCode == 34) value = 3;
   if (keyCode == 37) value = 4;
   if (keyCode == 12) value = 5;
   if (keyCode == 39) value = 6;
   if (keyCode == 36) value = 7;
   if (keyCode == 38) value = 8;
   if (keyCode == 33) value = 9;
   if (sudoku.sightRow == null)
      return;
   var currentData = sudoku.gridData.cellData[sudoku.sightRow][sudoku.sightColumn];
   if (!currentData){
      sudoku.gridData.cellData[sudoku.sightRow][sudoku.sightColumn] = {value: value, type: "common"};
      if(sudoku.onShot){
         sudoku.onShot(sudoku.sightRow, sudoku.sightColumn, value);
      }
   }else if (currentData.type != "clue"){
      if(!currentData.type) currentData.type = "common";
      currentData.value = value;
      if(sudoku.onShot){
         sudoku.onShot(sudoku.sightRow, sudoku.sightColumn, value);
      }
   }
   sudoku.redraw();
}

sudoku.checkValue = function(x, y, v){
   area = sudoku.gridData.rows[x].cells[y];
   for(var i=0;i<sudoku.prop.sudokuSize;i++){
      for(var j=0;j<sudoku.prop.sudokuSize;j++){
         if(i != x || j != y){
            var newCell = sudoku.gridData.cellData[i][j];
            if(newCell){
               if( i == x && v==newCell.value) return false;
               if( j == y && v==newCell.value) return false;
               newArea = sudoku.gridData.rows[i].cells[j];
               if(area==newArea && v==newCell.value) return false;
            }
         }
      }
   }
   if(sudoku.prop.puzzleType){
      if(typeof(sudoku.typeChecker[sudoku.prop.puzzleType]) == "function"){
         return sudoku.typeChecker[sudoku.prop.puzzleType](x, y, v);
      }
   }
   return true;
}

sudoku.clear = function(){
   for(var i=0;i<sudoku.prop.sudokuSize;i++){
      for(var j=0;j<sudoku.prop.sudokuSize;j++){
         cell = sudoku.gridData.cellData[i][j];
         if(cell){
            if(!cell.type || cell.type != "clue"){
               sudoku.gridData.cellData[i][j] = {};
            }
         }
      }
   }
}

sudoku.solve = function(checkOnly){
   var toCheck = false;
   if(checkOnly){
      toCheck = true;
   }
   sudoku.clear();
   var data = sudoku.gridData.cellData;
   var solutionCount = 0;
   fixAnswer = function(){
      solutionCount++;
      if(toCheck){
         return;
      }else{
         for(var i=0;i<sudoku.prop.sudokuSize;i++){
            for(var j=0;j<sudoku.prop.sudokuSize;j++){
               var answerCell = data[i][j];
               if(answerCell && answerCell.value){
                  answerCell.answer = answerCell.value;
               }
            }
         }
      }
   }
   putNext = function (x, y){
      if(x >= sudoku.prop.sudokuSize ){
         putNext(0, y + 1);
      }else if (y >= sudoku.prop.sudokuSize ){
         fixAnswer();
      }else{
         var cell = data[x][y];
         if(!cell){
            data[x][y] = {};
            cell = data[x][y];
         }
         if(!cell.type || cell.type == "common"){
            for(var v=1;v<=sudoku.prop.sudokuSize;v++){
               if(sudoku.checkValue(x, y, v)){
                  cell.value = v;
                  putNext(x+1, y);
                  cell.value = null;
               }
               if(toCheck && solutionCount > 1) return;
            }
         }else{
             putNext(x+1, y);
         }
      }
   }
   putNext(0, 0);
   if(toCheck){
      return solutionCount;
   }
}

sudoku.random = function(){
   sudoku.initSudoku();
   sudoku.clear();
   var data = sudoku.gridData.cellData;
   putRandom = function(x, y){
      if(x >= sudoku.prop.sudokuSize ){
         return putRandom(0, y + 1);
      }else if (y >= sudoku.prop.sudokuSize ){
         return true;
      }else{
         var cell = data[x][y];
         if(!cell){
            data[x][y] = {};
            cell = data[x][y];
         }
         if(!cell.type || cell.type == "common"){
            var variants = new Array(sudoku.prop.sudokuSize + 1);
            var variantCount = 0;
            for(var v=1;v<=sudoku.prop.sudokuSize;v++){
               if(sudoku.checkValue(x, y, v)){
                  variants[v] = true;
                  variantCount++;
               } else {
                  variants[v] = false;
               }
            }
            while (variantCount > 0){
               var rnd = Math.floor((Math.random()*variantCount)+1)
               var rndVal = -1;
               for(var v=1;v<=sudoku.prop.sudokuSize;v++){
                  if(variants[v]){
                     rnd--;
                  }
                  if(rnd <=0 ){
                     rndVal = v;
                     break;
                  }
               }
               if(rndVal > 0){
                  cell.value = rndVal;
                  if(putRandom(x+1, y)){
                     return true;
                  }
                  cell.value = null;
                  variants[rndVal] = false;
                  variantCount--;
               }
            }
            return false;
         }else{
             return putRandom(x+1, y);
         }
      }

   }
   if(putRandom(0, 0)){
      var clueCount = sudoku.prop.sudokuSize*sudoku.prop.sudokuSize;
      var minCount = 37;
      if (sudoku.prop.sudokuSize==4) minCount = 3;
      if (sudoku.prop.sudokuSize==6) minCount = 6;
      var variants = new Array(sudoku.prop.sudokuSize*sudoku.prop.sudokuSize);
      var variantCount = 0;
      for(var i=0;i<sudoku.prop.sudokuSize;i++){
         for(var j=0;j<sudoku.prop.sudokuSize;j++){
            sudoku.gridData.cellData[i][j].type = "clue";
            variants[i*sudoku.prop.sudokuSize + j] = true;
            variantCount++;
         }
      }
      while (variantCount > 0 && clueCount > minCount){
         var rnd = Math.floor((Math.random()*variantCount)+1)
         var rndVal = -1;
         for(var v=0;v<sudoku.prop.sudokuSize*sudoku.prop.sudokuSize;v++){
            if(variants[v]){
               rnd--;
            }
            if(rnd <=0 ){
               rndVal = v;
               break;
            }
         }
         if(rndVal >= 0){
            var x = Math.floor(rndVal / sudoku.prop.sudokuSize);
            var y = rndVal % sudoku.prop.sudokuSize;
            var cleared = [];
            addCleared = function (a, b){
               var added = false;
               for(var c=0;c<cleared.length;c++){
                  if(cleared[c].x == a && cleared[c].y == b) added = true;
               }
               if(!added){
                  cleared.push({x:a, y:b, value: sudoku.gridData.cellData[a][b].value});
               }
            }
// value=1>Central
// value=2>Vertical
// value=3>Horisontal
// value=4>Two axis
// value=5>Four axis
// value=6>Diagonal
            addCleared(x, y);
            if(sudoku.prop.symmetry==1){
               addCleared(sudoku.prop.sudokuSize-x-1, sudoku.prop.sudokuSize-y-1);
            }else if (sudoku.prop.symmetry==2){
               addCleared(x, sudoku.prop.sudokuSize-y-1);
            }else if (sudoku.prop.symmetry==3){
               addCleared(sudoku.prop.sudokuSize-x-1, y);
            }else if (sudoku.prop.symmetry==4){
               addCleared(sudoku.prop.sudokuSize-x-1, sudoku.prop.sudokuSize-y-1);
               addCleared(sudoku.prop.sudokuSize-x-1, y);
               addCleared(x, sudoku.prop.sudokuSize-y-1);
            }else if (sudoku.prop.symmetry==5){
               addCleared(sudoku.prop.sudokuSize-x-1, sudoku.prop.sudokuSize-y-1);
               addCleared(sudoku.prop.sudokuSize-x-1, y);
               addCleared(x, sudoku.prop.sudokuSize-y-1);
               addCleared(y, x);
               addCleared(sudoku.prop.sudokuSize-y-1, x);
               addCleared(y, sudoku.prop.sudokuSize-x-1);
               addCleared(sudoku.prop.sudokuSize-y-1, sudoku.prop.sudokuSize-x-1);
            }else if (sudoku.prop.symmetry==6){
               addCleared(y, x);
            }
            for(var c=0;c<cleared.length;c++){
               sudoku.gridData.cellData[cleared[c].x][cleared[c].y].value="";
               sudoku.gridData.cellData[cleared[c].x][cleared[c].y].type="";
            }
            if(sudoku.solve(true) > 1){
               for(var c=0;c<cleared.length;c++){
                  sudoku.gridData.cellData[cleared[c].x][cleared[c].y].value=cleared[c].value;
                  sudoku.gridData.cellData[cleared[c].x][cleared[c].y].type="clue";
               }
            }else{
               clueCount-=cleared.length;
            }
            for(var c=0;c<cleared.length;c++){
               variants[cleared[c].x*sudoku.prop.sudokuSize+cleared[c].y] = false;
               variantCount--;
            }
         }
      }
   }
   sudoku.solve(false);
}

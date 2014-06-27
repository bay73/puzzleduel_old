// global variable to store all used elements
var sudoku = {
}

// helper function - pad number with zeros
var pad2 = function(num){
   if (num < 10) return "0" + num;
   else return num.toString();
}
// format time to string
var showTime = function(duration){
   var ss = duration % 60;
   var mm = (duration - ss) / 60;
   return pad2(mm) + ":" + (pad2(ss).substr(0,5));
}

// initialization of layout elements
sudoku.init = function(parentElement, properties){
   sudoku.parentElement = parentElement;
   // extend properties with default values
   var prop =
   {
      minGridSize:      400,
      maxGridSize:      600,
      sudokuSize:       4,
      gridlineColor:    "lightGrey",       // color and width of common grid lines
      gridLineWidth:    2,
      borderColor:      "lightGrey",   // color and width of outlined grid lines
      borderWidth:      8,
      sightColor:       "black",       // color and line width for sight "image"
      sightLineWidth:   1,
      common: {                        // text proprties for common cells
         textColor:     "black",
         textFont:      "42pt " + $('body').css('font-family')
      },
      variants: {                        // text proprties for common cells
         textColor:     "black",
         textFont:      "10pt " + $('body').css('font-family')
      },
      clue: {                          // color and text properties for clue cells
         textFont:      "bold 48pt " + $('body').css('font-family'),
         textColor:     "darkBlue"
      }
   }
   $.extend(true, prop, properties);
   sudoku.prop = prop;
   // create table frame and game elements
   var table = $("<table style='width: 100%' border=1></table>");
   // header element
   sudoku.headerPanel = $("<div style='font-size: 16pt; text-align: center;'></div>");
   sudoku.header = $("<td colspan = 4 align=center></td>").append(sudoku.headerPanel);
   var row = $("<tr></tr>");
   sudoku.header.appendTo(row);
   row.appendTo(table);
   row = $("<tr></tr>");
   // main grid panel
   sudoku.gridPanel = $("<div style='text-align:center;'></div>");
   sudoku.leftCell = $("<td align=center valign=top colspan=2 width=50%></td>").append(sudoku.gridPanel);
   sudoku.leftCell.appendTo(row);
   sudoku.statPanel = $("<div style='text-align:center;'></div>");
   sudoku.rightCell = $("<td align=center valign=top colspan=2 width=50%></td>").append(sudoku.statPanel);
   sudoku.rightCell.appendTo(row);
   row.appendTo(table);
   row = $("<tr></tr>");
   // footer element
   sudoku.footerPanel = $("<div style='font-size: 16pt; text-align: center;'></div>");
   sudoku.footerCell = $("<td colspan = 4 align=center></td>").append(sudoku.footerPanel);;
   sudoku.footerCell.appendTo(row);
   row.appendTo(table);
   table.appendTo($(sudoku.parentElement));

   // canvas element (for main grid)
   var size = sudoku.gridSize();
   sudoku.puzzleGrid = $("<canvas id=puzzleGrid_ width=" + size + " height=" + size + " style='cursor: none;'>");
   sudoku.gridPanel.append(sudoku.puzzleGrid);
   sudoku.puzzleGrid.attr("tabindex","1");
   sudoku.showButtons();
   sudoku.showSudoku();
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

sudoku.getData = function(){
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
        ],
        "clues": [
        ],
        "goals": [
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
        ],
        "clues": [
        ],
        "goals": [
        ]
      };
   }
   if (sudoku.prop.sudokuSize==9){
      return {
        "size":  9 ,
         "rows": [
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 , 3 , 3, 3 ]
          },
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 , 3 , 3, 3 ]
          },
          {
            "cells": [ 1 , 1 , 1 , 2 , 2 , 2 , 3 , 3, 3 ]
          },
          {
            "cells": [ 4 , 4 , 4 , 5 , 5 , 5 , 6 , 6, 6 ]
          },
          {
            "cells": [ 4 , 4 , 4 , 5 , 5 , 5 , 6 , 6, 6 ]
          },
          {
            "cells": [ 4 , 4 , 4 , 5 , 5 , 5 , 6 , 6, 6 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 8 , 8 , 8 , 9 , 9, 9 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 8 , 8 , 8 , 9 , 9, 9 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 8 , 8 , 8 , 9 , 9, 9 ]
          }
        ],
        "clues": [
        ],
        "goals": [
        ]
      };
   }
}

// function toi show statistics of race
sudoku.showButtons = function(){
   var str ="";
   str += "<select id='type_selector'><option selected value='common'>Common</option><option value='noconsecutive'>No consecutive</option><option value='special'>Special</option></select>";
   str += "<select id='grdsize_selector'><option value=4>4x4</option><option selected value=6>6x6</option><option value=9>9x9</option></select>";
   str += "<button id='recreate_grid'>Create</button>";
   str += "<button id='solve_grid'>Solve</button>";
   str += "<button id='clear_grid'>Clear</button>";
   str += "<select id='symmetry_selector'><option selected value=0>No symmetry</option><option value=1>Central</option><option value=2>Vertical</option><option value=3>Horisontal</option><option value=4>Two axis</option><option value=5>Four axis</option><option value=6>Diagonal</option></select>";
   str += "<button id='random_grid'>Random</button>";
   str += "<button id='get_text'>Get Text</button>";
   sudoku.headerPanel.html(str);
   $('#recreate_grid').click(
      function(){
         sudoku.prop.sudokuSize = $('#grdsize_selector').val();
         sudoku.prop.puzzleType = $('#type_selector').val();
         sudoku.showSudoku();
      })
   $('#solve_grid').click(
      function(){
         sudoku.solve();
         sudoku.redraw();
      });
   $('#random_grid').click(
      function(){
         sudoku.prop.sudokuSize = $('#grdsize_selector').val();
         sudoku.prop.puzzleType = $('#type_selector').val();
         sudoku.prop.symmetry = $('#symmetry_selector').val();
         sudoku.random();
         sudoku.redraw();
      });
   $('#clear_grid').click(
      function(){
         sudoku.clear();
         sudoku.redraw();
      });
   $('#get_text').click(
      function(){
         sudoku.gettext();
      });
}

sudoku.initSudoku = function(){
   gridData = sudoku.getData();
   // fill in grd's array
   gridData.cellData = new Array(gridData.size);
   for(var i = 0; i < gridData.size; i++) gridData.cellData[i] = new Array(gridData.size);
   // mark goal cells
   var goalCount = 0;
   for(var i = 0; i < gridData.goals.length; i++){
      var goal = gridData.goals[i];
      goalCount++;
      gridData.cellData[goal.r][goal.c] = {type: "goal", goalValue: goal.v};
   }
   // mark clue's cells
   for(var i = 0; i < gridData.clues.length; i++){
      var clue = gridData.clues[i];
      gridData.cellData[clue.r][clue.c] = {type: "clue", value: clue.v};
   }
   // save property to DOM object
   sudoku.gridData = gridData;
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
                  font: prop[cellType].textFont,
                  x: c * cellwidth + cellwidth/2 + prop.borderWidth/2,
                  y: r * cellheight + cellheight/2 + prop.borderWidth/2,
                  text: value
               })
            }else{
               if (cellType == "variants"){
                  var answers = gridData.cellData[r][c].answers;
                  if(answers){
                     var ansCount = 0;
                     for(var v = 1; v <= sudoku.prop.sudokuSize; v++){
                        if(answers[v] > 0){
                           ansCount++;
                           gridCanvas.drawText({
                              fillStyle: prop[cellType].textColor,
                              font: prop[cellType].textFont,
                              x: c * cellwidth + cellwidth/2 + prop.borderWidth/2,
                              y: r * cellheight + ansCount*10 + prop.borderWidth/2,
                              text: v + ": " + answers[v]
                           })
                        }
                     }
                  }
               }
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
   if (value > 0){
      var currentData = sudoku.gridData.cellData[sudoku.sightRow][sudoku.sightColumn];
      if (!currentData){
         sudoku.gridData.cellData[sudoku.sightRow][sudoku.sightColumn] = {value: value, type: "clue"};
      }else{
         currentData.type = "clue";
         currentData.value = value;
      }
   }
   if (value == 0){
      sudoku.gridData.cellData[sudoku.sightRow][sudoku.sightColumn] = {};
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
                  if(!answerCell.answers){
                     answerCell.answers= new Array(sudoku.prop.sudokuSize + 1);
                     for(var v = 0; v <= sudoku.prop.sudokuSize; v++){
                        answerCell.answers[v] = 0;
                     }
                  }
                  answerCell.answers[answerCell.value]++;
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
      console.log("solutionCount = "+solutionCount);
      return solutionCount;
   }else{
      for(var i=0;i<sudoku.prop.sudokuSize;i++){
         for(var j=0;j<sudoku.prop.sudokuSize;j++){
            var answerCell = data[i][j];
            if(answerCell && answerCell.answers && answerCell.type != "clue"){
               var value = null;
               var bMulti = false;
               for(var v = 1; v <= sudoku.prop.sudokuSize; v++){
                  if(answerCell.answers[v] > 0){
                     if (value > 0){
                        bMulti = true;
                     }
                     value = v;
                  }
               }
               if(bMulti){
                  answerCell.type = "variants";
               }else{
                  answerCell.type = "common";
                  answerCell.value = value;
               }
            }
         }
      }
      sudoku.footerPanel.html("Total number of solutions: " + solutionCount);
   }
}

sudoku.random = function(){
   sudoku.initSudoku();
   sudoku.clear();
   var data = sudoku.gridData.cellData;
   putRandom = function(x, y){
      console.log("putRandom("+x+","+y+")");
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
      console.log("Start clear");
      var clueCount = sudoku.prop.sudokuSize*sudoku.prop.sudokuSize;
      var minCount = 23;
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
               console.log("Try "+cleared[c].x+","+cleared[c].y);
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
         console.log("variants="+variantCount+" clueCount="+clueCount);
      }
   }
}

sudoku.gettext = function(){
   str = "<textarea style='width:" + sudoku.gridSize() + "px; height:" + sudoku.gridSize() + "px;'>";
   for(var i=0;i<sudoku.prop.sudokuSize;i++){
      for(var j=0;j<sudoku.prop.sudokuSize;j++){
         var value = "";
         if(sudoku.gridData.cellData[i][j]) value = sudoku.gridData.cellData[i][j].value;
         if(value)
            str += value;
         str += "\t";
      }
      str += "\n";
   }
   str += "</textarea>";
   sudoku.statPanel.html(str);
}

sudoku.noconsecutive = function(x, y, v){
   checkNoConsecutive = function(i,j,val){
      if(i>=0 && i<sudoku.prop.sudokuSize && j>=0 && j<sudoku.prop.sudokuSize){
         if(sudoku.gridData.cellData[i][j]){
             var value = sudoku.gridData.cellData[i][j].value;
             if(value==val-1 || value==val+1){
                return false;
             }
         }
      }
      return true;
   }
   if(!checkNoConsecutive(x-1,y,v)) return false;
   if(!checkNoConsecutive(x+1,y,v)) return false;
   if(!checkNoConsecutive(x,y-1,v)) return false;
   if(!checkNoConsecutive(x,y+1,v)) return false;
   return true;
}


sudoku.special = function(x, y, v){
   checkNoConsecutive = function(i,j,val,direction){
      if(i>=0 && i<sudoku.prop.sudokuSize && j>=0 && j<sudoku.prop.sudokuSize){
         if(sudoku.gridData.cellData[i][j]){
             var value = sudoku.gridData.cellData[i][j].value;
             if(value){
                if(direction==1 && j==4 && (i == 0 || i == 2 || i==4)){
                   if(value!=val-1 && value!=val+1){
                      return false;
                   }
                }else if (direction==2 && j==4 && (i==1 ||i==3||i==5)){
                   if(value!=val-1 && value!=val+1){
                      return false;
                   }
                }else{
                   if(value==val-1 || value==val+1){
                      return false;
                   }
                }
             }
         }
      }
      return true;
   }
   if(!checkNoConsecutive(x-1,y,v,1)) return false;
   if(!checkNoConsecutive(x+1,y,v,2)) return false;
   if(!checkNoConsecutive(x,y-1,v,0)) return false;
   if(!checkNoConsecutive(x,y+1,v,0)) return false;
   return true;
}

sudoku.typeChecker = {
"noconsecutive":  sudoku.noconsecutive,
"special":        sudoku.special
}

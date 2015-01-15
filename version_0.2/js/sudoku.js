BaySudoku = function(size){
   this.sudokuSize = size;
}


BaySudoku.prototype.random = function(symmetry){
   this.initSudoku();
   this.clear();
   var self = this;
   var data = this.cellData;
   var size = this.sudokuSize;
   putRandom = function(x, y){
      if(x >= size ){
         return putRandom(0, y + 1);
      }else if (y >= size ){
         return true;
      }else{
         var cell = data[x][y];
         if(!cell){
            data[x][y] = {};
            cell = data[x][y];
         }
         if(!cell.type || cell.type == "common"){
            var variants = new Array(size + 1);
            var variantCount = 0;
            for(var v=1;v<=size;v++){
               if(self.checkValue(x, y, v)){
                  variants[v] = true;
                  variantCount++;
               } else {
                  variants[v] = false;
               }
            }
            while (variantCount > 0){
               var rnd = Math.floor((Math.random()*variantCount)+1)
               var rndVal = -1;
               for(var v=1;v<=size;v++){
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
      var clueCount = size*size;
      var minCount = 28;
      if (size==4) minCount = 3;
      if (size==6) minCount = 6;
      if (size==8) minCount = 12;
      var variants = new Array(size*size);
      var variantCount = 0;
      for(var i=0;i<size;i++){
         for(var j=0;j<size;j++){
            data[i][j].type = "clue";
            variants[i*size + j] = true;
            variantCount++;
         }
      }
      while (variantCount > 0 && clueCount > minCount){
         var rnd = Math.floor((Math.random()*variantCount)+1)
         var rndVal = -1;
         for(var v=0;v<size*size;v++){
            if(variants[v]){
               rnd--;
            }
            if(rnd <=0 ){
               rndVal = v;
               break;
            }
         }
         if(rndVal >= 0){
            var x = Math.floor(rndVal / size);
            var y = rndVal % size;
            var cleared = [];
            addCleared = function (a, b){
               var added = false;
               for(var c=0;c<cleared.length;c++){
                  if(cleared[c].x == a && cleared[c].y == b) added = true;
               }
               if(!added){
                  cleared.push({x:a, y:b, value: data[a][b].value});
               }
            }
// value=1>Central
// value=2>Vertical
// value=3>Horisontal
// value=4>Two axis
// value=5>Four axis
// value=6>Diagonal
            addCleared(x, y);
            if(symmetry==1){
               addCleared(size-x-1, size-y-1);
            }else if (symmetry==2){
               addCleared(x, size-y-1);
            }else if (symmetry==3){
               addCleared(size-x-1, y);
            }else if (symmetry==4){
               addCleared(size-x-1, size-y-1);
               addCleared(size-x-1, y);
               addCleared(x, size-y-1);
            }else if (symmetry==5){
               addCleared(size-x-1, size-y-1);
               addCleared(size-x-1, y);
               addCleared(x, size-y-1);
               addCleared(y, x);
               addCleared(size-y-1, x);
               addCleared(y, size-x-1);
               addCleared(size-y-1, size-x-1);
            }else if (symmetry==6){
               addCleared(y, x);
            }
            for(var c=0;c<cleared.length;c++){
               data[cleared[c].x][cleared[c].y].value="";
               data[cleared[c].x][cleared[c].y].type="";
            }
            if(this.solve(true) > 1){
               for(var c=0;c<cleared.length;c++){
                  data[cleared[c].x][cleared[c].y].value=cleared[c].value;
                  data[cleared[c].x][cleared[c].y].type="clue";
               }
            }else{
               clueCount-=cleared.length;
            }
            for(var c=0;c<cleared.length;c++){
               variants[cleared[c].x*size+cleared[c].y] = false;
               variantCount--;
            }
         }
      }
   }
   this.solve(false);
}

BaySudoku.prototype.getInitData = function(){
   if (this.sudokuSize==4){
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
   if (this.sudokuSize==6){
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
   if (this.sudokuSize==8){
      return {
        "size":  8 ,
         "rows": [
          {
            "cells": [ 1 , 1 , 1 , 1 , 2 , 2 , 2 , 2]
          },
          {
            "cells": [ 1 , 1 , 1 , 1 , 2 , 2 , 2 , 2 ]
          },
          {
            "cells": [ 3 , 3 , 3 , 3 , 4 , 4 , 4 , 4 ]
          },
          {
            "cells": [ 3 , 3 , 3 , 3 , 4 , 4 , 4 , 4 ]
          },
          {
            "cells": [ 5 , 5 , 5 , 5 , 6 , 6 , 6 , 6 ]
          },
          {
            "cells": [ 5 , 5 , 5 , 5 , 6 , 6 , 6 , 6 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 7 , 8 , 8 , 8 , 8 ]
          },
          {
            "cells": [ 7 , 7 , 7 , 7 , 8 , 8 , 8 , 8 ]
          }
        ]
      };
   }
   if (this.sudokuSize==9){
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

BaySudoku.prototype.initSudoku = function(){
   this.gridData = this.getInitData();
   this.cellData = new Array(this.gridData.size);
   for(var i = 0; i < this.gridData.size; i++) {
      this.cellData[i] = new Array(this.gridData.size);
      for(var j=0;j<this.sudokuSize;j++){
         this.cellData[i][j] = {};
      }
    }
}

BaySudoku.prototype.clear = function(){
   for(var i=0;i<this.sudokuSize;i++){
      for(var j=0;j<this.sudokuSize;j++){
         cell = this.cellData[i][j];
         if(cell){
            if(!cell.type || cell.type != "clue"){
               this.cellData[i][j] = {};
            }
         }
      }
   }
}

BaySudoku.prototype.checkValue = function(x, y, v){
   area = this.gridData.rows[x].cells[y];
   for(var i=0;i<this.sudokuSize;i++){
      for(var j=0;j<this.sudokuSize;j++){
         if(i != x || j != y){
            var newCell = this.cellData[i][j];
            if(newCell){
               if( i == x && v==newCell.value) return false;
               if( j == y && v==newCell.value) return false;
               newArea = this.gridData.rows[i].cells[j];
               if(area==newArea && v==newCell.value) return false;
            }
         }
      }
   }
   return true;
}


BaySudoku.prototype.solve = function(checkOnly){
   var toCheck = false;
   if(checkOnly){
      toCheck = true;
   }
   this.clear();
   var data = this.cellData;
   var size = this.sudokuSize;
   var self = this;
   var solutionCount = 0;
   fixAnswer = function(){
      solutionCount++;
      if(toCheck){
         return;
      }else{
         for(var i=0;i<size;i++){
            for(var j=0;j<size;j++){
               var answerCell = data[i][j];
               if(answerCell && answerCell.value){
                  answerCell.answer = answerCell.value;
               }
            }
         }
      }
   }
   putNext = function (x, y){
      if(x >= size ){
         putNext(0, y + 1);
      }else if (y >= size ){
         fixAnswer();
      }else{
         var cell = data[x][y];
         if(!cell){
            data[x][y] = {};
            cell = data[x][y];
         }
         if(!cell.type || cell.type == "common"){
            for(var v=1;v<=size;v++){
               if(self.checkValue(x, y, v)){
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

if(typeof(module) != 'undefined')
  module.exports=BaySudoku;

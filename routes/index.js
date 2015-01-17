module.exports = function(app){
   app.get('/', require('./start').get);
   app.get('/sudokuduel', require('./sudoku').get);

   app.post('/info', require('./info').post);
}

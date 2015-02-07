module.exports = function(app){
   app.get('/', require('./start').get);
   app.get('/sudokuduel', require('./sudoku').get);
   app.get('/rating', require('./rating').get);
   app.get('/matchhistory', require('./matchhistory').get);

   app.post('/info', require('./info').post);
};

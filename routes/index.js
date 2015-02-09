module.exports = function(app){
   app.get('/', require('./start').get);
   app.get('/sudokuduel', require('./sudoku').get);
   app.get('/rating', require('./rating').get);
   app.get('/matchhistory', require('./matchhistory').get);
   app.get('/allmatch', require('./allmatch').get);
   app.get('/allmatch/:userId', require('./allmatch').get);
   
   app.get('/policy', function(req, res, next) {
      res.render('policy', { languages: require('../translation').languages() });
   });

   app.post('/info', require('./info').post);
};

module.exports = function(app){
   app.get('/', require('./start').get);
   app.get('/index', require('./start').get);
   app.get('/account', require('./account').get);
   app.get('/rating', require('./rating').get);
   app.get('/sudokuduel', require('./sudoku').get);
   app.get('/matchhistory', require('./matchhistory').get);
   app.get('/statistics', require('./statistics').get);
   app.get('/invitations', require('./invitations').get);
   app.post('/invitations', require('./invitations').post);
   app.get('/allmatch', require('./allmatch').get);
   app.get('/allmatch/:userId', require('./allmatch').get);
   app.get('/monitor', require('./monitor').get);

   app.get('/policy', function(req, res, next) {
      res.render('policy', { languages: require('../translation').languages() });
   });

   app.post('/info', require('./info').post);
};

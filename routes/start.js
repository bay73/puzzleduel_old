exports.get = function(req, res, next){
   res.render('index', { title: 'PuzzleDuel', languages: require('../translation').languages() });
}
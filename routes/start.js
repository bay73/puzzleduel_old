exports.get = function(req, res, next){
   res.render('index', { title: 'Puzzle duel', languages: require('../translation').languages() });
}
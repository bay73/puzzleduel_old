exports.get = function(req, res, next){
   res.render('sudoku', { languages: require('../translation').languages()});
}
exports.get = function(req, res, next){
   res.render('sudoku', { title: 'PuzzleDuel', languages: require('../translation').languages()});
}
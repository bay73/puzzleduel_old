exports.get = function(req, res, next){
  var invitation = req.query ? req.query.invitation : null;
  res.render('sudoku', { languages: require('../translation').languages(), page: 'sudoku', invitation: invitation});
};
exports.get = function(req, res, next){
  var invitation = req.query ? req.query.invitation : null;
  res.render('sudoku6', { languages: require('../translation').languages(), page: 'sudoku', invitation: invitation, invitationCount: 0});
};
exports.get = function(req, res, next){
    if(req.user){
        res.render('account', { languages: require('../translation').languages(), page: 'account', invitationCount: 0 });
    } else {
        next(403);
    }
};

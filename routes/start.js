var AllUser = require('../models/match').AllUser;

exports.get = function(req, res, next){
    AllUser
    .find({type: {$ne: 'anonym'}})
    .sort({rating: -1})
    .limit(14)
    .select('displayName rating')
    .exec(function(err, data){
        if(err) return next(err);
        res.render('index', { title: 'PuzzleDuel', languages: require('../translation').languages(), ratings: data });
    });
};

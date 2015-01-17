var log = require('../scripts/log')(module);
var send = require('send');
var fs = require('fs');

var get = function(app){
    app.get('/translate.json', function(req, res, next){
        var lang = req.session.lang;
        var path = __dirname + '/' +  lang + '.json';
        var stream = send(req, path, {});
        stream.on('directory', next);
        
        stream.on('headers', function(res, path) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8;');
        });

        stream.on('error', function error(err) {
          next(err.status === 404 ? null : err);
        });
        stream.pipe(res);
    });

    app.get('/switchlang/:lang', function(req, res, next){
        req.session.lang = req.param("lang");
        res.redirect("/");
    });
};

module.exports.translate = function(app){
    app.use(function(req, res, next){
        if(req.user){
            req.session.lang = req.user.language;
        } else if(!req.session.lang){
            req.session.lang = 'en';
        }
        var lang = req.session.lang;
        var path = __dirname + '/' +  lang + '.json';
        var data = fs.readFileSync(path, {encoding: 'utf-8'});         
        res.locals.translate = JSON.parse(data);
        next();
    });
    get(app);
};

function getLanguage(lang){
    var path = __dirname + '/' +  lang + '.json';
    var data = fs.readFileSync(path, {encoding: 'utf-8'});         
    var label = JSON.parse(data)["Name of the language"];
    return {lang: lang, label: label};
}

module.exports.languages = function(){
    return [getLanguage('en'), getLanguage('de'), getLanguage('ru')];
    
}
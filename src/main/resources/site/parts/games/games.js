var contentLib = require('/lib/xp/content');
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');


// Handle the GET request
exports.get = function (req) {
  
    var weeks = foosLib.getWeeks();
    foosLib.generatePageUrl(weeks);
    var view = resolve('games.html');
    var body = mustacheLib.render(view, {
        weeks: weeks
    });
    return {
        body: body
    }
};
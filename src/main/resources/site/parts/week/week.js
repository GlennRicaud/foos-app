var contentLib = require('/lib/xp/content');
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');
var gamesWidgetLib = require('/lib/widgets/games/games');


// Handle the GET request
exports.get = function (req) {
    var games = foosLib.getGamesByWeekPath(portalLib.getContent()._path);
    var view = resolve('week.html');
    var body = mustacheLib.render(view, {
        gamesWidget: gamesWidgetLib.render(games)
    });
    return {
        body: body
    }
};
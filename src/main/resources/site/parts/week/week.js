var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosRetrievalLib = require('/lib/foos-retrieval');
var gamesWidgetLib = require('/lib/widgets/games/games');


// Handle the GET request
exports.get = function (req) {
    var games = foosRetrievalLib.getGamesByWeekPath(portalLib.getContent()._path);
    var view = resolve('week.html');
    var body = mustacheLib.render(view, {
        gamesWidget: gamesWidgetLib.render(games, true)
    });
    return {
        body: body
    }
};
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var gamesWidgetLib = require('/lib/widgets/games/games');

var view = resolve('game.html');

// Handle the GET request
exports.get = function (req) {
    var game = portalLib.getContent();
    var games = [];
    if (game.type === app.name + ':game') {
        games.push(game);
    }
    var body = mustacheLib.render(view, {
        gamesWidget: gamesWidgetLib.render(games)
    });
    return {
        body: body
    }
};
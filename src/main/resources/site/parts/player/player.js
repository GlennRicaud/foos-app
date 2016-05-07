var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');
var gamesWidgetLib = require('/lib/widgets/games/games');

exports.get = function (req) {
    var player = portalLib.getContent();
    foosLib.generatePlayerStats(player);

    //Retrieves the games played
    var games = foosLib.getGamesByPlayerId(player._id);


    var view = resolve('player.html');
    var body = mustacheLib.render(view, {
        player: player,
        wonGamesWidget: gamesWidgetLib.render(games, true)
    });
    return {
        body: body
    }
};

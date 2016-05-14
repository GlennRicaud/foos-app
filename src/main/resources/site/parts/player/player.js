var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosPlayerStatsLib = require('/lib/foos-player-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');
var gamesWidgetLib = require('/lib/widgets/games/games');

exports.get = function (req) {
    var player = portalLib.getContent();
    var playerStats = foosPlayerStatsLib.generatePlayerStats(player);

    log.info("playerStats:%s", JSON.stringify(playerStats, null, 2));

    //Retrieves the games played
    var games = foosRetrievalLib.getGamesByPlayerId(player._id);

    var view = resolve('player.html');
    var body = mustacheLib.render(view, {
        player: player,
        playerStats: playerStats,
        wonGamesWidget: gamesWidgetLib.render(games, true)
    });
    return {
        body: body
    }
};

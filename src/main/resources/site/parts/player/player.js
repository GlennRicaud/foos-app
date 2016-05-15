var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosPlayerStatsLib = require('/lib/foos-player-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosPerfLib = require('/lib/foos-perf');
var foosUtilLib = require('/lib/foos-util');
var gamesWidgetLib = require('/lib/widgets/games/games');

exports.get = function (req) {
    var gamesCount = req.params.gamescount || 10;

    var player = portalLib.getContent();
    var playerStats = foosPlayerStatsLib.generatePlayerStats(player);

    var playerStatsArray = [];
    var even = false;
    for (var statName in playerStats) {
        var playerStat = playerStats[statName];
        for (var subStatName in playerStat) {
            var subStat = playerStat[subStatName];
            if (!isNaN(subStat)) {
                playerStat[subStatName] = subStat.toFixed(0);
            }
        }
        playerStat.even = even;
        even = !even;
        playerStatsArray.push(playerStat);
    }

    //Retrieves the games played
    var games = foosRetrievalLib.getGamesByPlayerId(player._id, gamesCount);

    var view = resolve('player.html');
    var gamesWidget = gamesWidgetLib.render(games, true);
    var body = mustacheLib.render(view, {
        player: player,
        playerStats: playerStatsArray,
        gamesWidget: gamesWidget
    });
    return {
        body: body
    }
};

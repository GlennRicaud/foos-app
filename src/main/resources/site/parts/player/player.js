var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosPlayerStatsLib = require('/lib/foos-player-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');
var gamesWidgetLib = require('/lib/widgets/games/games');

exports.get = function (req) {
    var displayAllGames = req.params.allgames;

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
    var games = foosRetrievalLib.getGamesByPlayerId(player._id, displayAllGames ? -1 : 10);

    var view = resolve('player.html');
    var gamesWidget = gamesWidgetLib.render(games, true);
    var body = mustacheLib.render(view, {
        player: player,
        playerStats: playerStatsArray,
        gamesWidget: gamesWidget,
        displayAllGamesUrl: displayAllGames ? undefined : foosUrlLib.getCurrentPageUrl({allgames: true})
    });
    return {
        body: body
    }
};

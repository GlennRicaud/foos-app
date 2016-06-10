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
    var metaPlayerStats = foosPlayerStatsLib.getMetaPlayerStats();

    var playerStatsArray = [];
    var even = false;
    for (var statName in playerStats) {
        var playerStat = playerStats[statName];
        var metaPlayerStat = metaPlayerStats[statName];

        for (var subStatName in playerStat) {
            var subStat = playerStat[subStatName];
            if (!isNaN(subStat)) {
                playerStat[subStatName] = formatValue(subStat);
            }
        }
        playerStat.even = even;
        playerStat.name = metaPlayerStat.name;
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

function formatValue(number) {
    if (isNaN(number)) {
        return number;
    }
    return number % 1 === 0 ? number.toFixed(0) : number.toFixed(1);
}

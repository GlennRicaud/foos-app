var foosPlayerStatsLib = require('/lib/foos-player-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');

exports.get = function () {
    var playerStatsArray = [];
    foosRetrievalLib.getPlayers().forEach(function (player) {
        var playerStats = foosPlayerStatsLib.generatePlayerStats(player);
        playerStats.playerName = player.displayName;
        playerStatsArray.push(playerStats)
    });
    return {
        contentType: 'application/json',
        body: JSON.stringify(playerStatsArray)
    }
};
var foosPlayerStatsLib = require('/lib/foos-player-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');

exports.get = function () {
    var stats = {};
    foosRetrievalLib.getPlayers().forEach(function (player) {
        stats[player.displayName] = foosPlayerStatsLib.generatePlayerStats(player);
    });
    return {
        contentType: 'application/json',
        body: JSON.stringify(stats)
    }
};
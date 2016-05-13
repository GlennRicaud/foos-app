var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');

// Handle the GET request
exports.get = function (req) {
    var players = foosRetrievalLib.getPlayers();

    players.forEach(function (player) {
        foosUrlLib.generatePictureUrl(player);
        foosUrlLib.generatePageUrl(player);
    });

    var view = resolve('players.html');
    var body = mustacheLib.render(view, {
        players: players
    });
    return {
        body: body
    }
};
var portalLib = require('/lib/xp/portal');
var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');
var foosUrlLib = require('/lib/foos-url');

exports.get = function (req) {
    var players = foosRetrievalLib.getPlayers();

    players.forEach(function (player) {
        foosUrlLib.generatePictureUrl(player, 32, 'rounded(16)');
        foosUrlLib.generatePageUrl(player);
        player.data.rankingText = foosUtilLib.ordinal(player.data.ranking);
    });

    players.sort(function (p1, p2) {
        return p1.data.ranking - p2.data.ranking;
    });

    var view = resolve('ranking.html');
    var body = mustacheLib.render(view, {
        players: players
    });

    return {
        body: body,
        pageContributions: {
            headEnd: '<link rel="stylesheet" href="' + portalLib.assetUrl({path: 'css/ranking.css'}) + '" type="text/css" />'
        }
    }
};
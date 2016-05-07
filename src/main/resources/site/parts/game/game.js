var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');
var gamesWidgetLib = require('/lib/widgets/games/games');

var view = resolve('game.html');

// Handle the GET request
exports.get = function (req) {
    var game = portalLib.getContent();

    var body = mustacheLib.render(view, {
        gamesWidget: gamesWidgetLib.render([game], false),
        gameDetails: generateGameDetails(game),
        tableImgUrl: portalLib.assetUrl({path: "img/table.png"})

    });
    return {
        body: body
    }
};

function generateGameDetails(game) {
    var winnersDisplayName;
    var losersDisplayName;

    if (game.data.winners.length == 2) {
        var winingTeam = foosLib.getTeamByPlayerIds(game.data.winners.map(function (playerResult) {
            return playerResult.playerId
        }), true);
        var losingTeam = foosLib.getTeamByPlayerIds(game.data.losers.map(function (playerResult) {
            return playerResult.playerId
        }), true);
        winnersDisplayName = winingTeam.displayName;
        losersDisplayName = losingTeam.displayName;
    } else {
        var winner = foosLib.getContentByKey(game.data.winners.playerId);
        var loser = foosLib.getContentByKey(game.data.losers.playerId);
        winnersDisplayName = winner.displayName;
        losersDisplayName = loser.displayName;
    }

    return {
        winnersDisplayName: winnersDisplayName,
        losersDisplayName: losersDisplayName
    };
}

function formatTime(time) {
    var min = Math.floor(time / 60);
    var sec = time % 60;
    return (min < 10 ? "0" : "") + min + "′" + (sec < 10 ? "0" : "") + sec + "′′";
};
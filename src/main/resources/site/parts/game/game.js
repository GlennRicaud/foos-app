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

    if (!game.data.goals) {
        return undefined;
    }

    var winnersDisplayName;
    var losersDisplayName;
    var winners;
    var losers;

    if (game.data.winners.length == 2) {
        var winingTeam = foosLib.getTeamByGame(game, true, true);
        var losingTeam = foosLib.getTeamByGame(game, false, true);
        winnersDisplayName = winingTeam.displayName;
        losersDisplayName = losingTeam.displayName;

        winners = foosLib.getPlayersByGame(game, true);
        losers = foosLib.getPlayersByGame(game, false);

    } else {
        var winner = foosLib.getContentByKey(game.data.winners.playerId);
        var loser = foosLib.getContentByKey(game.data.losers.playerId);

        winnersDisplayName = winner.displayName;
        losersDisplayName = loser.displayName;
        winners = [winner];
        losers = [loser];
    }

    foosLib.concat(winners, losers).forEach(function (player) {
        foosLib.generatePictureUrl(player);
        foosLib.generatePageUrl(player);
    });

    return {
        winnersDisplayName: winnersDisplayName,
        losersDisplayName: losersDisplayName,
        winners: winners,
        losers: losers

    };
}

function formatTime(time) {
    var min = Math.floor(time / 60);
    var sec = time % 60;
    return (min < 10 ? "0" : "") + min + "′" + (sec < 10 ? "0" : "") + sec + "′′";
};
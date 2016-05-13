var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');
var foosUtilLib = require('/lib/foos-util');
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
        var winingTeam = foosRetrievalLib.getTeamByGame(game, true, true);
        var losingTeam = foosRetrievalLib.getTeamByGame(game, false, true);
        winnersDisplayName = winingTeam.displayName;
        losersDisplayName = losingTeam.displayName;

        winners = foosRetrievalLib.getPlayersByGame(game, true);
        losers = foosRetrievalLib.getPlayersByGame(game, false);

    } else {
        var winner = foosRetrievalLib.getContentByKey(game.data.winners.playerId);
        var loser = foosRetrievalLib.getContentByKey(game.data.losers.playerId);

        winnersDisplayName = winner.displayName;
        losersDisplayName = loser.displayName;
        winners = [winner];
        losers = [loser];
    }

    foosUtilLib.concat(winners, losers).forEach(function (player) {
        foosUrlLib.generatePictureUrl(player);
        foosUrlLib.generatePageUrl(player);
    });

    var firstHalfGoals = [], secondHalfGoals = [];
    generateGoalsDetails(game, firstHalfGoals, secondHalfGoals)

    return {
        winnersDisplayName: winnersDisplayName,
        losersDisplayName: losersDisplayName,
        firstHalfWinners: winners,
        secondHalfWinners: winners.slice(0).reverse(),
        firstHalfLosers: losers.slice(0).reverse(),
        secondHalfLosers: losers,
        firstHalfGoals: firstHalfGoals,
        secondHalfGoals: secondHalfGoals

    };
}

function generateGoalsDetails(game, firstHalf, secondHalf) {
    var winnersScore = 0;
    var losersScore = 0;
    var winnerIds = foosUtilLib.toArray(game.data.winners).map(function (playerResult) {
        return playerResult.playerId
    });

    var playersById = {};
    foosRetrievalLib.getPlayersByGame(game).forEach(function (player) {
        playersById[player._id] = player;
    });

    var currentHalf = firstHalf;
    game.data.goals.sort(function (goal1, goal2) {
        return goal1.time - goal2.time;
    }).forEach(function (goal) {
        var winnerScored = (!goal.against && winnerIds.indexOf(goal.playerId) > -1) ||
                           (goal.against && winnerIds.indexOf(goal.playerId) == -1);

        if (winnerScored) {
            winnersScore++;
        } else {
            losersScore++;
        }

        var comment = playersById[goal.playerId].displayName + " scores! (" + formatTime(goal.time) +
                      ")" + (goal.against ? " ... against himself" : "");
        var winner = winnerScored ? comment : "";
        var loser = winnerScored ? "" : comment;


        currentHalf.push({
            time: formatTime(game.time),
            winner: winner,
            score: winnersScore + " - " + losersScore,
            loser: loser
        });

        if (winnersScore >= 5 || losersScore >= 5) {
            currentHalf = secondHalf;
        }
    });
}

function formatTime(time) {
    var min = Math.floor(time / 60);
    var sec = time % 60;
    return (min < 10 ? "0" : "") + min + "′" + (sec < 10 ? "0" : "") + sec + "′′";
};
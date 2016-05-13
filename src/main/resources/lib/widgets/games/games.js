var mustacheLib = require('/lib/xp/mustache');
var foosGameStatsLib = require('/lib/foos-game-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');
var foosUrlLib = require('/lib/foos-url');


// Handle the GET request
exports.render = function (games, detailsButton) {
    games.forEach(function (game) {
        foosGameStatsLib.generateGameStats(game);
        foosGameStatsLib.generateGameComments(game);

        game.gen.winners =
            foosUtilLib.isTeamGame(game) ? foosRetrievalLib.getTeamByGame(game, true, true).displayName : game.data.winners.gen.name;
        game.gen.losers =
            foosUtilLib.isTeamGame(game) ? foosRetrievalLib.getTeamByGame(game, false, true).displayName : game.data.losers.gen.name;
        game.gen.score.winners = game.gen.score.winners.toFixed();
        game.gen.score.losers = game.gen.score.losers.toFixed();
        foosUtilLib.toArray(game.data.winners).
            concat(foosUtilLib.toArray(game.data.losers)).
            forEach(function (playerResult) {
                playerResult.against = playerResult.against > 0 ? playerResult.against : undefined;
            });
        if (detailsButton && game.data.goals) {
            foosUrlLib.generatePageUrl(game);
        }
    });

    games = games.
        sort(function (game1, game2) {
            return game2.data.date.localeCompare(game1.data.date);
        });

    var view = resolve('games.html');
    return mustacheLib.render(view, {
        games: games
    });
};
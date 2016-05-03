var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');


// Handle the GET request
exports.render = function (games, detailsButton) {
    games.forEach(function (game) {
        foosLib.generateGameStats(game);
        foosLib.generateGameComments(game);

        game.gen.score.winners = game.gen.score.winners.toFixed();
        game.gen.score.losers = game.gen.score.losers.toFixed();
        foosLib.toArray(game.data.winners).
            concat(foosLib.toArray(game.data.losers)).
            forEach(function (playerResult) {
                playerResult.against = playerResult.against > 0 ? playerResult.against : undefined;
            });
        if (detailsButton && game.data.goals) {
            foosLib.generatePageUrl(game);
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
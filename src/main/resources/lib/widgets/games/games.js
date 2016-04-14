var contentLib = require('/lib/xp/content');
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');


// Handle the GET request
exports.render = function (games) {
    games.forEach(function (game) {
        foosLib.generateGameStats(game);
        foosLib.generateGameComments(game);

        game.gen.score.winners = game.gen.score.winners.toFixed();
        game.gen.score.losers = game.gen.score.losers.toFixed();
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
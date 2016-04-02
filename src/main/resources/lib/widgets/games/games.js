var contentLib = require('/lib/xp/content');
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');


// Handle the GET request
exports.render = function (games) {
    games.forEach(function (game) {
        game.score = {
            winners: 0,
            losers: 0
        };

        var playerResults = foosLib.toArray(game.data.playerResults);
        playerResults.forEach(function (playerResult) {
            var playerContent = contentLib.get({
                key: playerResult.playerId
            });

            playerResult.gen = {};
            playerResult.gen.name = playerContent.displayName;
            foosLib.generatePictureUrl(playerContent);
            foosLib.generatePageUrl(playerContent);
            playerResult.gen.pictureUrl = playerContent.gen.pictureUrl;
            playerResult.gen.pageUrl = playerContent.gen.pageUrl;

            if (playerResult.winner) {
                game.score.winners += playerResult.score;
                if (playerResult.against) {
                    game.score.losers += playerResult.against;
                }
            } else {
                game.score.losers += playerResult.score;
                if (playerResult.against) {
                    game.score.winners += playerResult.against;
                }
            }
        });

        game.score.winners = game.score.winners.toFixed();
        game.score.losers = game.score.losers.toFixed();
    });

    var view = resolve('games.html');
    return mustacheLib.render(view, {
        games: games
    });
};
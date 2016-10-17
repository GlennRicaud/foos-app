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

        game.data.winnerTeamRatingSign = '';
        game.data.loserTeamRatingSign = '';
        game.data.winnerTeamRatingDiff = game.data.winnerTeamRatingDiff == null ? '' : formatPlusMinus(game.data.winnerTeamRatingDiff);
        game.data.loserTeamRatingDiff = game.data.loserTeamRatingDiff == null ? '' : formatPlusMinus(game.data.loserTeamRatingDiff);

        game.gen.winners =
            foosUtilLib.isTeamGame(game) ? foosRetrievalLib.getTeamByGame(game, true, true).displayName : game.data.winners.gen.name;
        game.gen.losers =
            foosUtilLib.isTeamGame(game) ? foosRetrievalLib.getTeamByGame(game, false, true).displayName : game.data.losers.gen.name;
        game.gen.score.winners = game.gen.score.winners.toFixed();
        game.gen.score.losers = game.gen.score.losers.toFixed();
        if (game.data.winners.length == 2) {
            game.data.winners[0].ratingDiff = formatPlusMinus(game.data.winners[0].ratingDiff);
            game.data.winners[0].ratingSign = game.data.winners[0].ratingDiff >= 0 ? 'foos-game-rating-plus' : 'foos-game-rating-minus';
            game.data.winners[1].ratingDiff = formatPlusMinus(game.data.winners[1].ratingDiff);
            game.data.winners[1].ratingSign = game.data.winners[1].ratingDiff >= 0 ? 'foos-game-rating-plus' : 'foos-game-rating-minus';
            game.data.losers[0].ratingDiff = formatPlusMinus(game.data.losers[0].ratingDiff);
            game.data.losers[0].ratingSign = game.data.losers[0].ratingDiff >= 0 ? 'foos-game-rating-plus' : 'foos-game-rating-minus';
            game.data.losers[1].ratingDiff = formatPlusMinus(game.data.losers[1].ratingDiff);
            game.data.losers[1].ratingSign = game.data.losers[1].ratingDiff >= 0 ? 'foos-game-rating-plus' : 'foos-game-rating-minus';

            if (game.data.winnerTeamRatingDiff != undefined) {
                game.data.winnerTeamRatingSign =game.data.winnerTeamRatingDiff>=0? 'foos-game-rating-plus' : 'foos-game-rating-minus';
                game.data.loserTeamRatingSign =game.data.loserTeamRatingDiff>=0? 'foos-game-rating-plus' : 'foos-game-rating-minus';
            }
        } else {
            game.data.winners.ratingDiff = formatPlusMinus(game.data.winners.ratingDiff);
            game.data.winners.ratingSign = game.data.winners.ratingDiff >= 0 ? 'foos-game-rating-plus' : 'foos-game-rating-minus';
            game.data.losers.ratingDiff = formatPlusMinus(game.data.losers.ratingDiff);
            game.data.losers.ratingSign = game.data.losers.ratingDiff >= 0 ? 'foos-game-rating-plus' : 'foos-game-rating-minus';
        }

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

function formatPlusMinus(value) {
    return value <= 0 ? value + "" : "+" + value;
}
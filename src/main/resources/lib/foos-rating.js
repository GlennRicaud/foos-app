var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');

var INITIAL_RATING = 1500;
var K_FACTOR = 40;

exports.calculateGameRatings = function (game) {
    var winners, losers, winner, loser;

    var doublePlayers = game.data.winners.length === 2;
    if (doublePlayers) {
        winners = foosRetrievalLib.getPlayersByGame(game, true);
        losers = foosRetrievalLib.getPlayersByGame(game, false);
    } else {
        winner = foosRetrievalLib.getContentByKey(game.data.winners.playerId);
        loser = foosRetrievalLib.getContentByKey(game.data.losers.playerId);
        winners = [winner];
        losers = [loser];
    }

    calcResultGame(game.data, winners, losers);

    log.info("GAME: " + JSON.stringify(game, null, 4));
    log.info("Winners: " + JSON.stringify(winners, null, 4));
    log.info("Losers: " + JSON.stringify(losers, null, 4));

    contentLib.modify({
        key: game._id,
        editor: function (gameContent) {
            if (doublePlayers) {
                gameContent.data.winners[0].ratingDiff = game.data.winners[0].ratingDiff;
                gameContent.data.winners[1].ratingDiff = game.data.winners[1].ratingDiff;
                gameContent.data.losers[0].ratingDiff = game.data.losers[0].ratingDiff;
                gameContent.data.losers[1].ratingDiff = game.data.losers[1].ratingDiff;
            } else {
                gameContent.data.winners.ratingDiff = game.data.winners.ratingDiff;
                gameContent.data.losers.ratingDiff = game.data.losers.ratingDiff;
            }
            return gameContent;
        }
    });
    var contentIdsUpdated = [];
    contentIdsUpdated.push(game._id);

    var players = winners.concat(losers);
    players.forEach(function (player) {
        setPlayerRating(player._id, player.data.rating);
        contentIdsUpdated.push(player._id);
    });

    publishPlayers(contentIdsUpdated);

    exports.updateRankings();
};


exports.resetRatings = function () {
    var players = foosRetrievalLib.getPlayers();
    var playerIds = [];
    players.forEach(function (player) {
        contentLib.modify({
            key: player._id,
            editor: function (c) {
                c.data.rating = INITIAL_RATING;
                c.data.ranking = 1;
                delete c.data.name; // old data format in player content type
                return c;
            }
        });
        playerIds.push(player._id);
    });

    publishPlayers(playerIds);
};

exports.updateRankings = function () {
    var players = foosRetrievalLib.getPlayers();
    var playerIds = [];

    players.forEach(function (p) {
        p.data.rating = p.data.rating || INITIAL_RATING;
        p.data.rating = p.data.rating < 0 ? 0 : p.data.rating;
    });
    players.sort(function (p1, p2) {
        return p2.data.rating - p1.data.rating;
    });

    var rank = 0, prevRating = 0;
    players.forEach(function (player) {
        if (player.data.rating !== prevRating) {
            rank = rank + 1;
            prevRating = player.data.rating;
        }
        log.info('Updating ranking for player: ' + player.displayName + ' - ' + foosUtilLib.ordinal(rank) + ' (' + prevRating + ')');
        contentLib.modify({
            key: player._id,
            editor: function (c) {
                c.data.ranking = rank;
                return c;
            }
        });
    });

    publishPlayers(playerIds);
};

var publishPlayers = function (playerIds) {
    contextLib.run({
            user: {
                login: 'su',
                userStore: 'system'
            }
        },
        function () {
            doPublishPlayers(playerIds);
        });
};

var doPublishPlayers = function (playerIds) {
    contentLib.publish({
        keys: playerIds,
        sourceBranch: 'draft',
        targetBranch: 'master',
        includeChildren: false,
        includeDependencies: true
    });
};

var setPlayerRating = function (playerId, newRating) {
    contentLib.modify({
        key: playerId,
        editor: function (c) {
            c.data.rating = newRating;
            return c;
        }
    });
};

// __________________________________
//
//      Game rating calculations
// __________________________________
var calcResultGame = function (game, winners, losers) {
    if (winners.length == 1) {
        game.winnerGoals = game.winners.score + (game.losers.against || 0);
    } else {
        game.winnerGoals = game.winners[0].score + game.winners[1].score + (game.losers[0].against || 0) + (game.losers[1].against || 0);
    }
    if (losers.length == 1) {
        game.loserGoals = game.losers.score + (game.winners.against || 0);
    } else {
        game.loserGoals = game.losers[0].score + game.losers[1].score + (game.winners[0].against || 0) + (game.winners[1].against || 0);
    }

    calcGameScore(game);
    calcGameTeamRatings(game, winners, losers);

};

var calcGameTeamRatings = function (game, winners, losers) {
    if (game.winners.length === 2) {
        calcGameTeamRatings2p(game, winners, losers);
    } else {
        calcGameTeamRatings1p(game, winners, losers);
    }
};

var calcGameTeamRatings1p = function (game, winners, losers) {
    var wRating = winners[0].data.rating;
    var lRating = losers[0].data.rating;

    log.info("Winner score: " + game.winnerScore);
    log.info("Loser score: " + game.loserScore);

    var newWRating = newRating(wRating, lRating, game.winnerScore);
    var newLRating = newRating(lRating, wRating, game.loserScore);

    var wRatingDiff = newWRating - (wRating);
    var lRatingDiff = newLRating - (lRating);
    log.info("Rating diffs: " + lRatingDiff + "," + wRatingDiff);

    winners[0].data.rating += wRatingDiff;
    losers[0].data.rating += lRatingDiff;

    log.info("Winners: " + JSON.stringify(winners, null, 4));
    log.info("Losers: " + JSON.stringify(losers, null, 4));

    game.winners.ratingDiff = wRatingDiff;
    game.losers.ratingDiff = lRatingDiff;
};

var calcGameTeamRatings2p = function (game, winners, losers) {
    var w1Rating = winners[0].data.rating;
    var w2Rating = winners[1].data.rating;
    var l1Rating = losers[0].data.rating;
    var l2Rating = losers[1].data.rating;

    var wAvgRating = (w1Rating + w2Rating) / 2;
    var lAvgRating = (l1Rating + l2Rating) / 2;
    log.info("Avg ratings: " + wAvgRating + "," + lAvgRating);
    log.info("Winner score: " + game.winnerScore);
    log.info("Loser score: " + game.loserScore);

    var newWRating = newRating(wAvgRating, lAvgRating, game.winnerScore);
    var newLRating = newRating(lAvgRating, wAvgRating, game.loserScore);

    var wRatingDiff = newWRating - (wAvgRating);
    var lRatingDiff = newLRating - (lAvgRating);
    log.info("Rating diffs: " + lRatingDiff + "," + wRatingDiff);

    winners[0].data.rating += wRatingDiff;
    winners[1].data.rating += wRatingDiff;
    losers[0].data.rating += lRatingDiff;
    losers[1].data.rating += lRatingDiff;
    log.info("Winners: " + JSON.stringify(winners, null, 4));
    log.info("Losers: " + JSON.stringify(losers, null, 4));

    game.winners[0].ratingDiff = wRatingDiff;
    game.winners[1].ratingDiff = wRatingDiff;
    game.losers[0].ratingDiff = lRatingDiff;
    game.losers[1].ratingDiff = lRatingDiff;
};

/**
 * Returns the new rating for the player after winning or losing to the opponent(s) with the given rating.
 * @param rating Player's old rating.
 * @param opponentRating The rating of the opposing player(s).
 * @param score Game score (WIN = 1.0, DRAW = 0.5, LOSS = 0.0).
 * @returns {number} Player's new rating.
 */
var newRating = function (rating, opponentRating, score) {
    var expectedScore = calculateExpectedScore(rating, opponentRating);
    return calculateNewRating(rating, score, expectedScore, K_FACTOR);
};

/**
 * Calculates the expected score based on two players.
 * In a 2v2 game opponent rating will be an average of the opposing players rating.
 * @param rating Player rating.
 * @param opponentRating The rating of the opposing player(s).
 * @returns {number} Expected score.
 */
var calculateExpectedScore = function (rating, opponentRating) {
    return 1.0 / (1.0 + Math.pow(10.0, (opponentRating - rating) / 400.0));
};

/**
 * Calculates the new rating for the player based on the old rating, the game score, the expected game score
 * and the k-factor.
 * @param rating Player's old rating.
 * @param score Game score (WIN = 1.0, DRAW = 0.5, LOSS = 0.0).
 * @param expectedScore Expected game score (based on participant ratings).
 * @param kFactor K-factor.
 * @returns {number} Player's new rating.
 */
var calculateNewRating = function (rating, score, expectedScore, kFactor) {
    return rating + parseInt(roundWithSign(kFactor * (score - expectedScore)), 10);
};

var calcGameScore = function (game) {
    game.winnerScore = ((game.winnerGoals - game.loserGoals) + 10) / 20;
    game.loserScore = ((game.loserGoals - game.winnerGoals ) + 10) / 20;
};

var roundWithSign = function (value) {
    var rounded = Math.ceil(Math.abs(value));
    return value >= 0 ? rounded : -rounded;
};

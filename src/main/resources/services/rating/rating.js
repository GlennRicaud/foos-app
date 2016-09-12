var contentLib = require('/lib/xp/content');
var foosRetrievalLib = require('/lib/foos-retrieval');

var INITIAL_RATING = 1500;
var K_FACTOR = 40;

exports.get = function () {
    var players = {};
    var playerIdToName = {};
    var games = [];

    foosRetrievalLib.getPlayers().forEach(function (player) {
        var p = {
            'name': player._name,
            'rating': INITIAL_RATING,
            'ranking': 0
        };
        players[p.name] = p;
        playerIdToName[player._id] = player._name;
    });


    getGamesSorted().forEach(function (game) {
        var g = {
            'date': game.data.date,
            'winners': [].concat(game.data.winners),
            'losers': [].concat(game.data.losers)
        };

        g.winners.forEach(function (p) {
            p.playerId = playerIdToName[p.playerId];
            p.rating = 0;
        });
        g.losers.forEach(function (p) {
            p.playerId = playerIdToName[p.playerId];
            p.rating = 0;
        });

        games.push(g);
    });

    games.forEach(function (game) {
        calcResultGame(game, players)
    });


    printPlayerRatings(players);

    return {
        contentType: 'application/json',
        body: JSON.stringify(games)
    }
};

var printPlayerRatings = function (players) {
    var playerList = [];
    for (var name in players) {
        playerList.push(players[name]);
    }
    playerList.sort(function (p1, p2) {
        return p2.rating - p1.rating;
    });

    log.info('----------------------------------------');
    log.info('  PLAYER    RATING    RANKING');
    log.info('----------------------------------------');
    playerList.forEach(function (p, i) {
        p.ranking = i + 1;
        log.info("  " + pad(p.name, 6) + "    " + pad(p.rating, 6) + "    " + pad(p.ranking, 7));
    });
};

var calcResultGame = function (game, players) {
    if (game.winners.length == 1) {
        game.winnerGoals = game.winners[0].score + (game.losers[0].against || 0);
    } else {
        game.winnerGoals = game.winners[0].score + game.winners[1].score + (game.losers[0].against || 0) + (game.losers[1].against || 0);
    }
    if (game.losers.length == 1) {
        game.loserGoals = game.losers[0].score + (game.winners[0].against || 0);
    } else {
        game.loserGoals = game.losers[0].score + game.losers[1].score + (game.winners[0].against || 0) + (game.winners[1].against || 0);
    }

    calcGameScore(game);
    calcGameTeamRatings(game, players);

};

var calcGameTeamRatings = function (game, players) {
    if (game.winners.length === 2) {
        calcGameTeamRatings2p(game, players);
    } else {
        calcGameTeamRatings1p(game, players);
    }
};

var calcGameTeamRatings1p = function (game, players) {
    var wRating = players[game.winners[0].playerId].rating;
    var lRating = players[game.losers[0].playerId].rating;

    var newWRating = newRating(wRating, lRating, game.winnerScore);
    var newLRating = newRating(lRating, wRating, game.loserScore);

    var wRatingDiff = newWRating - (wRating);
    var lRatingDiff = newLRating - (lRating);

    players[game.winners[0].playerId].rating += wRatingDiff;
    players[game.losers[0].playerId].rating += lRatingDiff;

    game.winners[0].ratingDiff = wRatingDiff;
    game.losers[0].ratingDiff = lRatingDiff;

    game.expectedResult = scoreToResult(calculateExpectedScore(wRating, lRating));

    log.info("Score=" + game.winnerScore + "; wavgRating=" + wRating + ";lRating=" + lRating +
             "; newWRating=" + newWRating + "; newLRating=" + newLRating);
};

var calcGameTeamRatings2p = function (game, players) {
    var w1Rating = players[game.winners[0].playerId].rating;
    var w2Rating = players[game.winners[1].playerId].rating;
    var l1Rating = players[game.losers[0].playerId].rating;
    var l2Rating = players[game.losers[1].playerId].rating;

    var wAvgRating = (w1Rating + w2Rating) / 2;
    var lAvgRating = (l1Rating + l2Rating) / 2;

    var newWRating = newRating(wAvgRating, lAvgRating, game.winnerScore);
    var newLRating = newRating(lAvgRating, wAvgRating, game.loserScore);

    var wRatingDiff = newWRating - (wAvgRating);
    var lRatingDiff = newLRating - (lAvgRating);

    players[game.winners[0].playerId].rating += wRatingDiff;
    players[game.winners[1].playerId].rating += wRatingDiff;
    players[game.losers[0].playerId].rating += lRatingDiff;
    players[game.losers[1].playerId].rating += lRatingDiff;

    game.winners[0].ratingDiff = wRatingDiff;
    game.winners[1].ratingDiff = wRatingDiff;
    game.losers[0].ratingDiff = lRatingDiff;
    game.losers[1].ratingDiff = lRatingDiff;

    game.expectedResult = scoreToResult(calculateExpectedScore(wAvgRating, lAvgRating));

    log.info("Score=" + game.winnerScore + "; wavgRating=" + wAvgRating + ";lavgRating=" + lAvgRating +
             "; newWRating=" + newWRating + "; newLRating=" + newLRating);
};

// Elo rating calculations, based on https://github.com/crisu83/foosball-android/blob/master/src/org/cniska/foosball/android/EloRatingSystem.java
/**
 * Returns the new rating for the player after winning or losing to the opponent(s) with the given rating.
 * @param rating Player's old rating.
 * @param opponentRating The rating of the opposing player(s).
 * @param score Game score (WIN = 1.0, DRAW = 0.5, LOSS = 0.0).
 * @returns {number} Player's new rating.
 */
var newRating = function (rating, opponentRating, score) {
    var expectedScore = calculateExpectedScore(rating, opponentRating);
    var newR = calculateNewRating(rating, score, expectedScore, K_FACTOR);
    //log.info("Expected score " + expectedScore + " (score=" + score + ")" + " " + rating + " vs " + opponentRating + " => " + newR);
    return newR;
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
    return rating + parseInt(Math.round(kFactor * (score - expectedScore)), 10);
};

var calcGameScore = function (game) {
    game.winnerScore = ((game.winnerGoals - game.loserGoals) + 10) / 20;
    game.loserScore = ((game.loserGoals - game.winnerGoals ) + 10) / 20;
};

var scoreToResult = function (score) {
    var diff = (score * 20) - 10;
    var winnerScore, loserScore;
    if (diff > 0) {
        winnerScore = 10;
        loserScore = 10 - diff;
    } else {
        loserScore = 10;
        winnerScore = 10 - diff;
    }
    return winnerScore + " - " + loserScore;
};

var getGamesSorted = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":game"],
        sort: "data.date ASC, createdTime ASC"
    }).hits;
};

var pad = function (num, size) {
    var s = "          " + num;
    return s.substr(s.length - size);
};
var contentLib = require('/lib/xp/content');
var portalLib = require('/lib/xp/portal');

/*******************************************************
 * URL functions
 *******************************************************/

exports.getFoosSiteUrl = function () {
    return portalLib.pageUrl({
        path: portalLib.getSite()._path
    });
};


/*******************************************************
 * Retrieval functions
 *******************************************************/

exports.getContentByKey = function (id) {
    return contentLib.get({
        key: id
    });
};

exports.getChildrenByParentKey = function (key) {
    return contentLib.getChildren({
        key: key,
        count: -1
    }).hits;
};

exports.getPlayers = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":player"],
        sort: "displayName ASC"
    }).hits;
};

exports.getTeams = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":team"],
        sort: "displayName ASC"
    }).hits;
};

exports.getTeamByPlayerIds = function (playerIds, createDummy) {
    var team = contentLib.query({
        start: 0,
        count: 1,
        query: "data.playerIds = '" + playerIds[0] + "' AND data.playerIds = '" + playerIds[1] + "'",
        contentTypes: [app.name + ":team"],
        sort: "displayName ASC"
    }).hits[0];

    if (!team && createDummy) {
        var player1DisplayName = exports.getContentByKey(playerIds[0]).displayName;
        var player2DisplayName = exports.getContentByKey(playerIds[1]).displayName;
        team = {
            displayName: "Team " + player1DisplayName + player2DisplayName
        }
    }

    return team;
};

exports.getLatestModificationTime = function () {
    return contentLib.query({
        start: 0,
        count: 1,
        sort: "modifiedTime DESC"
    }).hits[0].modifiedTime;
}

exports.getLatestWeek = function () {
    return contentLib.query({
        start: 0,
        count: 1,
        contentTypes: [app.name + ":week"],
        sort: "data.start DESC"
    }).hits[0];
};

exports.getWeeks = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":week"],
        sort: "data.start DESC"
    }).hits;
};

exports.getWeekCount = function () {
    return contentLib.query({
        start: 0,
        count: 0,
        contentTypes: [app.name + ":week"]
    }).total;
};

exports.getGames = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":game"],
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesByWeekPath = function (weekPath) {
    return contentLib.getChildren({
        key: weekPath,
        count: -1,
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesByPlayerId = function (playerId) {
    return contentLib.query({
        start: 0,
        count: -1,
        query: "data.winners.playerId = '" + playerId + "' OR data.losers.playerId = '" + playerId + "'",
        contentTypes: [app.name + ":game"],
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesByTeam = function (team, won) {
    var winnersQuery = "data.winners.playerId = '" + team.data.playerIds[0] + "' AND data.winners.playerId = '" + team.data.playerIds[1] +
                       "'";
    var losersQuery = "data.losers.playerId = '" + team.data.playerIds[0] + "' AND data.losers.playerId = '" + team.data.playerIds[1] + "'";

    var query;
    if (won == undefined) {
        query = "(" + winnersQuery + ") OR (" + losersQuery + ")";
    } else {
        if (won) {
            query = winnersQuery;
        } else {
            query = losersQuery;
        }
    }

    return contentLib.query({
        start: 0,
        count: -1,
        query: query,
        contentTypes: [app.name + ":game"],
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getTeamGames = function () {
    return exports.getGames().filter(function (game) {
        return game.data.winners.length > 1;
    });
};

exports.getTeamGamesBetween = function (start, end) {
    return exports.getTeamGames().filter(function (game) {
        return game.data.date.localeCompare(start) >= 0 && game.data.date.localeCompare(end) <= 0;
    });
};

/*******************************************************
 * Generation functions
 *******************************************************/

exports.generatePageUrl = function (contents) {
    var contentArray = exports.toArray(contents);
    contentArray.forEach(function (content) {
        content.gen = content.gen || {};
        content.gen.pageUrl = portalLib.pageUrl({
            path: content._path
        });
    });
}

exports.generatePictureUrl = function (content, size) {
    size = size || 60;
    if (content.data.picture) {
        content.gen = content.gen || {};
        content.gen.pictureUrl = portalLib.imageUrl({
            id: content.data.picture,
            scale: 'square(' + size + ')',
            filter: 'rounded(' + (size / 2).toFixed(0) + ');sharpen()'
        });
    }
};

exports.generatePlayerStats = function (player) {
    var games = exports.getGamesByPlayerId(player._id);

    player.gen = player.gen || {};
    player.gen.nbGames = 0;
    player.gen.nbGamesWon = 0;
    player.gen.nbGoalsScored = 0;
    player.gen.nbGoalsScoredSolo = 0;
    player.gen.nbGoalsScoredTeam = 0;
    player.gen.nbGoalsAgainst = 0;
    player.gen.nbGamesSolo = 0;
    player.gen.nbGamesWonSolo = 0;
    player.gen.nbGamesTeam = 0;
    player.gen.nbGamesWonTeam = 0;
    player.gen.nbAllGoalsSolo = 0;
    player.gen.nbAllGoalsTeam = 0;

    games.forEach(function (game) {
        var nbAllGoalsForCurrentGame = 0;
        var currentGamePlayed = false;
        var winnersResults = exports.toArray(game.data.winners);
        winnersResults.forEach(function (playerResult) {
            if (playerResult.playerId == player._id) {
                player.gen.nbGames++;
                player.gen.nbGamesWon++;
                currentGamePlayed = true;
                player.gen.nbGoalsScored += playerResult.score;

                player.gen.nbGoalsAgainst += playerResult.against || 0;

                if (winnersResults.length == 1) {
                    player.gen.nbGamesSolo++;
                    player.gen.nbGoalsScoredSolo += playerResult.score;
                    player.gen.nbGamesWonSolo++;
                } else if (winnersResults.length == 2) {
                    player.gen.nbGamesTeam++;
                    player.gen.nbGoalsScoredTeam += playerResult.score;
                    player.gen.nbGamesWonTeam++;
                }
            }
            nbAllGoalsForCurrentGame += playerResult.score;
        });

        var losersResults = exports.toArray(game.data.losers);
        losersResults.forEach(function (playerResult) {
            if (playerResult.playerId == player._id) {
                player.gen.nbGames++;
                currentGamePlayed = true;
                player.gen.nbGoalsScored += playerResult.score;

                player.gen.nbGoalsAgainst += playerResult.against || 0;

                if (losersResults.length == 1) {
                    player.gen.nbGamesSolo++;
                    player.gen.nbGoalsScoredSolo += playerResult.score;
                } else if (losersResults.length == 2) {
                    player.gen.nbGamesTeam++;
                    player.gen.nbGoalsScoredTeam += playerResult.score;
                }
            }
            nbAllGoalsForCurrentGame += playerResult.score;
        });

        if (currentGamePlayed) {
            if (winnersResults.length == 1) {
                player.gen.nbAllGoalsSolo += nbAllGoalsForCurrentGame;
            } else {
                player.gen.nbAllGoalsTeam += nbAllGoalsForCurrentGame;
            }
        }
    });

    player.gen.anySolo = player.gen.nbGamesSolo > 0;
    player.gen.anyTeam = player.gen.nbGamesTeam > 0;

    player.gen.ratioGamesWon = exports.toPercentageRatio(player.gen.nbGamesWon, player.gen.nbGames);
    player.gen.ratioGamesWonSolo = exports.toPercentageRatio(player.gen.nbGamesWonSolo, player.gen.nbGamesSolo);
    player.gen.ratioGamesWonTeam = exports.toPercentageRatio(player.gen.nbGamesWonTeam, player.gen.nbGamesTeam);
    player.gen.ratioGamesSolo = exports.toPercentageRatio(player.gen.nbGamesSolo, player.gen.nbGames);
    player.gen.ratioGoalsAgainst = exports.toPercentageRatio(player.gen.nbGoalsAgainst, player.gen.nbGoalsScored);
    player.gen.ratioGoalsScoredSolo = exports.toPercentageRatio(player.gen.nbGoalsScoredSolo, player.gen.nbAllGoalsSolo);
    player.gen.ratioGoalsScoredTeam = exports.toPercentageRatio(player.gen.nbGoalsScoredTeam, player.gen.nbAllGoalsTeam);
}

exports.generateTeamStats = function (team) {
    var nbGamesWon = exports.getGamesByTeam(team, true).length;
    var nbGamesLost = exports.getGamesByTeam(team, false).length;
    var nbGames = nbGamesWon + nbGamesLost;
    team.gen = team.gen || {};
    team.gen.nbGamesWon = nbGamesWon;
    team.gen.nbGames = nbGames;
    team.gen.ratioGamesWon = exports.toPercentageRatio(nbGamesWon, nbGames);
}

exports.generateGameBasicStats = function (game) {
    game.gen = game.gen || {};
    game.gen.score = {
        winners: 0,
        losers: 0
    };

    var winnerResults = exports.toArray(game.data.winners);
    winnerResults.forEach(function (playerResult) {
        game.gen.score.winners += playerResult.score;
        if (playerResult.against) {
            game.gen.score.losers += playerResult.against;
        }
    });

    var loserResults = exports.toArray(game.data.losers);
    loserResults.forEach(function (playerResult) {
        game.gen.score.losers += playerResult.score;
        if (playerResult.against) {
            game.gen.score.winners += playerResult.against;
        }
    });
}

exports.generateGameStats = function (game) {
    exports.generateGameBasicStats(game);

    function doGenerateGameStats(playerResult) {
        var playerContent = contentLib.get({
            key: playerResult.playerId
        });

        playerResult.gen = {};
        playerResult.gen.name = playerContent.displayName;
        exports.generatePictureUrl(playerContent);
        exports.generatePageUrl(playerContent);
        playerResult.gen.pictureUrl = playerContent.gen.pictureUrl;
        playerResult.gen.pageUrl = playerContent.gen.pageUrl;
    }

    exports.toArray(game.data.winners).forEach(doGenerateGameStats);
    exports.toArray(game.data.losers).forEach(doGenerateGameStats);
}


exports.generateGameComments = function (game) {
    game.gen = game.gen || {};

    game.gen.comments = exports.getChildrenByParentKey(game._id);
    game.gen.comments.forEach(function (comment) {
        var player = exports.getContentByKey(comment.data.authorId);
        comment.gen = {
            authorName: player.displayName
        };
    });
}

/*******************************************************
 * Generic functions
 *******************************************************/

exports.toArray = function (object) {
    if (!object) {
        return [];
    }
    if (object.constructor === Array) {
        return object;
    }
    return [object];
}

exports.concat = function (object1, object2) {
    return exports.toArray(object1).concat(exports.toArray(object2));
}

exports.toPercentageRatio = function (numerator, denominator) {
    return Math.floor(numerator * 100 / (denominator > 0 ? denominator : 1))
}

/*******************************************************
 * Perf functions
 *******************************************************/
var chrono = {};

exports.startChrono = function (topic) {
    chrono[topic] = new Date().getTime();
}
exports.stopChrono = function (topic) {
    var time = new Date().getTime() - chrono[topic];
    log.info(topic + ": " + time + "ms");
}

exports.log = function (message, object) {
    log.info(message + (object ? ": " + JSON.stringify(object, null, 2) : ""));
}


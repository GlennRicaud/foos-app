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


exports.getPlayersByGame = function (game, winners) {

    var playerResults;
    if (winners == undefined) {
        playerResults = exports.concat(game.data.winners, game.data.losers);
    } else if (winners) {
        playerResults = exports.toArray(game.data.winners);
    } else {
        playerResults = exports.toArray(game.data.losers);
    }

    return playerResults.map(function (playerResult) {
        return exports.getContentByKey(playerResult.playerId);
    });
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

exports.getTeamByGame = function (game, winning, createDummy) {
    var playerResults = winning ? game.data.winners : game.data.losers;
    var playerIds = playerResults.map(function (playerResult) {
        return playerResult.playerId
    });
    return exports.getTeamByPlayerIds(playerIds, createDummy);
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

    var stats = {
        nbGames: {
            name: "# games",
            solo: 0,
            team: 0
        },
        nbWonGames: {
            name: "# won games",
            solo: 0,
            team: 0
        },
        nbGamesWithExtraTime: {
            name: "# games with extra time",
            solo: 0,
            team: 0
        },
        nbWonGamesWithExtraTime: {
            name: "# won games with extra time",
            solo: 0,
            team: 0
        },
        nbPlayerGoals: {
            name: "# player goals",
            solo: 0,
            team: 0
        },
        nbPlayersGoalsAgainst: {
            name: "# player goals against",
            solo: 0,
            team: 0
        },
        nbTeamGoals: {
            name: "# team goals",
            solo: 0,
            team: 0
        },
        nbTeamPoints: {
            name: "# team points",
            solo: 0,
            team: 0
        },
        nbOpponentGoals: {
            name: "# opponent goals",
            solo: 0,
            team: 0
        },
        nbOpponentPoints: {
            name: "# opponent points",
            solo: 0,
            team: 0
        }
    };

    games.forEach(function (game) {
            var playerResult = exports.getPlayerResult(game, player._id);
            var isWinner = exports.isWinner(game, player._id);
            var isTeamGame = exports.isTeamGame(game);
            var attrName = isTeamGame ? "team" : "solo";
            var teamGoals = exports.getGoals(game, isWinner);
            var teamPoints = exports.getScore(game, isWinner);
            var opponentGoals = exports.getGoals(game, !isWinner);
            var opponentPoints = exports.getScore(game, !isWinner);
            var maxScore = exports.getScore(game, true);
            var isExtraTime = maxScore > 10;

            stats.nbGames[attrName]++;
            if (isWinner) {
                stats.nbWonGames[attrName]++;
            }
            if (isExtraTime) {
                stats.nbGamesWithExtraTime[attrName]++;
            }
            if (isWinner && isExtraTime) {
                stats.nbWonGamesWithExtraTime[attrName]++;
            }
            stats.nbPlayerGoals[attrName] += playerResult.score;
            stats.nbPlayersGoalsAgainst[attrName] += playerResult.against ? playerResult.against : 0;
            stats.nbTeamGoals[attrName] += teamGoals;
            stats.nbTeamPoints[attrName] += teamPoints;
            stats.nbOpponentGoals[attrName] += opponentGoals;
            stats.nbOpponentPoints[attrName] += opponentPoints;
        }
    );

    player.stats = [];
    var even = false;
    for (var statName in stats) {
        var stat = stats[statName];
        stat.total = stat.solo == "N/A" ? "N/A" : (stat.solo + stat.team);
        for (var subStatName in stat) {
            var subStat = stat[subStatName];
            if (!isNaN(subStat)) {
                stat[subStatName] = subStat.toFixed(0);
            }
        }
        stat.even = even;
        even = !even;

        player.stats.push(stat);
    }
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
 * Misc functions
 *******************************************************/

exports.isTeamGame = function (game) {
    return game.data.winners.length == 2;
}

exports.isWinner = function (game, playerId) {
    if (exports.isTeamGame(game)) {
        return game.data.winners.map(function (playerResult) {
                return playerResult.playerId;
            }).indexOf(playerId) > -1;
    }
    return game.data.winners.playerId == playerId;
}

exports.getPlayerResult = function (game, playerId) {
    return exports.concat(game.data.winners, game.data.losers).filter(function (playerResult) {
        return playerResult.playerId == playerId;
    })[0];
}

exports.getGoals = function (game, won) {
    var score = 0;
    var teamResults = won ? game.data.winners : game.data.losers;
    exports.toArray(teamResults).forEach(function (playerResult) {
        score += playerResult.score;
    });
    return score;
}

exports.getScore = function (game, won) {
    var score = exports.getGoals(game, won);
    var teamResults = won ? game.data.losers : game.data.winners;
    exports.toArray(teamResults).forEach(function (playerResult) {
        if (playerResult.against) {
            score += playerResult.against;
        }
    });
    return score;
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


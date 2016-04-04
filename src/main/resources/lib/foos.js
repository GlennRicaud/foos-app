var contentLib = require('/lib/xp/content');
var portalLib = require('/lib/xp/portal');

/*******************************************************
 * Global variables
 *******************************************************/

var foosSitePath = '/foos';
var foosPlayersPath = foosSitePath + '/players';
var foosTeamsPath = foosSitePath + '/teams';
var foosGamesPath = foosSitePath + '/games';


/*******************************************************
 * Retrieval functions
 *******************************************************/

exports.getFoosSiteUrl = function () {
    return portalLib.pageUrl({
        path: foosSitePath
    });
};

exports.getContentByKey = function (id) {
    return contentLib.get({
        key: id
    });
};

exports.getContentByKey = function (id) {
    return contentLib.get({
        key: id
    });
};

exports.getPlayers = function () {
    return contentLib.getChildren({
        key: foosPlayersPath,
        count: -1
    }).hits;
};

exports.getTeams = function () {
    return contentLib.getChildren({
        key: foosTeamsPath,
        count: -1
    }).hits;
};

exports.getTeamByPlayerIds = function (playerIds) {
    var teams = exports.getTeams().filter(function (team) {
        return (team.data.playerIds.indexOf(playerIds[0]) != -1) && (team.data.playerIds.indexOf(playerIds[1]) != -1);
    });
    return teams[0];
};

exports.getWeeks = function () {
    return contentLib.getChildren({
        key: foosGamesPath,
        count: -1
    }).hits;
};

exports.getGames = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":game"],
        sort: "displayName DESC"
    }).hits;
};

exports.getGamesByWeekPath = function (weekPath) {
    return contentLib.getChildren({
        key: weekPath,
        count: -1,
        sort: "displayName DESC"
    }).hits;
};

exports.getGamesByPlayerId = function (playerId) {
    return exports.getGames().filter(function (game) {
        var gamePlayer = false;
        game.data.playerResults.forEach(function (playerResult) {
            if (playerResult.playerId == playerId) {
                gamePlayer = true;
            }
        });
        return gamePlayer;
    });
};

exports.getGamesByTeam = function (team, won) {
    return exports.getGames().filter(function (game) {
        var nbWinnerTeamPlayers = 0;
        var nbLoserTeamPlayers = 0;
        game.data.playerResults.forEach(function (playerResult) {
            if (playerResult.playerId == team.data.playerIds[0] || playerResult.playerId == team.data.playerIds[1]) {
                if (playerResult.winner) {
                    nbWinnerTeamPlayers++;
                } else {
                    nbLoserTeamPlayers++;
                }
            }
        });

        if (won == undefined) {
            return nbWinnerTeamPlayers == 2 || nbLoserTeamPlayers == 2;
        } else {
            if (won) {
                return nbWinnerTeamPlayers == 2;
            } else {
                return nbLoserTeamPlayers == 2;
            }
        }
    });
};

exports.getTeamGames = function () {
    return exports.getGames().filter(function (game) {
        return game.data.playerResults.length == 4;
    });
};

exports.getTeamGamesBetween = function (start, end) {
    return exports.getTeamGames().filter(function (game) {
        log.info(" game.data.date:" + game.data.date);
        log.info(" start:" + start);
        log.info(" end:" + end);
        log.info(" game.data.date.localeCompare(start) >= 0:" + game.data.date.localeCompare(start) >= 0);
        log.info(" game.data.date.localeCompare(end):" + game.data.date.localeCompare(end));

        return game.data.date.localeCompare(start) >= 0 && game.data.date.localeCompare(end) < 0;
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

exports.generatePictureUrl = function (content) {
    if (content.data.picture) {
        content.gen = content.gen || {};
        content.gen.pictureUrl = portalLib.imageUrl({
            id: content.data.picture,
            scale: 'square(60)',
            filter: 'rounded(30);sharpen()'
        });
    }
};

exports.generatePlayerStats = function (player) {
    var games = exports.getGames();

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
        var currentGamePlayed = false
        var playerResults = exports.toArray(game.data.playerResults);
        playerResults.forEach(function (playerResult) {
            if (playerResult.playerId == player._id) {
                player.gen.nbGames++;
                currentGamePlayed = true;
                player.gen.nbGoalsScored += playerResult.score;
                player.gen.nbGoalsAgainst += playerResult.against || 0;

                if (playerResult.winner) {
                    player.gen.nbGamesWon++;
                }

                if (playerResults.length == 2) {
                    player.gen.nbGamesSolo++;
                    player.gen.nbGoalsScoredSolo += playerResult.score;
                    if (playerResult.winner) {
                        player.gen.nbGamesWonSolo++;
                    }
                } else if (playerResults.length == 4) {
                    player.gen.nbGamesTeam++;
                    player.gen.nbGoalsScoredTeam += playerResult.score;
                    if (playerResult.winner) {
                        player.gen.nbGamesWonTeam++;
                    }
                }
            }
            nbAllGoalsForCurrentGame += playerResult.score;
        });

        if (currentGamePlayed) {
            if (playerResults.length == 2) {
                player.gen.nbAllGoalsSolo += nbAllGoalsForCurrentGame;
            } else if (playerResults.length == 4) {
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

exports.generateGameStats = function (game) {
    game.gen = game.gen || {};
    game.gen.score = {
        winners: 0,
        losers: 0
    };

    var playerResults = exports.toArray(game.data.playerResults);
    playerResults.forEach(function (playerResult) {
        var playerContent = contentLib.get({
            key: playerResult.playerId
        });

        playerResult.gen = {};
        playerResult.gen.name = playerContent.displayName;
        exports.generatePictureUrl(playerContent);
        exports.generatePageUrl(playerContent);
        playerResult.gen.pictureUrl = playerContent.gen.pictureUrl;
        playerResult.gen.pageUrl = playerContent.gen.pageUrl;

        if (playerResult.winner) {
            game.gen.score.winners += playerResult.score;
            if (playerResult.against) {
                game.gen.score.losers += playerResult.against;
            }
        } else {
            game.gen.score.losers += playerResult.score;
            if (playerResult.against) {
                game.gen.score.winners += playerResult.against;
            }
        }
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

exports.toPercentageRatio = function (numerator, denominator) {
    return Math.floor(numerator * 100 / (denominator > 0 ? denominator : 1))
}



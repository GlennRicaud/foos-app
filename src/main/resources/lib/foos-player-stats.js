var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');
var foosRetrievalLib = require('/lib/foos-retrieval');

exports.generatePlayerStats = function (player) {
    var playerStatsContent = foosRetrievalLib.getContentByKey(player._path + '/stats');
    if (!playerStatsContent || playerStatsContent.modifiedTime < foosRetrievalLib.getLatestGameModificationTime()) {
        var playerStats = doGeneratePlayerStats(player);

        var storePlayerStatsFunction;
        if (playerStatsContent) {
            storePlayerStatsFunction = function () {
                return contentLib.modify({
                    key: playerStatsContent._id,
                    editor: function (c) {
                        c.data = playerStats
                    }
                });
            }
        } else {
            storePlayerStatsFunction = function () {
                return contentLib.create({
                    parentPath: player._path,
                    displayName: "Stats",
                    contentType: 'base:unstructured',
                    data: playerStats
                });
            }
        }

        contextLib.run({
                user: {
                    login: 'su',
                    userStore: 'system'
                }
            },
            storePlayerStatsFunction);

        return playerStats;
    }

    return playerStatsContent.data;
};

function doGeneratePlayerStats(player) {
    log.info("goGeneratePlayerStats");
    var games = foosRetrievalLib.getGamesByPlayerId(player._id);

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
        },
        nbStatGames: {
            name: "# games with temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbAttackerGames: {
            name: "# games as attacker (2nd half & extra time)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderGames: {
            name: "# games as defender (2nd half & extra time)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbStatGoals: {
            name: "# player goals with temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbFirstBloods: {
            name: "# first bloods",
            solo: 0,
            team: 0
        },
        nbFinalGoals: {
            name: "# final shot",
            solo: 0,
            team: 0
        },
        nbQuickGoals: {
            name: "# quick goals (< 10s)",
            solo: 0,
            team: 0
        },
        nbFirstHalfGoals: {
            name: "# first half goals",
            solo: 0,
            team: 0
        },
        nbSecondHalfGoals: {
            name: "# second half goals",
            solo: 0,
            team: 0
        },
        nbExtraTimeGoals: {
            name: "# extra time goals",
            solo: 0,
            team: 0
        },
        nbAttackerGoals: {
            name: "# player goals as attacker",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderGoals: {
            name: "# player goals as defender",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        avgDeltaTimeGoals: {
            name: "Avg. time to score",
            solo: 0,
            team: 0,
            total: 0
        },
        nbStatOpponentGoals: {
            name: "# opponent goals with temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbAttackerOpponentGoals: {
            name: "# opponent goals as attacker",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderOpponentGoals: {
            name: "# opponent goals as defender",
            solo: "N/A",
            team: 0,
            total: "N/A"
        }
    };

    var privateStats = {
        sumTimeStatGoals: {
            solo: 0,
            team: 0,
            total: 0
        }
    };

    games.forEach(function (game) {
        var playerResult = foosUtilLib.getPlayerResult(game, player._id);
        var isWinner = foosUtilLib.isWinner(game, player._id);
        var isTeamGame = foosUtilLib.isTeamGame(game);
        var attrName = isTeamGame ? "team" : "solo";
        var teamGoals = foosUtilLib.getGoals(game, isWinner);
        var teamPoints = foosUtilLib.getScore(game, isWinner);
        var opponentGoals = foosUtilLib.getGoals(game, !isWinner);
        var opponentPoints = foosUtilLib.getScore(game, !isWinner);
        var maxScore = foosUtilLib.getScore(game, true);
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


        var goals = game.data.goals;
        if (goals) {
            stats.nbStatGames[attrName]++;

            var firstBlood = goals[0].playerId == player._id;
            var lastShot = goals[goals.length - 1].playerId == player._id;


            if (firstBlood) {
                stats.nbFirstBloods[attrName]++;
            }
            if (lastShot) {
                stats.nbFinalGoals[attrName]++;
            }

            var startAsDefender = false;
            if (isTeamGame) {
                startAsDefender = game.data.winners[0].playerId == player._id || game.data.losers[0].playerId == player._id;
                if (startAsDefender) {
                    stats.nbAttackerGames.team++;
                } else {
                    stats.nbDefenderGames.team++;
                }
            }

            var previousGoalTime = 0;
            var winnersScore = 0;
            var losersScore = 0;
            goals.forEach(function (goal) {
                if (!goal.against) {

                    var isWinnerGoal = foosUtilLib.isWinner(game, goal.playerId);
                    if (isWinnerGoal) {
                        winnersScore++;
                    } else {
                        losersScore++;
                    }

                    var extraTime = winnersScore > 10 || losersScore > 10;
                    var afterHalfTime = winnersScore > 5 || losersScore > 5;
                    var deltaTime = goal.time - previousGoalTime;

                    var isAttacker = isTeamGame && ((afterHalfTime && startAsDefender) || (!afterHalfTime && !startAsDefender));
                    var isDefender = isTeamGame && ((afterHalfTime && !startAsDefender) || (!afterHalfTime && startAsDefender));
                    var isScoring = goal.playerId == player._id;
                    var isLosingGoal = (isWinnerGoal && !isWinner) || (!isWinnerGoal && isWinner);

                    if (isScoring) {

                        stats.nbStatGoals[attrName]++;

                        if (deltaTime < 10) {
                            stats.nbQuickGoals[attrName]++;
                        }
                        privateStats.sumTimeStatGoals[attrName] += deltaTime;
                        privateStats.sumTimeStatGoals.total += deltaTime;

                        var nbPeriodGoalsStat;
                        if (extraTime) {
                            nbPeriodGoalsStat = stats.nbExtraTimeGoals;
                        } else if (afterHalfTime) {
                            nbPeriodGoalsStat = stats.nbSecondHalfGoals;
                        } else {
                            nbPeriodGoalsStat = stats.nbFirstHalfGoals;
                        }
                        nbPeriodGoalsStat[attrName]++;

                        if (isAttacker) {
                            stats.nbAttackerGoals.team++;
                        } else if (isDefender) {
                            stats.nbDefenderGoals.team++;
                        }


                    } else if (isLosingGoal) {

                        stats.nbStatOpponentGoals[attrName]++;

                        if (isAttacker) {
                            stats.nbAttackerOpponentGoals.team++;
                        } else if (isDefender) {
                            stats.nbDefenderOpponentGoals.team++;
                        }
                    }
                    previousGoalTime = goal.time;
                }
            });
        }
    });

    //Computes the sum for each
    for (var statName in stats) {
        var stat = stats[statName];
        if (!stat.total) {
            stat.total = stat.solo + stat.team;
        }
    }

    ["solo", "team", "total"].forEach(function (attrName) {
        stats.avgDeltaTimeGoals[attrName] =
            stats.nbStatGoals[attrName] == 0 ? "N/A" : (privateStats.sumTimeStatGoals[attrName] / stats.nbStatGoals[attrName]);
    });


    return stats;
};

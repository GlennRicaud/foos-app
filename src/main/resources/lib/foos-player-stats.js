var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');

var applicationDeploymentTime = new Date().toISOString();


exports.generatePlayerStats = function (player) {

    var playerStatsFolder = foosRetrievalLib.getPlayerStatsFolder();
    var playerStatsContent = foosRetrievalLib.getContentByKey(playerStatsFolder._path + '/' + player._name);

    var latestGameModificationTime = foosRetrievalLib.getLatestGameModificationTime();
    var time = applicationDeploymentTime > latestGameModificationTime ? applicationDeploymentTime : latestGameModificationTime;

    if (!playerStatsContent || (playerStatsContent.modifiedTime < time)) {
        var playerStats = doGeneratePlayerStats(player);

        var storePlayerStatsFunction;
        if (playerStatsContent) {
            storePlayerStatsFunction = function () {
                return contentLib.modify({
                    key: playerStatsContent._id,
                    editor: function (c) {
                        c.data.time = time;
                        c.data.stats = playerStats;

                        return c;
                    }
                });
            }
        } else {
            storePlayerStatsFunction = function () {
                return contentLib.create({
                    parentPath: playerStatsFolder._path,
                    displayName: player._name,
                    contentType: 'base:unstructured',
                    data: {
                        stats: playerStats,
                        time: time
                    }
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

    return playerStatsContent.data.stats;
};

function doGeneratePlayerStats(player) {
    var games = foosRetrievalLib.getGamesByPlayerId(player._id);

    var stats = {
        nbGames: {
            name: "# Games",
            solo: 0,
            team: 0
        },
        nbWonGames: {
            name: "# Won games",
            solo: 0,
            team: 0
        },
        ratioWonGames: {
            name: "% Won games",
            solo: 0,
            team: 0
        },
        nbGamesWithExtraTime: {
            name: "# Games w/ extra time",
            solo: 0,
            team: 0
        },
        nbWonGamesWithExtraTime: {
            name: "# Won games w/ extra time",
            solo: 0,
            team: 0
        },
        ratioWonGamesWithExtraTime: {
            name: "% Won games w/ extra time",
            solo: 0,
            team: 0
        },
        nbPlayerGoals: {
            name: "# Player goals",
            solo: 0,
            team: 0
        },
        ratioPlayerGoals: {
            name: "# Player goals / game",
            solo: 0,
            team: 0
        },
        nbPlayersGoalsAgainst: {
            name: "# Player goals against",
            solo: 0,
            team: 0
        },
        nbTeamGoals: {
            name: "# Team goals",
            solo: 0,
            team: 0
        },
        nbTeamPoints: {
            name: "# Team points",
            solo: 0,
            team: 0
        },
        nbOpponentGoals: {
            name: "# Opponent goals",
            solo: 0,
            team: 0
        },
        nbOpponentPoints: {
            name: "# Opponent points",
            solo: 0,
            team: 0
        },
        nbStatGames: {
            name: "# Games with temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbAttackerGames: {
            name: "# Games as attacker (2nd half & extra time)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderGames: {
            name: "# Games as defender (2nd half & extra time)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbStatGoals: {
            name: "# Player goals w/ temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbAttackerGoals: {
            name: "# Player goals as attacker",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderGoals: {
            name: "# Player goals as defender",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbFirstBloods: {
            name: "# First bloods",
            solo: 0,
            team: 0
        },
        nbFinalGoals: {
            name: "# Final shot",
            solo: 0,
            team: 0
        },
        nbQuickGoals: {
            name: "# Quick goals (< 10s)",
            solo: 0,
            team: 0
        },
        nbFirstHalfGoals: {
            name: "# First half goals",
            solo: 0,
            team: 0
        },
        nbSecondHalfGoals: {
            name: "# Second half goals",
            solo: 0,
            team: 0
        },
        nbExtraTimeGoals: {
            name: "# Extra time goals",
            solo: 0,
            team: 0
        },
        avgDeltaTimeGoals: {
            name: "Avg. time to score",
            solo: 0,
            team: 0,
            total: 0
        },
        nbStatOpponentGoals: {
            name: "# Opponent goals w/ temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbAttackerOpponentGoals: {
            name: "# Opponent goals w/ you as attacker",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderOpponentGoals: {
            name: "# Opponent goals w/ you as defender",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbStatTeammateGoals: {
            name: "# Teammate goals w/ temporal stats (used for below stats)",
            solo: 0,
            team: 0
        },
        nbAttackerTeammateGoals: {
            name: "# Teammate goals w/ you as attacker",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        nbDefenderTeammateGoals: {
            name: "# Teammate goals w/ you as defender",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        defenderDividend: {
            name: "The defender dividend (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        attackerDividend: {
            name: "The attacker dividend (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        goalKeepingScore: {
            name: "Goalkeeping score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        midfieldBlockingScore: {
            name: "Midfield blocking score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        defenseScore: {
            name: "Defense score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        longshotsScore: {
            name: "Longshots score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        strikerScore: {
            name: "Striker score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        attackScore: {
            name: "Attack score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        score: {
            name: "Score (Explanations coming...)",
            solo: "N/A",
            team: 0,
            total: "N/A"
        },
        supportScore: {
            name: "Support score (Explanations coming...)",
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
                var isWinnerGoal = foosUtilLib.isWinner(game, goal.playerId);
                if (!goal.against) {

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
                    } else {
                        stats.nbStatTeammateGoals[attrName]++;
                        if (isAttacker) {
                            stats.nbAttackerTeammateGoals.team++;
                        } else if (isDefender) {
                            stats.nbDefenderTeammateGoals.team++;
                        }
                    }
                    previousGoalTime = goal.time;
                } else {
                    if (isWinnerGoal) {
                        losersScore++;
                    } else {
                        winnersScore++;
                    }
                }
            });

            if (isTeamGame) {
                stats.attackerDividend.team += startAsDefender ? (winnersScore - 5) : 5;
                stats.defenderDividend.team += startAsDefender ? 5 : (winnersScore - 5);
            }
        }
    });

    //Scores
    stats.goalKeepingScore.team =
        stats.nbStatGames.team == 0 ? "N/A" : 100 - foosUtilLib.toPercentageRatio(stats.nbDefenderOpponentGoals.team,
            stats.defenderDividend.team);
    stats.midfieldBlockingScore.team = stats.nbStatGames.team == 0 ? "N/A" : 100 -
                                                                             foosUtilLib.toPercentageRatio(stats.nbAttackerOpponentGoals.team,
                                                                                 stats.attackerDividend.team);
    stats.defenseScore.team = stats.nbStatGames.team == 0 ? "N/A" : (stats.goalKeepingScore.team + stats.midfieldBlockingScore.team) / 2;
    stats.longshotsScore.team =
        stats.nbStatGames.team == 0 ? "N/A" : foosUtilLib.toPercentageRatio(stats.nbDefenderGoals.team, stats.defenderDividend.team);
    stats.strikerScore.team =
        stats.nbStatGames.team == 0 ? "N/A" : foosUtilLib.toPercentageRatio(stats.nbAttackerGoals.team, stats.attackerDividend.team);
    stats.attackScore.team = stats.nbStatGames.team == 0 ? "N/A" : (stats.longshotsScore.team + stats.strikerScore.team) / 2;
    stats.score.team = stats.nbStatGames.team == 0 ? "N/A" : (stats.defenseScore.team + stats.attackScore.team) / 2;
    stats.supportScore.team =
        stats.nbStatGames.team == 0 ? "N/A" : foosUtilLib.toPercentageRatio(stats.nbDefenderTeammateGoals.team,
            stats.attackerDividend.team);

    //Computes the sum for each
    for (var statName in stats) {
        var stat = stats[statName];
        if (!stat.total) {
            stat.total = stat.solo + stat.team;
        }
    }

    //Ratios
    ["solo", "team", "total"].forEach(function (attrName) {
        stats.ratioWonGames[attrName] = foosUtilLib.toPercentageRatio(stats.nbWonGames[attrName], stats.nbGames[attrName]);
        stats.ratioWonGamesWithExtraTime[attrName] =
            foosUtilLib.toPercentageRatio(stats.nbWonGamesWithExtraTime[attrName], stats.nbGamesWithExtraTime[attrName]);
        stats.ratioPlayerGoals[attrName] = foosUtilLib.toRatio(stats.nbPlayerGoals[attrName], stats.nbGames[attrName]);
    });

    ["solo", "team", "total"].forEach(function (attrName) {
        stats.avgDeltaTimeGoals[attrName] =
            stats.nbStatGoals[attrName] == 0 ? "N/A" : (privateStats.sumTimeStatGoals[attrName] / stats.nbStatGoals[attrName]);
    });


    return stats;
};

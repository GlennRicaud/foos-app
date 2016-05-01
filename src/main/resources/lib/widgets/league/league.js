var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

var VICTORY_WITHOUT_EXTRA_FACTOR = 3;
var VICTORY_WITH_EXTRA_FACTOR = 2;

// Handle the GET request
exports.render = function (games, nbGamesThreshold) {
    var teams = [];
    var teamsByPlayerIds = {};

    function getTeamByPlayerIds(playerIds) {

        //Gets the cached team
        var team = teamsByPlayerIds[playerIds[0] + "/" + playerIds[1]];

        //If the team is not cached
        if (!team) {
            //Retrieves the team
            team = foosLib.getTeamByPlayerIds(playerIds);

            //If the team does not exist create a dummy team
            if (!team) {
                team = {
                    displayName: "Team " + foosLib.getContentByKey(playerIds[0]).displayName +
                                 foosLib.getContentByKey(playerIds[1]).displayName
                }
            } else {
                foosLib.generatePictureUrl(team, 18);
                foosLib.generatePageUrl(team);
            }

            team.gen = team.gen || {};
            team.gen.nbVictories = 0;
            team.gen.nbVictoriesWithExtra = 0;
            team.gen.nbVictoriesWithoutExtra = 0;
            team.gen.nbDefeats = 0;
            team.gen.nbDefeatsWithExtra = 0;
            team.gen.nbDefeatsWithoutExtra = 0;


            //Caches the team
            teams.push(team);
            teamsByPlayerIds[playerIds[0] + "/" + playerIds[1]] = team;
            teamsByPlayerIds[playerIds[1] + "/" + playerIds[0]] = team;
        }

        return team;
    }

    function getTeamByGame(game, won) {
        var playerIds = won ? game.data.winners.map(function (playerResult) {
            return playerResult.playerId;
        }) : game.data.losers.map(function (playerResult) {
            return playerResult.playerId;
        });
        return getTeamByPlayerIds(playerIds);
    }

    games.forEach(function (game) {
        foosLib.generateGameBasicStats(game);

        var winningTeam = getTeamByGame(game, true);
        winningTeam.gen.nbVictories++;
        if (game.gen.score.winners > 10) {
            winningTeam.gen.nbVictoriesWithExtra++;
        } else {
            winningTeam.gen.nbVictoriesWithoutExtra++;
        }

        var losingTeam = getTeamByGame(game, false);
        losingTeam.gen.nbDefeats++;
        if (game.gen.score.winners > 10) {
            losingTeam.gen.nbDefeatsWithExtra++;
        } else {
            losingTeam.gen.nbDefeatsWithoutExtra++;
        }
    });

    //Computes the score for each team
    teams.forEach(function (team) {
        team.gen.score = (team.gen.nbVictoriesWithoutExtra - team.gen.nbDefeatsWithoutExtra) * VICTORY_WITHOUT_EXTRA_FACTOR +
                         (team.gen.nbVictoriesWithExtra - team.gen.nbDefeatsWithExtra) * VICTORY_WITH_EXTRA_FACTOR;

        team.gen.score = 50 + team.gen.score / (team.gen.nbVictories + team.gen.nbDefeats) * 50 / 3;
    });


    //Keep the filtered teams
    var filteredTeams = teams.filter(function (team) {
        return (team.gen.nbVictories + team.gen.nbDefeats) < nbGamesThreshold;
    });
    filteredTeams.forEach(function (team) {
        team.gen.nbGames = (team.gen.nbVictories + team.gen.nbDefeats);
    });
    filteredTeams = filteredTeams.sort(function (team1, team2) {
        return team2.gen.nbGames - team1.gen.nbGames;
    });


    //Filters the games having not played enough games
    teams = teams.filter(function (team) {
        return (team.gen.nbVictories + team.gen.nbDefeats) >= nbGamesThreshold;
    });
    //Sorts the teams by score
    teams = teams.sort(function (team1, team2) {
        return team2.gen.score - team1.gen.score;
    });

    var rank = 1;
    teams.forEach(function (team) {
        team.gen.evenRow = (rank % 2) == 0;
        team.gen.rank = (rank++).toFixed(0);
        team.gen.score = team.gen.score.toFixed(0);
        team.gen.nbVictories = team.gen.nbVictories.toFixed(0);
        team.gen.nbVictoriesWithoutExtra = team.gen.nbVictoriesWithoutExtra.toFixed(0);
        team.gen.nbVictoriesWithExtra = team.gen.nbVictoriesWithExtra.toFixed(0);
        team.gen.nbDefeats = team.gen.nbDefeats.toFixed(0);
        team.gen.nbDefeatsWithoutExtra = team.gen.nbDefeatsWithoutExtra.toFixed(0);
        team.gen.nbDefeatsWithExtra = team.gen.nbDefeatsWithExtra.toFixed(0);
    });

    filteredTeams.forEach(function (team) {
        team.gen.score = team.gen.score.toFixed(0);
        team.gen.nbGames = team.gen.nbGames.toFixed(0);
    });

    var view = resolve('league.html');
    return mustacheLib.render(view, {
        teams: teams,
        filteredTeams: filteredTeams,
        nbGamesThreshold: nbGamesThreshold.toFixed(0)
    });
};
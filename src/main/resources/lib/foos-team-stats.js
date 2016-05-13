var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');

exports.generateTeamStats = function (team) {
    var nbGamesWon = foosRetrievalLib.getGamesByTeam(team, true).length;
    var nbGamesLost = foosRetrievalLib.getGamesByTeam(team, false).length;
    var nbGames = nbGamesWon + nbGamesLost;
    team.gen = team.gen || {};
    team.gen.nbGamesWon = nbGamesWon;
    team.gen.nbGames = nbGames;
    team.gen.ratioGamesWon = foosUtilLib.toPercentageRatio(nbGamesWon, nbGames);
};
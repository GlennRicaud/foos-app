var mustacheLib = require('/lib/xp/mustache');
var foosTeamStatsLib = require('/lib/foos-team-stats');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');
var foosUtilLib = require('/lib/foos-util');
var gamesWidgetLib = require('/lib/widgets/games/games');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {

    //Retrieves the team
    var team = portalLib.getContent();

    //Generates its stats
    foosTeamStatsLib.generateTeamStats(team);
    team.gen.nbGames = team.gen.nbGames.toFixed(0);
    team.gen.ratioGamesWon = Math.floor(team.gen.ratioGamesWon) + "%";
    foosUrlLib.generatePictureUrl(team, 120);
    team.data.rankingText = team.data.retired ? 'N/A' : foosUtilLib.ordinal(team.data.ranking);
    team.gen.leader = team.data.ranking === 1;

    //Retrieve the team players
    var playersIds = foosUtilLib.toArray(team.data.playerIds);
    var players = playersIds.map(function (playerId) {
        return foosRetrievalLib.getContentByKey(playerId);
    });
    players.forEach(function (player) {
        foosUrlLib.generatePictureUrl(player);
        foosUrlLib.generatePageUrl(player);
    });

    team.gen.rating = (players[0].data.rating + players[1].data.rating).toFixed(0);

    //Retrieves the games played
    var games = foosRetrievalLib.getGamesByTeam(team);

    var view = resolve('team.html');
    var body = mustacheLib.render(view, {
        team: team,
        players: players,
        wonGamesWidget: gamesWidgetLib.render(games, true),
        leaderImage : portalLib.assetUrl({path: "img/trophy.svg"})
    });
    return {
        body: body
    }
};

var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');
var gamesWidgetLib = require('/lib/widgets/games/games');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {

    //Retrieves the team
    var team = portalLib.getContent();

    //Generates its stats
    foosLib.generateTeamStats(team);
    team.gen.nbGames = team.gen.nbGames.toFixed(0);
    team.gen.ratioGamesWon = team.gen.ratioGamesWon.toFixed(0) + "%";

    //Retrieve the team players
    var playersIds = foosLib.toArray(team.data.playerIds);
    var players = playersIds.map(function (playerId) {
        return foosLib.getContentByKey(playerId);
    });
    players.forEach(function (player) {
        foosLib.generatePictureUrl(player);
        foosLib.generatePageUrl(player);
    });

    //Retrieves the games played ordered by date
    var games = foosLib.getGamesByTeam(team).
        sort(function (game1, game2) {
            log.info("game1date" + game1.data.date + (typeof game1.data.date));
            log.info("game2date" + game2.data.date + (typeof game2.data.date));
            return game2.data.date.localeCompare(game1.data.date);
        });

    var view = resolve('team.html');
    var body = mustacheLib.render(view, {
        team: team,
        players: players,
        wonGamesWidget: gamesWidgetLib.render(games)
    });
    return {
        body: body
    }
};

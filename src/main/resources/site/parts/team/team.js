var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {

    //Retrieves the team
    var team = portalLib.getContent();

    //Generates its stats
    //foosLib.generateTeamStats(team);

    //Retrieve the team players
    var playersIds = foosLib.toArray(team.data.playersIds);
    log.info(playersIds.length);
    var players = playersIds.map(function (playerId) {
        return foosLib.getContentByKey(playerId);
    });
    players.forEach(function (player) {
        foosLib.generatePictureUrl(player);
        foosLib.generatePageUrl(player);
    });

    var view = resolve('team.html');
    var body = mustacheLib.render(view, {
        team: team,
        players: players
    });
    return {
        body: body
    }
};

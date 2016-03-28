var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');

exports.get = function (req) {
    var team = portalLib.getContent(); 

    var players = team.data.players;
    players

    var view = resolve('team.html');
    var body = mustacheLib.render(view, {
        team: team
    });
    return {
        body: body
    }
};

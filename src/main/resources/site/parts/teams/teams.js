var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

// Handle the GET request
exports.get = function (req) {
    var teams = foosLib.getTeams();

    teams.forEach(function (team) {
        foosLib.generatePictureUrl(team);
        foosLib.generatePageUrl(team);
    });

    var view = resolve('teams.html');
    var body = mustacheLib.render(view, {
        teams: teams
    });
    return {
        body: body
    }
};
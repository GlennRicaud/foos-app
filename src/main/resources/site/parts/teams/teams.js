var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');

// Handle the GET request
exports.get = function (req) {
    var teams = foosRetrievalLib.getTeams();

    teams.forEach(function (team) {
        foosUrlLib.generatePictureUrl(team);
        foosUrlLib.generatePageUrl(team);
    });

    var view = resolve('teams.html');
    var body = mustacheLib.render(view, {
        teams: teams
    });
    return {
        body: body
    }
};
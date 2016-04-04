var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');
var leagueWidgetLib = require('/lib/widgets/league/league');


// Handle the GET request
exports.get = function (req) {

    var allTimeGames = foosLib.getTeamGames();
    var allTimeLeagueWidget = leagueWidgetLib.render(allTimeGames);


    var view = resolve('league.html');
    var body = mustacheLib.render(view, {
        allTimeLeagueWidget: allTimeLeagueWidget
    });
    return {
        body: body
    }
};
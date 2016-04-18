var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');
var leagueWidgetLib = require('/lib/widgets/league/league');


// Handle the GET request
exports.get = function (req) {
    var weekGames = foosLib.getTeamGamesBetween("2016-04-18", "2016-04-25");
    var weekLeagueWidget = leagueWidgetLib.render(weekGames, 3);

    var aprilGames = foosLib.getTeamGamesBetween("2016-04-01", "2016-05-01");
    var aprilLeagueWidget = leagueWidgetLib.render(aprilGames, 5);

    var yearGames = foosLib.getTeamGames();
    var yearLeagueWidget = leagueWidgetLib.render(yearGames, 9);

    var view = resolve('league.html');
    var body = mustacheLib.render(view, {
        weekLeagueWidget: weekLeagueWidget,
        aprilLeagueWidget: aprilLeagueWidget,
        yearLeagueWidget: yearLeagueWidget
    });
    return {
        body: body
    }
};
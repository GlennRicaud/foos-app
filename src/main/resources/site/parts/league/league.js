var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');
var leagueWidgetLib = require('/lib/widgets/league/league');


// Handle the GET request
exports.get = function (req) {


    var weekGames = foosLib.getTeamGamesBetween("2016-04-11", "2016-04-18");
    var weekLeagueWidget = leagueWidgetLib.render(weekGames, 3);

    var aprilGames = foosLib.getTeamGamesBetween("2016-04-01", "2016-05-01");
    var aprilLeagueWidget = leagueWidgetLib.render(aprilGames, 4);

    var yearGames = foosLib.getTeamGames();
    var yearLeagueWidget = leagueWidgetLib.render(yearGames, 7);

    var marchGames = foosLib.getTeamGamesBetween("2016-03-01", "2016-04-01");
    var marchLeagueWidget = leagueWidgetLib.render(marchGames, 6);


    var view = resolve('league.html');
    var body = mustacheLib.render(view, {
        weekLeagueWidget: weekLeagueWidget,
        aprilLeagueWidget: aprilLeagueWidget,
        yearLeagueWidget: yearLeagueWidget,
        marchLeagueWidget: marchLeagueWidget
    });
    return {
        body: body
    }
};
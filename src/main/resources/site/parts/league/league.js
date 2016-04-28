var cacheLib = require('/lib/xp/cache');
var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

var leagueWidgetLib = require('/lib/widgets/league/league');

var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

var leagueCache = cacheLib.newCache({size: 1});


// Handle the GET request
exports.get = function (req) {
    function doGet(req) {
        var currentWeek = foosLib.getLatestWeek();
        var weekGames = foosLib.getTeamGamesBetween(currentWeek.data.start, currentWeek.data.end);
        var weekLeagueWidget = leagueWidgetLib.render(weekGames, 3);

        var month = new Date().getMonth();
        var monthName = MONTH_NAMES[month];
        var monthIsoNumber = ++month < 10 ? "0" + month.toFixed(0) : month.toFixed(0);

        var day = new Date().getDate();
        var monthGames = foosLib.getTeamGamesBetween("2016-" + monthIsoNumber + "-01", "2016-" + monthIsoNumber + "-31");
        var monthLeagueWidget = leagueWidgetLib.render(monthGames, 2 + Math.min(6, Math.ceil(day / 7)));

        var yearGames = foosLib.getTeamGames();
        var yearLeagueWidget = leagueWidgetLib.render(yearGames, 2 + foosLib.getWeekCount());

        var view = resolve('league.html');
        var body = mustacheLib.render(view, {
            weekLeagueWidget: weekLeagueWidget,
            monthLeagueWidget: monthLeagueWidget,
            yearLeagueWidget: yearLeagueWidget,
            weekName: currentWeek.displayName,
            monthName: monthName
        });
        return {
            body: body
        }
    }

    return leagueCache.get(foosLib.getLatestModificationTime(), doGet);
};
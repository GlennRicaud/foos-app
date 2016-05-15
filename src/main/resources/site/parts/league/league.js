var cacheLib = require('/lib/xp/cache');
var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');

var leagueWidgetLib = require('/lib/widgets/league/league');

var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

var leagueCache = cacheLib.newCache({size: 1});


// Handle the GET request
exports.get = function (req) {

    function doGet() {
        log.info("doGetLeague");
        var currentWeek = foosRetrievalLib.getLatestWeek();
        var weekGames = foosRetrievalLib.getTeamGamesBetween(currentWeek.data.start, currentWeek.data.end);
        var weekLeagueWidget = leagueWidgetLib.render(weekGames, 2);

        var month = new Date().getMonth();
        var monthName = MONTH_NAMES[month];
        var monthIsoNumber = ++month < 10 ? "0" + month.toFixed(0) : month.toFixed(0);

        var day = new Date().getDate();
        var monthGames = foosRetrievalLib.getTeamGamesBetween("2016-" + monthIsoNumber + "-01", "2016-" + monthIsoNumber + "-31");
        var monthLeagueWidget = leagueWidgetLib.render(monthGames, Math.max(2, Math.min(4, Math.ceil(day / 7))));

        var yearGames = foosRetrievalLib.getTeamGames();
        var yearLeagueWidget = leagueWidgetLib.render(yearGames, Math.max(2, foosRetrievalLib.getWeekCount()));

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

    var key = req.mode + req.branch + foosRetrievalLib.getLatestModificationTime();
    return leagueCache.get(key, doGet);
};
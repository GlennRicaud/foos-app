var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosRetrievalLib = require('/lib/foos-retrieval');
var contentLib = require('/lib/xp/content');
var gamesWidgetLib = require('/lib/widgets/games/games');


exports.get = function (req) {
    if (req.params.data === 'true') {
        return getGamesPerDayData(req);
    }
    if (req.params.date) {
        return getGamesHtmlForDate(req);
    }
    var date = new Date();
    if (req.params.d) {
        date = new Date(req.params.d);
    }
    var games = foosRetrievalLib.getGamesByDate(date);

    var view = resolve('games.html');
    var body = mustacheLib.render(view, {
        gamesWidget: gamesWidgetLib.render(games, true),
        dataUrl: portalLib.componentUrl({})
    });

    var d3Url = portalLib.assetUrl({path: "js/d3.min.js"});
    var momentUrl = portalLib.assetUrl({path: "js/moment.min.js"});
    var heatMapUrl = portalLib.assetUrl({path: "js/cal-heatmap.min.js"});
    var gamesJsUrl = portalLib.assetUrl({path: "js/games.js"});
    return {
        body: body,
        pageContributions: {
            headEnd: '<link rel="stylesheet" href="' + portalLib.assetUrl({path: 'css/cal-heatmap.css'}) + '" type="text/css" />',
            bodyEnd: [
                '<script src="' + momentUrl + '"></script>',
                '<script src="' + d3Url + '"></script>',
                '<script src="' + heatMapUrl + '"></script>',
                '<script src="' + gamesJsUrl + '"></script>'
            ]
        }
    }
};

var getGamesPerDayData = function (req) {
    var start = req.params.start;
    var stop = req.params.stop;

    var res = contentLib.query({
        start: 0,
        count: 0,
        query: "data.date >= instant('" + start + "') AND data.date <= instant('" + stop + "')",
        contentTypes: [app.name + ":game"],
        aggregations: {
            by_day: {
                dateHistogram: {
                    field: "data.date",
                    interval: "1d",
                    minDocCount: 1,
                    format: "yyyy-MM-dd"
                }
            }
        }
    });
    var aggregations = res.aggregations || {};
    var gamesPerDay = {};
    if (aggregations && aggregations.by_day && aggregations.by_day.buckets) {
        aggregations.by_day.buckets.forEach(function (b) {
            var key = new Date(b.key).getTime() / 1000;
            gamesPerDay[key] = b.docCount;
        });
    }

    return {
        body: gamesPerDay,
        contentType: 'application/json'
    }
};

var getGamesHtmlForDate = function (req) {
    var games = foosRetrievalLib.getGamesByDate(new Date(req.params.date));
    return {
        body: gamesWidgetLib.render(games, true),
        contentType: 'text/html'
    }
};
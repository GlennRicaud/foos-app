var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');


// Handle the GET request
exports.get = function (req) {

    var weeks = foosRetrievalLib.getWeeks();
    foosUrlLib.generatePageUrl(weeks);
    var view = resolve('games.html');
    var body = mustacheLib.render(view, {
        weeks: weeks
    });
    return {
        body: body
    }
};
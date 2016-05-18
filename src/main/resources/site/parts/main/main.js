var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');

// Handle the GET request
exports.get = function (req) {

    var releases = foosRetrievalLib.getReleases();

    var view = resolve('main.html');
    var body = mustacheLib.render(view, {releases: releases});
    return {
        body: body
    }
};
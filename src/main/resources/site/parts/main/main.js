var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');

// Handle the GET request
exports.get = function (req) {

    var releases = foosRetrievalLib.getReleases();

    releases.forEach(function (release) {
        foosUtilLib.toArray(release.data.features).forEach(function (feature) {
            feature.gen = {
                hasDetails: !!feature.details
            };
        });
    });

    var view = resolve('main.html');
    var body = mustacheLib.render(view, {releases: releases});
    return {
        body: body
    }
};
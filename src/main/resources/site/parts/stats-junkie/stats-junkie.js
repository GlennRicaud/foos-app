var portalLib = require('/lib/xp/portal');
var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');

// Handle the GET request
exports.get = function (req) {
    var view = resolve('stats-junkie.html');
    var scriptView = resolve('stats-junkie-script.js');
    var body = mustacheLib.render(view, {});
    return {
        body: body,
        pageContributions: {
            headEnd: '<script src="' + portalLib.assetUrl({path: "js/jquery-2.2.4.min.js"}) + '""/></script>',
            bodyEnd: '<script>' + mustacheLib.render(scriptView, {}) + '</script>'
        }
    }
};
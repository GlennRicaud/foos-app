var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');

var view = resolve('broadcast.html');

exports.get = function (req) {

    var body = mustacheLib.render(view, {});

    var svcUrl = portalLib.serviceUrl({service: "broadcast"});
    return {
        body: body,
        pageContributions: {
            headEnd: '<link rel="stylesheet" href="' + portalLib.assetUrl({path: 'css/broadcast.css'}) + '" type="text/css" />',
            bodyEnd: [
                '<script type="text/javascript">var SVC_URL = "' + svcUrl + '";</script>',
                '<script src="' + portalLib.assetUrl({path: "js/Chart.bundle.min.js"}) + '"></script>',
                '<script src="' + portalLib.assetUrl({path: "js/broadcast.js"}) + '"></script>'
            ]
        }
    }
};
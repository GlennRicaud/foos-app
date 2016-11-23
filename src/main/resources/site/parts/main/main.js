var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');

// Handle the GET request
exports.get = function (req) {
    var view = resolve('main.html');
    var logoImg = portalLib.assetUrl({path: "img/logo.svg"})

    var body = mustacheLib.render(view, {logoImg: logoImg});
    return {
        body: body
    }
};
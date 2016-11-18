var authLib = require('/lib/xp/auth');
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosUrlLib = require('/lib/foos-url');

// Handle the GET request
exports.get = function (req) {
    var content = portalLib.getContent();
    var user = authLib.getUser();

    var mainRegion = content.page.regions["main"];
    var siteUrl = foosUrlLib.getFoosSiteUrl();
    var assetsUrl = portalLib.assetUrl({path: ""});

    var view = resolve('main.html');
    var body = mustacheLib.render(view, {
        mainRegion: mainRegion,
        siteUrl: siteUrl,
        assetsUrl: assetsUrl,
        title: content.displayName,
        logInUrl: !user && portalLib.loginUrl({
            redirect: siteUrl,
            type: 'absolute'
        }),
        logOutUrl: user && portalLib.logoutUrl({
            redirect: siteUrl,
            type: 'absolute'
        }),
        userName: user && user.displayName

    });

    return {
        body: body
    }
};
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var authLib = require('/lib/xp/auth');
var contextLib = require('/lib/xp/context');
var foosUtilLib = require('/lib/foos-util');

exports.handle401 = function (req) {
    var body = generateLoginPage();
    return {
        status: 401,
        contentType: 'text/html',
        body: body
    };
};

exports.login = function (req) {
    var body = generateLoginPage(req.params.redirect);
    return {
        contentType: 'text/html',
        body: body
    };
};

exports.autoLogin = function (req) {
    var user = authLib.getUser();
    if (!user) {
        var idProviderConfig = authLib.getIdProviderConfig();
        var allowedIps = foosUtilLib.toArray(idProviderConfig.allowedIps);
        if (allowedIps.indexOf(req.remoteAddress) != -1) {
            var result = authLib.login({
                user: "local-user",
                password: authLib.getIdProviderConfig().password, //TODO Temp fix
                userStore: portalLib.getUserStoreKey()
            });
        }
    }
};

exports.logout = function (req) {
    authLib.logout();

    return {
        redirect: req.params.redirect
    }
};

function generateLoginPage(redirectUrl) {
    var userStoreKey = portalLib.getUserStoreKey();

    var jQueryUrl = portalLib.assetUrl({path: "js/jquery-2.2.4.min.js"});
    var loginScriptUrl = portalLib.assetUrl({path: "js/login.js"});
    var loginStyleUrl = portalLib.assetUrl({path: "css/login.css"});
    var loginImgUrl = portalLib.assetUrl({path: "img/login.svg"});
    var loginServiceUrl = portalLib.serviceUrl({service: "login"});

    var loginConfigView = resolve('login-config.txt');
    var loginConfig = mustacheLib.render(loginConfigView, {
        userStoreKey: userStoreKey,
        loginServiceUrl: loginServiceUrl,
        redirectUrl: redirectUrl
    });

    var view = resolve("login.html");
    return mustacheLib.render(view, {
        loginConfig: loginConfig,
        jQueryUrl: jQueryUrl,
        loginScriptUrl: loginScriptUrl,
        loginStyleUrl: loginStyleUrl,
        loginImgUrl: loginImgUrl
    });
}

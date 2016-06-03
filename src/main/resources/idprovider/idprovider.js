var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var authLib = require('/lib/xp/auth');

exports.handle403 = function (req) {
    var body = generateLoginPage();

    return {
        status: 403,
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

exports.logout = function (req) {
    authLib.logout();

    return {
        redirect: req.params.redirect
    }
};

function generateLoginPage(redirectUrl) {
    var userStoreKey = authLib.getUserStore().key;
    var idProviderConfig = authLib.getIdProviderConfig();

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

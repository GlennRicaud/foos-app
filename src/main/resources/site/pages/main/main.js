var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');

// Handle the GET request
exports.get = function (req) {
    var content = portalLib.getContent();

    var mainRegion = content.page.regions["main"];
    var siteUrl = foosLib.getFoosSiteUrl();
    var mainCssUrl = portalLib.assetUrl({path: "css/main.css"});
    var favIconUrl = portalLib.assetUrl({path: "img/foosball.png"});

    if (content.data.picture) {
        var pictureUrl = portalLib.imageUrl({
            id: content.data.picture,
            scale: 'square(60)',
            filter: 'rounded(30);sharpen()'
        });
    }

    var view = resolve('main.html');
    var body = mustacheLib.render(view, {
        mainRegion: mainRegion,
        siteUrl: siteUrl,
        mainCssUrl: mainCssUrl,
        favIconUrl: favIconUrl,
        title: content.displayName + (content.data.nickname ? " aka " + content.data.nickname : "" ),
        pictureUrl: pictureUrl
    });

    return {
        body: body
    }
};
var portalLib = require('/lib/xp/portal');
var foosUtilLib = require('/lib/foos-util');

/*******************************************************
 * URL functions
 *******************************************************/

exports.getFoosSiteUrl = function () {
    return portalLib.pageUrl({
        path: portalLib.getSite()._path
    });
};

exports.getCurrentPageUrl = function (params) {
    return portalLib.pageUrl({
        id: portalLib.getContent()._id,
        params: params
    });
};

/*******************************************************
 * Generation functions
 *******************************************************/

exports.generatePageUrl = function (contents) {
    var contentArray = foosUtilLib.toArray(contents);
    contentArray.forEach(function (content) {
        content.gen = content.gen || {};
        content.gen.pageUrl = portalLib.pageUrl({
            path: content._path
        });
    });
}

exports.generatePictureUrl = function (content, size) {
    size = size || 60;
    if (content.data.picture) {
        content.gen = content.gen || {};
        content.gen.pictureUrl = portalLib.imageUrl({
            id: content.data.picture,
            scale: 'square(' + size + ')',
            filter: 'rounded(' + (size / 2).toFixed(0) + ');sharpen()'
        });
    }
};

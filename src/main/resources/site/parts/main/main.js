var mustacheLib = require('/lib/xp/mustache');

// Handle the GET request
exports.get = function (req) {

    var view = resolve('main.html');
    var body = mustacheLib.render(view, {});
    return {
        body: body
    }
};
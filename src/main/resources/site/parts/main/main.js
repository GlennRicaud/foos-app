var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

// Handle the GET request
exports.get = function (req) {
    var view = resolve('main.html');
    var body = mustacheLib.render(view, {});
    return {
        body: body
    }
};
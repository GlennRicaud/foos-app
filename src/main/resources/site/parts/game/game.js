var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');
var gamesWidgetLib = require('/lib/widgets/games/games');

var view = resolve('game.html');

// Handle the GET request
exports.get = function (req) {

    function generateDetails(game) {
        if (!game.data.goals) {
            return undefined;
        }

        var goals = game.data.goals.sort(function (goal1, goal2) {
            return goal1.time - goal2.time;
        });

        return {
            comments: goals.map(function (goal) {
                var playerDisplayName = foosLib.getContentByKey(goal.playerId).displayName;
                return Math.floor(goal.time / 60) + "′" + (goal.time % 60) + "′′: " + playerDisplayName + " scores!"
            })
        };

    }

    var game = portalLib.getContent();
    var body = mustacheLib.render(view, {
        gamesWidget: gamesWidgetLib.render([game], false),
        details: generateDetails(game)
    });
    return {
        body: body
    }
}
;
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

        var playersById = {};
        foosLib.concat(game.data.winners, game.data.losers).
            forEach(function (playerResult) {
                playersById[playerResult.playerId] = foosLib.getContentByKey(playerResult.playerId);
            });


        var goals = game.data.goals.sort(function (goal1, goal2) {
            return goal1.time - goal2.time;
        });

        var comments = [];
        for (var i = 0; i < goals.length; i++) {
            var goal = goals[i];
            var commentTime = Math.floor(goal.time / 60) + "′" + (goal.time % 60) + "′′: ";
            var playerDisplayName = playersById[goal.playerId].displayName;

            if (goal.against) {
                comments.push(commentTime + playerDisplayName + " seems disoriented and scores against himself! ");
                continue;
            }

            if (i == 0) {
                comments.push(commentTime + "First blood! " + playerDisplayName + " scores the first goal.");
                continue;
            }

            if (i == (goals.length - 1)) {
                comments.push(commentTime + "The End! " + playerDisplayName + " scores and ends the game.");
                continue;
            }

            var delta = goal.time - goals[i - 1].time;
            if (delta < 10) {
                comments.push(commentTime + "Quick shot! " + playerDisplayName + " scores in only " + delta + " seconds!");
                continue;
            }

            if (goal.playerId === goals[i - 1].playerId) {
                comments.push(commentTime + "Again? " + playerDisplayName + " scores again!");
                continue;
            }


            comments.push(commentTime + playerDisplayName + " scores.");

        }

        return {
            comments: comments
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
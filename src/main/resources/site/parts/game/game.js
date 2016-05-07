var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');
var gamesWidgetLib = require('/lib/widgets/games/games');

var view = resolve('game.html');

// Handle the GET request
exports.get = function (req) {

    function generateDetails(game) {

        function generateComment() {
            var playerDisplayName = playersById[goal.playerId].displayName;
            if (goal.against) {
                return playerDisplayName + " seems disoriented and scores against himself! ";
            }

            if (i == 0) {
                return "First blood! " + playerDisplayName + " scores the first goal.";
            }

            if (i == (goals.length - 1)) {
                return "The End! " + playerDisplayName + " scores and ends the game.";
            }

            var delta = goal.time - previousGoal.time;
            if (delta < 10) {
                return "Quick shot! " + playerDisplayName + " scores in only " + delta + " seconds!";
            }

            if (goal.playerId === previousGoal.playerId) {
                return "Again? " + playerDisplayName + " scores again!";
            }

            return playerDisplayName + " scores.";
        }

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
            var commentTime = Math.floor(goal.time / 60) + "′" + (goal.time % 60) + "′′";
            comments.push({time: commentTime, text: generateComment()});
            var previousGoal = goal;
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
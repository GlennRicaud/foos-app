var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

// Handle the GET request
exports.get = function (req) {

    function computeDevConWin() {
        var games = foosLib.getGames();

        games.forEach(function (game) {
            var devWinners = true;
            var conWinners = true;
            var devLosers = true;
            var conLosers = true;

            var playerResults = foosLib.toArray(game.data.playerResults);
            playerResults.forEach(function (playerResult) {
                var player = foosLib.getContentByKey(playerResult.playerId);
                devWinners &= (player.data.devcon == "dev" && playerResult.winner) || (player.data.devcon != "dev" && !playerResult.winner);
                conWinners &= (player.data.devcon == "con" && playerResult.winner) || (player.data.devcon != "con" && !playerResult.winner);
                devLosers &= (player.data.devcon == "dev" && !playerResult.winner) || (player.data.devcon != "dev" && playerResult.winner);
                conLosers &= (player.data.devcon == "con" && !playerResult.winner) || (player.data.devcon != "con" && playerResult.winner);
            });

            if (devWinners && conLosers) {
                devWin++;
            }
            if (devLosers && conWinners) {
                conWin++;
            }
        });
    };


    var devWin = 0;
    var conWin = 0;
    computeDevConWin();
    var view = resolve('main.html');
    var body = mustacheLib.render(view, {
        devWin: devWin.toFixed(),
        conWin: conWin.toFixed()
    });
    return {
        body: body
    }
};
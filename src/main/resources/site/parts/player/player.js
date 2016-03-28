var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var foosLib = require('/lib/foos');

exports.get = function (req) {
    var player = portalLib.getContent();
    foosLib.generatePlayerStats(player);
    
    player.gen.nbGames = player.gen.nbGames.toFixed(0);    
    player.gen.nbGamesWon = player.gen.nbGamesWon.toFixed(0);
    player.gen.nbGamesSolo = player.gen.nbGamesSolo.toFixed(0);
    player.gen.nbGamesWonSolo = player.gen.nbGamesWonSolo.toFixed(0);
    player.gen.nbGamesTeam = player.gen.nbGamesTeam.toFixed(0);
    player.gen.nbGamesWonTeam = player.gen.nbGamesWonTeam.toFixed(0);
    player.gen.nbGoalsScored = player.gen.nbGoalsScored.toFixed(0);
    player.gen.nbGoalsAgainst = player.gen.nbGoalsAgainst.toFixed(0);
    
    player.gen.ratioGamesWon = player.gen.ratioGamesWon.toFixed(0) + "%";
    player.gen.ratioGamesWonSolo = player.gen.ratioGamesWonSolo.toFixed(0) + "%";
    player.gen.ratioGamesWonTeam = player.gen.ratioGamesWonTeam.toFixed(0) + "%";
    player.gen.ratioGoalsScoredSolo = player.gen.ratioGoalsScoredSolo.toFixed(0) + "%"; 
    player.gen.ratioGoalsScoredTeam = player.gen.ratioGoalsScoredTeam.toFixed(0) + "%";
    

    var view = resolve('player.html');
    var body = mustacheLib.render(view, {
        player: player
    });
    return {
        body: body
    }
};

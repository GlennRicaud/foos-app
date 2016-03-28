var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

// Handle the GET request
exports.get = function(req) {	

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
  
  function computeMostSociallyChallenged() {    
    var players = foosLib.getPlayers();
    players.forEach(function (player) {      
      foosLib.generatePlayerStats(player);
    });    
    
    players.sort(function (player1,player2) {
      return player2.gen.ratioGamesSolo - player1.gen.ratioGamesSolo;
    });
    
    return players;
  };
  
  function computeMostOrientationallyChallenged() {    
    var players = foosLib.getPlayers();
    players.forEach(function(player) {
      foosLib.generatePlayerStats(player);
    });    
    
    players.sort(function (player1,player2) {
      return player2.gen.ratioGoalsAgainst - player1.gen.ratioGoalsAgainst;
    });
    
    return players;
  };
  
  var devWin = 0;
  var conWin = 0;
  computeDevConWin();

  var soloPlayers = computeMostSociallyChallenged();
  var orientationPlayers = computeMostOrientationallyChallenged();
  
  var view = resolve('main.html');
  var body = mustacheLib.render(view, {
    devWin: devWin.toFixed(),
    conWin: conWin.toFixed(),
    soloPlayers: soloPlayers,
    orientationPlayers: orientationPlayers
  });
  return {
      body: body
  }
};
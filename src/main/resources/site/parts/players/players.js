var mustacheLib = require('/lib/xp/mustache');
var foosLib = require('/lib/foos');

// Handle the GET request
exports.get = function(req) {  
  var players = foosLib.getPlayers();
  
  players.forEach(function(player){
    player.pictureUrl = foosLib.generatePictureUrl(player);
    foosLib.generatePageUrl(player);
  });  
  
  var view = resolve('players.html');
  var body = mustacheLib.render(view, {
    players: players
  });
  return {
    body: body
  }
};
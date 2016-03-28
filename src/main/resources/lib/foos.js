var contentLib = require('/lib/xp/content');
var portalLib = require('/lib/xp/portal');

/*******************************************************
 * Global variables
 *******************************************************/

var foosSitePath = '/foos';
var foosPlayersPath = foosSitePath + '/players';
var foosTeamsPath = foosSitePath + '/teams';
var foosGamesPath = foosSitePath + '/games';


/*******************************************************
 * Retrieval functions
 *******************************************************/
 
exports.getFoosSiteUrl = function() {
  return portalLib.pageUrl({
    path: foosSitePath
  });
};

exports.getContentByKey = function(id) {
  return contentLib.get({
    key: id
  });
};

exports.getContentByKey = function(id) {
  return contentLib.get({
    key: id
  });
};

exports.getPlayers = function() {
  return contentLib.getChildren({
    key: foosPlayersPath,
    count: -1
  }).hits;  
};

exports.getTeams = function() {
  return contentLib.getChildren({
    key: foosTeamsPath,
    count: -1
  }).hits;  
};

exports.getWeeks = function() {
  return contentLib.getChildren({
    key: foosGamesPath,
    count: -1
  }).hits;   
};

exports.getGames = function() {
  return contentLib.query({
    start: 0,
    count: -1,
    contentTypes: [app.name + ":game"],
    sort: "displayName DESC"
  }).hits;    
};

exports.getGamesByWeekPath = function(weekPath) {
  return contentLib.getChildren({
    key: weekPath,
    count: -1,
    sort: "displayName DESC"
  }).hits;  
};

exports.getGamesByPlayerId = function(playerId) {
  return exports.getGames().filter(function (game) {
    var gamePlayer = false;
    game.data.playerResults.forEach(function (playerResult) {
      if (playerResult.playerId == playerId) {
        gamePlayer = true;
      }
    });
    return gamePlayer;
  });
};

/*******************************************************
 * Generation functions
 *******************************************************/

exports.generatePageUrl = function(contents) {
  var contentArray = exports.toArray(contents);
  contentArray.forEach(function (content) {
    content.gen = content.gen || {};
    content.gen.pageUrl = portalLib.pageUrl({
      path: content._path
    });
  });
}
 
exports.generatePictureUrl = function(player) {
  if (player.data.picture) {
      return portalLib.imageUrl({
        id: player.data.picture,
        scale: 'square(60)',
        filter: 'rounded(30);sharpen()'
      });    
    }
    return undefined;
};

exports.generatePlayerStats = function(player) {
  var games = exports.getGames();

  player.gen = player.gen || {};
  player.gen.nbGames = 0;
  player.gen.nbGamesWon = 0;
  player.gen.nbGoalsScored = 0;
  player.gen.nbGoalsScoredSolo = 0;
  player.gen.nbGoalsScoredTeam = 0;
  player.gen.nbGoalsAgainst = 0;
  player.gen.nbGamesSolo = 0;  
  player.gen.nbGamesWonSolo = 0;
  player.gen.nbGamesTeam = 0;  
  player.gen.nbGamesWonTeam = 0;
  var nbAllGoalsSolo = 0;
  var nbAllGoalsTeam = 0;
  
  games.forEach(function (game) {    
    var nbAllGoalsForCurrentGame= 0;
    var currentGamePlayed = false
    var playerResults = exports.toArray(game.data.playerResults);      
    playerResults.forEach(function (playerResult) {
        if (playerResult.playerId == player._id) {
          player.gen.nbGames++;
          currentGamePlayed = true;
          player.gen.nbGoalsScored += playerResult.score;
          player.gen.nbGoalsAgainst += playerResult.against || 0;
          
          if (playerResult.winner) {
            player.gen.nbGamesWon++;
          }
          
          if (playerResults.length == 2) {
            player.gen.nbGamesSolo++;
            player.gen.nbGoalsScoredSolo += playerResult.score;
            if (playerResult.winner) {
              player.gen.nbGamesWonSolo++;
            }
          } else if (playerResults.length == 4)  {
            player.gen.nbGamesTeam++;
            player.gen.nbGoalsScoredTeam += playerResult.score;
            if (playerResult.winner) {
              player.gen.nbGamesWonTeam++;
            }
          }
        }
        nbAllGoalsForCurrentGame += playerResult.score;
    });
    
    if (currentGamePlayed) {
      if (playerResults.length == 2) {
        nbAllGoalsSolo +=  nbAllGoalsForCurrentGame;
      } else if (playerResults.length == 4)  {
        nbAllGoalsTeam +=  nbAllGoalsForCurrentGame;
      }
    }
  });
  
  player.gen.anySolo = player.gen.nbGamesSolo > 0;
  player.gen.anyTeam = player.gen.nbGamesTeam > 0;
  
  player.gen.ratioGamesWon = Math.floor( player.gen.nbGamesWon * 100 /  (player.gen.nbGames > 0 ? player.gen.nbGames : 1));
  player.gen.ratioGamesWonSolo = Math.floor( player.gen.nbGamesWonSolo * 100 /  (player.gen.nbGamesSolo > 0 ? player.gen.nbGamesSolo : 1));
  player.gen.ratioGamesWonTeam = Math.floor( player.gen.nbGamesWonTeam * 100 /  (player.gen.nbGamesTeam > 0 ? player.gen.nbGamesTeam : 1));
  player.gen.ratioGamesSolo = Math.floor( player.gen.nbGamesSolo * 100 /  (player.gen.nbGames > 0 ? player.gen.nbGames : 1));
  player.gen.ratioGoalsAgainst = Math.floor(player.gen.nbGoalsAgainst * 100 / (player.gen.nbGoalsScored > 0 ? player.gen.nbGoalsScored : 1));  
  player.gen.ratioGoalsScoredSolo = Math.floor(player.gen.nbGoalsScoredSolo * 100 / (nbAllGoalsSolo > 0 ? nbAllGoalsSolo : 1));
  player.gen.ratioGoalsScoredTeam = Math.floor(player.gen.nbGoalsScoredTeam * 100 / (nbAllGoalsTeam > 0 ? nbAllGoalsTeam : 1));
}

/*******************************************************
 * Generic functions
 *******************************************************/
 
exports.toArray = function(object) {
  if (!object) {
    return [];
  }
  if (object.constructor === Array) {
    return object;
  }
  return [object];
}



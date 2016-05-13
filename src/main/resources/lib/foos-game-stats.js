var foosUtilLib = require('/lib/foos-util');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');

exports.generateGameBasicStats = function (game) {
    game.gen = game.gen || {};
    game.gen.score = {
        winners: 0,
        losers: 0
    };

    var winnerResults = foosUtilLib.toArray(game.data.winners);
    winnerResults.forEach(function (playerResult) {
        game.gen.score.winners += playerResult.score;
        if (playerResult.against) {
            game.gen.score.losers += playerResult.against;
        }
    });

    var loserResults = foosUtilLib.toArray(game.data.losers);
    loserResults.forEach(function (playerResult) {
        game.gen.score.losers += playerResult.score;
        if (playerResult.against) {
            game.gen.score.winners += playerResult.against;
        }
    });
};

exports.generateGameStats = function (game) {
    exports.generateGameBasicStats(game);

    function doGenerateGameStats(playerResult) {
        var playerContent = foosRetrievalLib.getContentByKey(playerResult.playerId);

        playerResult.gen = {};
        playerResult.gen.name = playerContent.displayName;
        foosUrlLib.generatePictureUrl(playerContent);
        foosUrlLib.generatePageUrl(playerContent);
        playerResult.gen.pictureUrl = playerContent.gen.pictureUrl;
        playerResult.gen.pageUrl = playerContent.gen.pageUrl;
    }

    foosUtilLib.toArray(game.data.winners).forEach(doGenerateGameStats);
    foosUtilLib.toArray(game.data.losers).forEach(doGenerateGameStats);
};


exports.generateGameComments = function (game) {
    game.gen = game.gen || {};

    game.gen.comments = foosRetrievalLib.getChildrenByParentKey(game._id);
    game.gen.comments.forEach(function (comment) {
        var player = foosRetrievalLib.getContentByKey(comment.data.authorId);
        comment.gen = {
            authorName: player.displayName
        };
    });
};
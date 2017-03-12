var eventLib = require('/lib/xp/event');
var webSocketLib = require('/lib/xp/websocket');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUrlLib = require('/lib/foos-url');
var portalLib = require('/lib/xp/portal');
var contentLib = require('/lib/xp/content');
var httpClient = require('/lib/xp/http-client');

var WS_GROUP_NAME = 'foos-game';
var FOOS_GAME_EVENT_ID = 'foos-game';
var latestGameState;

eventLib.listener({
    type: 'custom.' + FOOS_GAME_EVENT_ID,
    localOnly: false,
    callback: function (event) {
        // log.info('Game status event received: ' + event.data.game);
        latestGameState = JSON.parse(event.data.game);
        webSocketLib.sendToGroup(WS_GROUP_NAME, getCurrentGameState());
    }
});

exports.get = function (req) {
    if (req.webSocket) {
        return {
            webSocket: {
                data: {},
                subProtocols: ["foos-game"]
            }
        };
    }

    return {
        status: 204
    }
};

exports.post = function (req) {
    // if new game started => reset latestGameState, send hipchat message with link
    // receive current game state from client
    try {
        var gameState = JSON.parse(req.body);
    } catch (e) {
        return {
            status: 400,
            body: {
                message: 'Invalid JSON in request body'
            }
        }
    }
    var gameStateDetails = getGameDetails(gameState);
    if (gameState && gameState.goals && gameState.goals.length === 0) {
        sendHipchatNotification(gameState);
    }

    // send event with current game state
    eventLib.send({
        type: FOOS_GAME_EVENT_ID,
        distributed: true,
        data: {
            game: JSON.stringify(gameStateDetails)
        }
    });

    return {
        contentType: 'application/json',
        body: {
            success: true
        }
    }
};

exports.webSocketEvent = function (event) {

    var sessionId = event.session.id;
    switch (event.type) {
    case 'open':
        webSocketLib.addToGroup(WS_GROUP_NAME, sessionId);

        // send last game state directly to client
        webSocketLib.send(sessionId, getCurrentGameState());
        break;

    case 'message':
        // handleMessage(event);
        break;

    case 'close':
        webSocketLib.removeFromGroup(WS_GROUP_NAME, sessionId);
        break;
    }
};

var getGameDetails = function (gameState) {
    if (gameState.winners[0].playerId > gameState.losers[0].playerId) {
        var tmp = gameState.winners;
        gameState.winners = gameState.losers;
        gameState.losers = tmp;
    }

    var winnerPlayers = {}, loserPlayers = {};
    for (var i = 0; i < gameState.winners.length; i++) {
        getPlayerDetails(gameState.winners[i]);
        winnerPlayers[gameState.winners[i].playerId] = true;
    }
    for (i = 0; i < gameState.losers.length; i++) {
        getPlayerDetails(gameState.losers[i]);
        loserPlayers[gameState.losers[i].playerId] = true;
    }
    var isTeamGame = gameState.winners.length == 2;
    gameState.teamGame = isTeamGame;
    if (isTeamGame) {
        var teamW = foosRetrievalLib.getTeamByPlayerIds([gameState.winners[0].playerId, gameState.winners[1].playerId], true);
        teamW.data = teamW.data || {};
        foosUrlLib.generatePictureUrl(teamW);

        var teamL = foosRetrievalLib.getTeamByPlayerIds([gameState.losers[0].playerId, gameState.losers[1].playerId], true);
        teamL.data = teamL.data || {};
        foosUrlLib.generatePictureUrl(teamL);
        gameState.teamWinner = {
            displayName: teamW.displayName,
            imageUrl: teamW.gen ? teamW.gen.pictureUrl : ''
        };
        gameState.teamLoser = {
            displayName: teamL.displayName,
            imageUrl: teamL.gen ? teamL.gen.pictureUrl : ''
        };
    } else {
        gameState.teamWinner = {
            displayName: gameState.winners[0].displayName,
            imageUrl: ''
        };
        gameState.teamLoser = {
            displayName: gameState.losers[0].displayName,
            imageUrl: ''
        };
    }
    gameState.teamWinner.score = 0;
    gameState.teamLoser.score = 0;
    var goal;
    for (var g = 0; g < gameState.goals.length; g++) {
        goal = gameState.goals[g];
        if (winnerPlayers[goal.playerId]) {
            if (goal.against) {
                gameState.teamLoser.score++;
            } else {
                gameState.teamWinner.score++
            }
        } else {
            if (goal.against) {
                gameState.teamWinner.score++
            } else {
                gameState.teamLoser.score++;
            }
        }
    }
    gameState.started = new Date(new Date().getTime() - Math.floor(gameState.elapsedTime * 1000));
    return gameState;
};

var getPlayerDetails = function (player) {
    var playerContent = foosRetrievalLib.getPlayer(player.playerId);
    foosUrlLib.generatePictureUrl(playerContent);
    player.displayName = playerContent.displayName;
    player.imageUrl = playerContent.gen.pictureUrl;
};

var getCurrentGameState = function () {
    if (!latestGameState) {
        return JSON.stringify({});
    }
    var scoreA = latestGameState.teamLoser.score;
    var scoreB = latestGameState.teamWinner.score;
    var gameFinished = ((scoreA >= 10 || scoreB >= 10) && (Math.ceil(scoreB - scoreA) >= 2));

    if (gameFinished) {
        latestGameState.elapsedTime = Math.round(latestGameState.goals[latestGameState.goals.length - 1].time);
    } else {
        latestGameState.elapsedTime = (new Date().getTime() - new Date(latestGameState.started).getTime()) / 1000;
    }

    return JSON.stringify(latestGameState)
};

var sendHipchatNotification = function (gameState) {
    var result = contentLib.query({
        count: 1,
        start: 0,
        contentTypes: [app.name + ":livegame"]
    });
    var liveGameContent = result.count === 1 ? result.hits[0] : null;
    if (!liveGameContent || !liveGameContent.page || !liveGameContent.page.config) {
        return;
    }
    var token = liveGameContent.page.config.hipchatToken || '';
    var roomName = liveGameContent.page.config.hipchatRoom || '';
    var broadcastPage = liveGameContent.page.config.broadcastPage;

    if (token.trim() === '' || roomName.trim() === '' || !broadcastPage) {
        return;
    }

    var url = 'https://enonic.hipchat.com/v2/room/' + roomName + '/notification';
    var body = {
        "color": 'purple',
        "message": generateHipchatMessage(broadcastPage, gameState),
        "notify": true,
        "message_format": "html"
    };
    try {
        var response = httpClient.request({
            url: url,
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify(body),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }

        });
        log.info(JSON.stringify(response));
    } catch (e) {
        log.error('Hipchat notification request error: ' + e.message);
    }
};

var generateHipchatMessage = function (pageId, gameState) {
    var singlesGame = gameState.winners.length === 1;
    var ratingTeam1, ratingTeam2;
    if (singlesGame) {
        ratingTeam1 = gameState.winners[0].rating;
        ratingTeam2 = gameState.losers[0].rating;
    } else {
        ratingTeam1 = (gameState.winners[0].rating + gameState.winners[1].rating) / 2;
        ratingTeam2 = (gameState.losers[0].rating + gameState.losers[1].rating) / 2;
    }

    var expectedScore = scoreToGoals(calculateExpectedScore(ratingTeam1, ratingTeam2));

    var gameUrl = portalLib.pageUrl({
        id: pageId,
        type: 'absolute'
    });
    var teamA = gameState.teamWinner.displayName;
    var teamB = gameState.teamLoser.displayName;
    var html = 'A new game has started: <strong>' + teamA + '</strong> - vs - <strong>' + teamB + '</strong>' +
               '<br/><br/><i>Expected score according to players ranking: ' + expectedScore + '</i>' +
               '<br/><br/>' +
               '<a href="' + gameUrl + '">Follow it Live in foos.es/foos</a>';
    return html;
};

var calculateExpectedScore = function (rating, opponentRating) {
    return 1.0 / (1.0 + Math.pow(10.0, (opponentRating - rating) / 400.0));
};

var scoreToGoals = function (score) {
    var diff = (score * 20) - 10;
    if (diff > 0) {
        return "10  -  " + (10 - diff).toFixed(1);
    } else {
        return (10 + diff).toFixed(1) + " - 10";
    }
};

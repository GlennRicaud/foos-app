var thymeleaf = require('/lib/xp/thymeleaf');
var mustacheLib = require('/lib/xp/mustache');
var portalLib = require('/lib/xp/portal');
var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');
var httpClient = require('/lib/xp/http-client');

exports.get = function (req) {
    if (req.params.d) {
        return getData(req);
    }

    var content = portalLib.getContent();

    var mainRegion = content.page.regions["main"];

    var view = resolve('livegame.html');
    var body = thymeleaf.render(view, {
        mainRegion: mainRegion,
        dataUrl: portalLib.componentUrl({params: {'d': true}})
    });

    return {
        body: body
    }
};

exports.post = function (req) {
    var game = contextLib.run({
        branch: 'draft',
        user: {
            login: 'su',
            userStore: 'system'
        }
    }, function () {
        return saveGame(req);
    });

    sendHipchatNotification(game);

    return {
        body: {
            gameUrl: portalLib.pageUrl({
                path: game._path
            })
        },
        contentType: 'application/json'
    }
};

var sendHipchatNotification = function (game) {
    // log.info('Hipchat:' + generateHipchatMessage(game));
    var liveGameContent = portalLib.getContent();
    var token = liveGameContent.page.config.hipchatToken || '';
    var roomName = liveGameContent.page.config.hipchatRoom || '';
    var color = liveGameContent.page.config.hipchatColor || 'green';
    var notify = !!liveGameContent.page.config.hipchatNotify;
    if (token.trim() === '' || roomName.trim() === '') {
        return;
    }

    var url = 'https://enonic.hipchat.com/v2/room/' + roomName + '/notification';
    var body = {
        // "from": "Foos app",
        "color": color,
        "message": generateHipchatMessage(game),
        "notify": notify,
        "message_format": "html"
    };

    try {
        response = httpClient.request({
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
    } catch (e) {
        log.error('Hipchat notification request error: ' + e.message);
    }
};

var generateHipchatMessage = function (game) {
    var view = resolve('hipchat.html');

    var gameUrl = portalLib.pageUrl({
        path: game._path,
        type: 'absolute'
    });

    var winnersDisplayName;
    var losersDisplayName;
    var winners;
    var losers;
    if (game.data.winners.length == 2) {
        var winingTeam = foosRetrievalLib.getTeamByGame(game, true, true);
        var losingTeam = foosRetrievalLib.getTeamByGame(game, false, true);
        winnersDisplayName = winingTeam.displayName;
        losersDisplayName = losingTeam.displayName;

        // winners = foosRetrievalLib.getPlayersByGame(game, true);
        // losers = foosRetrievalLib.getPlayersByGame(game, false);
    } else {
        var winner = foosRetrievalLib.getContentByKey(game.data.winners.playerId);
        var loser = foosRetrievalLib.getContentByKey(game.data.losers.playerId);
        winnersDisplayName = winner.displayName;
        losersDisplayName = loser.displayName;

        // winners = [winner];
        // losers = [loser];
    }

    // TODO get teams picture

    var gameDetails = generateGoalsDetails(game);
    log.info('Goal details: ' + JSON.stringify(gameDetails, null, 2));

    var title = winnersDisplayName + '   ' + gameDetails.winnersScore + ' - ' + gameDetails.losersScore + '   ' + losersDisplayName;

    var diffScore = gameDetails.winnersScore - gameDetails.losersScore;
    var action;
    if (diffScore > 7) {
        action = randomText(['obliterates', 'destroys']);
    } else if (diffScore > 4) {
        action = randomText(['crushes', 'dominates']);
    } else {
        action = randomText(['defeats', 'beats']);
    }
    var adj = randomText(['an exciting', 'an appealing', 'a hectic', 'a lively']);
    if (diffScore == 2) {
        adj = 'a dramatic';
    } else if (gameDetails.leadChanges > 4) {
        adj = 'an unpredictable';
    } else if (gameDetails.winnerTimeLeading < 0.5) {
        adj = 'a contended';
    }
    var summary = winnersDisplayName + ' ' + action + ' ' + losersDisplayName;
    summary += ' in ' + adj + ' game';
    if (gameDetails.comeBack) {
        var comebackAdj = gameDetails.winnerTimeLeading < gameDetails.loserTimeLeading ? 'epic' : 'incredible';
        summary += ', after an ' + comebackAdj + ' comeback';
    }
    if (gameDetails.overtime) {
        summary += ', on overtime';
    }
    summary += '.';

    var body = mustacheLib.render(view, {
        title: title,
        line1: summary,
        gameUrl: gameUrl
    });
    return body;
};

var generateGoalsDetails = function (game) {
    var winnersScore = 0;
    var losersScore = 0;
    var leadChanges = 0;
    var currentLead = 0;
    var winnerTimeLeading = 0;
    var loserTimeLeading = 0;
    var totalTime = 0;
    var previousTime = 0;
    var firstHalfWinner = 0;
    var secondHalfWinner = 0;
    var winnerIds = foosUtilLib.toArray(game.data.winners).map(function (playerResult) {
        return playerResult.playerId
    });

    var playersById = {};
    foosRetrievalLib.getPlayersByGame(game).forEach(function (player) {
        playersById[player._id] = player;
    });

    game.data.goals.sort(function (goal1, goal2) {
        return goal1.time - goal2.time;
    }).forEach(function (goal) {
        var winnerScored = (!goal.against && winnerIds.indexOf(goal.playerId) > -1) ||
                           (goal.against && winnerIds.indexOf(goal.playerId) == -1);

        if (winnerScored) {
            winnersScore++;
        } else {
            losersScore++;
        }

        var newLead = sign(winnersScore - losersScore);
        var timeDelta = goal.time - previousTime;

        if (currentLead > 0) {
            winnerTimeLeading = winnerTimeLeading + timeDelta;
        } else if (currentLead < 0) {
            loserTimeLeading = loserTimeLeading + timeDelta;
        }

        if (newLead != 0 && newLead != currentLead) {
            log.info('Lead change: ' + winnersScore + ' - ' + losersScore);
            leadChanges++;
        }
        if (newLead != 0) {
            currentLead = newLead;
        }

        totalTime += timeDelta;
        previousTime = goal.time;

        if ((winnersScore >= 5 || losersScore >= 5) && firstHalfWinner == 0) {
            firstHalfWinner = currentLead;
        }
    });

    secondHalfWinner = sign(winnersScore - losersScore);
    return {
        winnersScore: winnersScore,
        losersScore: losersScore,
        overtime: winnersScore > 10,
        leadChanges: leadChanges,
        winnerTimeLeading: winnerTimeLeading / totalTime,
        loserTimeLeading: loserTimeLeading / totalTime,
        comeBack: secondHalfWinner != firstHalfWinner
    };
};

var sign = function (x) {
    // Math.sign() polyfill
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
};

var randomText = function (values) {
    var i = random(0, values.length - 1);
    return values[i];
};

var random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var saveGame = function (req) {
    var playerResults = JSON.parse(req.body);

    var weekContent = ensureWeekContent();
    var gameNumber = getNextGame();

    var createResult = contentLib.create({
        name: 'game' + gameNumber,
        parentPath: weekContent._path,
        displayName: 'Game' + gameNumber,
        contentType: app.name + ':game',
        branch: 'draft',
        data: {
            date: formatIsoDate(new Date()),
            winners: playerResults.winners,
            losers: playerResults.losers,
            goals: playerResults.goals,
            goalsAgainst: playerResults.goalsAgainst
        }
    });

    var result = contentLib.publish({
        keys: [createResult._id],
        sourceBranch: 'draft',
        targetBranch: 'master',
        includeChildren: true,
        includeDependencies: true
    });

    return createResult;
};

var getData = function () {
    var plist = foosRetrievalLib.getPlayers();
    var players = [];
    var audioUrl = getAudioUrl();

    plist.forEach(function (p) {
        var player = {};
        player.pictureUrl = generatePictureUrl(p);
        player.id = p._id;
        player.name = p._name;
        player.displayName = p.displayName;

        players.push(player);
    });
    var json = {
        players: players,
        postUrl: portalLib.componentUrl({}),
        audioUrl: audioUrl
    };

    return {
        body: 'var data = ' + JSON.stringify(json, null, 4),
        contentType: 'application/javascript'
    }
};

var getAudioUrl = function () {
    var content = portalLib.getContent();
    if (!content || !content.page || !content.page.config || !content.page.config.victoryAudio) {
        return '';
    }
    var id = content.page.config.victoryAudio;
    return portalLib.attachmentUrl({
        id: id
    });
};

var generatePictureUrl = function (content) {
    if (!content.data.picture) {
        return null;
    }
    return portalLib.imageUrl({
        id: content.data.picture,
        scale: 'square(200)',
        filter: 'rounded(8,1,0x777777);'
    });
};

var ensureWeekContent = function () {
    var week = getWeekNumber(new Date());
    var site = portalLib.getSite();
    var path = site._path + '/games/week-' + week;

    var weekContent = contentLib.get({
        key: path,
        branch: 'master'
    });

    if (weekContent) {
        return weekContent;
    }
    var startDate = getFirstDayOfWeek(week, new Date().getFullYear());
    var endDate = addDays(startDate, 4);

    var createResult = contentLib.create({
        name: 'week-' + week,
        parentPath: site._path + '/games',
        displayName: 'Week ' + week,
        contentType: app.name + ':week',
        data: {
            start: formatIsoDate(startDate),
            end: formatIsoDate(endDate)
        }
    });

    var result = contentLib.publish({
        keys: [createResult._id],
        sourceBranch: 'draft',
        targetBranch: 'master',
        includeChildren: true,
        includeDependencies: true
    });

    return createResult;
};

var getFirstDayOfWeek = function (w, y) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var weekStart = simple;
    if (dow <= 4) {
        weekStart.setDate(simple.getDate() - dow + 1);
    } else {
        weekStart.setDate(simple.getDate() + 8 - dow);
    }
    return weekStart;
};

var addDays = function (date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

var formatIsoDate = function (date) {
    var tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 10); // "2016-04-07"
};

var getNextGame = function () {
    var gamesResult = contentLib.query({
        start: 0,
        count: 10000,
        sort: "modifiedTime DESC",
        branch: 'master',
        contentTypes: [
            app.name + ":game"
        ]
    });

    var hits = gamesResult.hits, i;
    var max = 0;
    for (i = 0; i < hits.length; i++) {
        var name = hits[i]._name;
        var idx = name.indexOf("game");
        var gameId = idx > -1 ? name.substring(idx + 4) : '';
        var gameNum = parseInt(gameId, 10);
        if (isNaN(gameNum)) {
            continue;
        }
        max = max < gameNum ? gameNum : max;
    }
    return max + 1;
};

var getWeekNumber = function (d) {
    d.setHours(0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
};
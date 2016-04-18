var thymeleaf = require('/lib/xp/thymeleaf');
var portalLib = require('/lib/xp/portal');
var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var foosLib = require('/lib/foos');

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
    var weekContent = contextLib.run({
        branch: 'draft',
        user: {
            login: 'su',
            userStore: 'system'
        }
    }, function () {
        return saveGame(req);
    });

    return {
        body: {
            weekUrl: portalLib.pageUrl({
                path: weekContent._path
            })
        },
        contentType: 'application/json'
    }
};

var saveGame = function (req) {
    var playerResults = JSON.parse(req.body);

    var weekContent = ensureWeekContent();
    var gameNumber = getNextGame(weekContent);

    var createResult = contentLib.create({
        name: 'game' + gameNumber,
        parentPath: weekContent._path,
        displayName: 'Game' + gameNumber,
        contentType: app.name + ':game',
        branch: 'draft',
        data: {
            date: new Date().toISOString().slice(0, 10), // "2016-04-07"
            playerResults: playerResults
        }
    });

    var result = contentLib.publish({
        keys: [createResult._id],
        sourceBranch: 'draft',
        targetBranch: 'master',
        includeChildren: true,
        includeDependencies: true
    });

    return weekContent;
};

var getData = function () {
    var plist = foosLib.getPlayers();
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
    if (!content || !content.page || !content.page.config || !content.page.config.victoryAudio) {
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
        scale: 'square(60)',
        filter: 'rounded(10,2,0x777777);'

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

    var createResult = contentLib.create({
        name: 'week-' + week,
        parentPath: site._path + '/games',
        displayName: 'Week ' + week,
        contentType: 'base:folder',
        data: {}
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

var getNextGame = function (weekContent) {
    var gamesResult = contentLib.getChildren({
        key: weekContent._id,
        start: 0,
        count: 1000,
        branch: 'master'
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
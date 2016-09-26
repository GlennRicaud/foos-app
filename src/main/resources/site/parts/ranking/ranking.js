var portalLib = require('/lib/xp/portal');
var mustacheLib = require('/lib/xp/mustache');
var foosRetrievalLib = require('/lib/foos-retrieval');
var foosUtilLib = require('/lib/foos-util');
var foosUrlLib = require('/lib/foos-url');

exports.get = function (req) {
    if (req.params.p == 'chartData') {
        return getChartData(req);
    } else if (req.params.p == 'sparkline') {
        return getSparklinesData(req);
    }
    var players = foosRetrievalLib.getPlayers();

    players.forEach(function (player) {
        foosUrlLib.generatePictureUrl(player, 32, 'rounded(16)');
        foosUrlLib.generatePageUrl(player);
        player.data.rankingText = foosUtilLib.ordinal(player.data.ranking);
    });

    players.sort(function (p1, p2) {
        return p1.data.ranking - p2.data.ranking;
    });

    var view = resolve('ranking.html');
    var body = mustacheLib.render(view, {
        players: players
    });

    var jqueryUrl = portalLib.assetUrl({path: "js/jquery-2.2.4.min.js"});
    var sparklineUrl = portalLib.assetUrl({path: "js/jquery.sparkline.min.js"});
    var chartUrl = portalLib.assetUrl({path: "js/Chart.bundle.min.js"});
    var gameJsUrl = portalLib.assetUrl({path: "js/ranking.js"});

    return {
        body: body,
        pageContributions: {
            headEnd: '<link rel="stylesheet" href="' + portalLib.assetUrl({path: 'css/ranking.css'}) + '" type="text/css" />',
            bodyEnd: [
                '<script src="' + jqueryUrl + '""></script>',
                '<script src="' + sparklineUrl + '""></script>',
                '<script src="' + chartUrl + '""></script>',
                '<script>var dataUrl = "' + portalLib.componentUrl({}) + '";</script>',
                '<script src="' + gameJsUrl + '""></script>'
            ]
        }
    }
};

var getChartData = function (req) {
    var dayCount = req.params.period || 30;
    var playersData = foosRetrievalLib.getPlayers();
    var since = new Date();
    since.setDate(since.getDate() - dayCount);
    var sinceDate = since.toISOString().slice(0, 10);
    var games = foosRetrievalLib.getGamesSince(sinceDate, 'createdTime ASC');

    var players = {}, player;
    playersData.forEach(function (p) {
        player = {
            name: p.displayName,
            id: p._id,
            rating: p.data.rating,
            points: [{t: 0, v: 0}]
        };
        players[p._id] = player;
    });

    var baseTime = 0, t = 0;
    games.forEach(function (g) {
        t = parseInt(new Date(g.createdTime).getTime() / 1000, 10);
        if (baseTime === 0) {
            baseTime = t;
        }
        t = t - baseTime + 1;
        var winners = [].concat(g.data.winners);
        var losers = [].concat(g.data.losers);
        var gamePlayers = winners.concat(losers);

        gamePlayers.forEach(function (p) {
            var gamePlayer = players[p.playerId];
            if (p.ratingDiff != null) {
                gamePlayer.points.push({
                    t: t,
                    v: p.ratingDiff
                });
            }
        });
    });

    if (t === 0) {
        t = 1;
    }
    for (var id in players) {
        var p = players[id];
        p.points.push({
            t: t,
            v: p.rating
        });

        for (var i = p.points.length - 2; i >= 0; i--) {
            p.points[i].v = p.points[i + 1].v - p.points[i].v;
        }
    }

    return {
        body: {
            players: players,
            count: playersData.length,
            baseTime: baseTime
        },
        contentType: 'application/json'
    }
};

var getSparklinesData = function (req) {
    var playersData = foosRetrievalLib.getPlayers();

    var players = [], player;
    playersData.forEach(function (p) {
        var games = foosRetrievalLib.getGamesByPlayerId(p._id, 60);
        player = {
            name: p.displayName,
            points: []
        };

        games.forEach(function (g) {
            player.points.unshift(getGamePlayerPoints(g, p._id));
        });
        players.push(player);
    });

    return {
        body: {
            players: players
        },
        contentType: 'application/json'
    }
};

var getGamePlayerPoints = function (game, playerId) {
    if (game.data.winners.length === 2) {
        if (game.data.winners[0].playerId === playerId) {
            return game.data.winners[0].ratingDiff;
        } else if (game.data.winners[1].playerId === playerId) {
            return game.data.winners[1].ratingDiff;
        } else if (game.data.losers[0].playerId === playerId) {
            return game.data.losers[0].ratingDiff;
        } else if (game.data.losers[1].playerId === playerId) {
            return game.data.losers[1].ratingDiff;
        }
    } else {
        if (game.data.winners.playerId === playerId) {
            return game.data.winners.ratingDiff;
        } else if (game.data.losers.playerId === playerId) {
            return game.data.losers.ratingDiff;
        }
    }
    return 0;
};
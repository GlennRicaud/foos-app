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
    var teams = foosRetrievalLib.getTeams();

    var upImg = portalLib.assetUrl({path: "img/trend-up.svg"});
    var downImg = portalLib.assetUrl({path: "img/trend-down.svg"});
    var rightImg = portalLib.assetUrl({path: "img/trend-right.svg"});
    var firstImg = portalLib.assetUrl({path: "img/trophy.svg"});
    var levelUpfImg = portalLib.assetUrl({path: "img/level-up.svg"});
    var levelDownImg = portalLib.assetUrl({path: "img/level-down.svg"});

    teams.sort(function (p1, p2) {
        return p1.data.ranking - p2.data.ranking;
    });

    teams.forEach(function (team, idx) {
        var p1 = foosRetrievalLib.getPlayer(team.data.playerIds[0]);
        var p2 = foosRetrievalLib.getPlayer(team.data.playerIds[1]);
        team.gen = team.gen || {};
        foosUrlLib.generatePictureUrl(p1, 24, 'rounded(12)');
        team.gen.pictureP1Url = p1.gen.pictureUrl;
        team.gen.pictureP1Name = p1.displayName;
        team.gen.p1Url = portalLib.pageUrl({id: p1._id});
        foosUrlLib.generatePictureUrl(p2, 24, 'rounded(12)');
        team.gen.pictureP2Url = p2.gen.pictureUrl;
        team.gen.pictureP2Name = p2.displayName;
        team.gen.p2Url = portalLib.pageUrl({id: p2._id});

        foosUrlLib.generatePictureUrl(team, 32, 'rounded(16)');
        foosUrlLib.generatePageUrl(team);
        team.data.rankingText = foosUtilLib.ordinal(team.data.ranking);
        if (team.data.rating < team.data.previousRating) {
            team.gen.trendImg = downImg;
        } else if (team.data.rating > team.data.previousRating) {
            team.gen.trendImg = upImg;
        } else {
            team.gen.trendImg = rightImg;
        }

        if (team.data.ranking === 1) {
            team.gen.icon = firstImg;
        } else if (team.data.ranking > team.data.previousRanking) {
            team.gen.icon = levelDownImg;
        } else if (team.data.ranking < team.data.previousRanking) {
            team.gen.icon = levelUpfImg;
        }
    });

    teams[0].data.first = true;

    var view = resolve('team-ranking.html');
    var body = mustacheLib.render(view, {
        teams: teams
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
    var teamsData = foosRetrievalLib.getTeams();
    var since = new Date();
    since.setDate(since.getDate() - dayCount);
    var sinceDate = since.toISOString().slice(0, 10);
    var games = foosRetrievalLib.getGamesSince(sinceDate, 'createdTime ASC');

    var teams = {}, team;
    teamsData.forEach(function (t) {
        team = {
            name: t.displayName,
            id: t._id,
            rating: t.data.rating,
            points: [{t: 0, v: 0}]
        };
        teams[getTeamPlayersId(t)] = team;
    });

    var baseTime = 0, t = 0;
    games.forEach(function (g) {
        if (g.data.winners.length !== 2 || g.data.losers.length !== 2) {
            return;
        }
        t = parseInt(new Date(g.createdTime).getTime() / 1000, 10);
        if (baseTime === 0) {
            baseTime = t;
        }
        t = t - baseTime + 1;

        var winnerTeamId = getGameWinnerTeamPlayersId(g);
        var loserTeamId = getGameLoserTeamPlayersId(g);
        var winnerTeam = teams[winnerTeamId];
        var loserTeam = teams[loserTeamId];

        if (winnerTeam && loserTeam) {
            if (g.data.winnerTeamRatingDiff != null) {
                winnerTeam.points.push({
                    t: t,
                    v: g.data.winnerTeamRatingDiff
                });
            }
            if (g.data.loserTeamRatingDiff != null) {
                loserTeam.points.push({
                    t: t,
                    v: g.data.loserTeamRatingDiff
                });
            }
        }
    });

    if (t === 0) {
        t = 1;
    }
    for (var id in teams) {
        var p = teams[id];
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
            players: teams,
            count: teamsData.length,
            baseTime: baseTime
        },
        contentType: 'application/json'
    }
};

var getTeamPlayersId = function (team) {
    var p1 = team.data.playerIds[0];
    var p2 = team.data.playerIds[1];
    return p1 < p2 ? p1 + "_" + p2 : p2 + "_" + p1;
};

var getGameWinnerTeamPlayersId = function (game) {
    var p1 = game.data.winners[0].playerId;
    var p2 = game.data.winners[1].playerId;
    return p1 < p2 ? p1 + "_" + p2 : p2 + "_" + p1;
};

var getGameLoserTeamPlayersId = function (game) {
    var p1 = game.data.losers[0].playerId;
    var p2 = game.data.losers[1].playerId;
    return p1 < p2 ? p1 + "_" + p2 : p2 + "_" + p1;
};

var getSparklinesData = function (req) {
    var teamsData = foosRetrievalLib.getTeams();

    var teams = [], team;
    teamsData.forEach(function (t) {
        var games = foosRetrievalLib.getGamesByTeam(t);
        team = {
            name: t.displayName,
            points: []
        };

        games.forEach(function (g) {
            team.points.unshift(getGameTeamPoints(g, getTeamPlayersId(t)));
        });
        teams.push(team);
    });

    return {
        body: {
            players: teams
        },
        contentType: 'application/json'
    }
};

var getGameTeamPoints = function (game, teamPlayersId) {
    var winnerTeamId = getGameWinnerTeamPlayersId(game);
    var loserTeamId = getGameLoserTeamPlayersId(game);
    if (winnerTeamId === teamPlayersId) {
        return game.data.winnerTeamRatingDiff;
    } else if (loserTeamId === teamPlayersId) {
        return game.data.loserTeamRatingDiff;
    } else {
        return 0;
    }
};
var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var portalLib = require('/lib/xp/portal');
var foosUtilLib = require('/lib/foos-util');

/*******************************************************
 * Retrieval functions
 *******************************************************/

exports.getContentByKey = function (id) {
    return contentLib.get({
        key: id
    });
};

exports.getChildrenByParentKey = function (key) {
    return contentLib.getChildren({
        key: key,
        count: -1
    }).hits;
};

exports.getPlayers = function (options) {
    options = options || {};
    var query;
    if (options.skipRetired) {
        query = "data.retired != 'true'";
    }
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":player"],
        query: query,
        sort: "displayName ASC"
    }).hits;
};

exports.getPlayer = function (playerId) {
    return contentLib.get({key: playerId});
};

exports.getPlayersByGame = function (game, winners) {

    var playerResults;
    if (winners == undefined) {
        playerResults = foosUtilLib.concat(game.data.winners, game.data.losers);
    } else if (winners) {
        playerResults = foosUtilLib.toArray(game.data.winners);
    } else {
        playerResults = foosUtilLib.toArray(game.data.losers);
    }

    return playerResults.map(function (playerResult) {
        return exports.getContentByKey(playerResult.playerId);
    });
};

exports.getTeams = function (options) {
    options = options || {};
    var query;
    if (options.skipRetired) {
        query = "data.retired != 'true'";
    }
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":team"],
        query: query,
        sort: "displayName ASC"
    }).hits;
};

exports.getPlayerTeams = function (playerId) {
    return contentLib.query({
        start: 0,
        count: -1,
        query: "data.playerIds = '" + playerId + "'",
        contentTypes: [app.name + ":team"],
        sort: "displayName ASC"
    }).hits;
};

exports.getTeamByPlayerIds = function (playerIds, createDummy) {
    var team = contentLib.query({
        start: 0,
        count: 1,
        query: "data.playerIds = '" + playerIds[0] + "' AND data.playerIds = '" + playerIds[1] + "'",
        contentTypes: [app.name + ":team"],
        sort: "displayName ASC"
    }).hits[0];

    if (!team && createDummy) {
        var player1DisplayName = exports.getContentByKey(playerIds[0]).displayName;
        var player2DisplayName = exports.getContentByKey(playerIds[1]).displayName;
        team = {
            displayName: "Team " + player1DisplayName + player2DisplayName
        }
    }

    return team;
};

exports.getTeamByGame = function (game, winning, createDummy) {
    var playerResults = winning ? game.data.winners : game.data.losers;
    var playerIds = playerResults.map(function (playerResult) {
        return playerResult.playerId
    });
    return exports.getTeamByPlayerIds(playerIds, createDummy);
};

exports.getLatestModificationTime = function () {
    return contentLib.query({
        start: 0,
        count: 1,
        query: "type != 'base:unstructured'",
        sort: "modifiedTime DESC"
    }).hits[0].modifiedTime;
};

exports.getLatestGameModificationTime = function () {
    return contentLib.query({
        start: 0,
        count: 1,
        contentTypes: [app.name + ":game"],
        sort: "modifiedTime DESC"
    }).hits[0].modifiedTime;
};

exports.getLatestWeek = function () {
    return contentLib.query({
        start: 0,
        count: 1,
        contentTypes: [app.name + ":week"],
        sort: "data.start DESC"
    }).hits[0];
};

exports.getWeeks = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":week"],
        sort: "data.start DESC"
    }).hits;
};

exports.getWeekCount = function () {
    return contentLib.query({
        start: 0,
        count: 0,
        contentTypes: [app.name + ":week"]
    }).total;
};

exports.getReleases = function () {
    return contentLib.query({
        start: 0,
        count: 10,
        contentTypes: [app.name + ":release"],
        sort: "data.date DESC"
    }).hits;
};

exports.getGames = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":game"],
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesByWeekPath = function (weekPath) {
    return contentLib.getChildren({
        key: weekPath,
        count: -1,
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesByPlayerId = function (playerId, count) {
    return contentLib.query({
        start: 0,
        count: count || -1,
        query: "data.winners.playerId = '" + playerId + "' OR data.losers.playerId = '" + playerId + "'",
        contentTypes: [app.name + ":game"],
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesByTeam = function (team, won) {
    var winnersQuery = "data.winners.playerId = '" + team.data.playerIds[0] + "' AND data.winners.playerId = '" + team.data.playerIds[1] +
                       "'";
    var losersQuery = "data.losers.playerId = '" + team.data.playerIds[0] + "' AND data.losers.playerId = '" + team.data.playerIds[1] + "'";

    var query;
    if (won == undefined) {
        query = "(" + winnersQuery + ") OR (" + losersQuery + ")";
    } else {
        if (won) {
            query = winnersQuery;
        } else {
            query = losersQuery;
        }
    }

    return contentLib.query({
        start: 0,
        count: -1,
        query: query,
        contentTypes: [app.name + ":game"],
        sort: "data.date DESC, displayName DESC"
    }).hits;
};

exports.getGamesSince = function (date, orderBy) {
    if (!date.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
        throw "Invalid date format (YYYY-MM-DD: " + date;
    }
    orderBy = orderBy || 'data.date ASC';

    return contentLib.query({
        start: 0,
        count: -1,
        query: "data.date > instant('" + date + "T00:00:00Z')",
        contentTypes: [app.name + ":game"],
        sort: orderBy
    }).hits;
};

exports.getTeamGames = function () {
    return exports.getGames().filter(function (game) {
        return game.data.winners.length > 1;
    });
};

exports.getTeamGamesBetween = function (start, end) {
    return exports.getTeamGames().filter(function (game) {
        return game.data.date.localeCompare(start) >= 0 && game.data.date.localeCompare(end) <= 0;
    });
};


exports.getPlayerStatsFolder = function () {
    var tmpFolder = createOrGetFolder(portalLib.getSite()._path, "Tmp");
    var statsFolder = createOrGetFolder(tmpFolder._path, "Stats");
    return createOrGetFolder(statsFolder._path, "Players");
};

function createOrGetFolder(parentPath, displayName) {
    var folder = contentLib.get({
        key: parentPath + "/" + displayName
    });

    if (!folder) {

        folder = contextLib.run({
                user: {
                    login: 'su',
                    userStore: 'system'
                }
            },
            function () {
                return contentLib.create({
                    parentPath: parentPath,
                    displayName: displayName,
                    contentType: "base:folder",
                    data: {}
                });
            });

    }
    return folder;
}
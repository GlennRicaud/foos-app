var contentLib = require('/lib/xp/content');
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

exports.getPlayers = function () {
    return contentLib.query({
        start: 0,
        count: -1,
        contentTypes: [app.name + ":player"],
        sort: "displayName ASC"
    }).hits;
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

exports.getTeams = function () {
    return contentLib.query({
        start: 0,
        count: -1,
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

exports.getGamesByPlayerId = function (playerId) {
    return contentLib.query({
        start: 0,
        count: -1,
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

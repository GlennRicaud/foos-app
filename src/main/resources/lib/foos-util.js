/*******************************************************
 * Business functions
 *******************************************************/

exports.isTeamGame = function (game) {
    return game.data.winners.length == 2;
}

exports.isWinner = function (game, playerId) {
    if (exports.isTeamGame(game)) {
        return game.data.winners.map(function (playerResult) {
                return playerResult.playerId;
            }).indexOf(playerId) > -1;
    }
    return game.data.winners.playerId == playerId;
}

exports.getPlayerResult = function (game, playerId) {
    return exports.concat(game.data.winners, game.data.losers).filter(function (playerResult) {
        return playerResult.playerId == playerId;
    })[0];
}

exports.getGoals = function (game, won) {
    var score = 0;
    var teamResults = won ? game.data.winners : game.data.losers;
    exports.toArray(teamResults).forEach(function (playerResult) {
        score += playerResult.score;
    });
    return score;
}

exports.getScore = function (game, won) {
    var score = exports.getGoals(game, won);
    var teamResults = won ? game.data.losers : game.data.winners;
    exports.toArray(teamResults).forEach(function (playerResult) {
        if (playerResult.against) {
            score += playerResult.against;
        }
    });
    return score;
}

/*******************************************************
 * Generic functions
 *******************************************************/

exports.toArray = function (object) {
    if (!object) {
        return [];
    }
    if (object.constructor === Array) {
        return object;
    }
    return [object];
};

exports.propertyArray = function (object) {
    var propertyArray = [];
    for (var propertyName in object) {
        var property = object[propertyName];
        property.propName = propertyName;
        propertyArray.push(property);
    }
    return propertyArray;
};

exports.concat = function (object1, object2) {
    return exports.toArray(object1).concat(exports.toArray(object2));
};

exports.toRatio = function (numerator, denominator) {
    return denominator <= 0 ? "N/A" : (numerator / denominator);
};

exports.toPercentageRatio = function (numerator, denominator) {
    return denominator <= 0 ? "N/A" : (numerator * 100 / denominator);
}

exports.log = function (message, object) {
    log.info(message + (object ? ": " + JSON.stringify(object, null, 2) : ""));
};


exports.ordinal = function (value) {
    if (!value) {
        return '';
    }
    switch (value) {
    case 1:
        return '1st';
    case 2:
        return '2nd';
    case 3:
        return '3rd';
    default:
        return value + 'th';
    }
};
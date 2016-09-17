var foosRatingLib = require('/lib/foos-rating');

// Recalculate players position (ranking) based on rating points already assigned for the player
exports.get = function () {
    foosRatingLib.updateRankings();

    return {
        contentType: 'application/json',
        body: {
            success: true
        }
    }
};

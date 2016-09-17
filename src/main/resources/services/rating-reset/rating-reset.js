var foosRatingLib = require('/lib/foos-rating');

// Reset all players to the same initial rating points and set rank=1
exports.get = function () {
    foosRatingLib.resetRatings();

    return {
        contentType: 'application/json',
        body: {
            success: true
        }
    }
};

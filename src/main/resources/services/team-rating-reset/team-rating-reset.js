var foosRatingLib = require('/lib/foos-rating');

// Reset all teams to the same initial rating points and set rank=1
exports.get = function () {
    foosRatingLib.resetTeamRatings();

    return {
        contentType: 'application/json',
        body: {
            success: true
        }
    }
};

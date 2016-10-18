var foosRatingLib = require('/lib/foos-rating');

// Recalculate teams position (ranking) based on rating points already assigned for the team
exports.get = function () {
    foosRatingLib.updateTeamRankings();

    return {
        contentType: 'application/json',
        body: {
            success: true
        }
    }
};

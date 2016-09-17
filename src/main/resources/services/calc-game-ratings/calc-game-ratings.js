var foosRatingLib = require('/lib/foos-rating');
var foosRetrievalLib = require('/lib/foos-retrieval');

// Calculate ratings for games since given date and update player stats accordingly
exports.get = function (req) {
    var since = req.params.since;
    if (!since.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
        return {
            contentType: 'application/json',
            body: {
                success: false,
                error: "Invalid date format in 'since' parameter (YYYY-MM-DD): " + since
            }
        }
    }

    var games = foosRetrievalLib.getGamesSince(since);
    games.forEach(function (game) {
        try {
            foosRatingLib.calculateGameRatings(game);
        } catch (error) {
            log.warning("Could not calculate game rankings for: " + game._path);
        }
    });

    return {
        contentType: 'application/json',
        body: {
            success: true
        }
    }
};

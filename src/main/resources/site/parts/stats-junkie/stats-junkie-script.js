$.ajax("{{playerStatsServiceUrl}}").done(function (data) {
    for (var playerName in data) {

    }
    $("#foos-stats-junkie-tmp-message").hide();
    //$("#foos-stats-junkie-table").html("");
});
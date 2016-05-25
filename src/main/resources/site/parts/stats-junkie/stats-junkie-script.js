$.ajax("{{playerStatsServiceUrl}}").done(function (data) {

    var index = 1;

    for (var playerName in data) {
        var template = "{{{playerStatsRowTemplate}}}";
        var row = Mustache.render(template, {displayName: playerName});
        $("#foos-stats-junkie-table").append(row);

    }
    $("#foos-stats-junkie-tmp-message").hide();
    //$("#foos-stats-junkie-table").html("");
});
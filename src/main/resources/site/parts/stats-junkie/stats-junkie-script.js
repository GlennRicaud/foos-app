$.ajax("{{playerStatsServiceUrl}}").done(function (data) {

    var index = 1;

    for (var playerName in data) {
        var template = '{{{playerStatsRowTemplate}}}';
        var row = Mustache.render(template, {
            even: (index % 2) == 0,
            rank: index,
            displayName: playerName,
            value: data[playerName].nbGames.total
        });
        $("#foos-stats-junkie-table").append(row);
        index++;
    }
    $("#foos-stats-junkie-tmp-message").hide();
    //$("#foos-stats-junkie-table").html("");
});
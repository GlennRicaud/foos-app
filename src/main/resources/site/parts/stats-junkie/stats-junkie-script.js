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

        if (index == 1) {
            for (var statName in data[playerName]) {
                $("#foos-stats-junkie-select").append("<option>" + data[playerName][statName].name + "</option>");
            }
        }
        index++;
    }


    $("#foos-stats-junkie-tmp-message").hide();
    //$("#foos-stats-junkie-table").html("");
});
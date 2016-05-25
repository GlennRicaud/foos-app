var playerStats;
$.ajax("{{playerStatsServiceUrl}}").done(function (data) {
    playerStats = data;

    var index = 1;

    var firstPlayer = data[Object.keys(data)[0]];
    var firstStatName = Object.keys(firstPlayer)[0];
    for (var statName in firstPlayer) {
        $("#foos-stats-junkie-select").append("<option value='" + statName + "'>" + firstPlayer[statName].name + "</option>");
    }
    

    for (var playerName in data) {
        var template = '{{{playerStatsRowTemplate}}}';
        var row = Mustache.render(template, {
            even: (index % 2) == 0,
            rank: index,
            displayName: playerName,
            value: data[playerName][firstStatName].total
        });

        $("#foos-stats-junkie-table").append(row);
        index++;
    }


    $("#foos-stats-junkie-tmp-message").hide();
    //$("#foos-stats-junkie-table").html("");
});
var playerStats;
$.ajax("{{playerStatsServiceUrl}}").done(function (data) {
    playerStats = data;

    var index = 1;

    var firstPlayer = data[0];
    var firstStatName = Object.keys(firstPlayer)[0];
    for (var statName in firstPlayer) {
        $("#foos-stats-junkie-select").append("<option value='" + statName + "'>" + firstPlayer[statName].name + "</option>");
    }

    data.sort(function (playerStats1, playerStats2) {
        return playerStats2[firstStatName].team - playerStats1[firstStatName].team
    });


    data.forEach(function (playerStats) {
        var template = '{{{playerStatsRowTemplate}}}';
        var row = Mustache.render(template, {
            even: (index % 2) == 0,
            rank: index,
            displayName: playerStats.playerName,
            soloValue: playerStats[firstStatName].solo,
            teamValue: playerStats[firstStatName].team,
            totalValue: playerStats[firstStatName].total
        });

        $("#foos-stats-junkie-table").append(row);
        index++;
    });


    $("#foos-stats-junkie-tmp-message").hide();
});
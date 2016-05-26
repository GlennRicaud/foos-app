var playerStats;
var currentStatName;

$.ajax("{{playerStatsServiceUrl}}").done(function (data) {
    playerStats = data;
    var firstPlayer = playerStats[0];
    currentStatName = Object.keys(firstPlayer)[0];
    for (var statName in firstPlayer) {
        $("#foos-stats-junkie-select").append("<option value='" + statName + "'>" + firstPlayer[statName].name + "</option>");
    }

    refreshFoosStatsJunkieTable();

    $("#foos-stats-junkie-tmp-message").hide();
});

function refreshFoosStatsJunkieTable() {
    playerStats.sort(function (playerStats1, playerStats2) {
        return playerStats2[currentStatName].team - playerStats1[currentStatName].team
    });


    var template = '{{{playerStatsRowTemplate}}}';
    var index = 1;
    playerStats.forEach(function (playerStats) {
        var row = Mustache.render(template, {
            even: (index % 2) == 0,
            rank: index,
            displayName: playerStats.playerName,
            soloValue: playerStats[currentStatName].solo,
            teamValue: playerStats[currentStatName].team,
            totalValue: playerStats[currentStatName].total
        });

        $("#foos-stats-junkie-table").append(row);
        index++;
    });
}
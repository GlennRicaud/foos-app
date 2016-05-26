var playerStats;
var currentStatName;

$.ajax("{{playerStatsServiceUrl}}").done(function (data) {
    playerStats = data;
    currentStatName = "score";

    var firstPlayer = playerStats[0];
    for (var statName in firstPlayer) {
        $("#foos-stats-junkie-select").append("<option value='" + statName + "'>" + firstPlayer[statName].name + "</option>");
    }

    $("#foos-stats-junkie-select").val(currentStatName);
    $("#foos-stats-junkie-select").change(function () {
        currentStatName = $("#foos-stats-junkie-select").val();
        refreshFoosStatsJunkieTable();
    });
    refreshFoosStatsJunkieTable();
    $("#foos-stats-junkie-tmp-message").remove();
});


function refreshFoosStatsJunkieTable() {
    $("#foos-stats-junkie-table .foos-body").remove();

    playerStats.sort(function (playerStats1, playerStats2) {
        return playerStats2[currentStatName].team - playerStats1[currentStatName].team
    });

    var template = '{{{playerStatsRowTemplate}}}';
    var index = 1;
    playerStats.forEach(function (playerStats) {
        console.log(playerStats.playerName + JSON.stringify(playerStats[currentStatName], null, 2));
        var row = Mustache.render(template, {
            even: (index % 2) == 0,
            rank: index,
            displayName: playerStats.playerName,
            soloValue: playerStats[currentStatName].solo,
            teamValue: playerStats[currentStatName].team.toFixed(0),
            totalValue: playerStats[currentStatName].total
        });

        $("#foos-stats-junkie-table").append(row);
        index++;
    });
}
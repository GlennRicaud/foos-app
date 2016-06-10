var playerStats;
var currentStatName = "score";

$("#foos-stats-junkie-select").val(currentStatName);
$("#foos-stats-junkie-select").change(function () {
    currentStatName = $("#foos-stats-junkie-select").val();
    refreshFoosStatsJunkieTable();
});

$.ajax("{{playerStatsServiceUrl}}").done(function (data) {
    playerStats = data;

    refreshFoosStatsJunkieTable();
    $("#foos-stats-junkie-tmp-message").remove();
});


function refreshFoosStatsJunkieTable() {
    $("#foos-stats-junkie-table .foos-body").remove();

    var ascSort = metaPlayerStats[currentStatName].order == "ASC";
    playerStats.sort(function (playerStats1, playerStats2) {

        var playerStatValue1 = playerStats1[currentStatName].team;
        var playerStatValue2 = playerStats2[currentStatName].team;
        
        if ("N/A" == playerStatValue1) {
            return ascSort ? -1 : 1;
        }
        if ("N/A" == playerStatValue2) {
            return ascSort ? 1 : -1;
        }
        return ascSort ? (playerStatValue1 - playerStatValue2) : (playerStatValue2 - playerStatValue1);
    });

    var template = '{{{playerStatsRowTemplate}}}';
    var index = 1;
    playerStats.forEach(function (playerStats) {
        var row = Mustache.render(template, {
            even: (index % 2) == 0,
            rank: index,
            displayName: playerStats.playerName,
            soloValue: formatValue(playerStats[currentStatName].solo),
            teamValue: formatValue(playerStats[currentStatName].team),
            totalValue: formatValue(playerStats[currentStatName].total)
        });

        $("#foos-stats-junkie-table").append(row);
        index++;
    });
}

function formatValue(number) {
    if (isNaN(number)) {
        return number;
    }
    return number % 1 === 0 ? number.toFixed(0) : number.toFixed(1);
}
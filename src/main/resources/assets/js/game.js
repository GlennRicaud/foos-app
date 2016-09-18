$(function () {
    var ctx = $('#gameChart');

    var dataWinner = [], dataLoser = [], goal, winnerScore = 0, loserScore = 0;
    dataWinner.push({x: 0, y: 0});
    dataLoser.push({x: 0, y: 0});
    for (var i = 0, l = GOALS.length; i < l; i++) {
        goal = GOALS[i];
        if (goal.teamScore === 'winner') {
            winnerScore++;
        } else {
            loserScore++;
        }
        dataWinner.push({
            x: goal.time,
            y: winnerScore,
            label: goal.player
        });
        dataLoser.push({
            x: goal.time,
            y: loserScore
        });
    }

    var ds1 = {
        label: WDN,
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(160,37,33,0.4)",
        borderColor: "rgba(160,37,33,1)",
        pointBorderColor: "rgba(160,37,33,1)",
        pointBackgroundColor: "#fff",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgba(160,37,33,1)",
        pointHoverBorderColor: "rgba(160,37,33,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 2,
        data: dataWinner
    };

    var ds2 = {
        label: LDN,
        fill: false,
        lineTension: 0,
        backgroundColor: "rgba(0,61,131,0.4)",
        borderColor: "rgba(0,61,131,1)",
        pointBorderColor: "rgba(0,61,131,1)",
        pointBackgroundColor: "#fff",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgba(0,61,131,1)",
        pointHoverBorderColor: "rgba(0,61,131,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 2,
        data: dataLoser
    };

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [ds1, ds2]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }],
                yAxes: [{
                    ticks: {
                        min: 0,
                        stepSize: 1
                    }
                }]
            }
        }
    });

});

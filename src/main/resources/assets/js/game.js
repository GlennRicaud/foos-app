$(function () {
    var ctx = $('#gameChart');

    var originalDraw = Chart.controllers.line.prototype.draw;
    Chart.controllers.line.prototype.draw = function (ease) {
        originalDraw.call(this, ease);
        var scale = this.chart.scales['x-axis-0'];
        var left = scale.getPixelForTick(tickIndex, false);
        // draw vertical line
        this.chart.chart.ctx.beginPath();
        this.chart.chart.ctx.strokeStyle = '#888888';
        this.chart.chart.ctx.lineWidth = 1.5;
        this.chart.chart.ctx.moveTo(left, 32);
        this.chart.chart.ctx.lineTo(left, 276);
        this.chart.chart.ctx.stroke();
    };

    var dataWinner = [], dataLoser = [], goal, winnerScore = 0, loserScore = 0, midTime = 0, tickIndex=0;
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
        if (midTime === 0 && ( winnerScore === 5 || loserScore === 5)) {
            midTime = goal.time;
        }
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
                    position: 'bottom',
                    ticks: {
                        min: 0,
                        callback: function (label, index, labels) {
                            return label == midTime ? '' : formatSeconds(parseInt(label, 10));
                        }
                    },
                    afterBuildTicks: function (chartTicks) {
                        if (chartTicks.ticks && chartTicks.ticks.length > 2) {
                            for (var i = 1; i < chartTicks.ticks.length; i++) {
                                if (chartTicks.ticks[i - 1] <= midTime && chartTicks.ticks[i] >= midTime) {
                                    chartTicks.ticks.splice(i, 0, midTime);
                                    tickIndex = i;
                                    break;
                                }
                            }
                        }
                    }
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

var formatSeconds = function (s) {
    if (s <= 0) {
        return '';
    }
    var date = new Date(null);
    date.setSeconds(s);
    if (s < 3600) {
        return date.toISOString().substr(14, 5)
    } else {
        return date.toISOString().substr(11, 8);
    }
};
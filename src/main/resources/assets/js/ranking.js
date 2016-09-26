var chart;

$(function () {

    $("#foosRankingPeriod").val(30);
    $('#foosRankingPeriod').on('change', function () {
        var period = $(this).val();
        loadData(period);
        $(this).blur();
    });
    loadSparklines();
    loadData(30)

});

function loadSparklines() {
    $.ajax({
        url: dataUrl,
        method: "GET",
        contentType: 'application/json',
        data: {
            p: 'sparkline'
        }
    }).done(function (data) {
        showSparklines(data.players);
    }).fail(function (jqXHR, textStatus) {
        //
    });
}

function showSparklines(players) {
    var player, i;
    for (i = 0; i < players.length; i++) {
        player = players[i];
        var target = $('table.foos-ranking-table').find('[data-player-id="' + player.name + '"]');
        console.log(target);
        target.sparkline(player.points, {type: 'bar', barColor: '#0000d0 ', negBarColor: '#d02020'});
    }
}

function loadData(period) {
    if (chart) {
        chart.destroy();
    }
    $.ajax({
        url: dataUrl,
        method: "GET",
        contentType: 'application/json',
        data: {
            p: 'chartData',
            period: period
        }
    }).done(function (data) {
        showChart(data.players, data.count, data.baseTime);
    }).fail(function (jqXHR, textStatus) {
        //
    });
}

function showChart(players, count, baseTime) {
    var ctx = $('#ratingChart');

    var datasets = [], player, dataset, playerRankings, point, colors, color, i = 0;
    colors = randomColors(count);

    for (var playerId in players) {
        player = players[playerId];
        playerRankings = [];
        for (var j = 0, m = player.points.length; j < m; j++) {
            point = player.points[j];
            playerRankings.push({
                x: new Date((baseTime + point.t) * 1000),
                y: point.v
            });
        }
        color = colors[i];

        dataset = {
            label: player.name,
            fill: false,
            lineTension: 0,
            backgroundColor: "rgba(" + color + ",0.4)",
            borderColor: "rgba(" + color + ",.5)",
            pointBorderColor: "rgba(" + color + ",.5)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(" + color + ",1)",
            pointHoverBorderColor: "rgba(" + color + ",1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,

            data: playerRankings
        };
        datasets.push(dataset);
        i++;
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets,
        },
        options: {
            title: {
                display: true,
                text: 'Ranking points - Last 90 days'
            },
            hover: {
                mode: 'single'
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    unit: 'day',
                    unitStepSize: 1,
                    time: {
                        displayFormats: {
                            'day': 'MMM DD'
                        }
                    }
                }],
                yAxes: [{
                    /*ticks: {
                     min: 0,
                     stepSize: 1
                     }*/
                }]
            }
        }
    });
}

function randomColors(total) {
    var i = 360 / (total - 1); // distribute the colors evenly on the hue range
    var r = []; // hold the generated colors
    for (var x = 0; x < total; x++) {
        r.push(hsvToRgb(i * x, 100, 100)); // you can also alternate the saturation and value for even more contrast between the colors
    }
    return r;
}

var hsvToRgb = function (h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if (s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch (i) {
    case 0:
        r = v;
        g = t;
        b = p;
        break;

    case 1:
        r = q;
        g = v;
        b = p;
        break;

    case 2:
        r = p;
        g = v;
        b = t;
        break;

    case 3:
        r = p;
        g = q;
        b = v;
        break;

    case 4:
        r = t;
        g = p;
        b = v;
        break;

    default: // case 5:
        r = v;
        g = p;
        b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};
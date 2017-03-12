(function ($, svcUrl) {
    "use strict";
    var ws, connected, keepAliveIntervalId;
    var startTime, endTime, gameFinished = false;

    $(function () {
        wsConnect();
        setInterval(updateElapsedTime, 1000);
    });

    // WS - EVENTS

    var wsConnect = function () {
        ws = new WebSocket(getWebSocketUrl(svcUrl), ['foos-game']);
        ws.onopen = onWsOpen;
        ws.onclose = onWsClose;
        ws.onmessage = onWsMessage;
    };

    var onWsOpen = function () {
        //console.log('connect WS');
        keepAliveIntervalId = setInterval(function () {
            if (connected) {
                ws.send('{"action":"KeepAlive"}');
            }
        }, 30 * 1000);
        connected = true;
    };

    var onWsClose = function () {
        clearInterval(keepAliveIntervalId);
        connected = false;

        setTimeout(wsConnect, 2000); // attempt to reconnect
    };

    var onWsMessage = function (event) {
        var gameState = JSON.parse(event.data);
        //console.log('WS onWsMessage', gameState);
        displayGameDetails(gameState);
    };

    var getWebSocketUrl = function (path) {
        var l = window.location;
        return ((l.protocol === "https:") ? "wss://" : "ws://") + l.host + path;
    };

    var hideGameDetails = function () {
        $('.foos-game-details,.foos-game-title').hide();
        $('#foos-main-container').addClass('foos-main-container-broadcast');
        $('.foos-broadcast-nogames').show();
    };

    var displayGameDetails = function (gameState) {
        if (!gameState.winners) {
            hideGameDetails();
            return;
        }
        $('#foos-main-container').removeClass('foos-main-container-broadcast');
        gameFinished = checkGameFinished(gameState);

        if (gameState.teamGame) {
            $('#winnersDisplayName').text(gameState.teamWinner.displayName);
            $('#losersDisplayName').text(gameState.teamLoser.displayName);
            $('#loserTeamRatingDiff').text(''/*'0'*/);
            $('#winnerTeamRatingDiff').text(''/*'0'*/);

            $('#winnerImageUrl1').attr('src', gameState.winners[1].imageUrl);
            $('#winnerImageUrl2').attr('src', gameState.winners[0].imageUrl);
            $('#loserImageUrl1').attr('src', gameState.losers[0].imageUrl);
            $('#loserImageUrl2').attr('src', gameState.losers[1].imageUrl);

            $('#winner1').text(playerGoalsText(gameState.winners[1]));
            $('#winner2').text(playerGoalsText(gameState.winners[0]));
            $('#loser1').text(playerGoalsText(gameState.losers[0]));
            $('#loser2').text(playerGoalsText(gameState.losers[1]));
            $('#loser2').parent().show();
            $('#winner2').parent().show();

            $('#winnerRating1').text(''/*'0'*/);
            $('#winnerRating2').text(''/*'0'*/);
            $('#loserRating1').text(''/*'0'*/);
            $('#loserRating2').text(''/*'0'*/);
        } else {
            $('#winnersDisplayName').text(gameState.winners[0].displayName);
            $('#losersDisplayName').text(gameState.losers[0].displayName);
            $('#loserTeamRatingDiff').text('');
            $('#winnerTeamRatingDiff').text('');

            $('#winnerImageUrl1').attr('src', gameState.winners[0].imageUrl);
            $('#loserImageUrl1').attr('src', gameState.losers[0].imageUrl);

            $('#winner1').text(playerGoalsText(gameState.winners[0]));
            $('#loser1').text(playerGoalsText(gameState.losers[0]));
            $('#loser2').parent().hide();
            $('#winner2').parent().hide();

            $('#winnerRating1').text(''/*'0'*/);
            $('#winnerRating2').text(''/*'0'*/);
            $('#loserRating1').text(''/*'0'*/);
            $('#loserRating2').text(''/*'0'*/);
        }

        $('#losersScore').text(gameState.teamLoser.score);
        $('#winnersScore').text(gameState.teamWinner.score);
        if (gameFinished) {
            if (gameState.teamLoser.score > gameState.teamWinner.score) {
                $('#losersScore').addClass('foos-game-score-victory');
            } else {
                $('#winnersScore').addClass('foos-game-score-victory');
            }
            $('#broadcastGameTitle').text('Game Over');
        } else {
            $('#losersScore,#winnersScore').removeClass('foos-game-score-victory');
            $('#broadcastGameTitle').text('Live Game');
        }

        startTime = new Date(Math.floor(new Date().getTime() - (gameState.elapsedTime * 1000)));
        updateElapsedTime();

        $('.foos-game-details,.foos-game-title,#gameStatsContainer').show();
        $('.foos-broadcast-nogames').hide();

        if (gameState.teamLoser.score > 0 || gameState.teamWinner.score > 0) {
            displayChart(gameState);
            $('#gameChartContainer').show();
        } else {
            $('#gameChartContainer').hide();
        }
    };

    var playerGoalsText = function (player) {
        return player.displayName + ': ' + player.score + ' goals' + (player.against ? '(+' + player.against + ' against)' : '');
    };

    var updateElapsedTime = function () {
        if (gameFinished) {
            if (!endTime) {
                endTime = new Date();
            }
            $('#elapsedTime').text(timeDiffFormat(startTime, endTime)).show();
        } else if (startTime) {
            $('#elapsedTime').text(timeDiffFormat(startTime, new Date())).show();
            endTime = undefined;
        } else {
            $('#elapsedTime').hide();
        }
    };

    var timeDiffFormat = function (from, to) {
        var delta = Math.abs(to - from) / 1000;
        var days = Math.floor(delta / 86400);
        delta -= days * 86400;
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;
        var seconds = Math.floor(delta % 60);

        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return (hours === '00') ? minutes + ':' + seconds : hours + ':' + minutes + ':' + seconds;
    };

    var checkGameFinished = function (gameState) {
        var scoreA = gameState.teamLoser.score;
        var scoreB = gameState.teamWinner.score;
        return ((scoreA >= 10 || scoreB >= 10) && (Math.abs(scoreB - scoreA) >= 2));
    };

    var isGoalFromWinnerTeam = function (goal, gameState) {
        var p = goal.playerId;
        for (var w = 0; w < gameState.winners.length; w++) {
            if (gameState.winners[w].playerId === p) {
                return !goal.against;
            }
        }
        return !!goal.against;
    };

    var displayChart = function (gameState) {
        var ctx = $('#gameChart');

        var dataWinner = [], dataLoser = [], goal, winnerScore = 0, loserScore = 0;
        dataWinner.push({x: 0, y: 0});
        dataLoser.push({x: 0, y: 0});
        for (var i = 0, l = gameState.goals.length; i < l; i++) {
            goal = gameState.goals[i];
            if (isGoalFromWinnerTeam(goal, gameState)) {
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
                y: loserScore,
                label: goal.player
            });
        }

        var ds1 = {
            label: gameState.teamWinner.displayName,
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
            label: gameState.teamLoser.displayName,
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
                                return formatSeconds(parseInt(label, 10));
                            }
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0,
                            max: Math.max(winnerScore, loserScore, 10),
                            stepSize: 1
                        }
                    }]
                }
            }
        });
    };

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

}($, SVC_URL));
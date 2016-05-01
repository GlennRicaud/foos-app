var GAME = (function () {
    const PLAYER1 = 0;
    const PLAYER2 = 1;
    const PLAYER3 = 2;
    const PLAYER4 = 3;

    const TEAM1 = 0;
    const TEAM2 = 1;

    var teams = [
        {
            score: 0
        },
        {
            score: 0
        }
    ];

    var postUrl;
    var audioUrl;
    var players = [];
    var gamePlayers = [0, 0, 0, 0];
    var gamePlayersDivs = ['player1', 'player2', 'player3', 'player4'];
    var gameStarted = false;
    var gameEnded = false;
    var playerSelected = -1;
    var gameSavedUrl;
    var singlesGame = false;

    toggleRight = function (show) {
        $('#player3, #player4, #goal-right').toggle(show);
    };

    toggleLeft = function (show) {
        $('#player1, #player2, #goal-left').toggle(show);
    };

    toggleMiddle = function (show) {
        $('.ball, .circle').toggle(show);
    };

    toggleScores = function (show) {
        $('.score-left, .score-right').toggle(show);
    };

    toggleStart = function (show) {
        $('#title').toggle(show);
    };

    initPlayerSelection = function () {
        if (players.length === 0) {
            return;
        }
        var i = 0, l = players.length;
        gamePlayers[PLAYER1] = i % l;
        gamePlayers[PLAYER2] = (i + 1) % l;
        gamePlayers[PLAYER3] = (i + 2) % l;
        gamePlayers[PLAYER4] = (i + 3) % l;
        loadSelectedPlayers();

        $('#player1').on('click', {pid: PLAYER1}, onSelectPlayer);
        $('#player2').on('click', {pid: PLAYER2}, onSelectPlayer);
        $('#player3').on('click', {pid: PLAYER3}, onSelectPlayer);
        $('#player4').on('click', {pid: PLAYER4}, onSelectPlayer);
        $('#title').on('click', onStart);
        $('#goal-left').on('click', onSelectGoal);
        $('#goal-right').on('click', onSelectGoal);
        $('#mainRegion').on('click', onFieldClick);

        showPlayers();

        toggleMiddle(false);
        $('#title span').text('Play');
        toggleStart(true);
    };

    onFieldClick = function () {
        if (gameSavedUrl) {
            window.location.href = gameSavedUrl;
        }
    };

    showPlayers = function () {
        showPlayer(PLAYER1);
        showPlayer(PLAYER2);
        showPlayer(PLAYER3);
        showPlayer(PLAYER4);
    };

    showPlayer = function (playerIdx) {
        var div = $('#' + gamePlayersDivs[playerIdx]);
        var player = players[gamePlayers[playerIdx]];
        div.find('img').attr('src', player.pictureUrl);
        div.find('.player-name').text(player.displayName);
        div.find('.player-score').text(player.against ? "+" + player.goals + " -" + player.against + "" : "+" + player.goals);
    };

    showScore = function () {
        $('#scoreleft').text(teams[TEAM1].score);
        $('#scoreright').text(teams[TEAM2].score);
    };

    onSelectPlayer = function (e) {
        if (gameEnded) {
            return;
        }

        var pid = e.data.pid;
        var div = $('#' + gamePlayersDivs[pid]);

        if (!gameStarted) {
            gamePlayers[pid] = (gamePlayers[pid] + 1) % players.length;
            showPlayers();
            playerSelected = pid;

        } else {
            if (playerSelected === pid) {
                playerSelected = -1;
                $('#goal-right,#goal-left').removeClass('selected');
                showActivePlayers();
            } else {
                playerSelected = pid;
                $('.player').hide();
                div.show();
                $('#goal-right,#goal-left').addClass('selected');
            }
        }
    };

    onSelectGoal = function (e) {
        if (!gameStarted || (playerSelected == -1)) {
            singlesGame = !singlesGame;
            $('#player2,#player4').toggle(!singlesGame);
            return;
        }
        var tid = playerSelected < 2 ? TEAM1 : TEAM2;
        var scorerTeam = teams[tid];
        var receiverTeam = teams[(tid + 1) % 2];
        var player = players[gamePlayers[playerSelected]];

        if ($(this).get(0).id === 'goal-left') {
            if (tid === TEAM1) {
                receiverTeam.score += 1;
                player.against += 1;
            } else {
                scorerTeam.score += 1;
                player.goals += 1;
            }
        } else {
            if (tid === TEAM1) {
                scorerTeam.score += 1;
                player.goals += 1;
            } else {
                receiverTeam.score += 1;
                player.against += 1;
            }
        }

        showPlayer(playerSelected);
        showScore();
        showActivePlayers();
        $('#goal-right,#goal-left').removeClass('selected');

        playerSelected = -1;

        checkEndGame();
    };

    showActivePlayers = function () {
        $('.player').show();
        if (singlesGame) {
            $('#player2,#player4').hide();
        }
    };

    onStart = function (e) {
        toggleStart(false);
        toggleScores(true);
        toggleMiddle(true);
        showActivePlayers();

        teams[TEAM1].score = 0;
        teams[TEAM2].score = 0;
        showScore();

        gameStarted = true;

        saveSelectedPlayers();
    };

    checkEndGame = function () {
        var score1 = teams[TEAM1].score;
        var score2 = teams[TEAM2].score;
        if ((score1 >= 10 || score2 >= 10) && Math.abs(score1 - score2) >= 2) {
            var winner = score1 > score2 ? TEAM1 : TEAM2;
            toggleMiddle(false);
            if (winner == TEAM1) {
                $('#scoreleft,#player1,#player2').addClass('start-blink');
            } else {
                $('#scoreright,#player3,#player4').addClass('start-blink');
            }
            gameStarted = false;
            gameEnded = true;
            playVictoryAudio();
            sendGameData();
        }
    };

    playVictoryAudio = function () {
        try {
            if (audioUrl) {
                var audioElement = $('#gameAudio');
                audioElement.attr("src", audioUrl);
                startElementAudio(audioElement, 200);
            }
        } catch (e) {
            console && console.log(e);
        }
    };

    function startElementAudio(audioElement, fadeTime) {
        audioElement[0].volume = 0;
        audioElement.animate({volume: 1}, fadeTime);
        audioElement.trigger("play");
    }

    sendGameData = function () {
        var data = {}, winners = [], losers = [];
        var score1 = teams[TEAM1].score;
        var score2 = teams[TEAM2].score;
        var winner = score1 > score2 ? TEAM1 : TEAM2;

        var pid, player, playerResult;
        for (pid = 0; pid < gamePlayers.length; pid++) {
            if (singlesGame && (pid === PLAYER2 || pid === PLAYER4)) {
                continue;
            }
            player = players[gamePlayers[pid]];
            playerResult = {};
            playerResult.playerId = player.id;
            playerResult.score = player.goals;
            playerResult.against = player.against;
            var playerTeam = (pid / 2) >> 0;
            if (playerTeam === winner) {
                winners.push(playerResult);
            } else {
                losers.push(playerResult);
            }
        }
        data.winners = winners;
        data.losers = losers;

        $.ajax({
            url: postUrl,
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                gameSavedUrl = data.weekUrl;
                $('#field').addClass('game-over');
                setTimeout(function () {
                    window.location.href = gameSavedUrl;
                }, 30000);
            },
            data: JSON.stringify(data)
        });
    };

    doInitialize = function (data) {
        players = data.players;
        for (var i = 0; i < players.length; i++) {
            players[i].goals = 0;
            players[i].against = 0;
        }
        postUrl = data.postUrl;
        audioUrl = data.audioUrl;
        initPlayerSelection();
    };

    saveSelectedPlayers = function () {
        if (!localStorage) {
            return;
        }
        var p1 = players[gamePlayers[PLAYER1]];
        var p2 = players[gamePlayers[PLAYER2]];
        var p3 = players[gamePlayers[PLAYER3]];
        var p4 = players[gamePlayers[PLAYER4]];
        var selectedPlayers = [p1.name, p2.name, p3.name, p4.name];
        localStorage.setItem('players', selectedPlayers.join('/'));
    };

    loadSelectedPlayers = function () {
        if (!localStorage) {
            return;
        }
        var playersStored = localStorage.getItem('players');
        if (!playersStored) {
            return;
        }
        var playerNames = playersStored.split('/');
        if (playerNames.length != 4) {
            return;
        }

        var i, l = players.length;
        for (i = 0; i < l; i++) {
            if (playerNames[PLAYER1] === players[i].name) {
                gamePlayers[PLAYER1] = i;
            }
            if (playerNames[PLAYER2] === players[i].name) {
                gamePlayers[PLAYER2] = i;
            }
            if (playerNames[PLAYER3] === players[i].name) {
                gamePlayers[PLAYER3] = i;
            }
            if (playerNames[PLAYER4] === players[i].name) {
                gamePlayers[PLAYER4] = i;
            }
        }
    };

    return {
        initialize: function (data) {
            doInitialize(data);

            toggleLeft(true);
            toggleMiddle(false);
            toggleRight(true);
            toggleScores(false);
        }
    };

})();

$(function () {
    GAME.initialize(data);
});

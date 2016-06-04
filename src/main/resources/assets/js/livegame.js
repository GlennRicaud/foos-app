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
    var gamePlayers = [-1, -1, -1, -1];
    var gamePlayersDivs = ['player1', 'player2', 'player3', 'player4'];
    var gameStarted = false;
    var gameEnded = false;
    var lastTime, totalTimeSec, pauseTime;
    var playerSelected = -1;
    var gameSavedUrl;
    var singlesGame = false;
    var goals = [];
    var paused = false;
    var shuffleCountDown = false;

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
        $('#player1').on('click', {pid: PLAYER1}, onSelectPlayer);
        $('#player2').on('click', {pid: PLAYER2}, onSelectPlayer);
        $('#player3').on('click', {pid: PLAYER3}, onSelectPlayer);
        $('#player4').on('click', {pid: PLAYER4}, onSelectPlayer);
        $('#goal-left').on('click', onSelectGoal);
        $('#goal-right').on('click', onSelectGoal);
        $('#mainRegion').on('click', onFieldClick);
        $('.circle').on('click', onCircleClick);

        toggleMiddle(false);
        $('#title span').text('Play');
        toggleStart(true);
    };

    onCircleClick = function () {
        paused = !paused;
        $('.circle,#field').toggleClass('paused-game', paused);
        $('.ball').toggleClass('paused-game-alt', paused);
        if (paused) {
            pauseTime = new Date();
        } else {
            var now = new Date();
            var pausedTime = now.getTime() - pauseTime.getTime();
            // console.log('Paused time: ' + pausedTime);
            // console.log('lastTime: ' + lastTime);
            lastTime = new Date(lastTime.getTime() + pausedTime);
            // console.log('new lastTime: ' + lastTime);
        }
    };

    onFieldClick = function () {
        if (gameSavedUrl) {
            window.location.href = gameSavedUrl;
        }
    };

    addGoal = function (player, against) {
        var now = new Date();
        var offsetSeconds = Math.abs((now.getTime() - lastTime.getTime()) / 1000);
        lastTime = now;
        totalTimeSec += offsetSeconds;
        var goalInfo = {playerId: player.id, time: totalTimeSec, against: against};
        goals.push(goalInfo);
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
        if (!player) {
            return;
        }
        div.find('img').attr('src', player.pictureUrl);
        div.find('.player-name').text(player.displayName);
        div.find('.player-score').text(player.against ? "+" + player.goals + " -" + player.against + "" : "+" + player.goals);
    };

    showScore = function () {
        $('#scoreleft').text(teams[TEAM1].score);
        $('#scoreright').text(teams[TEAM2].score);
    };

    onSelectPlayer = function (e) {
        if (gameEnded || paused) {
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

    onSelectGoal = function () {
        if (paused) {
            return;
        }
        if (!gameStarted || (playerSelected == -1)) {
            if (!gameStarted) {
                singlesGame = !singlesGame;
                $('#player2,#player4').toggle(!singlesGame);
            }
            return;
        }
        var tid = playerSelected < 2 ? TEAM1 : TEAM2;
        var scorerTeam = teams[tid];
        var receiverTeam = teams[(tid + 1) % 2];
        var player = players[gamePlayers[playerSelected]];
        var against = false;

        if ($(this).get(0).id === 'goal-left') {
            if (tid === TEAM1) {
                receiverTeam.score += 1;
                player.against += 1;
                against = true;
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
                against = true;
            }
        }
        addGoal(player, against);

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

    doStart = function () {
        toggleStart(false);
        toggleScores(true);
        toggleMiddle(true);
        showActivePlayers();

        teams[TEAM1].score = 0;
        teams[TEAM2].score = 0;
        showScore();

        gameStarted = true;
        lastTime = new Date();
        totalTimeSec = 0;
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
        data.goals = goals;

        $.ajax({
            url: postUrl,
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                gameSavedUrl = data.gameUrl;
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

    getPlayerIndex = function (playerId) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].id === playerId) {
                return i;
            }
        }
        return -1;
    };

    onPlayerClick = function (e) {
        var pSelected = e.data.p;
        var playerIdx = getPlayerIndex(pSelected.id);

        for (var pid = 0; pid < gamePlayers.length; pid++) {
            if (gamePlayers[pid] == playerIdx) {
                return;
            }
            if (singlesGame && (pid === PLAYER2 || pid == PLAYER3)) {
                continue;
            }
            if (gamePlayers[pid] === -1) {
                break;
            }
        }
        var div = $('#teamPlayer' + (pid + 1));
        div.addClass('selected');
        div.find('img').attr('src', pSelected.pictureUrl);

        gamePlayers[pid] = playerIdx;

        if (pid == 3) {
            $('.players').hide();
            $('.gameActions').show();
            $('#playerSelection').addClass('playerSelectionDone');
            $('.gameActionShuffle').toggle(!singlesGame);
        }
    };

    shuffleArray = function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    };

    gameSelectionStartClick = function (data) {
        // switch p3&p4, different layout in field
        p3 = gamePlayers[PLAYER3];
        p4 = gamePlayers[PLAYER4];
        gamePlayers[PLAYER4] = p3;
        gamePlayers[PLAYER3] = p4;
        showPlayers();

        $('#gameSelection').hide();
        $('#mainRegion').show();

        $('#player2,#player4').toggle(!singlesGame);

        doStart();
    };

    gameSelectionShuffleClick = function () {
        $('.gameActionStart,.gameActionShuffle').css('visibility', 'hidden');
        shuffleCountDown = 20;
        doShuffle();
    };

    teamPlayerClick = function () {
        if (gamePlayers[PLAYER2] != -1) {
            return;
        }
        singlesGame = !singlesGame;
        $('#teamPlayer2,#teamPlayer3').css('visibility', singlesGame ? 'hidden' : 'visible');
    };

    doShuffle = function () {
        shuffleArray(gamePlayers);
        showTeamSelectionPlayers();

        shuffleCountDown--;
        if (shuffleCountDown === 0) {
            $('.gameActionStart,.gameActionShuffle').css('visibility', 'visible');
            return;
        }
        setTimeout(doShuffle, 50);
    };

    showTeamSelectionPlayers = function () {
        for (var playerIdx = PLAYER1; playerIdx <= PLAYER4; playerIdx++) {
            var div = $('#teamPlayer' + (playerIdx + 1));
            var player = players[gamePlayers[playerIdx]];
            div.addClass('selected');
            div.find('img').attr('src', player.pictureUrl);
        }
    };

    doInitializeTeamSelection = function (data) {
        var players = data.players, player, playerEls = [], playerEl, playerNameDiv, playerImg, count = players.length;
        var photoWidth, lineSize, width;

        width = $('body').width() - 20;
        lineSize = Math.ceil(count / 2);
        photoWidth = Math.floor(width / lineSize);
        photoWidth = Math.floor(photoWidth / 10) * 10;
        console.log(players);
        for (var i = 0; i < count; i++) {
            player = players[i];
            playerEl = $('<div class="player-option"/>');
            playerNameDiv = $('<div class="player-name"/>').text(player.name);
            playerImg = $('<img class="player-photo"/>').attr('src', player.pictureUrl).css('width', photoWidth + 'px');
            playerEl.append(playerNameDiv).append(playerImg);
            playerEl.on('click', {p: player}, onPlayerClick);
            playerEls.push(playerEl);
        }

        $('.players').width((photoWidth) * lineSize).append(playerEls);
        $('.gameActions').width((photoWidth) * lineSize);

        $('.gameActionStart').on('click', gameSelectionStartClick);
        $('.gameActionShuffle').on('click', gameSelectionShuffleClick);
        $('.team-player').on('click', teamPlayerClick);
    };

    return {
        initialize: function (data) {
            doInitialize(data);
            doInitializeTeamSelection(data);

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

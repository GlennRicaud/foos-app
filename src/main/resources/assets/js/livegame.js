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

    var postUrl, broadcastGameUrl;
    var audioUrl, firstGoalAudio, goal3Audio, goal5Audio, goal7Audio, goal8Audio;
    var players = [];
    var gamePlayers = [-1, -1, -1, -1];
    var gamePlayersDivs = ['player1', 'player2', 'player3', 'player4'];
    var gameStarted = false;
    var gameEnded = false;
    var lastTime, totalTimeSec, pauseTime;
    var playerSelected = -1;
    var gameSavedUrl;
    var singlesGame = false;
    var goals = [], undoGoals, undoIndex = -1;
    var team1Streak = 0;
    var team2Streak = 0;
    var firstGoal = false;
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
        $('.circle,img.pause-icon').on('click', onPauseClick);
        $('img.undo-icon').on('click', onUndoClick);
        $('img.redo-icon').on('click', onRedoClick);

        toggleMiddle(false);
        $('#title span').text('Play');
        toggleStart(true);
    };

    onPauseClick = function () {
        paused = !paused;
        $('#field').toggleClass('paused-game', paused);
        $('.pause-icon').toggleClass('pause-blink', paused);
        $('.circle,.middle,.ball').toggle(!paused);
        $('.game-controls').toggle(paused);
        if (paused) {
            pauseTime = new Date();
            undoGoals = $.extend(true, [], goals);
            undoIndex = goals.length;
            $('img.undo-icon').toggleClass('control-disabled', undoIndex <= 0);
            $('img.redo-icon').toggleClass('control-disabled', undoIndex >= undoGoals.length);

        } else {
            var now = new Date();
            var pausedTime = now.getTime() - pauseTime.getTime();
            // console.log('Paused time: ' + pausedTime);
            // console.log('lastTime: ' + lastTime);
            lastTime = new Date(lastTime.getTime() + pausedTime);
            // console.log('new lastTime: ' + lastTime);
            undoGoals = [];
            undoIndex = -1;

            sendCurrentGameState();
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

    onUndoClick = function (e) {
        e.preventDefault();
        $(this).blur();
        if ($(this).hasClass('control-disabled')) {
            return;
        }
        goals = $.extend(true, [], undoGoals);
        undoIndex--;
        goals = goals.slice(0, undoIndex);

        undoRedoRefresh();
    };

    onRedoClick = function (e) {
        e.preventDefault();
        $(this).blur();
        if ($(this).hasClass('control-disabled')) {
            return;
        }
        goals = $.extend(true, [], undoGoals);
        undoIndex++;
        goals = goals.slice(0, undoIndex);

        undoRedoRefresh();
    };

    undoRedoRefresh = function () {
        resetHistory();
        replayHistory();
        showScore();
        showPlayers();

        $('img.undo-icon').toggleClass('control-disabled', undoIndex <= 0);
        $('img.redo-icon').toggleClass('control-disabled', undoIndex >= undoGoals.length);
    };

    getPlayerById = function (id) {
        return players.filter(function (p) {
            return p.id === id;
        })[0];
    };

    getPlayerTeam = function (player) {
        var idx = -1;
        for (var i = 0; i < players.length; i++) {
            if (players[i].id === player.id) {
                idx = i;
                break;
            }
        }
        if (gamePlayers[PLAYER1] === idx || gamePlayers[PLAYER2] === idx) {
            return TEAM1;
        }
        return TEAM2;
    };

    resetHistory = function () {
        teams[TEAM1].score = 0;
        teams[TEAM2].score = 0;
        team1Streak = 0;
        team2Streak = 0;

        if (singlesGame) {
            players[gamePlayers[PLAYER1]].goals = 0;
            players[gamePlayers[PLAYER1]].against = 0;
            players[gamePlayers[PLAYER3]].goals = 0;
            players[gamePlayers[PLAYER3]].against = 0;
        } else {
            players[gamePlayers[PLAYER1]].goals = 0;
            players[gamePlayers[PLAYER1]].against = 0;
            players[gamePlayers[PLAYER2]].goals = 0;
            players[gamePlayers[PLAYER2]].against = 0;
            players[gamePlayers[PLAYER3]].goals = 0;
            players[gamePlayers[PLAYER3]].against = 0;
            players[gamePlayers[PLAYER4]].goals = 0;
            players[gamePlayers[PLAYER4]].against = 0;
        }
    };

    replayHistory = function () {
        var pl, goal, tid;
        for (var g = 0; g < goals.length; g++) {
            goal = goals[g];
            pl = getPlayerById(goal.playerId);
            tid = getPlayerTeam(pl);

            if (goal.against) {
                pl.against++;
            } else {
                pl.goals++;
            }

            if (tid === TEAM1) {
                if (goal.against) {
                    teams[TEAM2].score += 1;
                } else {
                    teams[TEAM1].score += 1;
                    team1Streak++;
                    team2Streak = 0;
                }
            } else {
                if (goal.against) {
                    teams[TEAM1].score += 1;
                } else {
                    teams[TEAM2].score += 1;
                    team2Streak++;
                    team1Streak = 0;
                }
            }
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

    sendCurrentGameState = function () {
        var data = createGameData(true);
        $.ajax({
            url: broadcastGameUrl,
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function () {
                // console.log('Game broadcast update sent');
            },
            data: JSON.stringify(data)
        });
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

                team2Streak++;
                team1Streak = 0;
            }
        } else {
            if (tid === TEAM1) {
                scorerTeam.score += 1;
                player.goals += 1;

                team1Streak++;
                team2Streak = 0;
            } else {
                receiverTeam.score += 1;
                player.against += 1;
                against = true;
            }
        }
        addGoal(player, against);
        sendCurrentGameState();

        showPlayer(playerSelected);
        showScore();
        showActivePlayers();
        $('#goal-right,#goal-left').removeClass('selected');

        playerSelected = -1;

        var streak = team1Streak > team2Streak ? team1Streak : team2Streak;
        if (!against) {
            if (!firstGoal) {
                firstGoal = true;
                playAudio(firstGoalAudio);
            } else if (streak === 3) {
                playAudio(goal3Audio);
            } else if (streak === 5) {
                playAudio(goal5Audio);
            } else if (streak === 7) {
                playAudio(goal7Audio);
            } else if (streak === 8) {
                playAudio(goal8Audio);
            }
        }

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

        sendCurrentGameState();
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
        playAudio(audioUrl, 200);
    };

    playAudio = function (url, fadeTime) {
        if (!url) {
            return;
        }
        fadeTime = fadeTime || 0;
        try {
            var audioElement = $('#gameAudio');
            audioElement.attr("src", url);
            startElementAudio(audioElement, fadeTime);

        } catch (e) {
            console && console.log(e);
        }
    };

    function startElementAudio(audioElement, fadeTime) {
        audioElement[0].volume = 0;
        audioElement.animate({volume: 1}, fadeTime);
        audioElement.trigger("play");
    }

    createGameData = function (includeRating) {
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
            if (includeRating) {
                playerResult.rating = player.rating;
            }
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

        var offsetSeconds = Math.abs((new Date().getTime() - lastTime.getTime()) / 1000);
        data.elapsedTime = totalTimeSec + offsetSeconds;

        return data;
    };

    sendGameData = function () {
        var data = createGameData(false);
        $.ajax({
            url: postUrl,
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                gameSavedUrl = data.gameUrl;
                $('#field').addClass('game-over');
                var redirectDelay = audioUrl ? 30000 : 5000;
                setTimeout(function () {
                    window.location.href = gameSavedUrl;
                }, redirectDelay);
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
        firstGoalAudio = data.firstGoalAudio;
        goal3Audio = data.goal3Audio;
        goal5Audio = data.goal5Audio;
        goal7Audio = data.goal7Audio;
        goal8Audio = data.goal8Audio;
        broadcastGameUrl = data.broadcastGameUrl;
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
        div.find('figcaption').text(pSelected.rating);

        gamePlayers[pid] = playerIdx;

        if (pid == 3) {
            $('.players').hide();
            $('.gameActions').show();
            $('#playerSelection').addClass('playerSelectionDone');
            $('.gameActionShuffle,.gameActionEqualize').toggle(!singlesGame);

            var ratingTeam1, ratingTeam2;
            if (singlesGame) {
                ratingTeam1 = players[gamePlayers[0]].rating;
                ratingTeam2 = players[gamePlayers[3]].rating;
            } else {
                ratingTeam1 = (players[gamePlayers[0]].rating + players[gamePlayers[1]].rating) / 2;
                ratingTeam2 = (players[gamePlayers[2]].rating + players[gamePlayers[3]].rating) / 2;
            }

            $('#expectedScore').text('Expected score: ' + scoreToGoals(calculateExpectedScore(ratingTeam1, ratingTeam2)));
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

    equalizeArray = function (array) {
        var pairPermutations = [
            [array[0], array[1], array[2], array[3]],
            [array[0], array[2], array[1], array[3]],
            [array[0], array[3], array[1], array[2]]
        ];
        // find combinations with lowest ranking difference
        var permutationDiff = [], perm, minDiff = Number.MAX_VALUE, diff;
        for (var i = 0; i < pairPermutations.length; i++) {
            perm = pairPermutations[i];
            diff = Math.abs((players[perm[0]].rating + players[perm[1]].rating) - (players[perm[2]].rating + players[perm[3]].rating));
            minDiff = diff < minDiff ? diff : minDiff;
            permutationDiff[i] = diff;
        }

        pairPermutations = pairPermutations.filter(function (p, idx) {
            return permutationDiff[idx] === minDiff;
        });

        // select random item from the minimum diff ranking combinations (if more than one)
        var randomPair = pairPermutations[Math.floor(Math.random() * pairPermutations.length)];

        // randomize player order in team, and team order
        var swapTeam1 = Math.random() >= 0.5;
        var swapTeam2 = Math.random() >= 0.5;
        var swapTeams = Math.random() >= 0.5;
        var tmp, tmp2;
        if (swapTeam1) {
            tmp = randomPair[0];
            randomPair[0] = randomPair[1];
            randomPair[1] = tmp;
        }
        if (swapTeam2) {
            tmp = randomPair[2];
            randomPair[2] = randomPair[3];
            randomPair[3] = tmp;
        }
        if (swapTeams) {
            tmp = randomPair[0];
            tmp2 = randomPair[1];
            randomPair[0] = randomPair[2];
            randomPair[1] = randomPair[3];
            randomPair[2] = tmp;
            randomPair[3] = tmp2;
        }

        array[0] = randomPair[0];
        array[1] = randomPair[1];
        array[2] = randomPair[2];
        array[3] = randomPair[3];

        return randomPair;
    };

    calculateExpectedScore = function (rating, opponentRating) {
        return 1.0 / (1.0 + Math.pow(10.0, (opponentRating - rating) / 400.0));
    };

    scoreToGoals = function (score) {
        var diff = (score * 20) - 10;
        if (diff > 0) {
            return "10 - " + (10 - diff).toFixed(1);
        } else {
            return (10 + diff).toFixed(1) + " - 10";
        }
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
        $('.gameActionStart,.gameActionShuffle,.gameActionEqualize').css('visibility', 'hidden');
        shuffleCountDown = 20;
        doShuffle();
    };

    gameSelectionEqualizeClick = function () {
        $('.gameActionStart,.gameActionShuffle,.gameActionEqualize').css('visibility', 'hidden');
        shuffleCountDown = 20;
        doEqualize();
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
            $('.gameActionStart,.gameActionShuffle,.gameActionEqualize').css('visibility', 'visible');
            return;
        }
        setTimeout(doShuffle, 50);
    };

    doEqualize = function () {
        equalizeArray(gamePlayers);
        showTeamSelectionPlayers();

        shuffleCountDown--;
        if (shuffleCountDown === 0) {
            $('.gameActionStart,.gameActionShuffle,.gameActionEqualize').css('visibility', 'visible');
            return;
        }
        setTimeout(doEqualize, 50);
    };

    showTeamSelectionPlayers = function () {
        for (var playerIdx = PLAYER1; playerIdx <= PLAYER4; playerIdx++) {
            var div = $('#teamPlayer' + (playerIdx + 1));
            var player = players[gamePlayers[playerIdx]];
            div.addClass('selected');
            div.find('img').attr('src', player.pictureUrl);
            div.find('figcaption').text(player.rating);
        }
        var ratingTeam1 = (players[gamePlayers[0]].rating + players[gamePlayers[1]].rating) / 2;
        var ratingTeam2 = (players[gamePlayers[2]].rating + players[gamePlayers[3]].rating) / 2;

        $('#expectedScore').text('Expected score: ' + scoreToGoals(calculateExpectedScore(ratingTeam1, ratingTeam2)));
    };

    doInitializeTeamSelection = function (data) {
        var players = data.players, player, playerEls = [], playerEl, playerNameDiv, playerImg, count = players.length;
        var photoWidth, lineSize, width;

        width = $('body').width() - 20;
        lineSize = Math.ceil(count / 2);
        photoWidth = Math.floor(width / lineSize);
        photoWidth = Math.floor(photoWidth / 10) * 10;
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
        $('.gameActionEqualize').on('click', gameSelectionEqualizeClick);
        $('.team-player').on('click', teamPlayerClick);

        window.addEventListener('resize', function (e) {
            var width = $('body').width() - 20;
            var photoWidth = Math.floor(width / lineSize);
            photoWidth = Math.floor(photoWidth / 10) * 10;

            $('img.player-photo').css('width', photoWidth + 'px');
            $('.players').width((photoWidth) * lineSize);
            $('.gameActions').width((photoWidth) * lineSize);
        });
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

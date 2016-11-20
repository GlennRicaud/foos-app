(function () {
    var dataUrl, cal;

    $(function () {
        window.addEventListener('popstate', function (event) {
            var date = (event.state && event.state.date) || new Date();
            loadGames(date, true);
        });

        $('#foos-main').css('overflow-y', 'scroll');
        dataUrl = $('.foos-calendar-select').data('games-url');
        cal = new CalHeatMap();
        var now = new Date();
        cal.init({
            itemSelector: ".foos-calendar-select",
            domain: "month",
            subDomain: "x_day",
            data: dataUrl + "?data=true&start={{d:start}}&stop={{d:end}}",
            dataType: "json",
            start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
            highlight: "now",
            cellSize: 20,
            cellPadding: 5,
            domainGutter: 20,
            range: 4,
            domainDynamicDimension: false,
            domainLabelFormat: function (date) {
                moment.locale("en");
                return moment(date).format("MMMM YYYY").toUpperCase();
            },
            subDomainTextFormat: "%d",
            legendHorizontalPosition: 'right',
            legendVerticalPosition: 'top',
            legend: [1, 3, 5, 8, 13],
            legendColors: {
                min: "#dae289",
                max: "#637939",
                empty: "white"
            },
            onClick: function (date) {
                loadGames(date);
            }
        });

        $('#calendarSelPrev').on('click', function () {
            $(this).blur();
            cal.previous();
        });
        $('#calendarSelNext').on('click', function () {
            $(this).blur();
            cal.next();
        });

        if (!$.trim($('.foos-calendar-games').html())) {
            var dateParam = getUrlParam('d');
            var date = dateParam ? new Date(dateParam) : new Date();
            $('.foos-calendar-games').hide();
            $('.foos-calendar-nogames span').text(dateText(date));
            $('.foos-calendar-nogames').show();
        }
    });

    var loadGames = function (date, skipHistory) {
        var zeroPad = function (v) {
            return v < 10 ? '0' + v : v;
        };
        var d = date.getFullYear() + '-' + zeroPad(date.getMonth() + 1) + '-' + zeroPad(date.getDate());
        cal.highlight(date);

        $('.foos-calendar-nogames').hide();
        $('.foos-calendar-games').children().fadeOut('fast').promise().done(function () {
            $(".foos-calendar-games").hide();
            $.get(dataUrl + "?date=" + d, function (data) {
                if (!skipHistory && window.history) {
                    var stateObj = {date: date};
                    window.history.pushState(stateObj, "Games for " + d, "?d=" + d);
                }

                if (data) {
                    $(".foos-calendar-games").html(data).fadeIn();
                } else {
                    $('.foos-calendar-nogames span').text(dateText(date));
                    $('.foos-calendar-nogames').fadeIn();
                }
            });
        });
    };

    var dateText = function (d) {
        var today = new Date();
        if (d.getFullYear() == today.getFullYear() && d.getMonth() == today.getMonth() && d.getDate() === today.getDate()) {
            return 'today';
        }
        if (d.getFullYear() == today.getFullYear()) {
            return 'on ' + moment(d).format('Do MMMM');
        } else {
            return 'on ' + moment(d).format('Do MMM YYYY');
        }
    };

    var getUrlParam = function (name) {
        if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search)) {
            return decodeURIComponent(name[1]);
        }
    }
})();
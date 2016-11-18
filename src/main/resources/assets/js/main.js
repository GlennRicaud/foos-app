$('#foos-menu-item-user').click(function () {
    var userNameBoundingClientRect = this.getBoundingClientRect();
    $('#foos-menu-item-logout').toggleClass('hidden');
    $('#foos-menu-item-logout').css('position', 'absolute');
    $('#foos-menu-item-logout').css('right', 0);
    $('#foos-menu-item-logout').css('top', userNameBoundingClientRect.bottom);

});

$('#foos-menu-item-logout').mouseleave(function () {
    $('#foos-menu-item-logout').addClass('hidden');
});
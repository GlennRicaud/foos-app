var chrono = {};

exports.startChrono = function (topic) {
    chrono[topic] = new Date().getTime();
}
exports.stopChrono = function (topic) {
    var time = new Date().getTime() - chrono[topic];
    log.info(topic + ": " + time + "ms");
}

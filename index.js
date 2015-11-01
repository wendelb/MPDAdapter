"use strict";

var EventEmitter = require('events').EventEmitter,
    util = require("util"),
    debug = require("debug")("MPDClient"),
    mpd = require('mpd'),
    cmd = mpd.cmd;


function MPDClient(host, port) {
    EventEmitter.call(this)

    host = host || 'localhost';
    port = port || '6600';

    var self = this;

    this.status = {};
    this.currentsong = {};

    this.client = mpd.connect({
        host: host,
        port: port
    });

    this._initialize();

    this.client.on('ready', function () {
        debug("Ready");
        // Initialize MPDClient
        self.client.sendCommand(cmd("currentsong", []), function (err, msg) {
            if (err) throw err;
            self.currentsong = self._preprocessMessage(msg);
        });
        self.client.sendCommand(cmd("status", []), function (err, msg) {
            if (err) throw err;
            self.status = self._preprocessMessage(msg);
        });

        setTimeout(function () {
            // Tell the world, we are ready,
            // but give mpd a chance to populate status and currentsong
            self.emit("ready");
        }, 1000);
    });
};
util.inherits(MPDClient, EventEmitter);


MPDClient.prototype._preprocessMessage = function(msg) {
    var data = ('' + msg).split("\n");
    var result = {};

    for (var i = 0; i < data.length - 1; i++) {
        var item = data[i].split(': ');
        result[item[0]] = item.slice(1).join(': ');
    }

    return result;
};

MPDClient.prototype._initialize = function () {
    var self = this;
    this.client.on('system', function (name) {
        debug("update %s", name);
    });

    // Status has changed
    this.client.on('system-player', function () {
        self.client.sendCommand(cmd("status", []), function (err, msg) {
            if (err) throw err;
            self.status = self._preprocessMessage(msg);
            self.emit("status", self.status);
        });
    });

    // Playlist has changed
    this.client.on("system-playlist", function () {
        self.client.sendCommand(cmd("currentsong", []), function (err, msg) {
            if (err) throw err;
            self.currentsong = self._preprocessMessage(msg);
            self.emit("songinfo", self.currentsong);
        });
    });
};

MPDClient.prototype.stop = function () {
    this.client.sendCommand(cmd("stop", []), function (err, msg) {
        if (err) throw err;
    });
}

MPDClient.prototype.clearPlaylist = function () {
    this.client.sendCommand(cmd("clear", []), function (err, msg) {
        if (err) throw err;
    });
}

MPDClient.prototype.addItemToPlaylist = function (url) {
    this.client.sendCommand(cmd("add", [url]), function (err, msg) {
        if (err) throw err;
    });
}


MPDClient.prototype.play = function (url) {
    if (url !== undefined) {
        debug("Clearing Playlist and adding %s", url)
        // Load url
        this.stop();
        this.clearPlaylist();
        this.addItemToPlaylist(url);
    }

    this.client.sendCommand(cmd("play", []), function (err, msg) {
        if (err) throw err;
    });
}

// Node Export
module.exports = exports = MPDClient;
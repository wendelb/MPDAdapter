"use strict";

var MPDClient = require("../");

var client = new MPDClient();
client.on("ready", function () {
    console.log("Ready");
    console.log(client.status.state);
    console.log(client.currentsong.Title);
});

client.on("songinfo", function (info) {
    console.log(info.Title);
});

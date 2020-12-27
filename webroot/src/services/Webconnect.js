"use strict";
export var DELIMITER_STR = "$*$*$"
function Webconnect() {
    this.chans = {};
}

Webconnect.prototype.Init = async function () {
    function connect() {
        return new Promise(function (resolve, reject) {
            var server = new WebSocket("wss://" + "fdu-web.live" + "/ws");
            server.onopen = function () {
                console.log(`websocket open`);
                resolve(server);
            };
            server.onerror = function (err) {
                reject(err);
            };

        });
    }

    try {
        this.conn = await connect()
    } catch (error) {
        console.log('WebSocket error: ' + error.code)
    }
    this.conn.onclose = function (e) {
        console.log(`websocket close: ` + e.code);
        console.log(e)
    }.bind(this);

    this.conn.onmessage = function (evt) {
        var messages = evt.data.split(DELIMITER_STR);
        if (messages.length == 0)
            return;
        switch (messages[0]) {
            case 'userdel':
                this.chans[0](messages);
                break;
            case 'turndata':
                this.chans[0](messages);
                break;
            default:
                this.chans[messages[3]](messages);
                break;
        }
    }.bind(this);
}

Webconnect.prototype.addchan = function (chanid, callback) {
    this.chans[chanid] = callback
}

export default Webconnect
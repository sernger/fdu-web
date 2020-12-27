"use strict";
import Peercall from './Peercall'

function Screenshare(callback, webconn) {
    this.callback = callback;
    this.conn = webconn.conn;
    this.chanid = 1;

    this.offerOptions = {
        offerToReceiveAudio: 0,
        offerToReceiveVideo: 0
    };
}

Screenshare.prototype = Object.create(Peercall.prototype);
Screenshare.prototype.constructor = Screenshare;

Screenshare.prototype.getLocalMedia = async function () {
    if (this.peers && this.peers[1]) {
        console.log(`error: other is in screen shareing`);
        return
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })

        console.log('Received screen stream');
        this.localStream = stream;
        this.callback("onGotScreenStream", stream);
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log('The user has ended sharing the screen');
            this.callback("onRemoveScreenStream", stream);
            this.localStream = null;
        });

        console.log('Received screen stream');

    } catch (e) {
        console.log(`getDisplayMedia() error: ${e.name}`);
    }
}

Screenshare.prototype.gotRemoteStream = async function (uid, e) {
    this.callback("onGotScreenStream", uid, e.streams[0])
}

export default Screenshare
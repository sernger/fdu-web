"use strict";
import { Peercall, g_local_id} from './Peercall'

function Screenshare(callback, webconn) {
    this.startTime = 0;
    this.peers = {};
    this.callback = callback

    this.local_uid = g_local_id;
    this.offerOptions = {
        offerToReceiveAudio: 0,
        offerToReceiveVideo: 0
    };

    this.webconn = webconn
    this.chanid = 0
    this.webconn.addchan(this.chanid, this.evcallback.bind(this))
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
"use strict";
import { Peercall, g_local_id} from './Peercall'

function Screenshare(callback, webconn) {
    this.startTime = 0;
    this.peers = {};
    this.callback = callback

    this.local_uid = g_local_id;
    this.offerOptions = {
        offerToReceiveAudio: 0,
        offerToReceiveVideo: 1
    };

    this.webconn = webconn
    this.chanid = 1
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
        this.callback("onGotlocalStream", 0, this.chanid, stream);
        stream.getVideoTracks()[0].addEventListener('ended', (() => {
            console.log('The user has ended sharing the screen');
            this.callback("onRemoveStream", 0, this.chanid);
            this.localStream = null;
            this.hangupall();
        }).bind(this));

        console.log('Received screen stream');

    } catch (e) {
        console.log(`getDisplayMedia() error: ${e.name}`);
    }
}

export default Screenshare
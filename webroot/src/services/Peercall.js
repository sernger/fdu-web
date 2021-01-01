"use strict";
import {DELIMITER_STR} from './Webconnect'
var g_local_id = Math.ceil(Math.random() * 1000000 + 2);
function Peercall(callback, webconn) {
    this.startTime = 0;
    this.peers = {};
    this.callback = callback

    this.local_uid = g_local_id;
    this.offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };
    this.webconn = webconn
    this.chanid = 0
    this.webconn.addchan(this.chanid, this.evcallback.bind(this))
}

Peercall.prototype.evcallback = function (messages) {
    if (messages.length == 0)
        return;
    switch (messages[0]) {
        case 'useradd':
            console.log(`useradd ${messages[2]}`);
            this.onUserAdd(parseInt(messages[2]));
            break;
        case 'userdel':
            console.log(`userdel ${messages[2]}`);
            this.onUserDel(parseInt(messages[2]));
            break;
        case 'offer':
            console.log(`offer ${messages[2]}\n${messages[4]}`);
            this.onRecvOffer(parseInt(messages[2]), JSON.parse(messages[4]));
            break;
        case 'answer':
            console.log(`answer ${messages[2]}\n${messages[4]}`);
            this.onRecvAnswer(parseInt(messages[2]), JSON.parse(messages[4]));
            break;
        case 'turndata':
            console.log(`turndata ${messages[1]}`);
            this.turnData = JSON.parse(messages[1]);
            break;
        case 'icecandidate':
            console.log(`icecandidate ${messages[2]}\n${messages[4]}`);
            this.onIceCandidateFromPeer(parseInt(messages[2]), JSON.parse(messages[4]));
            break;
        default:
            console.log(`Sorry, we are out of ${messages[0]}.`);
    }
}

Peercall.prototype.Init = async function () {
    this.start();
}

Peercall.prototype.close = function (uid) {
    this.webconn.conn.close()
}

Peercall.prototype.onUserAdd = function (uid) {
    this.call(uid)
}

Peercall.prototype.onUserDel = function (uid) {
    this.hangup(uid)
    this.callback("onUserDel", uid)
}

Peercall.prototype.start = async function () {
    console.log('Requesting local stream');
    await this.getLocalMedia();
    this.webconn.conn.send("useradd" + DELIMITER_STR + "0" + DELIMITER_STR + this.local_uid.toString() + DELIMITER_STR + this.chanid.toString()+DELIMITER_STR);
}

Peercall.prototype.getLocalMedia = async function () {
    try {
        //const audioSource = audioInputSelect.value;
        //const videoSource = videoSelect.value;
        var audioSource = null;
        var videoSource = null;
        const constraints = {
            audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
            video: { deviceId: videoSource ? { exact: videoSource } : undefined }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        navigator.mediaDevices.enumerateDevices().then(this.gotDevices.bind(this)).catch(this.handleError.bind(this));
        console.log('Received local stream');
        this.localStream = stream;
        this.callback("onGotlocalStream", 0, this.chanid, stream);

        stream.getVideoTracks()[0].addEventListener('ended', (() => {
            this.callback("onRemoveStream", 0, this.chanid);
            this.localStream = null;
        }).bind(this));
    } catch (e) {
        alert(`getUserMedia() error: ${e.name}`);
    }
}

Peercall.prototype.setupPc = async function (uid) {
    this.startTime = window.performance.now();
    if(this.localStream) {
        const videoTracks = this.localStream.getVideoTracks();
        const audioTracks = this.localStream.getAudioTracks();
        if (videoTracks.length > 0) {
            console.log(`Using video device: ${videoTracks[0].label}`);
        }
        if (audioTracks.length > 0) {
            console.log(`Using audio device: ${audioTracks[0].label}`);
        }
    }
    
    var turnservers = [];
    for (var i = 0; i < this.turnData.Uris.length; i++) {
        var turn = {};
        turn.url = this.turnData.Uris[i];
        turn.username = this.turnData.Username;
        turn.credential = this.turnData.Password;
        turnservers.push(turn)
    }

    const configuration = {
        iceServers:
            turnservers
    };

    console.log('RTCPeerConnection configuration:', configuration);
    this.peers[uid] = new RTCPeerConnection(configuration);
    console.log('Created local peer connection object pc');
    this.peers[uid].addEventListener('icecandidate', e => this.onIceCandidate(uid, e));
    this.peers[uid].addEventListener('iceconnectionstatechange', e => this.onIceStateChange(uid, e));
    this.peers[uid].addEventListener('track', e => this.gotRemoteStream(uid, this.chanid, e));
    this.peers[uid].addEventListener('connectionstatechange', e => this.connectionstatechange(uid, e));

    if(this.localStream) {
        this.localStream.getTracks().forEach(track => this.peers[uid].addTrack(track, this.localStream));
        console.log('Added local stream to pc');
    }  
}

Peercall.prototype.connectionstatechange = async function (uid, e) {
    if (this.peers[uid] && (this.peers[uid].connectionState == "disconnected" || this.peers[uid].connectionState == "closed") ){
        console.log(`connectionstatechange   ${uid} \n${e}`);
        this.hangup(uid)
        //this.callback("onUserDel", uid)
    }   
}

Peercall.prototype.gotRemoteStream = async function (uid, chanid, e) {
    console.log(`gotRemoteStream   uid:${uid} chanid:${chanid} \n${e}`);
    this.callback("ongotRemoteStream", uid, chanid, e.streams[0])

    e.streams[0].getVideoTracks()[0].addEventListener('ended', (() => {
        this.callback("onRemoveStream", uid, chanid);
    }).bind(this));
}

Peercall.prototype.call = async function (uid) {
    console.log('Starting call');

    await this.setupPc(uid);

    try {
        console.log('pc createOffer start');
        const offer = await this.peers[uid].createOffer(this.offerOptions);
        await this.onCreateOfferSuccess(uid, offer);
    } catch (e) {
        this.onCreateSessionDescriptionError(e);
    }
}

Peercall.prototype.onCreateSessionDescriptionError = function (error) {
    console.log(`Failed to create session description: ${error.toString()}`);
}

Peercall.prototype.onCreateOfferSuccess = async function (uid, desc) {
    console.log(`Offer from ${uid} \n${desc.sdp}`);
    console.log('pc setLocalDescription start');
    try {
        await this.peers[uid].setLocalDescription(desc);
        this.onSetLocalSuccess(uid);
    } catch (e) {
        this.onSetSessionDescriptionError();
    }

    this.webconn.conn.send("offer" + DELIMITER_STR + uid.toString() + DELIMITER_STR + this.local_uid.toString()  + DELIMITER_STR + this.chanid.toString() + DELIMITER_STR + JSON.stringify(desc)+DELIMITER_STR);
}

Peercall.prototype.onSetLocalSuccess = function (uid) {
    console.log(`setLocalDescription for ${uid} complete`);
}

Peercall.prototype.onSetRemoteSuccess = function (uid) {
    console.log(`setRemoteDescription for ${uid} complete`);
}

Peercall.prototype.onSetSessionDescriptionError = function (error) {
    console.log(`Failed to set session description: ${error.toString()}`);
}

Peercall.prototype.onRecvOffer = async function (uid, desc) {
    await this.setupPc(uid);
    console.log(`onRecvOffer pc setRemoteDescription start \n ${desc.sdp}`);
    try {
        await this.peers[uid].setRemoteDescription(desc);
        this.onSetRemoteSuccess(uid);
    } catch (e) {
        this.onSetSessionDescriptionError();
    }

    console.log('pc createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
        const answer = await this.peers[uid].createAnswer();
        await this.onCreateAnswerSuccess(uid, answer);
    } catch (e) {
        this.onCreateSessionDescriptionError(e);
    }
}

Peercall.prototype.onRecvAnswer = async function (uid, desc) {
    console.log(`onRecvAnswer pc setRemoteDescription start\n ${desc.sdp}`);
    try {
        await this.peers[uid].setRemoteDescription(desc);
        this.onSetRemoteSuccess(uid);
    } catch (e) {
        this.onSetSessionDescriptionError(e);
    }
}

Peercall.prototype.onCreateAnswerSuccess = async function (uid, desc) {
    console.log(`Answer for pc:\n${desc.sdp}`);
    console.log('pc setLocalDescription start');
    try {
        await this.peers[uid].setLocalDescription(desc);
        this.onSetLocalSuccess(uid);
    } catch (e) {
        this.onSetSessionDescriptionError(e);
    }
    this.webconn.conn.send("answer" + DELIMITER_STR + uid.toString() + DELIMITER_STR + this.local_uid.toString() + DELIMITER_STR + this.chanid.toString() + DELIMITER_STR + JSON.stringify(desc)+DELIMITER_STR);
}

Peercall.prototype.onIceCandidate = async function (uid, event) {
    if(event.candidate) {
        this.webconn.conn.send("icecandidate" + DELIMITER_STR + uid.toString() + DELIMITER_STR + this.local_uid.toString() + DELIMITER_STR + this.chanid.toString() + DELIMITER_STR + JSON.stringify(event.candidate)+DELIMITER_STR);
        console.log(`send IceCandidate to ${uid}:\n${event.candidate.candidate}`);
    }
    else {
        console.log('End of candidates.');
    }
    
}

Peercall.prototype.onIceCandidateFromPeer = async function (uid, candidate) {
    try {
        await (this.peers[uid].addIceCandidate(candidate));
        this.onAddIceCandidateSuccess(uid);
    } catch (e) {
        this.onAddIceCandidateError(uid, e);
    }
    console.log(`ICE candidate from ${uid} :\n${candidate ? candidate.candidate : '(null)'}`);
}

Peercall.prototype.onAddIceCandidateSuccess = function (uid) {
    console.log(`${uid} addIceCandidate success`);
}

Peercall.prototype.onAddIceCandidateError = function (uid, error) {
    console.log(`${uid} failed to add ICE Candidate: ${error.toString()}`);
}

Peercall.prototype.onIceStateChange = function (uid, event) {
    if (this.peers[uid]) {
        console.log(`${uid} ICE state: ${this.peers[uid].iceConnectionState}`);
        console.log('ICE state change event: ', event);
    }
}

Peercall.prototype.hangupall = function () {
    console.log(`Ending all call`);
    Object.entries(this.peers).forEach(function (item){
        item[1].close();
    })

    Object.keys(this.peers).forEach((k => delete this.peers[k]).bind(this))
}

Peercall.prototype.hangup = function (uid) {
    console.log(`Ending call ${uid}`);
    if (this.peers[uid] != null) {
        this.peers[uid].close();
        delete this.peers[uid];
    }
}

Peercall.prototype.gotDevices = function (deviceInfos) {

    this.callback("onGotDevices", deviceInfos)

    // to do
    /*
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
            option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });*/
}

Peercall.prototype.enumerateDevices = function () {
    navigator.mediaDevices.enumerateDevices().then(this.gotDevices).catch(this.handleError);
}


// Attach audio output device to video element using device/sink ID.
Peercall.prototype.attachSinkId = function (element, sinkId) {
    // to do
    /*
    if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch(error => {
                let errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0;
            });
    } else {
        console.warn('Browser does not support output device selection.');
    }
    */
}

Peercall.prototype.changeAudioDestination = function () {
    /* to do
    const audioDestination = audioOutputSelect.value;
    this.attachSinkId(videoElement, audioDestination);
    */
}

Peercall.prototype.handleError = function (error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

Peercall.prototype.changeAVSelect = function () {
    if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
            track.stop();
        });
    }
    this.getLocalMedia();
}

export {Peercall, g_local_id};
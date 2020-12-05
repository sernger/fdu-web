'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

var DELIMITER_STR="$*";

var conn = new WebSocket("ws://" + "www.fdu-web.live:8955" + "/ws");

var turnData;

conn.onopen = function () {
    console.log(`websocket open`);
}

conn.onclose = function (e) {
    console.log(`websocket close: ` + e.code);
    console.log(e)
};

conn.onerror = function (e) {
    console.log('WebSocket error: ' + e.code)
    console.log(e)
}
conn.onmessage = function (evt) {
    var messages = evt.data.split(DELIMITER_STR);
    if (messages.length == 0)
        return;
    switch (messages[0]) {
        case 'useradd':
            console.log(`useradd ${messages[1]}`);
            onUserAdd(parseInt(messages[1]));
            break;
        case 'userdel':
            console.log(`userdel ${messages[1]}`);
            onUserDel(parseInt(messages[1]));
            break;
        case 'offer':
            console.log(`offer ${messages[2]}`);
            onRecvOffer(parseInt(messages[2]), JSON.parse(messages[3]));
            break;
        case 'answer':
            console.log(`answer ${messages[2]}`);
            onRecvAnswer(parseInt(messages[2]), JSON.parse(messages[3]));
            break;
        case 'turndata':
            console.log(`turndata ${messages[1]}`);
            turnData = JSON.parse(messages[1]);
						break;
				case 'icecandidate':
						onIceCandidateFromPeer(parseInt(messages[2]), JSON.parse(messages[3]));
						break;
        default:
            console.log(`Sorry, we are out of ${messages[0]}.`);
    }
};



var peers = {};
async function onUserAdd(uid) {
    call(uid)
}

async function onUserDel(uid) {
    hangup(uid)
}

localVideo.addEventListener('loadedmetadata', function() {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
  // We'll use the first onsize callback as an indication that video has started
  // playing out.
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
});

let localStream;

let local_uid = Math.ceil(Math.random()*1000000);
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

async function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
  conn.send("useradd"+DELIMITER_STR+local_uid.toString());
}
async function setupPc(uid) {
    startTime = window.performance.now();
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
        console.log(`Using video device: ${videoTracks[0].label}`);
    }
    if (audioTracks.length > 0) {
        console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    var turnservers = [];
    for (var i = 0 ; i < turnData.Uris.length; i++)
    {
        var turn = {};
        turn.url = turnData.Uris[i];
        turn.username = turnData.Username;
        turn.credential = turnData.Password;
        turnservers.push(turn)
    }
    
    const configuration = {iceServers:
        turnservers
    };
    
    console.log('RTCPeerConnection configuration:', configuration);
    peers[uid] = new RTCPeerConnection(configuration);
    console.log('Created local peer connection object pc');
    peers[uid].addEventListener('icecandidate', e => onIceCandidate(uid, e));
    peers[uid].addEventListener('iceconnectionstatechange', e => onIceStateChange(uid, e));
    peers[uid].addEventListener('track', e => gotRemoteStream(uid, e));

    localStream.getTracks().forEach(track => peers[uid].addTrack(track, localStream));
    console.log('Added local stream to pc');
}

function gotRemoteStream(uid, e) {
    if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        console.log(`pc received remote stream from ${uid}`);
    }
}

async function call(uid) {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting call');

  await setupPc(uid);

  try {
    console.log('pc createOffer start');
    const offer = await peers[uid].createOffer(offerOptions);
    await onCreateOfferSuccess(uid, offer);
  } catch (e) {
    onCreateSessionDescriptionError(e);
  }
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

async function onCreateOfferSuccess(uid, desc) {
  console.log(`Offer from ${uid} \n${desc.sdp}`);
  console.log('pc setLocalDescription start');
  try {
    await peers[uid].setLocalDescription(desc);
    onSetLocalSuccess(uid);
  } catch (e) {
    onSetSessionDescriptionError();
  }

  conn.send("offer"+DELIMITER_STR+uid.toString()+DELIMITER_STR+local_uid.toString()+DELIMITER_STR+JSON.stringify(desc));
}

function onSetLocalSuccess(uid) {
  console.log(`setLocalDescription for ${uid} complete`);
}

function onSetRemoteSuccess(uid) {
  console.log(`setRemoteDescription for ${uid} complete`);
}

function onSetSessionDescriptionError(error) {
  console.log(`Failed to set session description: ${error.toString()}`);
}

async function onRecvOffer(uid, desc) {
    await setupPc(uid);
    console.log(`onRecvOffer pc setRemoteDescription start \n ${desc.sdp}`);
    try {
        await peers[uid].setRemoteDescription(desc);
        onSetRemoteSuccess(uid);
    } catch (e) {
        onSetSessionDescriptionError();
    }

    console.log('pc createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
        const answer = await peers[uid].createAnswer();
        await onCreateAnswerSuccess(uid, answer);
    } catch (e) {
        onCreateSessionDescriptionError(e);
    }
}

async function onRecvAnswer(uid, desc) {
    console.log(`onRecvAnswer pc setRemoteDescription start\n ${desc.sdp}`);
    try {
      await peers[uid].setRemoteDescription(desc);
      onSetRemoteSuccess(uid);
    } catch (e) {
      onSetSessionDescriptionError(e);
    }
}

async function onCreateAnswerSuccess(uid, desc) {
  console.log(`Answer for pc:\n${desc.sdp}`);
  console.log('pc setLocalDescription start');
  try {
    await peers[uid].setLocalDescription(desc);
    onSetLocalSuccess(uid);
  } catch (e) {
    onSetSessionDescriptionError(e);
  }
  conn.send("answer"+DELIMITER_STR+uid.toString()+DELIMITER_STR+local_uid.toString()+DELIMITER_STR+JSON.stringify(desc));
}

async function onIceCandidate(uid, event) {
	conn.send("icecandidate"+DELIMITER_STR+uid.toString()+DELIMITER_STR+local_uid.toString()+DELIMITER_STR+JSON.stringify(event.candidate)); /*try {
    await (peers[uid].addIceCandidate(event.candidate));
    onAddIceCandidateSuccess(uid);
  } catch (e) {
    onAddIceCandidateError(uid, e);
	}
	console.log(`${uid} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
	*/
  console.log(`send IceCandidate to ${uid}:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

async function onIceCandidateFromPeer(uid, candidate) {
	try {
		await (peers[uid].addIceCandidate(candidate));
		onAddIceCandidateSuccess(uid);
	} catch (e) {
		onAddIceCandidateError(uid, e);
	}
	console.log(`ICE candidate from ${uid} :\n${candidate ? candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(uid) {
  console.log(`${uid} addIceCandidate success`);
}

function onAddIceCandidateError(uid, error) {
  console.log(`${uid} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(uid, event) {
  if (peers[uid]) {
    console.log(`${uid} ICE state: ${peers[uid].iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}

function hangup(uid) {
  console.log('Ending call');
  peers[uid].close();
  delete peers[uid];
  hangupButton.disabled = true;
  callButton.disabled = false;
}

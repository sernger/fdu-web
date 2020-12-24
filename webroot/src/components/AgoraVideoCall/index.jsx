import React from 'react'
import { merge } from 'lodash'
//import AgoraRTC from 'agora-rtc-sdk'

import './canvas.css'
import '../../assets/fonts/css/icons.css'

const tile_canvas = {
  '1': ['span 12/span 24'],
  '2': ['span 12/span 12/13/25', 'span 12/span 12/13/13'],
  '3': ['span 6/span 12', 'span 6/span 12', 'span 6/span 12/7/19'],
  '4': ['span 6/span 12', 'span 6/span 12', 'span 6/span 12', 'span 6/span 12/7/13'],
  '5': ['span 3/span 4/13/9', 'span 3/span 4/13/13', 'span 3/span 4/13/17', 'span 3/span 4/13/21', 'span 9/span 16/10/21'],
  '6': ['span 3/span 4/13/7', 'span 3/span 4/13/11', 'span 3/span 4/13/15', 'span 3/span 4/13/19', 'span 3/span 4/13/23', 'span 9/span 16/10/21'],
  '7': ['span 3/span 4/13/5', 'span 3/span 4/13/9', 'span 3/span 4/13/13', 'span 3/span 4/13/17', 'span 3/span 4/13/21', 'span 3/span 4/13/25', 'span 9/span 16/10/21'],
}

var DELIMITER_STR="$*";

//var conn = new WebSocket("wss://" + "fdu-web.live" + "/ws");

var turnData;
var peers = {};

let local_uid = Math.ceil(Math.random()*1000000);
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};
let startTime;


/**
 * @prop appId uid
 * @prop transcode attendeeMode videoProfile channel baseMode
 */
class AgoraCanvas extends React.Component {
  constructor(props) {
    super(props)
    //this.client = {}
    this.localStream = {}
    this.shareClient = {}
    this.shareStream = {}
    this.state = {
      displayMode: 'pip',
      streamList: [],
      readyState: false
    }
    this.conn = new WebSocket("wss://" + "fdu-web.live" + "/ws");

    this.conn.onopen = () => {
      console.log("websocket open");
      this.getonConnect();
    }

    this.conn.onclose = (e) => {
      console.log(`websocket close: ` + e.code);
      console.log(e)
    };

    this.conn.onerror = (e) => {
      console.log('WebSocket error: ' + e.code)
      console.log(e)
    }
    this.conn.onmessage = (evt) => {
      var messages = evt.data.split(DELIMITER_STR);
      if (messages.length == 0)
          return;
        switch (messages[0]) {
          case 'useradd':
              console.log(`useradd ${messages[1]}`);
              this.onUserAdd(parseInt(messages[1]));
              break;
          case 'userdel':
              console.log(`userdel ${messages[1]}`);
              this.onUserDel(parseInt(messages[1]));
              break;
          case 'offer':
              console.log(`offer ${messages[2]}`);
              this.onRecvOffer(parseInt(messages[2]), JSON.parse(messages[3]));
              break;
          case 'answer':
              console.log(`answer ${messages[2]}`);
              this.onRecvAnswer(parseInt(messages[2]), JSON.parse(messages[3]));
              break;
          case 'turndata':
              console.log(`turndata ${messages[1]}`);
              turnData = JSON.parse(messages[1]);
              break;
          case 'icecandidate':
              //onIceCandidateFromPeer(parseInt(messages[2]), JSON.parse(messages[3]));
              break;
          default:
              console.log(`Sorry, we are out of ${messages[0]}.`);
        }
      };
  } 

  componentWillMount() {
    let $ = this.props

    // init AgoraRTC local client
    {/*this.client = AgoraRTC.createClient({ mode: $.transcode })
    this.client.init($.appId, () => {
      console.log("AgoraRTC client initialized")
      this.subscribeStreamEvents()
      this.client.join($.appId, $.channel, $.uid, (uid) => {
        console.log("User " + uid + " join channel successfully")
        console.log('At ' + new Date().toLocaleTimeString())
        // create local stream
        // It is not recommended to setState in function addStream
        this.localStream = this.streamInit(uid, $.attendeeMode, $.videoProfile)
        this.localStream.init(() => {
          if ($.attendeeMode !== 'audience') {
            this.addStream(this.localStream, true)
            this.client.publish(this.localStream, err => {
              console.log("Publish local stream error: " + err);
            })
          }
          this.setState({ readyState: true })
        },
          err => {
            console.log("getUserMedia failed", err)
            this.setState({ readyState: true })
          })
      })
    }) */}
  }

  async componentDidMount() {
    // add listener to control btn group
    let canvas = document.querySelector('#ag-canvas')
    let btnGroup = document.querySelector('.ag-btn-group')
    canvas.addEventListener('mousemove', () => {
      if (global._toolbarToggle) {
        clearTimeout(global._toolbarToggle)
      }
      btnGroup.classList.add('active')
      global._toolbarToggle = setTimeout(function () {
        btnGroup.classList.remove('active')
      }, 2000)
    })

    console.log('Requesting local stream');
    await this.getLocalMedia();
  }

  getonConnect() {
    this.conn.send("useradd"+DELIMITER_STR+local_uid.toString());
  } 

  async getLocalMedia() {
    try {
        const audioSource = "";//audioInputSelect.value;
        const videoSource = "";//videoSelect.value;
        const constraints = {
            audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
            video: {deviceId: videoSource ? {exact: videoSource} : undefined}
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        navigator.mediaDevices.enumerateDevices().then(this.gotDevices).catch(this.handleError);
        console.log('Received local stream');
        //localVideo.srcObject = stream;
        this.localStream = stream;
        this.state.streamList[local_uid] = this.localStream;
        this.setState({
          streamList: this.state.streamList
        })
        this.setState({ readyState: true });
       
      } catch (e) {
        alert(`getUserMedia() error: ${e.name}`);
      }
  }

  gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      //option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === 'audioinput') {
      } else if (deviceInfo.kind === 'audiooutput') {
        
      } else if (deviceInfo.kind === 'videoinput') {   
      } else {
        console.log('Some other kind of source/device: ', deviceInfo);
      }
    }
  }

  handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }

  // componentWillUnmount () {
  //     // remove listener
  //     let canvas = document.querySelector('#ag-canvas')
  //     canvas.removeEventListener('mousemove')
  // }

  componentDidUpdate() {
    // rerendering
    let canvas = document.querySelector('#ag-canvas')
    // pip mode (can only use when less than 4 people in channel)
    if (this.state.displayMode === 'pip') {
      let no = Object.keys(this.state.streamList).length//this.state.streamList.keys(data).length
      if (no > 4) {
        this.setState({ displayMode: 'tile' })
        return
      }
      var index = 0;
      this.state.streamList.forEach(function(item,key){
        let dom = document.querySelector('#ag-item-' + key)
        if (!dom) {
          dom = document.createElement('video')
          dom.setAttribute('id', 'ag-item-' + key)
          dom.setAttribute('class', 'ag-item')         
          dom.srcObject = item;
          dom.setAttribute("autoplay", "autoplay");
          canvas.appendChild(dom)
        }
        if (index === no - 1) {
          dom.setAttribute('style', `grid-area: span 12/span 24/13/25`)
        }
        else {
          dom.setAttribute('style', `grid-area: span 3/span 4/${4 + 3 * index}/25;
                    z-index:1;width:calc(100% - 20px);height:calc(100% - 20px)`)
        }
        index++;
      })

    }
    // tile mode
    else if (this.state.displayMode === 'tile') {
      /*let no = this.state.streamList.length
      this.state.streamList.map((item, index) => {
        let id = item.getId()
        let dom = document.querySelector('#ag-item-' + id)
        if (!dom) {
          dom = document.createElement('section')
          dom.setAttribute('id', 'ag-item-' + id)
          dom.setAttribute('class', 'ag-item')
          canvas.appendChild(dom)
          item.play('ag-item-' + id)
        }
        dom.setAttribute('style', `grid-area: ${tile_canvas[no][index]}`)
        item.player.resize && item.player.resize()*/
        let no = Object.keys(this.state.streamList).length
        var index = 0;
        this.state.streamList.forEach(function(item,key){
          let dom = document.querySelector('#ag-item-' + key)
          if (!dom) {
            dom = document.createElement('video')
            dom.setAttribute('id', 'ag-item-' + key)
            dom.setAttribute('class', 'ag-item')         
            dom.srcObject = item;
            dom.setAttribute("autoplay", "autoplay");
            canvas.appendChild(dom)
          }
          dom.setAttribute('style', `grid-area: ${tile_canvas[no][index]}`)
          index++;
        })
    }
    // screen share mode (tbd)
    else if (this.state.displayMode === 'share') {

    }
  }

  componentWillUnmount () {
    //this.client && this.client.unpublish(this.localStream)
    //this.localStream && this.localStream.close()
    /*this.client && this.client.leave(() => {
      console.log('Client succeed to leave.')
    }, () => {
      console.log('Client failed to leave.')
    })*/
  }

  streamInit = (uid, attendeeMode, videoProfile, config) => {
    let defaultConfig = {
      streamID: uid,
      audio: true,
      video: true,
      screen: false
    }

    var stream;
    //let stream = AgoraRTC.createStream(merge(defaultConfig, config))
    //stream.setVideoProfile(videoProfile)
    return stream
  }

  subscribeStreamEvents = () => {
    let rt = this
    rt.client.on('stream-added', function (evt) {
      let stream = evt.stream
      console.log("New stream added: " + stream.getId())
      console.log('At ' + new Date().toLocaleTimeString())
      console.log("Subscribe ", stream)
      rt.client.subscribe(stream, function (err) {
        console.log("Subscribe stream failed", err)
      })
    })

    rt.client.on('peer-leave', function (evt) {
      console.log("Peer has left: " + evt.uid)
      console.log(new Date().toLocaleTimeString())
      console.log(evt)
      rt.removeStream(evt.uid)
    })

    rt.client.on('stream-subscribed', function (evt) {
      let stream = evt.stream
      console.log("Got stream-subscribed event")
      console.log(new Date().toLocaleTimeString())
      console.log("Subscribe remote stream successfully: " + stream.getId())
      console.log(evt)
      rt.addStream(stream)
    })

    rt.client.on("stream-removed", function (evt) {
      let stream = evt.stream
      console.log("Stream removed: " + stream.getId())
      console.log(new Date().toLocaleTimeString())
      console.log(evt)
      rt.removeStream(stream.getId())
    })
  }

  removeStream = (uid) => {
    this.state.streamList.map((item, index) => {
      if (item.getId() === uid) {
        item.close()
        let element = document.querySelector('#ag-item-' + uid)
        if (element) {
          element.parentNode.removeChild(element)
        }
        let tempList = [...this.state.streamList]
        tempList.splice(index, 1)
        this.setState({
          streamList: tempList
        })
      }

    })
  }

  addStream = (stream, push = false) => {
    let repeatition = this.state.streamList.some(item => {
      return item.getId() === stream.getId()
    })
    if (repeatition) {
      return
    }
    if (push) {
      this.setState({
        streamList: this.state.streamList.concat([stream])
      })
    }
    else {
      this.setState({
        streamList: [stream].concat(this.state.streamList)
      })
    }

  }


  setupPc(uid) {
    startTime = window.performance.now();
    const videoTracks = this.localStream.getVideoTracks();
    const audioTracks = this.localStream.getAudioTracks();
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
    peers[uid].addEventListener('icecandidate', e => this.onIceCandidate(uid, e));
    peers[uid].addEventListener('iceconnectionstatechange', e => this.onIceStateChange(uid, e));
    peers[uid].addEventListener('track', e => this.gotRemoteStream(uid, e));

    this.localStream.getTracks().forEach(track => peers[uid].addTrack(track, this.localStream));
    console.log('Added local stream to pc');
  }

  onIceCandidate = (uid, event) => {
    this.conn.send("icecandidate"+DELIMITER_STR+uid.toString()+DELIMITER_STR+local_uid.toString()+DELIMITER_STR+JSON.stringify(event.candidate)); /*try {
      await (peers[uid].addIceCandidate(event.candidate));
      onAddIceCandidateSuccess(uid);
    } catch (e) {
      onAddIceCandidateError(uid, e);
    }
    console.log(`${uid} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
    */
    console.log(`send IceCandidate to ${uid}:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  onIceStateChange(uid, event) {
    if (peers[uid]) {
      console.log(`${uid} ICE state: ${peers[uid].iceConnectionState}`);
      console.log('ICE state change event: ', event);
    }
  }

  onUserAdd(uid) {
    this.callid(uid)
  }

  async onUserDel(uid) {
    this.hangup(uid)
  }
 
  async callid(uid) {
    console.log('Starting call');
  
    await this.setupPc(uid);
  
    try {
      console.log('pc createOffer start');
      const offer = await peers[uid].createOffer(offerOptions);
      await this.onCreateOfferSuccess(uid, offer);
    } catch (e) {
      //onCreateSessionDescriptionError(e);
    }
  }

  hangup(uid) {
    console.log(`Ending call ${uid}`);
    peers[uid].close();
    delete peers[uid];
    let element = document.querySelector('#ag-item-' + uid)
    if (element) {
      element.parentNode.removeChild(element)
    }
    delete this.state.streamList[uid];       
    this.setState({
      streamList: this.state.streamList
    })
  }

  async onCreateOfferSuccess(uid, desc) {
    console.log(`Offer from ${uid} \n${desc.sdp}`);
    console.log('pc setLocalDescription start');
    try {
      await peers[uid].setLocalDescription(desc);
      this.onSetLocalSuccess(uid);
    } catch (e) {
      //onSetSessionDescriptionError();
    }
  
    this.conn.send("offer"+DELIMITER_STR+uid.toString()+DELIMITER_STR+local_uid.toString()+DELIMITER_STR+JSON.stringify(desc));
  }

  onSetLocalSuccess(uid) {
    console.log(`setLocalDescription for ${uid} complete`);
  }

  onSetRemoteSuccess(uid) {
    console.log(`setRemoteDescription for ${uid} complete`);
  }

  async onRecvOffer(uid, desc) {
    await this.setupPc(uid);
    console.log(`onRecvOffer pc setRemoteDescription start \n ${desc.sdp}`);
    try {
        await peers[uid].setRemoteDescription(desc);
        this.onSetRemoteSuccess(uid);
    } catch (e) {
        //onSetSessionDescriptionError();
    }

    console.log('pc createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
        const answer = await peers[uid].createAnswer();
        await this.onCreateAnswerSuccess(uid, answer);
    } catch (e) {
        //onCreateSessionDescriptionError(e);
    }
  }

  async onRecvAnswer(uid, desc) {
    console.log(`onRecvAnswer pc setRemoteDescription start\n ${desc.sdp}`);
    try {
      await peers[uid].setRemoteDescription(desc);
      this.onSetRemoteSuccess(uid);
    } catch (e) {
      //onSetSessionDescriptionError(e);
    }
  }

  async onCreateAnswerSuccess(uid, desc) {
    console.log(`Answer for pc:\n${desc.sdp}`);
    console.log('pc setLocalDescription start');
    try {
      await peers[uid].setLocalDescription(desc);
      this.onSetLocalSuccess(uid);
    } catch (e) {
      //onSetSessionDescriptionError(e);
    }
    this.conn.send("answer"+DELIMITER_STR+uid.toString()+DELIMITER_STR+local_uid.toString()+DELIMITER_STR+JSON.stringify(desc));
  }

  gotRemoteStream(uid, e) {
    /*createRemoteVideoDom(uid);
    if (remoteVideos[uid].srcObject !== e.streams[0]) {
        remoteVideos[uid].srcObject = e.streams[0];
        console.log(`pc received remote stream from ${uid}`);
    }*/
    this.state.streamList[uid] = e.streams[0];
    this.setState({
      streamList: this.state.streamList
    })
  }

  handleCamera = (e) => {
    e.currentTarget.classList.toggle('off')
    this.localStream.isVideoOn() ?
      this.localStream.disableVideo() : this.localStream.enableVideo()
  }

  handleMic = (e) => {
    e.currentTarget.classList.toggle('off')
    this.localStream.isAudioOn() ?
      this.localStream.disableAudio() : this.localStream.enableAudio()
  }

  switchDisplay = (e) => {
    var num = Object.keys(this.state.streamList).length;
    if (e.currentTarget.classList.contains('disabled') || num <= 1) {
      return
    }
    if (this.state.displayMode === 'pip') {
      this.setState({ displayMode: 'tile' })
    }
    else if (this.state.displayMode === 'tile') {
      this.setState({ displayMode: 'pip' })
    }
    else if (this.state.displayMode === 'share') {
      // do nothing or alert, tbd
    }
    else {
      console.error('Display Mode can only be tile/pip/share')
    }
  }

  hideRemote = (e) => {
    var num = Object.keys(this.state.streamList).length;
    if (e.currentTarget.classList.contains('disabled') || num <= 1) {
      return
    }
    let list
    let id = this.state.streamList[num - 1].getId()
    list = Array.from(document.querySelectorAll(`.ag-item:not(#ag-item-${id})`))
    list.map(item => {
      if (item.style.display !== 'none') {
        item.style.display = 'none'
      }
      else {
        item.style.display = 'block'
      }
    })

  }

  handleExit = (e) => {
    if (e.currentTarget.classList.contains('disabled')) {
      return
    }
    try {
      //this.client && this.client.unpublish(this.localStream)
      //this.localStream && this.localStream.close()
      /*this.client && this.client.leave(() => {
        console.log('Client succeed to leave.')
      }, () => {
        console.log('Client failed to leave.')
      })*/
    }
    finally {
      this.setState({ readyState: false })
      //this.client = null
      this.localStream = null
      // redirect to index
      window.location.hash = ''
    }
  }

  render() {
    const style = {
      display: 'grid',
      gridGap: '10px',
      alignItems: 'center',
      justifyItems: 'center',
      gridTemplateRows: 'repeat(12, auto)',
      gridTemplateColumns: 'repeat(24, auto)'
    }
    const videoControlBtn = this.props.attendeeMode === 'video' ?
      (<span
        onClick={this.handleCamera}
        className="ag-btn videoControlBtn"
        title="Enable/Disable Video">
        <i className="ag-icon ag-icon-camera"></i>
        <i className="ag-icon ag-icon-camera-off"></i>
      </span>) : ''

    const audioControlBtn = this.props.attendeeMode !== 'audience' ?
      (<span
        onClick={this.handleMic}
        className="ag-btn audioControlBtn"
        title="Enable/Disable Audio">
        <i className="ag-icon ag-icon-mic"></i>
        <i className="ag-icon ag-icon-mic-off"></i>
      </span>) : ''

    const switchDisplayBtn = (
      <span
        onClick={this.switchDisplay}
        className={Object.keys(this.state.streamList).length > 4 ? "ag-btn displayModeBtn disabled" : "ag-btn displayModeBtn"}
        title="Switch Display Mode">
        <i className="ag-icon ag-icon-switch-display"></i>
      </span>
    )
    const hideRemoteBtn = (
      <span
        className={Object.keys(this.state.streamList).length > 4 || this.state.displayMode !== 'pip' ? "ag-btn disableRemoteBtn disabled" : "ag-btn disableRemoteBtn"}
        onClick={this.hideRemote}
        title="Hide Remote Stream">
        <i className="ag-icon ag-icon-remove-pip"></i>
      </span>
    )
    const exitBtn = (
      <span
        onClick={this.handleExit}
        className={this.state.readyState ? 'ag-btn exitBtn' : 'ag-btn exitBtn disabled'}
        title="Exit">
        <i className="ag-icon ag-icon-leave"></i>
      </span>
    )

    return (
      <div id="ag-canvas" style={style}>
        <div className="ag-btn-group">
          {exitBtn}
          {videoControlBtn}
          {audioControlBtn}
          {/* <span className="ag-btn shareScreenBtn" title="Share Screen">
                        <i className="ag-icon ag-icon-screen-share"></i>
                    </span> */}
          {switchDisplayBtn}
          {hideRemoteBtn}
        </div>
      </div>
    )
  }
}

export default AgoraCanvas

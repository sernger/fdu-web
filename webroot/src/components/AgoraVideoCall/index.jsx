import React from 'react'
import { merge } from 'lodash'
//import AgoraRTC from 'agora-rtc-sdk'

import './canvas.css'
import '../../assets/fonts/css/icons.css'
import { Peercall } from '../../services/Peercall'
import Webconnect from '../../services/Webconnect'
import Screenshare from '../../services/Screenshare'

const tile_canvas = {
    '1': ['span 12/span 24'],
    '2': ['span 12/span 12/13/25', 'span 12/span 12/13/13'],
    '3': ['span 6/span 12', 'span 6/span 12', 'span 6/span 12/7/19'],
    '4': ['span 6/span 12', 'span 6/span 12', 'span 6/span 12', 'span 6/span 12/7/13'],
    '5': ['span 3/span 4/13/9', 'span 3/span 4/13/13', 'span 3/span 4/13/17', 'span 3/span 4/13/21', 'span 9/span 16/10/21'],
    '6': ['span 3/span 4/13/7', 'span 3/span 4/13/11', 'span 3/span 4/13/15', 'span 3/span 4/13/19', 'span 3/span 4/13/23', 'span 9/span 16/10/21'],
    '7': ['span 3/span 4/13/5', 'span 3/span 4/13/9', 'span 3/span 4/13/13', 'span 3/span 4/13/17', 'span 3/span 4/13/21', 'span 3/span 4/13/25', 'span 9/span 16/10/21'],
}

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
            streamList: {},
            readyState: false
        }
        this.callback = this.callback.bind(this)
        this.webcon = new Webconnect()
        this.peercall = new Peercall(this.callback, this.webcon)

    }

    callback(e, param1, param2, param3) {
        switch (e) {
            case 'onGotlocalStream':
                //stream = param1
                this.localStream = param1
                this.addStream(0, param1)
                break;
            case 'ongotRemoteStream':
                //uid = param1
                //stream = param2
                this.addStream(param1, param2)
                break;
            case 'onGotDevices':
                //deviceInfos = param1
                break;
            case 'onUserDel':
                //uid = param1
                this.removeStream(param1)
                break;
            case 'onGotScreenStream':
                //stream = param1
                this.addStream(1, param1)
                break;
            case 'onRemoveScreenStream':
                this.removeStream(1)
                break;
            default:
                break;
        }
    }

    async componentWillMount() {
        let $ = this.props
        await this.webcon.Init()
        await this.peercall.Init()
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
            Object.entries(this.state.streamList).forEach(function (item) {
                let dom = document.querySelector('#ag-item-' + item[0])
                if (!dom) {
                    dom = document.createElement('video')
                    dom.setAttribute('id', 'ag-item-' + item[0])
                    dom.setAttribute('class', 'ag-item')
                    dom.srcObject = item[1];
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
            let no = Object.keys(this.state.streamList).length
            var index = 0;
            Object.entries(this.state.streamList).forEach(function (item) {
                let dom = document.querySelector('#ag-item-' + item[0])
                if (!dom) {
                    dom = document.createElement('video')
                    dom.setAttribute('id', 'ag-item-' + item[0])
                    dom.setAttribute('class', 'ag-item')
                    dom.srcObject = item[1];
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

    componentWillUnmount() {
        //this.client && this.client.unpublish(this.localStream)
        this.localStream && this.localStream.close()
        this.peercall && this.peercall.close()
    }

    removeStream = (uid) => {
        delete this.state.streamList[uid]
        this.setState({
            streamList: this.state.streamList
        })
    }

    addStream = (uid, stream) => {
        if (this.state.streamList[uid] != null)
            return
        this.state.streamList[uid] = stream
        this.setState({
            streamList: this.state.streamList
        })
    }

    handleCamera = (e) => {
        e.currentTarget.classList.toggle('off')
        this.localStream.getTracks().forEach((t) => {
            if (t.kind === 'video') t.enabled = !t.enabled;
        });
    }

    handleMic = (e) => {
        e.currentTarget.classList.toggle('off')
        this.localStream.getTracks().forEach((t) => {
            if (t.kind === 'audio') t.enabled = !t.enabled;
        });
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
        let id = 0//local
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
            this.localStream && this.localStream.close()
            this.peercall && this.peercall.close()
        }
        finally {
            this.setState({ readyState: false })
            //this.client = null
            this.localStream = null
            // redirect to index
            window.location.hash = ''
        }
    }

    handleshare = (e) => {
        this.screenShare = new Screenshare(this.callback, this.webcon)
        this.screenShare.Init()
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
        const videoControlBtn =
            (<span
                onClick={this.handleCamera}
                className="ag-btn videoControlBtn"
                title="Enable/Disable Video">
                <i className="ag-icon ag-icon-camera"></i>
                <i className="ag-icon ag-icon-camera-off"></i>
            </span>)

        const audioControlBtn =
            (<span
                onClick={this.handleMic}
                className="ag-btn audioControlBtn"
                title="Enable/Disable Audio">
                <i className="ag-icon ag-icon-mic"></i>
                <i className="ag-icon ag-icon-mic-off"></i>
            </span>)

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
        const exitBtn = 1 ? "" : (
            <span
                onClick={this.handleExit}
                className={this.state.readyState ? 'ag-btn exitBtn' : 'ag-btn exitBtn disabled'}
                title="Exit">
                <i className="ag-icon ag-icon-leave"></i>
            </span>
        )

        const screenShareBtn = 
            <span
                onClick={this.handleshare}
                className={this.state.streamList[1] == null ? 'ag-btn shareScreenBtn' : 'ag-btn shareScreenBtn disabled'}
                title="Screen Share">
                <i className="ag-icon ag-icon-screen-share"></i>
            </span>

        return (
            <div id="ag-canvas" style={style}>
                <div className="ag-btn-group">
                    {exitBtn}
                    {videoControlBtn}
                    {audioControlBtn}
                    {screenShareBtn}
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

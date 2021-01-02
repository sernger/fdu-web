import React from "react";
import * as Cookies from "js-cookie";

import "./meeting.css";
import VideoCall from "../../components/VideoCall";

class Meeting extends React.Component {
  constructor(props) {
    super(props);
    this.videoProfile = Cookies.get("videoProfile").split(",")[0] || "480p_4";
    this.channel = Cookies.get("channel") || "test";
    this.transcode = Cookies.get("transcode") || "interop";
    this.uid = undefined;
  }

  render() {
    return (
      <div className="wrapper meeting">
        <div className="ag-header">
          <div className="ag-header-lead">
            <img
              className="header-logo"
              src={require("../../assets/images/ag-logo.png")}
              alt=""
            />
            <span>WebRTC 云课堂</span>
          </div>
          <div className="ag-header-msg">
            Room:&nbsp;<span id="room-name">{this.channel}</span>
          </div>
        </div>
        <div className="ag-main">
          <div className="ag-container">
            <VideoCall
              videoProfile={this.videoProfile}
              channel={this.channel}
              transcode={this.transcode}
              attendeeMode={this.attendeeMode}
              baseMode={this.baseMode}
              appId={this.appId}
              uid={this.uid}
            />
          </div>
        </div>
        <div className="ag-footer">
          <a className="ag-href" href="">
            <span>Powered By Fudan</span>
          </a>
          <span></span>
        </div>
      </div>
    );
  }
}

export default Meeting;

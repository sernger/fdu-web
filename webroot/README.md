# Open Video WebRtc React


## Prerequisites

- Node.js 6.9.1+


## Quick Start
1. Use `npm` to install the dependencies:

``` bash
# install dependency
npm install
```

2. Build and run the project:

Use `start` for a local build. View the application in your browser with the URL `http://localhost:3000`

```bash
# serve with hot reload at localhost:3000
npm run start
```
Use `build` for a production version with minification.

```bash
# build for production with minification
npm run build
```

## Steps to Create the Sample 

- [Add Assets](#add-assets)
- [Create Index Page](#create-index-page)
- [Create Meeting Page](#create-meeting-page)

### Add Assets

The sample application uses assets located in the [`src/assets/images`](src/assets/images) folder.

Asset|Image|Description
---|---|---
`ag-index-background.png`|![ag-index-background.png](src/assets/images/ag-index-background.png)|Main application background image.
`ag-logo.png`|![ag-logo.png](src/assets/images/ag-logo.png)|Logo image for the application.
`avatar.png`|![avatar.png](src/assets/images/avatar.png)|Avatar image for the application.
`ag-login.png`|<div style="background-color:grey; text-align:center; padding-top:4px">![ag-login.png](src/assets/images/ag-login.png)</div>|Image of a monitor, for login.
`ag-audience.png` and `ag-audience-active.png`|<div style="background-color:grey; text-align:center; padding-top:4px">![ag-audience.png](src/assets/images/ag-audience.png)</div><div style="text-align:center; padding-top:4px">![ag-audience-active.png](src/assets/images/ag-audience-active.png)</div>|Image of a person icon in a circle, to represent an audience member.
`ag-mic-s.png` and `ag-mic-active-s.png`|<div style="background-color:grey; text-align:center; padding-top:4px">![ag-mic-s.png](src/assets/images/ag-mic-s.png)</div><div style="text-align:center; padding-top:4px">![ag-mic-active-s.png](src/assets/images/ag-mic-active-s.png)</div>|Image of a microphone, to turn on/off audio.
`ag-video-s.png` and `ag-video-active-s.png`|<div style="background-color:grey; text-align:center; padding-top:4px">![ag-video-s.png](src/assets/images/ag-video-s.png)</div><div style="text-align:center; padding-top:4px">![ag-video-active-s.png](src/assets/images/ag-video-active-s.png)</div>|Video camera image, to turn on/off video.
`ag-oval.png` and `ag-oval-active.png`|<div style="background-color:grey; text-align:center; padding-top:4px">![ag-oval.png](src/assets/images/ag-oval.png)</div><div style="text-align:center; padding-top:4px">![ag-oval-active.png](src/assets/images/ag-oval-active.png)</div>|Circle image (empty and filled-in) to indicate selections.

### Create Index Page

The Index page is managed by the [src/pages/index/index.jsx](src/pages/index/index.jsx) file.

The Index page is comprised of four classes:

Class|Description
---|---
[`Index`](#create-the-index-class)|Main class for the index page. The other classes are used in the layout for this class.
[`InputChannel`](#add-the-inputchannel-class)|Text input manager for the channel name.
[`BaseOptions`](#add-the-baseoptions-class)|Chooser for the type of call.
[`AdvancedOptions`](#add-the-advancedoptions-class)|Chooser for video transcoding.

```JavaScript
import React from 'react'
import * as Cookies from 'js-cookie'

import '../../assets/fonts/css/icons.css'
import Validator from '../../utils/Validator'
import { RESOLUTION_ARR } from '../../utils/Settings'
import './index.css'
...

export default Index
```

#### Create the Index Class

The `Index` class is main class for the index page.

![screenshots/index.jpg](screenshots/index.jpg)

```JavaScript
class Index extends React.Component {
  
  ...
  
}
```

- [Add the Constructor Method for the Index Class](#add-the-constructor-method-for-the-index-class)
- [Add Event Listeners for the Index Class](#add-event-listeners-for-the-index-class)
- [Add the Render Method for the Index Class](#add-the-render-method-for-the-index-class)

##### Add the Constructor Method for the Index Class

The `constructor()` method initializes the `state` properties for the class:

Property|Value|Description
---|---|---
`joinBtn`|`false`|Indicates if the **Join** button is enabled / disabled.
`channel`|Empty string|Name of the channel.
`baseMode`|`avc`|Indicates the current base mode for the call.
`transcode`|`interop`|Indicates the current transcoding setting.
`attendeeMode`|`video`|Indicates the current connection mode for the attendee.
`videoProfile`|`480p_4`|Indicates the current video profile setting.

```JavaScript
  constructor(props) {
    super(props)
    this.state = {
      joinBtn: false,
      channel: '',
      baseMode: 'avc',
      transcode: 'interop',
      attendeeMode: 'video',
      videoProfile: '480p_4',

    }
  }
```


##### Add Event Listeners for the Index Class

The `componentDidMount()` method initializes event listener for keyboard presses.

When a keyboard button is pressed, ensure `e.keyCode` is the **Enter** / **Return** key before executing `this.handleJoin()`.

```JavaScript
  componentDidMount() {
    window.addEventListener('keypress', (e) => {
      e.keyCode === 13 && this.handleJoin()
    })
  }
```

The `handleChannel()` method updates the `channel` and `joinBtn` state properties.

```JavaScript
  /**
   * 
   * @param {String} val 0-9 a-z A-Z _ only 
   * @param {Boolean} state 
   */
  handleChannel = (val, state) => {
    this.setState({
      channel: val,
      joinBtn: state
    })
  }
```

The `handleJoin()` method initiates joining the channel.

1. Ensure the `joinBtn` state is `false`, otherwise stop the method execution with a `return`.
2. Set a log for the `state` information using `console.log`.
3. Set cookies for the state properties `channel`, `baseMode`, `transcode`, `attendeeMode`, and `videoProfile`.
4. Transfer the user to the `meeting` page.

```JavaScript
  handleJoin = () => {
    if (!this.state.joinBtn) {
      return
    }
    console.log(this.state)
    Cookies.set('channel', this.state.channel)
    Cookies.set('baseMode', this.state.baseMode)
    Cookies.set('transcode', this.state.transcode)
    Cookies.set('attendeeMode', this.state.attendeeMode)
    Cookies.set('videoProfile', this.state.videoProfile)
    window.location.hash = "meeting"
  }
```

##### Add the Render Method for the Index Class

The `render()` method displays the UI for the index page in the `return()`.

The layout is comprised of three sections, specified by the class names `ag-header`, `ag-main`, and `ag-footer`.

The `ag-main` section contains the key login elements for the layout. The remaining code for this section is contained within the `section` sub-element.

The `ag-footer` section contains a `Powered By Agora` text and Agora contact information.


```JavaScript
  render() {
    return (
      <div className="wrapper index">
        <div className="ag-header"></div>
        <div className="ag-main">
          <section className="login-wrapper">
          
          ...
    	
          </section>
        </div>
        <div className="ag-footer">
          <a className="ag-href" href="https://www.agora.io">
            <span>Powered By Agora</span>
          </a>
          <div>
            <span>Interested in Agora video call SDK? Contact </span>
            <span className="ag-contact">sales@agora.io</span>
          </div>
        </div>
      </div>
    )
  }
```

The `login-header` section contains the Agora logo, application title, and the application motto / subtitle.

```JavaScript
            <div className="login-header">
              <img src={require('../../assets/images/ag-logo.png')} alt="" />
              <p className="login-title">AgoraWeb v2.1</p>
              <p className="login-subtitle">Powering Real-Time Communications</p>
            </div>
```

The `login-body` section is divided into three main sections:

- The text input for the room name
- The call options
- The attendee mode options

```JavaScript
            <div className="login-body">
              <div className="columns">
                <div className="column is-12">
                
	                ...
                
                </div>
              </div>
              <div className="columns">
                <div className="column is-7">
                		
                		...
                		
                </div>
                <div className="column is-5">
                		
                		...
                		
                </div>
              </div>
              <div className="columns">
                <div className="column">
                		
                		...
                		
                </div>
              </div>
            </div>
```

The first section is a text input box for the room name / channel. The `InputChannel` element is nested within two `div` elements. The text input has `onChange` event listener which invokes the `this.handleChannel` method.

```JavaScript
              <div className="columns">
                <div className="column is-12">
                  <InputChannel onChange={this.handleChannel} placeholder="Input a room name here"></InputChannel>
                </div>
              </div>
```

The second section is contains a `BaseOptions` component and a `AdvancedOptions` component.

The `BaseOptions` component has an `onChange` event listener which updates the `baseMode` state value.

The `AdvancedOptions` component has two event listeners:

- An `onRadioChange` event listener which updates the `transcode` state value.
- An `OnSelectChange` event listener which updates the `videoProfile` state value.

```JavaScript
              <div className="columns">
                <div className="column is-7">
                  <BaseOptions
                    onChange={val => this.setState({ baseMode: val })}>
                  </BaseOptions>
                </div>
                <div className="column is-5">
                  <AdvancedOptions
                    onRadioChange={val => this.setState({ transcode: val })}
                    onSelectChange={val => this.setState({ videoProfile: val })}>
                  </AdvancedOptions>
                </div>
              </div>
```

The third section is contains a set of radio dials and supporting images and text labels. Each radio `input` element has an `onChange` event listener which updates the `attendeeMode` state value.

```JavaScript
              <div className="columns">
                <div className="column">
                  <div id="attendeeMode" className="control">
                    <label className="radio">
                      <input onChange={e => this.setState({ attendeeMode: e.target.value })}
                        value="video" type="radio"
                        name="attendee" defaultChecked />
                      <span className="radio-btn">
                      </span>
                      <span className="radio-img video">
                      </span>
                      <span className="radio-msg">Video Call : join with video call</span>
                    </label>
                    <br />
                    <label className="radio">
                      <input onChange={e => this.setState({ attendeeMode: e.target.value })}
                        value="audio-only" type="radio"
                        name="attendee" />
                      <span className="radio-btn">
                      </span>
                      <span className="radio-img audio">
                      </span>
                      <span className="radio-msg">Audio-only : join with audio call</span>
                    </label>
                    <br />
                    <label className="radio">
                      <input onChange={e => this.setState({ attendeeMode: e.target.value })}
                        value="audience" type="radio"
                        name="attendee" />
                      <span className="radio-btn">
                      </span>
                      <span className="radio-img audience">
                      </span>
                      <span className="radio-msg">Audience : join as an audience</span>
                    </label>
                  </div>
                </div>
              </div>
```

The footer for the `ag-main` section contains a **Join** button, designated by an `a` element. The **Join** button has an `onClick` event listener which invokes the `this.handleJoin` method. This button is set to enabled / disabled by the `joinBtn` state value.

```JavaScript
            <div className="login-footer">
              <a id="joinBtn"
                onClick={this.handleJoin}
                disabled={!this.state.joinBtn}
                className="ag-rounded button is-info">Join
                  </a>
            </div>
```

#### Add the InputChannel Class

The `InputChannel` class defines the room channel text input for the index page.

```JavaScript
class InputChannel extends React.Component {
  
  ...
  
}
```

- [Add the Constructor Method for the InputChannel Class](#add-the-constructor-method-for-the-inputchannel-class)
- [Add Validation and Event Listeners for the InputChannel Class](#add-validation-and-event-listeners-for-the-inputchannel-class)
- [Add the Render Method for the InputChannel Class](#add-the-render-method-for-the-inputchannel-class)

##### Add the Constructor for the InputChannel Class

The `constructor()` method initializes the state properties `errorMsg` and `state` to empty strings.

```JavaScript
  constructor(props) {
    super(props)
    this.state = {
      errorMsg: '',
      state: ''
    }
  }
```

##### Add Validation and Event Listeners for the InputChannel Class

The `validate()` method checks the string for the text input and updates the `state` and `errorMsg` properties if necessary.

Set both properties to an empty string.

```JavaScript
  validate = (val) => {
    this.setState({
      state: '',
      errorMsg: ''
    })
    
    ...
    
  }
```

Ensure the text input value is not empty using `Validator.isNonEmpty`. If the value is empty, update the `errorMsg` and `state` properties to inform the user that the text input should not be empty.

```JavaScript
    if (Validator.isNonEmpty(val.trim())) {
      this.setState({
        errorMsg: 'Cannot be empty!',
        state: 'is-danger'
      })
      return false
    }
```

Ensure the text input value at least `1` character long. If the value is shorter than `1` character, update the `errorMsg` and `state` properties to inform the user that the text input should be longer than `1` character.

```JavaScript
    else if (Validator.minLength(val.trim(), 1)) {
      this.setState({
        errorMsg: 'No shorter than 1!',
        state: 'is-danger'
      })
      return false
    }
```

Ensure the text input value `16` characters or shorter. If the value is longer than `16` characters, update the `errorMsg` and `state` properties to inform the user that the text input should no longer than `16` characters.

```JavaScript
    else if (Validator.maxLength(val.trim(), 16)) {
      this.setState({
        errorMsg: 'No longer than 16!',
        state: 'is-danger'
      })
      return false
    }
```

Ensure the text input value only contains valid characters. If invalid characters are found, update the `errorMsg` and `state` properties to inform the user that the text input should only contain letters, numbers, or the `_` character.

```JavaScript
    else if (Validator.validChar(val.trim())) {
      this.setState({
        state: 'is-danger',
        errorMsg: 'Only capital or lower-case letter, number and "_" are permitted!'
      })
      return false
    }
```

If the text input value passes all the validation tests, update the `state` property to `is-success` and return `true`.

```JavaScript
    else {
      this.setState({
        state: 'is-success'
      })
      return true
    }
```

The `handleChange()` method is invoked when the text input value is updated. Retrieve the `state` using `this.validate()`. Update the property change for the component using `this.props.onChange()`

```JavaScript
  handleChange = (e) => {
    let state = this.validate(e.target.value)
    this.props.onChange(e.target.value, state)
  }
```

##### Add the Render Method for the InputChannel Class

The `render()` method displays the UI for the `InputChannel` component.

Set the `validateIcon` value, based on the component's `state` property.

```JavaScript
  render() {
    let validateIcon = ''
    switch (this.state.state) {
      default:
      case '':
        validateIcon = ''; break;
      case 'is-success':
        validateIcon = (<i className="ag-icon ag-icon-valid"></i>); break;
      case 'is-danger':
        validateIcon = (<i className="ag-icon ag-icon-invalid"></i>); break;
    }
    
    ...
    
  }
```

The `return` contains the layout for the component. The key elements are comprised of the text input box, login button, validation icon, and validation error message.

The text `input` element is initialized with the component `placeholder` property. The `onInput` event listener triggers the `this.handleChange` method.

The validation icon and error message are updated as the text input box value is validated.

```JavaScript
    return (
      <div className="channel-wrapper control has-icons-left">
        <input onInput={this.handleChange}
          id="channel"
          className={'ag-rounded input ' + this.state.state}
          type="text"
          placeholder={this.props.placeholder} />
        <span className="icon is-small is-left">
          <img src={require('../../assets/images/ag-login.png')} alt="" />
        </span>
        <span className="validate-icon">
          {validateIcon}
        </span>
        <div className="validate-msg">
          {this.state.errorMsg}
        </div>
      </div>
    )
```

#### Add the BaseOptions Class

The `BaseOptions` class defines the base options component for the index page.

```JavaScript
class BaseOptions extends React.Component {

  ...
  
}
```

- [Add the Constructor Method for the BaseOptions Class](#add-the-constructor-method-for-the-baseoptions-class)
- [Add the Event Listener for the BaseOptions Class](#add-the-event-listener-for-the-baseoptions-class)
- [Add the Render Method for the BaseOptions Class](#add-the-render-method-for-the-baseoptions-class)

##### Add the Constructor Method for the BaseOptions Class

The `constructor()` method initializes the `_options` array and state properties `active` and `message`.

```JavaScript
  constructor(props) {
    super(props)
    this._options = [
      {
        label: 'Agora Video Call',
        value: 'avc',
        content: 'One to one and group calls'
      },
      {
        label: 'Agora Live',
        value: 'al',
        content: 'Enabling real-time interactions between the host and the audience'
      }
    ]
    this.state = {
      active: false,
      message: 'Agora Video Call',

    }
  }
```

##### Add the Event Listener for the BaseOptions Class

The `handleSelect()` method is invoked when a dropdown menu item is selected.

Update the state properties `message` and `active` with the selection values, and trigger the component's `onChange` event listener with `val`.

```JavaScript
  handleSelect = (item) => {
    let msg = item.label
    let val = item.value
    this.setState({
      'message': msg,
      'active': false
    })
    this.props.onChange(val)
  }
```

##### Add the Render Method for the BaseOptions Class

The `render()` method displays the UI for the `BaseOptions` component.

Create the `options` layout variable, by mapping through `this._options`, giving each option an item `label` and  `content` description wrapped in a `div` element.

Add an `onClick` event listener, which triggers the `this.handleSelect()` method for the item selection.

```JavaScript
  render() {
    const options = this._options.map((item, index) => {
      return (
        <div className="dropdown-item"
          key={index}
          onClick={(e) => this.handleSelect(item, e)}>
          <p>{item.label}</p>
          <hr />
          <p>{item.content}</p>
        </div>
      )
    })
```

The `return` contains the layout for the component. The component is enabled / disabled based on the state's `active` property.

When the dropdown button `dropdown-trigger` is clicked, set the dropdown menu to open/closed by updating the `active` property using `this.setState()`. The selection option is updated in the `baseOptionLabel` element using the `message` state property.

The `options` layout variable populates the items in the dropdown menu.

```JavaScript
    return (
      <div className={this.state.active ? 'dropdown is-active' : 'dropdown'}>
        <div className="dropdown-trigger"
          onClick={() => this.setState({ 'active': !this.state.active })}>
          <a id="baseMode" className="ag-rounded button" aria-haspopup="true" aria-controls="baseModeOptions">
            <span id="baseOptionLabel">{this.state.message}</span>
            <span className="icon is-small">
              <i className="ag-icon ag-icon-arrow-down" aria-hidden="true"></i>
            </span>
          </a>
        </div>
        <div className="dropdown-menu" id="baseModeOptions" role="menu">
          <div className="dropdown-content">
            {options}
          </div>
        </div>
      </div>
    )
  }
```

This software is licensed under the MIT License (MIT). [View the license](LICENSE.md).
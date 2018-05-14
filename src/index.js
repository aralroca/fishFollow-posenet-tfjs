import React, { Component } from 'react';
import { render } from 'react-dom';
import * as posenet from '@tensorflow-models/posenet';

import './style.css';

const IMAGE = 'https://aralroca.github.io/fishFollow-posenet-tfjs/fish.gif';
const MILLISECONDS = 500;
const imageScaleFactor = 0.5;
const outputStride = 16;
const flipHorizontal = true;
const maxVideoSize = 513;
const weight = 0.5;
const initialPosition = 40;

class App extends Component {
  state = {
    top: initialPosition,
    left: initialPosition,
    oldTop: initialPosition,
    oldLeft: initialPosition
  };

  componentDidMount =  async () =>{
    this.net = await posenet.load(weight);
    this.initCapture();
  }

  isMobile = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    return isAndroid || isiOS;
  }

  loadVideo = async (videoElement) => {
    const video = await this.setupCamera(videoElement);

    video.play();
  
    return video;
  }

  setupCamera =  async (videoElement) => {
    videoElement.width = maxVideoSize;
    videoElement.height = maxVideoSize;
  
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const mobile = this.isMobile();
      const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
          facingMode: 'user',
          width: mobile ? undefined : maxVideoSize,
          height: mobile ? undefined: maxVideoSize}
      });
      videoElement.srcObject = stream;
  
      return new Promise(resolve => {
        videoElement.onloadedmetadata = () => {
          resolve(videoElement);
        };
      });
    } else {
      const errorMessage = "This browser does not support video capture, or this device does not have a camera";
      alert(errorMessage);
      return Promise.reject(errorMessage);
    }
  }

  setRef = async (videoElement) => {
    this.videoElement = videoElement;
  }

  initCapture = () => {
    this.timeout = setTimeout(this.capture, MILLISECONDS);
  }

  capture = async () => {
    let nose;
    if(!this.videoElement || !this.net){
      this.initCapture();
      return;
    }

    if(!this.video && this.videoElement){
      this.video = await this.loadVideo(this.videoElement);
    }

    const poses = await this.net
      .estimateSinglePose(this.video, imageScaleFactor, flipHorizontal, outputStride)

    if(poses && poses.keypoints){
       nose = poses.keypoints.filter(keypoint => keypoint.part === 'nose')[0];
    }
    if(nose){
      this.setState({
        top: nose.position.y * 100 / maxVideoSize,
        left: nose.position.x * 100 / maxVideoSize,
        oldTop: this.state.top,
        oldLeft: this.state.left,
      })
    }

    this.initCapture();
  }

  render() {
    const fishStyle = {
      position: 'absolute',
      transitionDuration: '2s',
      top: `${this.state.top}%`,
      left: `${this.state.left}%`,
    };
    const toMirror = this.state.oldLeft > this.state.left;

    return (
      <div className="fish-tank">
        <video className="video" playsInline ref={this.setRef} />
        <img width="200px" style={fishStyle} className={toMirror ? 'mirror' : ''} src={IMAGE} />
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));

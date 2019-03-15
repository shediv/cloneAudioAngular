import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AUTH_CONFIG } from '../../auth/auth.config';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import * as RecordRTC from 'recordrtc';

// import { AlertService, UserService } from '../_services';

@Component({templateUrl: 'record-video.component.html'})
export class RecordVideoComponent implements AfterViewInit {
    private stream: MediaStream;
    private recordRTC: any;
    loading: boolean;
    submitting: boolean;
    uploading: boolean;
    error: boolean;
    userData: any;
    userAudios: any;    
    userTextForAudio: any;
    uploadUrl: string;

    // Form submission
    submitEventObj: 'Object';
    @ViewChild('video') video;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private api: ApiService) { }

    
    ngOnInit() {
      // this.uploading = false;
      // this.uploadUrl = `${AUTH_CONFIG.UPLOADURL}`;
      // this._getUserAudios();
    }        

    ngAfterViewInit() {
        // set the initial state of the audio
        let video:HTMLVideoElement = this.video.nativeElement;
        video.muted = false;
        video.controls = true;
        video.autoplay = false;
    }

    startRecording() {   
      navigator.mediaDevices
        .getUserMedia({audio:true, video:true})
        .then(this.successCallback.bind(this), this.errorCallback.bind(this));
    }

    successCallback(stream){
      var options = {
        mimeType: 'video/webm', // or video/webm\;codecs=h264 or video/webm\;codecs=vp9
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 128000,
        bitsPerSecond: 128000 // if this line is provided, skip above two
      };
      this.stream = stream;
      this.recordRTC = RecordRTC(stream, options);
      this.recordRTC.startRecording();
      let video: HTMLVideoElement = this.video.nativeElement;
      //video.src = window.URL.createObjectURL(stream);
    }
    
    errorCallback(stream){
      // To do
    }

    stopRecording() {
      let recordRTC = this.recordRTC;
      recordRTC.stopRecording(this.processVideo.bind(this));
      let stream = this.stream;
      stream.getAudioTracks().forEach(track => track.stop());
      stream.getVideoTracks().forEach(track => track.stop());
    }

    processVideo(videoWebMURL) {
      let video: HTMLVideoElement = this.video.nativeElement;
      let recordRTC = this.recordRTC;
      video.src = videoWebMURL;
      var recordedBlob = recordRTC.getBlob();
      recordRTC.getDataURL(function (dataURL) { });
    }

    download() {
      this.recordRTC.save('audio.wav');
    }

    // uploadAudio(id: number) {
    //   this.uploading = true;
    //   let recordRTC = this.recordRTC;
    //   var recordedBlob = recordRTC.getBlob();
    //   var fd = new FormData();
    //   fd.append('file', recordedBlob);
    //   //this.submitEventObj;
    //   this.api
    //   .uploadAudio$(fd, id)
    //   .subscribe(
    //     data => this._handleSubmitSuccess(data),
    //     err => this._handleSubmitError(err)
    //   );
    // }

    // private _handleSubmitSuccess(res) {
    //   this.error = false;
    //   this.submitting = false;
    //   this.uploading = false;
    //   alert('Audio Uploaded On server...!!')
    //   this._getUserAudios();
    //   // To Do add window reload...
    //   // Redirect to event detail
    //   this.router.navigate(['/record']);
    // }
  
    // private _handleSubmitError(err) {
    //   this.submitting = false;
    //   this.error = true;
    // }

    // private _getUserAudios() {
    //   // GET event by ID
    //   this.userData = this.api
    //     .getUserAudios$()
    //     .subscribe(
    //       res => {
    //         this.userAudios =  res;
    //         this.userTextForAudio = this.userAudios.audioTextFiles;
    //         //debugger;
    //         //this.userTextForAudio =  this.audioTextFiles;
    //       },
    //       err => {
    //         console.error(err);
    //         // this.loading = false;
    //         // this.error = true;
    //       }
    //     );
    // }

}
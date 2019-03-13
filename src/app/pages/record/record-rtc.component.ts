import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import * as RecordRTC from 'recordrtc';

// import { AlertService, UserService } from '../_services';

@Component({templateUrl: 'record-rtc.component.html'})
export class RecordRTCComponent implements AfterViewInit {
    private stream: MediaStream;
    private recordRTC: any;
    loading: boolean;
    submitting: boolean;
    error: boolean;
    userData: any;
    userAudios: any;

    // Form submission
    submitEventObj: 'Object';
    @ViewChild('audio') audio;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private api: ApiService) { }

    
    ngOnInit() {
      this._getUserAudios();
    }        

    ngAfterViewInit() {
        // set the initial state of the audio
        let audio:HTMLVideoElement = this.audio.nativeElement;
        audio.muted = false;
        audio.controls = true;
        audio.autoplay = false;
    }

    startRecording(id: number) {    
      navigator.mediaDevices
        .getUserMedia({audio:true})
        .then(this.successCallback.bind(this), this.errorCallback.bind(this));
    }

    successCallback(stream){
      this.stream = stream;
      this.recordRTC = RecordRTC(stream, {
          type: 'audio',
          timeSlice: 1000,
          mimeType: 'audio/wav',
          audioBitsPerSecond: 128000,
          bitsPerSecond: 128000,
          sampleRate: 96000,
          numberOfAudioChannels: 1,
          recorderType: RecordRTC.StereoAudioRecorder
      });
      this.recordRTC.startRecording();
      let audio: HTMLVideoElement = this.audio.nativeElement;
    }
    
    errorCallback(stream){
      // To do
    }

    stopRecording() {
      let recordRTC = this.recordRTC;
      recordRTC.stopRecording(this.processVideo.bind(this));
      let stream = this.stream;
      stream.getAudioTracks().forEach(track => track.stop());
    }

    processVideo(audioVideoWebMURL) {
      let audio: HTMLVideoElement = this.audio.nativeElement;
      let recordRTC = this.recordRTC;
      audio.src = audioVideoWebMURL;
      var recordedBlob = recordRTC.getBlob();
      recordRTC.getDataURL(function (dataURL) { });
    }

    download() {
      this.recordRTC.save('audio.wav');
    }

    uploadAudio() {
      let recordRTC = this.recordRTC;
      var recordedBlob = recordRTC.getBlob();
      var fd = new FormData();
      fd.append('file', recordedBlob);
      //this.submitEventObj;
      this.api
      .uploadAudio$(fd)
      .subscribe(
        data => this._handleSubmitSuccess(data),
        err => this._handleSubmitError(err)
      );
    }

    private _handleSubmitSuccess(res) {
      this.error = false;
      this.submitting = false;
      // Redirect to event detail
      this.router.navigate(['/record']);
    }
  
    private _handleSubmitError(err) {
      this.submitting = false;
      this.error = true;
    }

    private _getUserAudios() {
      // GET event by ID
      this.userData = this.api
        .getUserAudios$()
        .subscribe(
          res => {
            this.userAudios =  res;
            // this._setPageTitle(this.event.title);
            // this.loading = false;
            // this.eventPast = this.utils.eventPast(this.event.endDatetime);
          },
          err => {
            console.error(err);
            // this.loading = false;
            // this.error = true;
            // this._setPageTitle('Event Details');
          }
        );
    }

}
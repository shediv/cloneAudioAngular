import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AUTH_CONFIG } from '../../auth/auth.config';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import * as RecordRTC from 'recordrtc';

// import { AlertService, UserService } from '../_services';

@Component({templateUrl: 'record-text.component.html'})
export class RecordTextComponent implements AfterViewInit {
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
    }

    uploadText(text: string) {
      this.uploading = true;
      this.api
      .uploadText$(text)
      .subscribe(
        res => {
          //this.deleting =  false;
          alert('User Text has been added');
        },
        err => {
          console.error(err);
        }
      );
    }

    submitText() {
      console.log("Test");
    }

}
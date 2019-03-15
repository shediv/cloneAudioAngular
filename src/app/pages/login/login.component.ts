import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../auth/auth.service';
//import { contentHeaders } from '../common/headers';

// const styles   = require('./login.component.css');
// const template = require('./login.component.html');

@Component({
  selector: 'loginComponent',
  templateUrl: 'login.component.html'
})
export class LoginComponent {
  loading: boolean;
  submitting: boolean;
  singInError: boolean;
  singInErrorMessage: string;

  constructor(public router: Router, 
              private api: ApiService, 
              private auth: AuthService) {}

  ngOnInit() {
    this.singInError = false;
  }              

  login(event, username, password) {
    event.preventDefault();
    let body = JSON.stringify({ username, password });
    //Log In a User.
    this.auth
    .signinUser$(body)
    .subscribe(
      response => {
        //console.log(response.)
        //this.auth.setLoggedIn(true)
        localStorage.setItem('token', response.token);
        this.router.navigate(['record']);
      },
      error => {
        //debugger;
        this.singInError = true;
        this.singInErrorMessage = error;
        console.log(error);
      }
    );  
  }

  signup(event) {
    event.preventDefault();
    this.router.navigate(['signup']);
  }
}

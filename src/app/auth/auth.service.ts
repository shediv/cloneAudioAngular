import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError as ObservableThrowError, BehaviorSubject, Subscription, of, timer, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { AUTH_CONFIG } from './auth.config';
import * as auth0 from 'auth0-js';
import { ENV } from './../core/env.config';
import { EventModel, AuthenticationModel } from '../core/models/event.model';

@Injectable()
export class AuthService {
  // Create Auth0 web auth instance
  private _auth0 = new auth0.WebAuth({
    clientID: AUTH_CONFIG.CLIENT_ID,
    domain: AUTH_CONFIG.CLIENT_DOMAIN,
    responseType: 'token',
    redirectUri: AUTH_CONFIG.REDIRECT,
    audience: AUTH_CONFIG.AUDIENCE,
    scope: AUTH_CONFIG.SCOPE
  });
  accessToken: string;
  userProfile: any;
  expiresAt: number;
  isAdmin: boolean;
  // Create a stream of logged in status to communicate throughout app
  loggedIn: boolean;
  loggedIn$ = new BehaviorSubject<boolean>(this.loggedIn);
  loggingIn: boolean;
  // Subscribe to token expiration stream
  refreshSub: Subscription;
  routeSub: Subscription;

  constructor(private router: Router, private http: HttpClient) {
    // If app auth token is not expired, request new token
    if (JSON.parse(localStorage.getItem('expires_at')) > Date.now()) {
      this.renewToken();
    }
  }

  setLoggedIn(value: boolean) {
    // Update login status behavior subject
    this.loggedIn$.next(value);
    this.loggedIn = value;
  }

  login() {
    this.router.navigate(['/']);
    //debugger;
    // Auth0 authorize request
    //this._auth0.authorize();
  }

  // Sign in User
  signinUser$(data: Object): Observable<AuthenticationModel> {
    return this.http
      .post<AuthenticationModel>(`${ENV.BASE_API}user/signin`, data, {
          headers: new HttpHeaders().set('Content-Type', 'application/json')
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  handleAuth() {
    // When Auth0 hash parsed, get profile
    this._auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken) {
        window.location.hash = '';
        this._getProfile(authResult);
      } else if (err) {
        this._clearRedirect();
        this.router.navigate(['/']);
        console.error(`Error authenticating: ${err.error}`);
      }
    });
  }

  private _getProfile(authResult) {
    this.loggingIn = true;
    // Use access token to retrieve user's profile and set session
    this._auth0.client.userInfo(authResult.accessToken, (err, profile) => {
      if (profile) {
        this._setSession(authResult, profile);
        this._redirect();
      } else if (err) {
        console.warn(`Error retrieving profile: ${err.error}`);
      }
    });
  }

  private _setSession(authResult, profile?) {
    this.expiresAt = (authResult.expiresIn * 1000) + Date.now();
    // Store expiration in local storage to access in constructor
    localStorage.setItem('expires_at', JSON.stringify(this.expiresAt));
    this.accessToken = authResult.accessToken;
    // If initial login, set profile and admin information
    if (profile) {
      this.userProfile = profile;
      this.isAdmin = this._checkAdmin(profile);
    }
    // Update login status in loggedIn$ stream
    this.setLoggedIn(true);
    this.loggingIn = false;
    // Schedule access token renewal
    this.scheduleRenewal();
  }

  private _checkAdmin(profile) {
    // Check if the user has admin role
    const roles = profile[AUTH_CONFIG.NAMESPACE] || [];
    return roles.indexOf('admin') > -1;
  }

  private _redirect() {
    // Redirect with or without 'tab' query parameter
    // Note: does not support additional params besides 'tab'
    const fullRedirect = decodeURI(localStorage.getItem('authRedirect'));
    const redirectArr = fullRedirect.split('?tab=');
    const navArr = [redirectArr[0] || '/'];
    const tabObj = redirectArr[1] ? { queryParams: { tab: redirectArr[1] }} : null;

    if (!tabObj) {
      this.router.navigate(navArr);
    } else {
      this.router.navigate(navArr, tabObj);
    }
    // Redirection completed; clear redirect from storage
    this._clearRedirect();
  }

  private _clearRedirect() {
    // Remove redirect from localStorage
    localStorage.removeItem('authRedirect');
  }

  private _clearExpiration() {
    // Remove token expiration from localStorage
    localStorage.removeItem('expires_at');
  }

  // logout() {
  //   // Remove data from localStorage
  //   this._clearExpiration();
  //   this._clearRedirect();
  //   // End Auth0 authentication session
  //   this._auth0.logout({
  //     clientId: AUTH_CONFIG.CLIENT_ID,
  //     returnTo: ENV.BASE_URI
  //   });
  // }

  logout() {
    // Remove data from localStorage
    localStorage.removeItem('token');
    this.loggedIn$.next(false);
    this.loggedIn = false;
    this.router.navigate(['']);
  }

  get tokenValid(): boolean {
    //My code
    if(localStorage.getItem('token')){
      return true;
    }else{
      return false;
    }
  }

  renewToken() {
    // Check for valid Auth0 session
    this._auth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken) {
        this._getProfile(authResult);
      } else {
        this._clearExpiration();
      }
    });
  }

  scheduleRenewal() {
    // If last token is expired, do nothing
    if (!this.tokenValid) { return; }
    // Unsubscribe from previous expiration observable
    this.unscheduleRenewal();
    // Create and subscribe to expiration observable
    const expiresIn$ = of(this.expiresAt).pipe(
      mergeMap(
        expires => {
          const now = Date.now();
          // Use timer to track delay until expiration
          // to run the refresh at the proper time
          return timer(Math.max(1, expires - now));
        }
      )
    );

    this.refreshSub = expiresIn$
      .subscribe(
        () => {
          this.renewToken();
          this.scheduleRenewal();
        }
      );
  }

  unscheduleRenewal() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    //debugger;
    // const errorMsg = err.message || 'Error: Unable to complete request.';
    // if (err.message && err.message.indexOf('No JWT present') > -1) {
    //   //this.auth.login();
    // }
    return ObservableThrowError(err.error.message);
  }

}

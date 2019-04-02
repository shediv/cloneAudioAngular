import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './../auth/auth.service';
import { throwError as ObservableThrowError, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ENV } from './env.config';
import { AudioModel, AuthenticationModel } from './models/audio.model';

@Injectable()
export class ApiService {
  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  private get _authHeader(): string {
    return `Bearer ${this.auth.accessToken}`;
  }

  private get _authToken(): string {
    return `Bearer ${localStorage.getItem('token')}`;
  }

  // Upload a audio file
  uploadAudio$(file: Object, id: string): Observable<AudioModel> {
    return this.http
      .post<AudioModel>(`${ENV.BASE_API}uploadfile/${id}`, file, {
        headers: new HttpHeaders().set('Authorization', this._authToken)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // Upload a audio file
  deleteAudio$(id: string): Observable<AudioModel> {
    //debugger;
    return this.http
      .delete(`${ENV.BASE_API}deleteAudio/${id}`, {
        headers: new HttpHeaders().set('Authorization', this._authToken)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );

    // return this.http
    //   .put<AuthenticationModel[]>(`${ENV.BASE_API}deleteAudio/${id}`, {
    //     headers: new HttpHeaders().set('Authorization', this._authToken)
    //   })
    //   .pipe(
    //     catchError((error) => this._handleError(error))
    //   );  
  }

  // Sign in User
  signinUser$(data: Object): Observable<AuthenticationModel> {
    //debugger;
    return this.http
      .post<AuthenticationModel>(`${ENV.BASE_API}user/signin`, data, {
          headers: new HttpHeaders().set('Content-Type', 'application/json')
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // GET all audios for User
  getUserAudios$(): Observable<AuthenticationModel[]> {
    return this.http
      .get<AuthenticationModel[]>(`${ENV.BASE_API}userInfo`, {
        headers: new HttpHeaders().set('Authorization', this._authToken)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  // Upload a text of User
  uploadText$(text: string): Observable<AudioModel> {
    return this.http
      .post<AudioModel>(`${ENV.BASE_API}user/uploadText`, text, {
        headers: new HttpHeaders().set('Authorization', this._authToken)
      })
      .pipe(
        catchError((error) => this._handleError(error))
      );
  }

  private _handleError(err: HttpErrorResponse | any): Observable<any> {
    const errorMsg = err.message || 'Error: Unable to complete request.';
    if (err.message && err.message.indexOf('No JWT present') > -1) {
      this.auth.login();
    }
    return ObservableThrowError(errorMsg);
  }

}

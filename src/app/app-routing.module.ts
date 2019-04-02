import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// Route guards
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';
import { LoginCheckGuard } from './auth/login-check.guard';
// Page components
import { LoginComponent } from './pages/login/login.component';
import { RecordRTCComponent } from './pages/record/record-rtc.component';
import { RecordVideoComponent } from './pages/record-video/record-video.component';
import { RecordTextComponent } from './pages/record-text/record-text.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [
      LoginCheckGuard
    ]
  },
  {
    path: 'record',
    component: RecordRTCComponent,
    canActivate: [
      AuthGuard
    ]
  },
  {
    path: 'recordVideo',
    component: RecordVideoComponent,
    canActivate: [
      AuthGuard
    ]
  },
  {
    path: 'recordText',
    component: RecordTextComponent,
    canActivate: [
      AuthGuard
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  providers: [
    AuthGuard,
    AdminGuard,
    LoginCheckGuard
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// Route guards
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';
// Page components
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RecordRTCComponent } from './pages/record/record-rtc.component';
import { RecordVideoComponent } from './pages/record-video/record-video.component';
import { CallbackComponent } from './pages/callback/callback.component';
import { MyRsvpsComponent } from './pages/my-rsvps/my-rsvps.component';

const routes: Routes = [
  // {
  //   path: '',
  //   component: HomeComponent,
  // },
  {
    path: '',
    component: LoginComponent,
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
  // {
  //   path: 'callback',
  //   component: CallbackComponent
  // },
  // {
  //   path: 'event/:id',
  //   loadChildren: './pages/event/event.module#EventModule',
  //   canActivate: [
  //     AuthGuard
  //   ]
  // },
  // {
  //   path: 'my-rsvps',
  //   component: MyRsvpsComponent,
  //   canActivate: [
  //     AuthGuard
  //   ]
  // },
  // {
  //   path: 'admin',
  //   loadChildren: './pages/admin/admin.module#AdminModule',
  //   canActivate: [
  //     AuthGuard,
  //     AdminGuard
  //   ]
  // },
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
    AdminGuard
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

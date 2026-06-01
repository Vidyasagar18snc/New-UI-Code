 import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../Service/ApiService ';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-camera',
  imports: [CommonModule,FormsModule],
  templateUrl: './camera-component.html',
  styleUrls: ['./camera-component.css']
})
export class CameraComponent {
   email:string='';

  password:string='';

  errorMessage:string='';
  candidates:any[]=[];
  candidatesLoading=false;

  constructor(

    private apiService:ApiService,

    private router:Router,
    private cdr:ChangeDetectorRef

  ){}

  login(){

    const payload={

      email:this.email,

      password:this.password
    };

    this.apiService
        .panelLogin(payload)

        .subscribe({

          next:(res:any)=>{

            console.log(
              'Login Success',
              res
            );

            localStorage.setItem(
              'panelId',
              res.id
            );

            localStorage.setItem(
              'panelName',
              res.name
            );

            localStorage.setItem(
              'panelEmail',
              res.email
            );

            this.loadMyCandidates(
              res.id
            );

            this.router.navigate([
              '/interview-dashboard'
            ]);
          },

          error:(err:any)=>{

            console.error(err);

            this.errorMessage=
              'Invalid Credentials';
          }
        });
  }

  loadMyCandidates(panelId:string){

  this.candidatesLoading=true;

  this.apiService
      .getMyCandidates(panelId)

      .subscribe({

        next:(res:any)=>{

          console.log(
            'Assigned Candidates:',
            res
          );

          this.candidates=
                Array.isArray(res)
                ?res
                :[];

          this.candidatesLoading=false;

          this.cdr.detectChanges();
        },

        error:(err:any)=>{

          console.error(err);

          this.candidates=[];

          this.candidatesLoading=false;

          this.cdr.detectChanges();
        }
      });
}
}
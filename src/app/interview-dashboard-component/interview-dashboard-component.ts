import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { ApiService }
from '../Service/ApiService ';

import { CommonModule }
from '@angular/common';

import { FormsModule }
from '@angular/forms';

import { HttpClientModule }
from '@angular/common/http';

@Component({

  selector:'app-interview-dashboard-component',

  imports:[
    CommonModule,
    FormsModule,
    HttpClientModule
  ],

  templateUrl:
    './interview-dashboard-component.html',

  styleUrl:
    './interview-dashboard-component.css',
})

export class InterviewDashboardComponent
implements OnInit {

  candidates:any[]=[];

  selectedCandidate:any=null;

  selectedPanel:string='';

  selectedPanelName:string='';

  selectedDate:string='';

  freeSlots:string[]=[];

  selectedSlot:string='';

  loading=false;

  candidatesLoading=false;

  slotsChecked=false;

  searchQuery:string='';

  statusFilter:string='';

  todayDate:string=
      new Date()
      .toISOString()
      .split('T')[0];

  constructor(

    private Apiservice:ApiService,

    private cdr:ChangeDetectorRef

  ){}


  ngOnInit():void{

    const panelId=

        localStorage.getItem(
          'panelId'
        );

    console.log(
      'Logged In PanelId:',
      panelId
    );

    if(panelId){

      this.loadMyCandidates(
        panelId
      );
    }
  }


  loadMyCandidates(panelId:string){

    this.candidatesLoading=true;

    this.Apiservice
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


  getInitials(name:string):string{

    if(!name)return '?';

    return name
      .split(' ')
      .map((n:string)=>n[0])
      .slice(0,2)
      .join('')
      .toUpperCase();
  }

  getStatusClass(status:string):string{

    if(!status)
      return 'status-default';

    const s=
        status.toLowerCase();

    if(s==='shortlisted')
      return 'status-shortlisted';

    if(s==='pending')
      return 'status-pending';

    if(s==='scheduled')
      return 'status-scheduled';

    return 'status-default';
  }

  filteredCandidates():any[]{

    const q=
        (this.searchQuery||'')
        .toLowerCase();

    return this.candidates.filter((c)=>{

      const matchesSearch=

        !q ||

        (c?.name||'')
        .toLowerCase()
        .includes(q)

        ||

        (c?.role||'')
        .toLowerCase()
        .includes(q)

        ||

        (c?.position||'')
        .toLowerCase()
        .includes(q);

      const matchesStatus=

        !this.statusFilter ||

        (c?.status||'')
        .toLowerCase()

        ===

        this.statusFilter
        .toLowerCase();

      return matchesSearch
              &&
             matchesStatus;
    });
  }


  openScheduler(candidate:any){

    console.log(
      'Selected Candidate:',
      candidate
    );

    this.selectedCandidate=
        candidate;

    this.selectedDate='';

    this.selectedSlot='';

    this.freeSlots=[];

    this.slotsChecked=false;

    this.selectedPanel=

        localStorage.getItem(
          'panelEmail'
        ) || '';

    this.selectedPanelName=

        localStorage.getItem(
          'panelName'
        ) || '';
  }


  checkAvailability(){

    if(
      !this.selectedPanel
      ||
      !this.selectedDate
    ){

      alert(
        'Please select date'
      );

      return;
    }

    this.loading=true;

    this.slotsChecked=false;

    this.freeSlots=[];

    this.selectedSlot='';

    this.Apiservice
        .getAvailableSlots(

          this.selectedPanel,

          this.selectedDate

        )

        .subscribe({

          next:(res:any)=>{

            console.log(
              '[Slots] API response:',
              res
            );

            if(Array.isArray(res)){

              this.freeSlots=res;

            }else{

              this.freeSlots=

                res?.slots
                ??
                res?.data
                ??
                res?.availableSlots
                ??
                [];
            }

            console.log(
              '[Slots] Final:',
              this.freeSlots
            );

            this.loading=false;

            this.slotsChecked=true;

            this.cdr.detectChanges();
          },

          error:(err:any)=>{

            console.error(
              '[Slots] Error:',
              err
            );

            this.loading=false;

            this.slotsChecked=true;

            this.cdr.detectChanges();
          }
        });
  }


  scheduleInterview(){

    if(!this.selectedSlot){

      alert(
        'Please select a slot'
      );

      return;
    }

    const payload={

      candidateId:
          this.selectedCandidate?.id,

      candidateName:
          this.selectedCandidate?.name,

      panelName:
          this.selectedPanelName,

      panelEmail:
          this.selectedPanel,

      selectedSlot:
          this.selectedSlot,
    };

    console.log(
      '[Schedule] Payload:',
      payload
    );

    this.Apiservice
        .scheduleInterview(payload)

        .subscribe({

          next:()=>{

            alert(
              'Interview Scheduled Successfully'
            );

            this.selectedCandidate=
                null;

            const panelId=

                localStorage.getItem(
                  'panelId'
                );

            if(panelId){

              this.loadMyCandidates(
                panelId
              );
            }
          },

          error:(err:any)=>{

            console.error(
              '[Schedule] Error:',
              err
            );

            const errorMessage=

              err?.error?.message
              ||
              err?.error?.error
              ||
              '';

            if(

              err?.status===409

              ||

              errorMessage
              .toLowerCase()
              .includes(
                'already booked'
              )

            ){

              alert(
                'Panel member is busy. Choose another slot.'
              );

              this.checkAvailability();

            }else{

              alert(
                'Unable to schedule interview'
              );
            }
          }
        });
  }


  closeModal(){

    this.selectedCandidate=
        null;
  }


  onOverlayClick(event:MouseEvent){

    if(

      (event.target as HTMLElement)
      .classList
      .contains(
        'modal-overlay'
      )

    ){

      this.closeModal();
    }
  }
}
import { Routes } from '@angular/router';
import { Dashboardcomponent } from './dashboardcomponent/dashboardcomponent';
import { Uploadcomponent } from './uploadcomponent/uploadcomponent';
import { Layoutcomponent } from './layoutcomponent/layoutcomponent';
import { Jdcomponent } from './jdcomponent/jdcomponent';
import { JdDetailscomponent } from './jd-detailscomponent/jd-detailscomponent';
import { AnalyticsComponent } from './analytics-component/analytics-component';
import { RankComponent } from './rank-component/rank-component';
import { InterviewComponent } from './interview-component/interview-component';
import { FeedbackDashboardComponent } from './feedback-dashboard-component/feedback-dashboard-component';
import { OfferLetterComponent } from './offer-letter-component/offer-letter-component';
import { TestComponent } from './testcomponent/testcomponent';
import { InterviewDashboardComponent } from './interview-dashboard-component/interview-dashboard-component';
import { CameraComponent } from './camera-component/camera-component';
import { SlotSelectionComponent } from './slot-selection-component/slot-selection-component';
import { OfferResponseComponent } from './offer-response-component/offer-response-component';
import { OnboardingUploadComponent } from './onboarding-upload-component/onboarding-upload-component';
import { HrDocumentVerificationComponent } from './hr-document-verification-component/hr-document-verification-component';
import { EmployeeLoginComponent } from './employee-login-component/employee-login-component';
import { EmployeeDashboardComponent } from './employee-dashboard-component/employee-dashboard-component';
import { authGuard } from './authGuard';
import { AssetDashboardComponent } from './asset-dashboard-component/asset-dashboard-component';
import { Employeedetails } from './employeedetails/employeedetails';
import { EmployeeAssetTrackingComponent } from './employee-asset-tracking-component/employee-asset-tracking-component';
import { DeboardingDashboardComponent } from './deboarding-dashboard-component/deboarding-dashboard-component';
import { PanelManagement } from './pages/panel-management/panel-management';
import { BackgroundVerification } from './background-verification/background-verification';

export const routes: Routes = [
  // PUBLIC ROUTES

  {
    path: '',
    redirectTo: 'PortalLogin',
    pathMatch: 'full'
  },
  {
    path: 'PortalLogin',
    component: EmployeeLoginComponent
  },

  {
    path: 'test',
    component: TestComponent
  },
  {
    path: 'login',
    component: CameraComponent
  },
  {
    path: 'offer-response/:token',
    component: OfferResponseComponent
  },
  {
    path: 'uploaddocuments/:candidateId',
    component: OnboardingUploadComponent
  },
  {
    path: 'slots',
    component: SlotSelectionComponent
  },
  {
    path: 'panel-management',
    component: PanelManagement
  },
  {
    path: 'deboarding-dashboard',
    component: DeboardingDashboardComponent
  },

  // EMPLOYEE DETAILS
  {
    path: 'Employee-Details',
    component: Employeedetails,
    canActivate: [authGuard],
    data: {
      departments: ['HR']
    }
  },

  // EMPLOYEE DASHBOARD
  {
    path: 'Employee-dashboard',
    component: EmployeeDashboardComponent,
    canActivate: [authGuard],
    data: {
      departments: [
        'Engineering',
        'Product',
        'Design',
        'Sales',
        'Finance',
        'Operations'
      ]
    }
  },

  // PANEL ROUTES
  {
    path: 'panel',
    component: Layoutcomponent,
    canActivate: [authGuard],
    data: {
      departments: ['PANEL', 'INTERVIEWER']
    },
    children: [
      {
        path: 'interview-dashboard',
        component: InterviewDashboardComponent
      },

    ]
  },

  // HR ROUTES
  {
    path: '',
    component: Layoutcomponent,
    canActivate: [authGuard],
    data: {
      departments: ['HR']
    },
    children: [
      {
        path: '',
        component: Dashboardcomponent
      },
      {
        path: 'dashboard',
        component: Dashboardcomponent
      },
      {
        path: 'upload',
        component: Uploadcomponent
      },
      {
        path: 'bg-verification',
        component: BackgroundVerification
      },
      {
        path: 'job',
        component: Jdcomponent
      },
      {
        path: 'jd-details',
        component: JdDetailscomponent
      },
      {
        path: 'rank',
        component: RankComponent
      },
      {
        path: 'Feedbackdashboard',
        component: FeedbackDashboardComponent
      },
      {
        path: 'interviewFeedback',
        component: InterviewComponent
      },

      {
        path: 'interview-dashboard',
        component: InterviewDashboardComponent
      },
      {
        path: 'hr-document-verification',
        component: HrDocumentVerificationComponent
      },
      {
        path: 'Analytics',
        component: AnalyticsComponent
      },

      {
        path: 'offer-letter',
        component: OfferLetterComponent
      },
      {
        path: 'assestdashboard',
        component: AssetDashboardComponent
      },
      {
        path: 'asset-tracking',
        component: EmployeeAssetTrackingComponent
      }
    ]
  },

  // FALLBACK
  {
    path: '**',
    redirectTo: 'login'
  }
];
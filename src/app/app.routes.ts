import { Routes } from '@angular/router';

import { Dashboardcomponent } from './dashboardcomponent/dashboardcomponent';
import { Uploadcomponent } from './uploadcomponent/uploadcomponent';
import { Layoutcomponent } from './layoutcomponent/layoutcomponent';
import { Jdcomponent } from './jdcomponent/jdcomponent';
import { JdDetailscomponent } from './jd-detailscomponent/jd-detailscomponent';

export const routes: Routes = [
  {
    path: '',
    component: Layoutcomponent, // ✅ IMPORTANT
    children: [
      { path: '', component: Dashboardcomponent },
      { path: 'dashboard', component: Dashboardcomponent },
      { path: 'upload', component: Uploadcomponent },
      {path: 'job', component: Jdcomponent },
      {path:'jd-details', component: JdDetailscomponent}
    ]
  }
];
import {

  CanActivateFn,

  CanActivateChildFn,

  Router

} from '@angular/router';

import {

  inject

} from '@angular/core';

// COMMON FUNCTION

const checkAccess = (

  route: any,

  router: Router
) => {

  const department =

    localStorage.getItem(
      'department'
    );

  const allowedDepartments =

    route.data?.['departments']
    || [];

  // NOT LOGGED IN

  if (!department) {

    router.navigate([
      '/EmployeeLogin'
    ]);

    return false;
  }

  // ADMIN FULL ACCESS

  if (

    department === 'Admin'
  ) {

    return true;
  }

  // VALIDATION

  if (

    allowedDepartments.length &&

    !allowedDepartments.includes(
      department
    )
  ) {

    // HR REDIRECT

    if (

      department === 'HR'
    ) {

      router.navigate([
        '/dashboard'
      ]);
    }

    // PANEL REDIRECT

    else if (

      department === 'PANEL'

      ||

      department === 'INTERVIEWER'
    ) {

      router.navigate([
        '/panel/interview-dashboard'
      ]);
    }

    // EMPLOYEE REDIRECT

    else {

      router.navigate([
        '/Employee-dashboard'
      ]);
    }

    return false;
  }

  return true;
};

// ROUTE GUARD

export const authGuard:
CanActivateFn = (

  route,

  state
) => {

  const router = inject(
    Router
  );

  return checkAccess(
    route,
    router
  );
};

// CHILD ROUTE GUARD

export const childAuthGuard:
CanActivateChildFn = (

  childRoute,

  state
) => {

  const router = inject(
    Router
  );

  return checkAccess(
    childRoute,
    router
  );
};
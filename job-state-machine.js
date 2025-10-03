// Job State Machine - Centralized status management
class JobStateMachine {
  constructor() {
    // Job status state machine
    this.jobStates = {
      matching: {
        allowedTransitions: ['assigned', 'cancelled', 'expired'],
        permissions: {
          assigned: ['employer'],
          cancelled: ['employer'],
          expired: ['system']
        }
      },
      assigned: {
        allowedTransitions: ['pending', 'completed', 'cancelled'],
        permissions: {
          pending: ['employee'],
          completed: ['employer'],
          cancelled: ['employer']
        }
      },
      pending: {
        allowedTransitions: ['completed'],
        permissions: {
          completed: ['employer']
        }
      },
      completed: { allowedTransitions: [] },
      cancelled: { allowedTransitions: [] },
      expired: { allowedTransitions: [] }
    };

    // Employee status state machine
    this.employeeStates = {
      open_to_work: {
        allowedTransitions: ['busy'],
        triggers: {
          busy: ['apply_to_job']
        }
      },
      busy: {
        allowedTransitions: ['open_to_work'],
        triggers: {
          open_to_work: ['job_completed', 'job_cancelled', 'not_selected', 'cancel_application']
        }
      }
    };
  }

  // Job status methods
  canJobTransition(fromStatus, toStatus, userRole = null) {
    const state = this.jobStates[fromStatus];
    if (!state) return false;
    
    if (!state.allowedTransitions.includes(toStatus)) return false;
    
    if (userRole && state.permissions[toStatus]) {
      return state.permissions[toStatus].includes(userRole);
    }
    
    return true;
  }

  validateJobTransition(job, toStatus, userId, userRole) {
    if (!this.canJobTransition(job.status, toStatus, userRole)) {
      throw new Error(`Invalid job transition from ${job.status} to ${toStatus} for ${userRole}`);
    }
    
    // Additional business rules
    if (toStatus === 'assigned' && job.employerId !== userId) {
      throw new Error('Only job employer can assign employees');
    }
    
    if (toStatus === 'pending' && job.selectedEmployeeId !== userId) {
      throw new Error('Only selected employee can mark job as pending');
    }
    
    return true;
  }

  // Employee status methods
  canEmployeeTransition(fromStatus, toStatus) {
    const state = this.employeeStates[fromStatus];
    if (!state) return false;
    return state.allowedTransitions.includes(toStatus);
  }

  validateEmployeeTransition(employee, toStatus, trigger) {
    if (!this.canEmployeeTransition(employee.employeeStatus, toStatus)) {
      throw new Error(`Invalid employee transition from ${employee.employeeStatus} to ${toStatus}`);
    }
    
    const state = this.employeeStates[employee.employeeStatus];
    if (state.triggers[toStatus] && !state.triggers[toStatus].includes(trigger)) {
      throw new Error(`Invalid trigger '${trigger}' for transition to ${toStatus}`);
    }
    
    return true;
  }

  // Backward compatibility methods
  canTransition(fromStatus, toStatus, userRole = null) {
    return this.canJobTransition(fromStatus, toStatus, userRole);
  }

  validateTransition(job, toStatus, userId, userRole) {
    return this.validateJobTransition(job, toStatus, userId, userRole);
  }
}

module.exports = JobStateMachine;
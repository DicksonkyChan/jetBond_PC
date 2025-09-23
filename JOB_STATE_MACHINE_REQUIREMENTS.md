# Job State Machine & Rule Engine Requirements

## Overview
Implement a centralized job status management system with configurable state transitions and rule-based workflow engine to replace scattered hardcoded status logic.

## Current Problems
- Status validation scattered across multiple endpoints
- Inconsistent transition rules (`job.status !== 'assigned'` vs `job.status !== 'pending'`)
- Hard to maintain and extend with new statuses
- No audit trail for status changes
- Business rules mixed with implementation logic

## Requirements

### 1. State Machine Configuration
```javascript
const JOB_STATE_MACHINE = {
  matching: {
    allowedTransitions: ['assigned', 'cancelled', 'expired'],
    triggers: {
      assigned: 'employer_selects_employee',
      cancelled: 'employer_cancels',
      expired: 'auto_expiration'
    }
  },
  assigned: {
    allowedTransitions: ['pending', 'completed', 'cancelled'],
    triggers: {
      pending: 'employee_completes',
      completed: 'employer_completes',
      cancelled: 'employer_cancels'
    }
  },
  pending: {
    allowedTransitions: ['completed'],
    triggers: {
      completed: 'employer_completes_with_rating'
    }
  },
  completed: { allowedTransitions: [] },
  cancelled: { allowedTransitions: [] },
  expired: { allowedTransitions: [] }
}
```

### 2. Rule Engine Features
- **Validation**: `canTransition(jobId, fromStatus, toStatus, userId, userRole)`
- **Authorization**: Role-based transition permissions
- **Side Effects**: Automatic actions on state changes
- **Audit Trail**: Log all transitions with timestamps and reasons

### 3. Business Rules
- Only employers can cancel jobs in 'matching' status
- Only employees can trigger 'assigned' → 'pending' transition
- Only employers can trigger 'pending' → 'completed' transition
- Auto-expiration only applies to 'matching' status
- Status changes trigger notifications to relevant parties

### 4. Side Effects Configuration
```javascript
const STATE_SIDE_EFFECTS = {
  assigned: {
    actions: ['set_employee_busy', 'release_other_applicants', 'notify_selected_employee']
  },
  completed: {
    actions: ['set_employee_open', 'update_ratings', 'notify_completion']
  },
  cancelled: {
    actions: ['release_all_applicants', 'notify_cancellation']
  }
}
```

## Architecture

### 1. Core Components
- **JobStateMachine**: Main state machine class
- **RuleEngine**: Validates transitions and applies business rules
- **StateTransitionService**: Handles state changes with side effects
- **AuditLogger**: Records all state changes

### 2. API Integration
- Replace hardcoded status checks with `stateMachine.canTransition()`
- Use `stateTransitionService.transition()` for all status changes
- Middleware to validate all job status modifications

### 3. Database Schema
```javascript
// Add to job document
{
  statusHistory: [
    {
      from: 'matching',
      to: 'assigned',
      triggeredBy: 'dee@jetbond.com',
      trigger: 'employer_selects_employee',
      timestamp: '2025-01-17T10:30:00Z',
      metadata: { selectedEmployeeId: 'rikke@jetbond.com' }
    }
  ]
}
```

## Implementation Plan

### Phase 1: Core State Machine
1. Create JobStateMachine class with configuration
2. Implement transition validation logic
3. Add unit tests for all state transitions

### Phase 2: Rule Engine Integration
1. Replace hardcoded status checks in all endpoints
2. Add role-based authorization
3. Implement side effects system

### Phase 3: Audit & Monitoring
1. Add status history tracking
2. Create audit trail endpoints
3. Add monitoring dashboard for state transitions

### Phase 4: Configuration UI
1. Admin interface for viewing state machine
2. Status transition analytics
3. Business rule configuration panel

## Benefits
- **Maintainability**: Single source of truth for status logic
- **Scalability**: Easy to add new statuses and transitions
- **Reliability**: Guaranteed valid state transitions
- **Auditability**: Complete history of all status changes
- **Flexibility**: Configuration-driven business rules
- **Consistency**: Uniform status handling across all endpoints

## Success Metrics
- Zero invalid state transitions
- 100% audit trail coverage
- Reduced code duplication in status handling
- Faster feature development for new job workflows
- Improved system reliability and debugging capabilities
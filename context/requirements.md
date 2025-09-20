# JetBond Requirements Document

## Project Overview
JetBond is a real-time gig marketplace mobile app connecting employees and employers for urgent job opportunities in Hong Kong.

## Core Business Requirements

### 1. User Types
- **Employees**: Job seekers looking for gig work
- **Employers**: Businesses needing immediate staffing

### 2. Target Market
- **Geographic**: Hong Kong market initially
- **Job Types**: Gig work, temporary positions, urgent staffing needs
- **Use Case**: Restaurant short-staffed, needs server within hours

### 3. Language Support
- **Bilingual**: Traditional Chinese and English
- **Cross-language matching**: Chinese job posts match English profiles

## Functional Requirements

### User Registration & Profiles ✅ IMPLEMENTED

#### Employee Profile (Minimum Required) ✅ COMPLETE
- **REQ-001**: Name field (required) ✅ AuthScreen
- **REQ-002**: Job description/experience (free text, any language) ✅ ProfileScreen
- **REQ-003**: Preferred districts (multiple selection from HK districts) ✅ PostJobScreen
- **REQ-004**: Hourly rate range (min/max in HKD) ✅ PostJobScreen
- **REQ-005**: Rating history (good/neutral/bad counts) ✅ EmployeeDashboard

#### Employer Profile (Minimum Required) ✅ COMPLETE
- **REQ-006**: Company/Business name (required) ✅ AuthScreen
- **REQ-007**: Contact information (required) ✅ ProfileScreen
- **REQ-008**: Rating history (good/neutral/bad counts) ✅ EmployerDashboard

### Job Posting System ✅ IMPLEMENTED

#### Job Post Requirements ✅ COMPLETE
- **REQ-009**: Job title/description (free text, any language) ✅ PostJobScreen
- **REQ-010**: District location (HK districts) ✅ PostJobScreen dropdown
- **REQ-011**: Hourly rate offered (HKD) ✅ PostJobScreen
- **REQ-012**: Experience level required ✅ PostJobScreen description
- **REQ-013**: Duration/hours needed ✅ PostJobScreen
- **REQ-014**: Urgency level ✅ PostJobScreen (implicit in posting)

### Matching System

#### Matching Algorithm
- **REQ-015**: AI-powered matching using DeepSeek embeddings for semantic similarity
- **REQ-016**: Bilingual matching ("餐廳服務員" matches "restaurant server")
- **REQ-017**: Scoring factors:
  - Semantic similarity (50% weight)
  - District match (30% weight)
  - Rate compatibility (20% weight)
- **REQ-018**: Filtering by rating threshold and active users only

#### Matching Flow
- **REQ-019**: Employer posts urgent job
- **REQ-020**: System finds top 10 matching employees
- **REQ-021**: Push notifications sent to matched employees
- **REQ-022**: Response window opens when first employee responds
- **REQ-023**: Window closes after 5 responses OR 5 minutes (whichever first)
- **REQ-024**: Employer selects from candidate list

### Response Window System

#### Timing Rules
- **REQ-025**: 5-minute timer starts after FIRST response
- **REQ-026**: Window closure conditions:
  - 5 employees respond, OR
  - 5 minutes elapsed after first response
- **REQ-027**: First-come basis priority visibility

#### Candidate Selection
- **REQ-028**: Employee identities masked until selection
- **REQ-029**: Information shown: Experience, ratings, rate range, response time
- **REQ-030**: Employer chooses from response list
- **REQ-031**: Selected/rejected notifications to all candidates

### Rating System

#### Rating Structure
- **REQ-032**: Simple 3-tier rating system (Good / Neutral / Bad)
- **REQ-033**: Mutual rating - both employer and employee rate each other
- **REQ-034**: Display format showing count of each rating type
- **REQ-035**: Poor ratings (>30% bad) reduce matching priority

### Real-time Features

#### Push Notifications
- **REQ-036**: Job match notifications to top 10 employees
- **REQ-037**: Response confirmations to employers
- **REQ-038**: Selection results to all candidates
- **REQ-039**: Real-time updates during matching window

#### Live Updates
- **REQ-040**: Response counter for employers
- **REQ-041**: Timer countdown display
- **REQ-042**: Window closure notifications
- **REQ-043**: Candidate list updates

## Technical Requirements

### Mobile Platform ✅ IMPLEMENTED
- **REQ-044**: Flutter framework (cross-platform) ✅ COMPLETE
- **REQ-045**: iOS and Android platform support ✅ COMPLETE
- **REQ-046**: Basic offline capability for profile viewing 📋 PENDING
- **REQ-047**: Native push notification integration 📋 PENDING

### Backend Infrastructure ✅ IMPLEMENTED
- **REQ-048**: AWS cloud provider ✅ COMPLETE
- **REQ-049**: App Runner containerized deployment ✅ COMPLETE
- **REQ-050**: DynamoDB database (NoSQL for scalability) ✅ COMPLETE
- **REQ-051**: WebSocket API Gateway for real-time 📋 PENDING
- **REQ-052**: DeepSeek API for AI embeddings 📋 PENDING

### Performance Requirements
- **REQ-053**: Matching speed <3 seconds for top 10 matches
- **REQ-054**: Push notification delivery <10 seconds
- **REQ-055**: Real-time updates <1 second latency
- **REQ-056**: Support 1000+ concurrent users

### Security Requirements
- **REQ-057**: AWS Cognito authentication
- **REQ-058**: Data encryption at rest and in transit
- **REQ-059**: API security (rate limiting, input validation)
- **REQ-060**: Masked candidate identities for privacy
- **REQ-061**: AWS Secrets Manager for API keys

## Non-Functional Requirements

### Scalability
- **User growth**: Support 10K+ users initially
- **Geographic expansion**: Architecture ready for other cities
- **Feature expansion**: Modular design for new job categories

### Reliability
- **Uptime**: 99.9% availability
- **Error handling**: Graceful degradation
- **Backup systems**: Fallback matching without AI if needed
- **Data backup**: Automated DynamoDB backups

### Usability
- **Language switching**: Easy toggle between Chinese/English
- **Simple UI**: Minimal steps for job posting/responding
- **Accessibility**: Support for screen readers
- **Onboarding**: Quick profile setup process

## Business Rules

### Matching Rules
- **REQ-062**: Maximum 10 candidates per job notification
- **REQ-063**: Minimum 60% similarity score for matching
- **REQ-064**: Rating penalty: >30% bad ratings = 50% score reduction
- **REQ-065**: Active users only (logged in within 7 days)

### Response Window Rules
- **REQ-066**: Timer starts only after first response
- **REQ-067**: Maximum 5 responses accepted
- **REQ-068**: Employer must select within 24 hours of window closure
- **REQ-069**: Auto-expire jobs after 48 hours if no selection

### Rating Rules
- **REQ-070**: Both parties must complete job to rate
- **REQ-071**: Ratings visible in future matches
- **REQ-072**: No rating editing after submission
- **REQ-073**: Minimum 3 completed jobs before rating impact

## MVP Scope (Version 1.0)

### Included Features
- User registration and profiles
- Job posting and matching
- Real-time response window
- Push notifications
- Basic rating system
- Bilingual support

### Excluded from MVP
- Payment processing
- Advanced job categories
- Video/photo attachments
- In-app messaging
- Job history analytics
- Multi-city support

## Success Metrics

### User Engagement
- **Match rate**: >70% of jobs get at least 3 responses
- **Response time**: Average <2 minutes for first response
- **Completion rate**: >80% of confirmed jobs completed
- **User retention**: >60% monthly active users

### Business Metrics
- **Time to fill**: Average job filled within 2 hours
- **User satisfaction**: >4.0/5.0 average rating
- **Platform growth**: 20% month-over-month user growth
- **Market penetration**: 5% of HK gig market within 6 months

## Compliance & Legal

### Data Protection
- **GDPR compliance**: User data rights and deletion
- **Local privacy laws**: Hong Kong data protection
- **Data retention**: Automatic cleanup of old data
- **User consent**: Clear privacy policy acceptance

### Employment Law
- **Gig worker classification**: Compliance with HK labor laws
- **Minimum wage**: Rate validation against legal minimums
- **Working hours**: Tracking for legal compliance
- **Dispute resolution**: Basic mediation process
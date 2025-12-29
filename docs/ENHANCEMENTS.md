# Admo AI - Future Enhancements Tracker

> Last Updated: 2025-12-29

This document tracks planned enhancements and improvements for each module of the Admo AI platform. Use this as a reference for future development sprints.

---

## 📋 Leave Request Module

**Status:** ✅ Core Complete

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Email Notifications | High | Send email to teacher when leave is approved/rejected |
| Leave Balance Tracking | High | Track sick leave, casual leave quotas per teacher per year |
| Calendar View | Medium | Visual calendar showing who's on leave on each day |
| Substitution Suggestions | Medium | AI-suggested substitute teachers based on availability |
| Bulk Approval | Low | Allow principal to approve multiple leaves at once |
| Export Reports | Low | PDF/Excel export of leave reports for HR |
| Leave Policies | Low | Configurable leave types and limits per school |

---

## 👥 User Management Module

**Status:** 🔲 Basic Implementation

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Password Reset | High | Forgot password flow with email verification |
| Profile Management | High | Allow users to update their profile and photo |
| Bulk User Import | Medium | CSV import for adding multiple teachers/staff |
| Activity Logs | Medium | Track user login history and actions |
| Two-Factor Auth (2FA) | Low | Optional 2FA for admin accounts |
| Session Management | Low | View and revoke active sessions |

---

## 📚 Student Management Module

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Student Profiles | High | Complete student database with photos |
| Parent Portal | High | Separate login for parents to view child info |
| Bulk Import | Medium | CSV import for student data |
| Student Timeline | Medium | Track academic history, events, notes |
| Document Storage | Low | Store birth certificates, report cards, etc. |

---

## ✅ Attendance Module

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Daily Attendance | High | Mark attendance per class/section |
| Attendance Reports | High | Daily, weekly, monthly attendance summaries |
| SMS to Parents | Medium | Auto-notify parents when child is absent |
| Biometric Integration | Low | Support for biometric attendance devices |
| Late Arrival Tracking | Low | Track students who arrive late |

---

## 📅 Timetable Module

**Status:** 🔲 Basic UI Only

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| CRUD for Timetable | High | Create, edit, delete timetable entries |
| Conflict Detection | High | Warn if teacher is double-booked |
| Teacher View | Medium | Show teacher their personal schedule |
| Period Swap | Medium | Easy way to swap periods between days |
| Printable Timetable | Low | PDF export of timetable |

---

## 💰 Fee Management Module

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Fee Structure | High | Define fee types, amounts, due dates |
| Payment Tracking | High | Mark fees as paid, pending, overdue |
| Payment Reminders | Medium | Auto SMS/email reminders for pending fees |
| Online Payment | Medium | Integration with payment gateway |
| Fee Reports | Low | Monthly/yearly fee collection reports |
| Receipt Generation | Low | Auto-generate fee receipts |

---

## 📝 Exams & Results Module

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Exam Scheduling | High | Create exam timetables |
| Marks Entry | High | Teachers enter marks per subject |
| Report Card Generation | High | Auto-generate student report cards |
| Grade Calculation | Medium | Configurable grading system (CGPA, percentage) |
| Result Analysis | Medium | Class-wise, subject-wise performance analytics |
| SMS Results | Low | Send results to parents via SMS |

---

## 🤖 AI Features

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Homework Generator | High | AI-generated homework based on topic |
| Lesson Plan Generator | High | AI-generated lesson plans |
| Parent Query Bot | Medium | AI chatbot for common parent queries |
| Performance Predictor | Low | Predict student performance trends |
| Smart Substitution | Low | AI-suggested substitutes based on skills |

---

## 📢 Communication Module

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Broadcast Messages | High | Send messages to all parents/teachers |
| WhatsApp Integration | High | Send notifications via WhatsApp |
| SMS Integration | Medium | Send notifications via SMS |
| Email Templates | Medium | Reusable email templates |
| Announcement Board | Low | In-app announcement system |

---

## ⚙️ Settings & Administration

**Status:** 🔲 Planned

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| School Profile | High | Edit school name, logo, contact info |
| Academic Year Setup | High | Configure academic year, terms |
| Class/Section Management | High | Add/edit classes and sections |
| Role Permissions | Medium | Fine-grained permission control |
| Backup & Restore | Low | Database backup functionality |
| Audit Logs | Low | Track all admin actions |

---

## 🛠️ Technical Improvements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Unit Tests | High | Add pytest tests for backend |
| E2E Tests | Medium | Playwright/Cypress tests for frontend |
| CI/CD Pipeline | Medium | GitHub Actions for auto-deployment |
| API Rate Limiting | Medium | Prevent API abuse |
| Caching Layer | Low | Redis caching for frequently accessed data |
| Mobile App | Low | React Native or Flutter mobile app |

---

## 📝 How to Use This Document

1. **Adding Enhancements**: When you identify a new enhancement, add it to the appropriate module table
2. **Priority Levels**:
   - **High**: Critical for MVP or next release
   - **Medium**: Nice to have, plan for upcoming sprints
   - **Low**: Future consideration
3. **Updating Status**: When an enhancement is completed, move it to a "Completed" section or remove it

---

*This document should be reviewed and updated at the start of each development sprint.*

# Admo AI - Future Enhancements Tracker

> Last Updated: 2026-01-02

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

**Status:** ✅ Core Complete

### Completed Features
- ✅ Complete CRUD operations (Add, Edit, View, Delete)
- ✅ 16+ student fields (admission number, personal info, parent details, etc.)
- ✅ Class-first navigation with student count badge
- ✅ Role-based access control (Principal full access, Teachers view all but edit only assigned classes)
- ✅ CSV bulk upload with flexible date parsing (10+ formats)
- ✅ CSV export by class with timestamped filenames
- ✅ Server-side pagination (20 per page)
- ✅ Real-time search by name/admission number with debounce
- ✅ Modern modal design with backdrop blur
- ✅ Dark mode support

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Student Photos | High | Upload and display student profile photos |
| Advanced Filters | High | Filter by gender, blood group, admission date range, active status |
| Parent Portal | High | Separate login for parents to view child info and attendance |
| Siblings Linking | Medium | Link students who are siblings for easy navigation |
| Student Timeline | Medium | Track academic history, achievements, events, disciplinary notes |
| Document Storage | Medium | Store and manage birth certificates, TC, report cards, medical records |
| Bulk Edit | Medium | Update multiple students at once (e.g., promote to next class) |
| Student ID Cards | Medium | Generate printable ID cards with photos and QR codes |
| Attendance Integration | Medium | Show attendance percentage in student list |
| Fee Status Badge | Medium | Display fee status (paid/pending/overdue) in student list |
| Transfer Certificate | Low | Generate TC when student leaves |
| SMS to Parents | Low | Send SMS for important updates (admission, TC, etc.) |
| Student Analytics | Low | Dashboard showing gender ratio, admission trends, class strength |
| Duplicate Detection | Low | AI-powered duplicate student detection during admission |
| Custom Fields | Low | Allow schools to add custom fields per their requirements |
| Barcode Scanner | Low | Scan admission number barcode for quick student lookup |

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

**Status:** ✅ Core Complete

### Completed Features
- ✅ Weekly timetable grid view with periods
- ✅ Inline edit mode for Principal (click-to-edit slots)
- ✅ "My View" toggle for teachers to see their schedule
- ✅ Leave management with approval workflow
- ✅ School Management page (Classes & Subjects CRUD)
- ✅ Teacher assignment to subjects
- ✅ Role-based access control

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Conflict Detection | High | Warn if teacher is double-booked across classes |
| Drag & Drop | High | Drag periods to swap or reassign slots |
| Auto-Timetable Generation | High | AI-powered timetable generation based on constraints |
| Period Templates | Medium | Save and reuse period configurations |
| Substitution Management | Medium | Assign substitute teachers when someone is on leave |
| Break/Lunch Configuration | Medium | Configurable break and lunch periods |
| Multi-Week View | Medium | View/manage timetables for different weeks |
| Copy Timetable | Medium | Copy timetable from one class to another |
| Printable Timetable | Low | PDF export of class/teacher timetable |
| Room/Lab Assignment | Low | Assign rooms/labs to periods, detect conflicts |
| Period Reminders | Low | Push notifications for upcoming periods |
| Timetable History | Low | Track changes and allow rollback |

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

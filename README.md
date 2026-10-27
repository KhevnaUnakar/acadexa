# Acadexa

Acadexa is a Student & Academic Management System designed for managing academic records, enrollment, fees, and academic tracking in a single interface.

## Tech stack

- Frontend: React 19 + Vite
- Backend: Node.js + Express
- Database: MongoDB via Mongoose
- API: REST endpoints for students, courses, fees, departments, admissions, attendance, and examinations

## Current implemented modules

- Student directory and enrollment management
- Course catalog and fee settings
- Fee records and payment tracking
- Department management
- Admission applications for new applicants or existing students
- Admission approval that creates or activates a student record and assigns the selected course
- Course-wise attendance marking by course and date, with per-student status and existing-record updates
- Examination results tracking
- Admin dashboard overview with live metrics from the backend
- Student dashboard preview using the same data model

## Role-based access status

The project currently does not implement a secure authentication or role-based authorization layer. The student portal is presented as a UI preview and should be protected with a proper auth flow (for example JWT or session-based auth with separate admin/student roles) before being exposed publicly.

## Local setup

1. Start the backend:
   - cd backend
   - npm install
   - create a `.env` file with `MONGO_URI=<your-mongodb-connection-string>`
   - npm run dev

2. Start the frontend:
   - cd frontend
   - npm install
   - npm run dev

3. Open the frontend development server in the browser.

## Main routes

- `/api/students`
- `/api/courses`
- `/api/fees`
- `/api/departments`
- `/api/admissions`
- `/api/attendance`
- `/api/examinations`

Admissions can be created as an applicant without a student record. Approving an application enrolls the applicant by email (or updates the selected existing student), assigns the intended course, and links the resulting student to the admission. Repeating approval does not create another student. The server updates the student before marking the admission approved, so a failed enrollment leaves the admission unapproved and can be retried.

Attendance is available under the Courses navigation group and is selected by course and date. The roster includes students currently assigned to that course; existing records for that day are loaded so they can be reviewed or updated. Saving writes one attendance record per student and date.

Run the backend admission workflow tests with `cd backend` followed by `npm test`. These tests use isolated in-memory model doubles and do not write to MongoDB.

## Notes

- The dashboard is designed to use actual backend data rather than mock values.
- Existing CRUD functionality is preserved while the interface is standardized for a more consistent academic workflow.
- If you want to turn this into a production-ready application, the next required step is adding secure identity management and protected routes for admin and student roles.

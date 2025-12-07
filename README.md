# Admo AI - School Management Platform

Admo AI is a comprehensive school management platform designed to streamline administrative tasks, enhance communication, and leverage AI for educational assistance. It features a modern, responsive frontend and a robust, scalable backend.

## 🚀 Features

*   **Multi-Tenancy:** Support for multiple schools with data isolation.
*   **User Management:** Role-based access for Principals, Teachers, and Admins.
*   **Student Management:** Complete database of students with class and section tracking.
*   **Academic Operations:**
    *   **Attendance:** Daily attendance tracking.
    *   **Timetables:** Class schedule management.
    *   **Exams & Results:** Exam scheduling and marks entry.
*   **Administrative Tools:**
    *   **Fee Management:** Fee tracking, status updates, and reminders.
*   **AI & Communication:**
    *   **Teacher Assistant:** AI-generated resources (Homework, Lesson Plans).
    *   **Parent Query Bot:** Automated handling of parent queries.
    *   **Broadcasts:** Communication via WhatsApp/SMS (logging).

## 🛠️ Tech Stack

### Backend
*   **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database:** PostgreSQL
*   **ORM:** [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy + Pydantic)
*   **Authentication:** JWT (JSON Web Tokens) with Argon2 password hashing.

### Frontend
*   **Framework:** [React](https://react.dev/) (via [Vite](https://vitejs.dev/))
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Lucide React](https://lucide.dev/) (Icons), [Framer Motion](https://www.framer.com/motion/) (Animations)
*   **State/Routing:** React Router DOM, Axios

## 📋 Prerequisites

*   **Node.js** (v18+ recommended)
*   **Python** (v3.10+ recommended)
*   **PostgreSQL** (running locally or via Docker)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd admo-ai
```

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Set up environment variables:
Create a `.env` file in the `backend` directory (refer to `.env.example` if available) and configure your database URL and secret keys.

Run the server:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
API Documentation (Swagger UI) is available at `http://localhost:8000/docs`.

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🐳 Docker Support

A `docker-compose.yml` file is included for easy deployment of services.

```bash
docker-compose up --build
```

## 📂 Project Structure

```
admo-ai/
├── backend/                # FastAPI Backend
│   ├── main.py             # Application entry point
│   ├── models.py           # Database models (SQLModel)
│   ├── database.py         # Database connection logic
│   ├── auth_utils.py       # Authentication utilities
│   └── requirements.txt    # Python dependencies
├── frontend/               # React Frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
├── database_architecture.md # Database design documentation
└── docker-compose.yml      # Docker orchestration
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.



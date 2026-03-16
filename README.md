# Support Ticket System

A full-stack support ticket management system with automatic ticket classification using an LLM.

Users can submit support tickets, view and filter them, and see system statistics.  
When a ticket description is written, an LLM automatically suggests the ticket category and priority.

---

## Features

### Ticket Management
- Create support tickets
- View all tickets
- Update ticket status
- Filter by category, priority, and status
- Search by title and description

### LLM Classification
When the user writes a ticket description:
- The system calls an LLM API
- It predicts:
  - Ticket category
  - Ticket priority
- The user can accept or override the suggestion.

### Statistics Dashboard
The stats endpoint provides:
- Total tickets
- Open tickets
- Average tickets per day
- Priority breakdown
- Category breakdown

Statistics are calculated using **database aggregation**.

---

## Tech Stack

### Backend
- Django
- Django REST Framework
- PostgreSQL

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### LLM Integration
- Groq API
- Model: `llama-3.3-70b-versatile`

Groq was chosen because it provides a free API tier and supports OpenAI-style chat completions.

### Infrastructure
- Docker
- Docker Compose

---

## Project Structure
support-ticket-system
│
├── backend
│ ├── config
│ ├── tickets
│ ├── manage.py
│ └── requirements.txt
│
├── frontend
│ ├── index.html
│ ├── style.css
│ └── app.js
│
├── docker-compose.yml
├── backend.Dockerfile
├── frontend.Dockerfile
└── README.md

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <project-folder>
cd support-ticket-system
```
2. Add LLM API key

Create:backend/.env

Example:GROQ_API_KEY=your_api_key_here
3. Run the application
docker-compose up --build

Docker will start:

PostgreSQL database

Django backend

Frontend (served via Nginx)

Access the application

Frontend UI:

http://localhost:3000

Backend API:

http://localhost:8000/api/tickets/

Stats endpoint:

http://localhost:8000/api/tickets/stats/
API Endpoints
Create Ticket
POST /api/tickets/

Example:

{
 "title": "Login issue",
 "description": "I cannot login to my account",
 "category": "account",
 "priority": "high"
}
List Tickets
GET /api/tickets/

Filters:

/api/tickets/?category=billing
/api/tickets/?priority=high
/api/tickets/?status=open
/api/tickets/?search=login
Update Ticket
PATCH /api/tickets/<id>/

Example:

{
 "status": "resolved"
}
Ticket Classification
POST /api/tickets/classify/

Example request:

{
 "description": "My card was charged twice"
}

Example response:

{
 "suggested_category": "billing",
 "suggested_priority": "high"
}
Ticket Statistics
GET /api/tickets/stats/

Example response:

{
 "total_tickets": 10,
 "open_tickets": 5,
 "avg_tickets_per_day": 2.3,
 "priority_breakdown": {
   "low": 2,
   "medium": 3,
   "high": 4,
   "critical": 1
 },
 "category_breakdown": {
   "billing": 3,
   "technical": 4,
   "account": 2,
   "general": 1
 }
}
Design Decisions
Django REST Framework

Chosen for rapid API development and built-in serialization.

Database Aggregation

Statistics use Django ORM aggregation (annotate, Count) instead of Python loops for better performance.

LLM Provider

Groq was selected because:

Free tier available

Fast inference

Compatible chat completion API

Frontend Approach

Vanilla JavaScript was used instead of React to keep the implementation lightweight while still supporting dynamic updates.

Running Without Docker

Backend:

cd backend
python manage.py runserver

Frontend:

Open:

frontend/index.html
Author

Satyam Behera


---

💡 **Tip before submitting:**  

Zip the **entire folder including `.git`**:


support-ticket-system.zip
# Support Ticket System

A full-stack support ticket management system with LLM-assisted ticket classification.

Users can create support tickets, filter and manage them from a dashboard, and view queue statistics. While writing a ticket description, the system can suggest a category and priority using an LLM.

## Features

### Ticket Management
- Create support tickets
- View all tickets
- Update ticket status
- Filter by category, priority, and status
- Search by title and description

### LLM Classification
When a user writes a ticket description, the system:
- Sends the description to an LLM API
- Predicts the ticket category
- Predicts the ticket priority
- Lets the user accept or override the suggestion

### Statistics Dashboard
The dashboard includes:
- Total tickets
- Open tickets
- Average tickets per day
- Priority breakdown
- Category breakdown

Statistics are calculated using database aggregation.

## Tech Stack

### Backend
- Django
- Django REST Framework
- PostgreSQL

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Nginx

### LLM Integration
- Groq API
- Model: `llama-3.3-70b-versatile`

Groq was chosen because it provides a free tier and supports an OpenAI-style chat completions interface.

### Infrastructure
- Docker
- Docker Compose

## Project Structure

```text
support-ticket-system/
├── backend/
│   ├── config/
│   ├── tickets/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── nginx.conf
├── backend.Dockerfile
├── frontend.Dockerfile
├── docker-compose.yml
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd support-ticket-system
```

### 2. Add the Environment File

Create `backend/.env`:

```env
GROQ_API_KEY=your_api_key_here
```

### 3. Run the Application

```bash
docker compose up --build
```

This starts:
- PostgreSQL
- Django backend
- Frontend served by Nginx

## Access the Application

- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/api/tickets/](http://localhost:8000/api/tickets/)
- Stats endpoint: [http://localhost:8000/api/tickets/stats/](http://localhost:8000/api/tickets/stats/)

## API Endpoints

### Create Ticket

`POST /api/tickets/`

Example request:

```json
{
  "title": "Login issue",
  "description": "I cannot login to my account",
  "category": "account",
  "priority": "high"
}
```

### List Tickets

`GET /api/tickets/`

Supported filters:

```text
/api/tickets/?category=billing
/api/tickets/?priority=high
/api/tickets/?status=open
/api/tickets/?search=login
```

### Update Ticket

`PATCH /api/tickets/<id>/`

Example request:

```json
{
  "status": "resolved"
}
```

### Classify Ticket

`POST /api/tickets/classify/`

Example request:

```json
{
  "description": "My card was charged twice"
}
```

Example response:

```json
{
  "suggested_category": "billing",
  "suggested_priority": "high"
}
```

### Ticket Statistics

`GET /api/tickets/stats/`

Example response:

```json
{
  "total_tickets": 10,
  "open_tickets": 5,
  "avg_tickets_per_day": 2.3,
  "priority_breakdown": [
    {
      "priority": "critical",
      "count": 1
    },
    {
      "priority": "high",
      "count": 4
    }
  ],
  "category_breakdown": [
    {
      "category": "billing",
      "count": 3
    },
    {
      "category": "technical",
      "count": 4
    }
  ]
}
```

## Design Decisions

### Django REST Framework

Chosen for rapid API development and built-in serialization.

### Database Aggregation

Statistics use Django ORM aggregation such as `annotate()` and `Count()` instead of Python-side loops for better performance.

### LLM Provider

Groq was selected because it offers:
- A free tier
- Fast inference
- Compatibility with OpenAI-style chat completions

### Frontend Approach

Vanilla JavaScript keeps the frontend lightweight while still supporting dynamic updates and filtering.

## Running Without Docker

### Backend

```bash
cd backend
python manage.py runserver
```

### Frontend

Open:

```text
frontend/index.html
```

## Author

Satyam Behera

## Submission Tip

Zip the entire folder, including `.git`:

```text
support-ticket-system.zip
```

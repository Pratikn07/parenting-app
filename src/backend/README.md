# Parenting App Backend API

## Overview

This is a comprehensive FastAPI backend for the Parenting App, featuring AI-powered chat assistance, milestone tracking, personalized resources, and analytics.

## 🏗️ Architecture

### Core Technology Stack
- **Backend**: FastAPI with Pydantic validation
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Caching**: Redis for session management and performance
- **Authentication**: JWT tokens with refresh mechanism, bcrypt password hashing
- **AI Integration**: OpenAI API + Context7 MCP for parenting knowledge
- **Background Tasks**: Celery for notifications and analytics
- **Containerization**: Docker for development and deployment

### Database Schema

#### Core Tables
- `users` - User authentication and basic info
- `user_profiles` - Detailed parenting information
- `conversations` - AI chat history with context
- `milestones` - Developmental milestones database
- `user_milestones` - User milestone progress tracking
- `resources` - Parenting resources and articles
- `user_saved_resources` - User's saved resources
- `daily_tips` - Daily parenting tips
- `user_analytics` - User behavior tracking

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Installation

1. **Clone and Setup**
   ```bash
   cd src/backend
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**
   ```bash
   # Option 1: Using Docker Compose (Recommended)
   docker-compose up -d
   
   # Option 2: Manual setup
   ./setup_database.sh
   ./run_backend.sh
   ```

4. **Access API**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

## 📊 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `POST /logout` - User logout
- `GET /me` - Get current user

### User Management (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /profile/details` - Get detailed profile
- `PUT /profile/details` - Update detailed profile
- `POST /onboarding` - Complete onboarding

### AI Chat System (`/api/chat`)
- `POST /message` - Send message to AI assistant
- `GET /history` - Get conversation history
- `DELETE /history` - Clear conversation history

### Milestones (`/api/milestones`)
- `GET /` - Get age-appropriate milestones
- `GET /user` - Get user milestone progress
- `PUT /{milestone_id}/complete` - Mark milestone completed
- `GET /progress` - Get progress statistics

### Resources (`/api/resources`)
- `GET /` - Get personalized resources
- `GET /search` - Search resources
- `GET /{resource_id}` - Get specific resource
- `POST /{resource_id}/save` - Save resource
- `GET /saved` - Get saved resources
- `DELETE /{resource_id}/save` - Remove saved resource

### Analytics (`/api/analytics`)
- `POST /event` - Track analytics event
- `GET /progress` - Get weekly progress
- `GET /insights` - Get user insights

## 🤖 AI Chat Features

### Context-Aware Responses
- Integrates user's baby age and previous conversations
- Accesses parenting knowledge through Context7 MCP
- Stores conversation memory for personalized responses

### Smart Topic Detection
- Automatically categorizes questions (sleep, feeding, development, health)
- Provides specialized responses based on topic
- Tracks interaction patterns for insights

### Fallback Handling
- Graceful responses when AI is unavailable
- Local caching for improved reliability

## 🎯 Personalization Engine

### Age-Based Content
- Filters milestones, tips, and resources by baby's age
- Dynamic content recommendation based on developmental stage

### Learning Preferences
- Tracks user interactions to improve recommendations
- Personalized daily tips and insights

### Progress Tracking
- Real-time milestone completion tracking
- Weekly progress analytics and celebrations

## 🔐 Security Features

### Authentication & Authorization
- JWT access tokens (15min) + refresh tokens (7 days)
- Secure password hashing with bcrypt
- Rate limiting and security headers

### Data Protection
- Input validation with Pydantic schemas
- SQL injection prevention through ORM
- CORS configuration for frontend integration

### Privacy
- User data encryption at rest
- Secure session management with Redis
- Audit logging for security events

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
```

## 📈 Monitoring & Analytics

### Health Checks
- `/health` endpoint for service monitoring
- Database and Redis connectivity checks
- Performance metrics tracking

### User Analytics
- Event tracking for user behavior
- Weekly progress reports
- Engagement score calculation
- Usage pattern analysis

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- Resource usage analytics

## 🔧 Development

### Running Tests
```bash
pytest tests/ -v
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Adding New Features
1. Create database models in `database/models.py`
2. Create Pydantic schemas in `api/schemas.py`
3. Implement business logic in `services/`
4. Create API routes in `api/routes/`
5. Add tests in `tests/`
6. Update documentation

## 🚀 Deployment

### Production Checklist
- [ ] Update `SECRET_KEY` with strong random value
- [ ] Configure production database URL
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Update CORS origins for production
- [ ] Set up CI/CD pipeline

### Scaling Considerations
- **Database**: Use read replicas for high traffic
- **Redis**: Cluster setup for high availability
- **API**: Horizontal scaling with load balancer
- **Background Tasks**: Multiple Celery workers
- **Monitoring**: Prometheus + Grafana setup

## 📚 API Documentation

### Interactive Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Example Requests

#### User Registration
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "name": "Sarah Johnson",
    "password": "securepassword123"
  }'
```

#### Send Chat Message
```bash
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My baby is not sleeping well at night",
    "context": {}
  }'
```

#### Mark Milestone Complete
```bash
curl -X PUT "http://localhost:8000/api/milestones/{milestone_id}/complete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "notes": "Baby smiled for the first time today!"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the health check at `/health`
- Check application logs for error details
- Verify database and Redis connectivity

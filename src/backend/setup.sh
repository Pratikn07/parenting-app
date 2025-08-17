#!/bin/bash

# Backend Setup Script for Parenting App
# This script sets up the FastAPI backend with all dependencies

set -e

echo "🚀 Setting up Parenting App Backend..."

# Check if Python 3.11+ is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📋 Installing Python dependencies..."
pip install -r requirements.txt

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker not found. Please install Docker to run the full stack."
    echo "📖 You can still run the backend manually with PostgreSQL and Redis."
else
    echo "✅ Docker found"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ Docker Compose not found. Please install Docker Compose."
else
    echo "✅ Docker Compose found"
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating environment file..."
    cp .env.example .env
    echo "⚠️ Please update .env with your actual configuration values"
else
    echo "✅ Environment file already exists"
fi

# Setup database (if running locally)
echo "🗄️ Database setup instructions:"
echo "1. Start PostgreSQL and Redis:"
echo "   docker-compose up postgres redis -d"
echo ""
echo "2. Run database migrations:"
echo "   alembic upgrade head"
echo ""
echo "3. Seed initial data:"
echo "   python database/seed.py"
echo ""
echo "4. Start the backend server:"
echo "   uvicorn main:app --reload"
echo ""

# Create run script
cat > run_backend.sh << 'EOF'
#!/bin/bash
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
EOF

chmod +x run_backend.sh

# Create database setup script
cat > setup_database.sh << 'EOF'
#!/bin/bash
source venv/bin/activate

echo "Starting database services..."
docker-compose up postgres redis -d

echo "Waiting for database to be ready..."
sleep 10

echo "Running migrations..."
alembic upgrade head

echo "Seeding initial data..."
python database/seed.py

echo "Database setup complete!"
EOF

chmod +x setup_database.sh

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Add your OpenAI API key to .env"
echo "3. Run ./setup_database.sh to setup the database"
echo "4. Run ./run_backend.sh to start the server"
echo ""
echo "📚 API Documentation will be available at: http://localhost:8000/docs"
echo "🔍 Health check endpoint: http://localhost:8000/health"

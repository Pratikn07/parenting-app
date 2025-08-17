import pytest
from httpx import AsyncClient
from tests.conftest import async_client, authenticated_user


class TestAuthentication:
    """Test authentication endpoints."""
    
    async def test_register_user(self, async_client: AsyncClient):
        """Test user registration."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "password123"
        }
        
        response = await async_client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert "id" in data
        assert "password" not in data
    
    async def test_register_duplicate_email(self, async_client: AsyncClient):
        """Test registration with duplicate email."""
        user_data = {
            "email": "duplicate@example.com",
            "name": "User One",
            "password": "password123"
        }
        
        # Register first user
        response1 = await async_client.post("/api/auth/register", json=user_data)
        assert response1.status_code == 201
        
        # Try to register with same email
        user_data["name"] = "User Two"
        response2 = await async_client.post("/api/auth/register", json=user_data)
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"]
    
    async def test_login_success(self, async_client: AsyncClient):
        """Test successful login."""
        # Register user first
        user_data = {
            "email": "logintest@example.com",
            "name": "Login Test",
            "password": "password123"
        }
        
        await async_client.post("/api/auth/register", json=user_data)
        
        # Login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        response = await async_client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = await async_client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    async def test_get_current_user(self, async_client: AsyncClient, authenticated_user):
        """Test getting current user information."""
        response = await async_client.get(
            "/api/auth/me", 
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
    
    async def test_get_current_user_unauthorized(self, async_client: AsyncClient):
        """Test getting current user without token."""
        response = await async_client.get("/api/auth/me")
        
        assert response.status_code == 401
    
    async def test_logout(self, async_client: AsyncClient, authenticated_user):
        """Test user logout."""
        response = await async_client.post(
            "/api/auth/logout",
            headers=authenticated_user["headers"]
        )
        
        assert response.status_code == 200
        assert "Successfully logged out" in response.json()["message"]

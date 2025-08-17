#!/usr/bin/env python3
"""
Generate Apple JWT Token for Supabase OAuth Configuration
"""

import jwt
import time
from datetime import datetime, timedelta

# Your Apple OAuth credentials
TEAM_ID = "2KNGC3DV9C"
KEY_ID = "4J97CCJ755"
SERVICE_ID = "com.parentingcompass.web"

# Your Apple private key
PRIVATE_KEY = """-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgks1KPfv003/CSv7/
naiSMLzMH0a1oMVBj+G3JGcyq1mgCgYIKoZIzj0DAQehRANCAASMOMVnct+Gwt3b
KFfDpUIai8tri/xPbz3D1Cf+I3928s1Za0yXI8CGgg4Mp0F+OtVbRwo3/HRjS5ET
gGtzksiH
-----END PRIVATE KEY-----"""

def generate_apple_jwt():
    """Generate JWT token for Apple OAuth"""
    
    # Current time
    now = datetime.utcnow()
    
    # JWT payload
    payload = {
        "iss": TEAM_ID,  # Team ID
        "iat": int(now.timestamp()),  # Issued at
        "exp": int((now + timedelta(days=180)).timestamp()),  # Expires in 6 months
        "aud": "https://appleid.apple.com",  # Apple's audience
        "sub": SERVICE_ID  # Your Service ID
    }
    
    # JWT headers
    headers = {
        "kid": KEY_ID,  # Key ID
        "alg": "ES256"  # Algorithm
    }
    
    # Generate JWT token
    token = jwt.encode(
        payload=payload,
        key=PRIVATE_KEY,
        algorithm="ES256",
        headers=headers
    )
    
    return token

if __name__ == "__main__":
    try:
        jwt_token = generate_apple_jwt()
        
        print("🎉 Apple JWT Token Generated Successfully!")
        print("=" * 60)
        print("COPY THIS TOKEN TO SUPABASE:")
        print("=" * 60)
        print(jwt_token)
        print("=" * 60)
        print("\n📋 Configuration Summary:")
        print(f"Team ID: {TEAM_ID}")
        print(f"Key ID: {KEY_ID}")
        print(f"Service ID: {SERVICE_ID}")
        print(f"Token expires: {datetime.utcnow() + timedelta(days=180)}")
        print("\n🔧 Next Steps:")
        print("1. Copy the token above")
        print("2. Paste it in the 'Secret Key (for OAuth)' field in Supabase")
        print("3. Add your Service ID to the 'Client IDs' field")
        print("4. Click 'Save' in Supabase")
        print("5. Test Apple Sign In in your app!")
        
    except Exception as e:
        print(f"❌ Error generating JWT token: {e}")
        print("\n💡 You may need to install PyJWT:")
        print("pip install PyJWT[crypto]")

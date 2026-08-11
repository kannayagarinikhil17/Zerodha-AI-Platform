from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase Admin
# Make sure to rename 'firebase-key.json' to match your downloaded Service Account file
key_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "firebase-key.json"))

try:
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    # Prevents app from crashing if Firebase is initialized multiple times during hot-reloads
    pass

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency to verify the Firebase ID token in the Authorization header.
    Returns the decoded token containing the user's UID.
    """
    token = credentials.credentials
    try:
        # Verify the token against Firebase
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
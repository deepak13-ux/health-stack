import hashlib
from server import getDBconnection
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)
def getCurrentUser(credentials: HTTPAuthorizationCredentials | None = Depends(bearer),):
    if credentials is None:
        raise HTTPException( status_code=401, detail="Please log in.", headers={"WWW-Authenticate": "Bearer"},)

    # frontend would send "Authorization : Bearer <Token>"
    token = credentials.credentials
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    con = getDBconnection()
    cur = con.cursor(dictionary=True)
    try:
        cur.execute("SELECT a.Account_id AS accountId, a.Role AS role, a.User_id AS userId FROM AuthSession AS s JOIN AuthAccount AS a ON a.Account_id = s.Account_id WHERE s.Token_hash = %s AND s.Expires_at > UTC_TIMESTAMP()",(token_hash,))
        user = cur.fetchone()
        if user is None:
            raise HTTPException( status_code=401, detail="Session invalid.", headers={"WWW-Authenticate": "Bearer"},)
        return user
    finally:
        cur.close()
        con.close()
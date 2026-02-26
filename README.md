# Group-20-Software-Engineering-Project
CM22007 group 20 software engineering project repository.

To run the server:
```
node backend/index.js
http://127.0.0.1:8080/
```

Important note:

The recommender engine requires a set of dependencies listed in backend/dbManagement/reccomendation/requirements.txt. I would advise doing the following before running the server:

```
python -m venv .venv
source .venv/bin/activate
pip install -r backend/dbManagement/reccomendation/requirements.txt

node backend/index.js
```

Run backend tests via
```
cd backend
npm test
```
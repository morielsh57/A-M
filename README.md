# A&M
A modern clothing e-commerce platform featuring product pages, customer reviews, shipping options, secure checkout, order tracking, and more.
## Backend API Documentation:
https://am-fashion-backend.onrender.com/api/docs

## Running the Backend Locally

### Windows

```powershell
cd backend
```

For the first local setup, run:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py check
python manage.py migrate
```

Start the backend server:

```powershell
python -m uvicorn config.asgi:application --host 127.0.0.1 --port 8000 --ssl-keyfile .certs\localhost-key.pem --ssl-certfile .certs\localhost-cert.pem
```

For future runs on Windows, only activate the virtual environment and start the server:

```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn config.asgi:application --host 127.0.0.1 --port 8000 --ssl-keyfile .certs\localhost-key.pem --ssl-certfile .certs\localhost-cert.pem
```

### Mac/Linux

```bash
cd backend
```

For the first local setup, run:

```bash
source venv/bin/activate
python -m pip install -r requirements.txt
python manage.py check
python manage.py migrate
```

Start the backend server:

```bash
python -m uvicorn config.asgi:application --host 127.0.0.1 --port 8000 --ssl-keyfile .certs/localhost-key.pem --ssl-certfile .certs/localhost-cert.pem
```

For future runs on Mac/Linux, only activate the virtual environment and start the server:

```bash
source venv/bin/activate
python -m uvicorn config.asgi:application --host 127.0.0.1 --port 8000 --ssl-keyfile .certs/localhost-key.pem --ssl-certfile .certs/localhost-cert.pem
```

### Health Check

To verify that the backend is running, open this URL in the browser:

```text
https://localhost:8000/api/v1/health
```

The response should include:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

# Flask Word to PDF Converter

A comprehensive document conversion application with dual database architecture - MySQL for user management and MongoDB for document operations.

## Features

- 📄 Convert Word documents (.docx, .doc) to PDF
- 👤 User registration and authentication (MySQL)
- 📁 Document management and history (MongoDB)
- ⬇️ Download converted PDFs
- 🗑️ Delete documents
- 💎 Modern glassmorphism UI design
- 🔒 Secure file handling
- 📱 Responsive design

## Architecture

- **User Management**: MySQL database with secure password hashing
- **Document Storage**: MongoDB for document metadata and operations
- **File Conversion**: LibreOffice for reliable Word to PDF conversion
- **Authentication**: Session-based user authentication

## Tech Stack

- **Backend**: Python Flask
- **User DB**: MySQL (StatefulSet)
- **Document DB**: MongoDB (Deployment with PV)
- **Conversion**: LibreOffice
- **Frontend**: HTML, CSS, JavaScript
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## Quick Start

### 1. Build Docker Image
```bash
cd "L3 Flask-word-pdf-converter"
docker build -t word-pdf-converter:latest .
```

### 2. Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get pvc
```

### 3. Access Application
```bash
# Get minikube IP
minikube ip

# Access at: http://<minikube-ip>:30200
```

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - User login
- `GET /register` - Registration page
- `POST /register` - User registration
- `GET /logout` - User logout

### Document Operations
- `GET /` - Main application interface
- `POST /upload` - Upload and convert Word document
- `GET /download/<file_id>` - Download converted PDF
- `GET /api/documents` - Get user's documents
- `DELETE /api/documents/<file_id>` - Delete document

## Database Schemas

### MySQL - Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MongoDB - Documents Collection
```json
{
  "file_id": "uuid",
  "user_id": 1,
  "original_filename": "document.docx",
  "pdf_filename": "document.pdf",
  "original_path": "/path/to/original",
  "pdf_path": "/path/to/pdf",
  "created_at": "2024-01-15T10:30:00",
  "file_size": 1024
}
```

## Kubernetes Resources

- **MySQL StatefulSet**: Persistent user data storage
- **MongoDB Deployment**: Document metadata storage
- **Flask App Deployment**: 2 replicas for high availability
- **Services**: Internal database services and external NodePort
- **PersistentVolumes**: Storage for MongoDB data
- **EmptyDir Volume**: Temporary file storage for conversions

## Environment Variables

### MySQL Connection
- `MYSQL_HOST`: MySQL service hostname
- `MYSQL_PORT`: MySQL port (3306)
- `MYSQL_USER`: Database user (root)
- `MYSQL_PASSWORD`: Database password
- `MYSQL_DATABASE`: Database name (converter_db)

### MongoDB Connection
- `MONGO_HOST`: MongoDB service hostname
- `MONGO_PORT`: MongoDB port (27017)

## Port Configuration

- **Application**: Port 30200 (NodePort)
- **MySQL**: Port 3306 (Internal)
- **MongoDB**: Port 27017 (Internal)

## Security Features

- Password hashing with Werkzeug
- Session-based authentication
- File type validation
- Secure filename handling
- User isolation for documents

## File Conversion Process

1. User uploads Word document
2. File validation and secure storage
3. LibreOffice converts to PDF
4. Document metadata stored in MongoDB
5. Original file cleaned up
6. PDF available for download

## Cleanup

```bash
kubectl delete -f k8s/
```

## Development

1. Install dependencies: `pip install -r requirements.txt`
2. Run MySQL: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=converter_db mysql:8.0`
3. Run MongoDB: `docker run -d -p 27017:27017 mongo:5.0`
4. Start Flask app: `python app.py`
5. Access at: http://localhost:5000
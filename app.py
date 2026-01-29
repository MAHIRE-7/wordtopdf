from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
import mysql.connector
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import uuid
import subprocess
import tempfile

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# MySQL connection for users
mysql_config = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', 'password'),
    'database': os.getenv('MYSQL_DATABASE', 'converter_db')
}

# MongoDB connection for documents
mongo_host = os.getenv('MONGO_HOST')
mongo_port = int(os.getenv('MONGO_PORT', 27017))
mongo_client = MongoClient(f'mongodb://{mongo_host}:{mongo_port}/')
mongo_db = mongo_client.converter
documents = mongo_db.documents

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'docx', 'doc'}

def get_mysql_connection():
    return mysql.connector.connect(**mysql_config)

def init_mysql_db():
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"MySQL init error: {e}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        try:
            conn = get_mysql_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT id, password_hash FROM users WHERE username = %s', (data['username'],))
            user = cursor.fetchone()
            conn.close()
            
            if user and check_password_hash(user[1], data['password']):
                session['user_id'] = user[0]
                session['username'] = data['username']
                return jsonify({'success': True})
            return jsonify({'success': False, 'message': 'Invalid credentials'})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.json
        try:
            conn = get_mysql_connection()
            cursor = conn.cursor()
            password_hash = generate_password_hash(data['password'])
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)',
                (data['username'], data['email'], password_hash)
            )
            conn.commit()
            conn.close()
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file selected'})
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Invalid file type'})
    
    try:
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        
        # Save original file
        original_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
        file.save(original_path)
        
        # Convert to PDF using LibreOffice
        pdf_filename = f"{file_id}_{filename.rsplit('.', 1)[0]}.pdf"
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        
        # Use LibreOffice to convert
        result = subprocess.run([
            'libreoffice', '--headless', '--convert-to', 'pdf',
            '--outdir', UPLOAD_FOLDER, original_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {result.stderr}")
        
        # LibreOffice creates PDF with original name, rename it
        temp_pdf = os.path.join(UPLOAD_FOLDER, f"{filename.rsplit('.', 1)[0]}.pdf")
        if os.path.exists(temp_pdf):
            os.rename(temp_pdf, pdf_path)
        
        # Store in MongoDB
        doc_record = {
            'file_id': file_id,
            'user_id': session['user_id'],
            'original_filename': filename,
            'pdf_filename': pdf_filename,
            'original_path': original_path,
            'pdf_path': pdf_path,
            'created_at': datetime.now(),
            'file_size': os.path.getsize(original_path)
        }
        documents.insert_one(doc_record)
        
        # Clean up original file
        os.remove(original_path)
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'pdf_filename': pdf_filename
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/download/<file_id>')
def download_file(file_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    doc = documents.find_one({
        'file_id': file_id,
        'user_id': session['user_id']
    })
    
    if not doc or not os.path.exists(doc['pdf_path']):
        return "File not found", 404
    
    return send_file(doc['pdf_path'], as_attachment=True, download_name=doc['pdf_filename'])

@app.route('/api/documents')
def get_documents():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    docs = list(documents.find(
        {'user_id': session['user_id']},
        {'_id': 0, 'original_path': 0, 'pdf_path': 0}
    ).sort('created_at', -1))
    
    for doc in docs:
        doc['created_at'] = doc['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    
    return jsonify({'documents': docs})

@app.route('/api/documents/<file_id>', methods=['DELETE'])
def delete_document(file_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'})
    
    doc = documents.find_one({
        'file_id': file_id,
        'user_id': session['user_id']
    })
    
    if doc:
        if os.path.exists(doc['pdf_path']):
            os.remove(doc['pdf_path'])
        documents.delete_one({'file_id': file_id, 'user_id': session['user_id']})
    
    return jsonify({'success': True})

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    init_mysql_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
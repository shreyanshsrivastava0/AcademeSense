# 🎓 Academesence – ML-Powered Student Performance Prediction System

**Project Guide :** Shravan Kumar Pandey
**Project Coordinator:** Pankaj Kumar

---

## 📘 Overview

**Academesence** is a Machine Learning–powered academic performance monitoring and early-warning platform designed for educational institutions.

It predicts students’ academic outcomes using data-driven ML models, evaluates risk levels, and automatically generates personalized insights and email alerts for mentors or Heads of Department (HODs).

This enables institutions to identify at-risk students early and take proactive corrective actions to improve academic performance.

---

## 🎯 Objectives

- Predict student academic performance using Machine Learning
- Identify at-risk students early
- Provide actionable recommendations
- Enable mentors and HODs to intervene proactively
- Automate academic monitoring and reporting

---

## 🚀 Key Features

### 📊 Data-Driven Analysis
- Upload student datasets via CSV
- Analyze grades, attendance, and study behavior
- Generate performance insights automatically

### 🤖 Machine Learning Predictions
- ML model predicts academic outcomes
- Assigns risk levels based on learning patterns

### 📧 Automated Email Alerts
- Sends alerts to mentors/HODs
- Highlights students needing attention
- Enables early intervention

### 📈 Interactive Dashboard
- Real-time analytics visualization
- Risk distribution overview
- Student performance tracking

### 🧩 Individual Student Analysis
- Personalized strengths and weaknesses
- AI-generated improvement suggestions

### 💾 Secure Database Storage
- MongoDB integration
- Persistent student records
- Dynamic updates and retrieval

---

## 🧠 Machine Learning Model

The ML model analyzes the following features:

- Academic grades across subjects
- Attendance percentage
- Daily study hours

### Risk Classification Levels

- 🟢 Low Risk  
- 🟡 Medium Risk  
- 🟠 High Risk  
- 🔴 Very High Risk  

This enables proactive academic support based on behavior patterns rather than waiting for final exam results.

---

## 🧩 Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | HTML, CSS, JavaScript, EJS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Machine Learning | Python, pandas, scikit-learn |
| Email Service | Nodemailer |
| Visualization | Chart.js |

---

## ⚙️ System Architecture

```
CSV Upload
   ↓
Python ML Processing
   ↓
Node.js Backend
   ↓
MongoDB Storage
   ↓
Risk Analysis & Insight Generation
   ↓
Email Alerts
   ↓
Dashboard Visualization
```

---

## 📂 Project Structure

```
Mini3/
│
├── config/              # Database & environment configuration
├── controllers/         # Application logic & routing handlers
├── init/                # Initialization scripts
├── models/              # MongoDB Mongoose schemas
├── public/              # Static assets (CSS, JS, Images)
├── services/            # Business logic & service layer
├── uploads/             # Uploaded CSV files
├── utils/               # Utility scripts (csv_reader.py)
│
├── views/
│   ├── includes/        # Reusable UI components
│   ├── layouts/         # Layout templates
│   ├── listings/        # Application pages
│
├── csv_reader.py        # Python ML processing script
├── server.js            # Main server entry point
├── package.json         # Node dependencies
├── .env                 # Environment variables
├── .env.example         # Sample environment file
└── README.md
```

---

## 🛠️ Installation & Setup Guide

### Prerequisites

Make sure you have installed:

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB
- npm

---

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/academesence.git
cd academesence
```

---

### Step 2: Install Node Dependencies

```bash
npm install
```

---

### Step 3: Install Python Dependencies

```bash
pip install pandas scikit-learn numpy
```

---

### Step 4: Configure Environment Variables

Create `.env` file:

```
PORT=3000

MONGO_URI=your_mongodb_connection_string

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

---

### Step 5: Start MongoDB

```bash
mongod
```

---

### Step 6: Run the Server

```bash
node server.js
```

Server will run at:

```
http://localhost:3000
```

---

## 📊 Usage Guide

### Step 1: Login as Mentor/HOD

Access dashboard via browser.

### Step 2: Upload CSV File

Example CSV format:

```
Student Name,Grades,Attendance,Study Hours
John Doe,78,85,3
Jane Smith,45,60,1
```

---

### Step 3: View Dashboard

Dashboard displays:

- Risk levels
- Student performance analytics
- Individual insights

---

### Step 4: Email Alerts

System automatically sends alerts for high-risk students.

---

## 📸 Screenshots

Add your screenshots like:

```
![Dashboard](1.png)
![Risk Analysis](2.png)
![Insights](3.png)
```

---

## 🔬 Machine Learning Workflow

```
CSV Input
   ↓
Data Cleaning (pandas)
   ↓
Feature Processing
   ↓
ML Model Prediction (scikit-learn)
   ↓
Risk Classification
   ↓
Insight Generation
   ↓
Store in MongoDB
   ↓
Display on Dashboard
```

---

## 🌟 Future Enhancements

- Deep Learning based predictions
- Real-time student monitoring
- Parent notification system
- Mobile application support
- Multi-institution support
- Role-based authentication

---

## 👨‍💻 Project Guide

**Project Coordinator:**  
Shravan Kumar Pandey  

---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you like this project, please star the repository.


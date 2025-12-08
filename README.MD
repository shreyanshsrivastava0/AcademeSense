**Academesence – ML-Powered Student Performance Prediction System**

📘 Overview :

    Academesence is an AI-driven academic performance monitoring and early-warning platform designed for educational institutions.
    It predicts students’ academic outcomes using Machine Learning, evaluates risk levels, and automatically generates personalized insights and email alerts for mentors or HODs.

    This platform helps identify students who may be at risk of academic failure well before final exams, enabling timely interventions and academic support.



🚀 Key Features :

* 📊 Data-Driven Insights: Upload student CSV data including grades, attendance, and study hours.

* 🤖 Machine Learning Prediction: Automatically predicts student performance trends and risk levels.

* 📧 Automated Email Alerts: Sends email notifications to mentors or HODs for at-risk students.

* 📈 Dynamic Dashboard: Real-time analytics of student performance and risk distribution.

* 🧩 Individual Analysis: Personalized strengths, weaknesses, and actionable recommendations.

* 💾 MongoDB Database: All student records and insights are securely stored and updated dynamically.

🧩 Tech Stack :

| Layer              | Technology                    |
| ------------------ | ----------------------------- |

| **Frontend**       | HTML, CSS, JavaScript, EJS    |

| **Backend**        | Node.js, Express.js           |

| **Database**       | MongoDB                       |

| **ML Integration** | Python (pandas, scikit-learn) |

| **Communication**  | Nodemailer for email alerts   |


🧠 Machine Learning Model :

The ML model is trained to analyze:

    * Grades: Academic marks across multiple subjects.

    * Attendance: Percentage of classes attended.

    * Study Hours: Average daily self-study time.

Using these factors, it computes a risk score and classifies students into:

 Low Risk | Medium Risk | High Risk | Very High Risk

This prediction helps mentors proactively guide students based on learning behavior rather than just final scores.


⚙️ System Architecture

1. CSV Upload: Mentor uploads a CSV containing student data.

2. Python Processing: A Python script reads and analyzes the data, applying the ML model.

3. Node.js Integration: The processed data is sent to the backend and stored in MongoDB.

4. Risk & Insight Generation:

    * Calculates individual performance insights.

    * Assigns risk level and generates improvement suggestions.

5. Email Automation: Alerts mentors or HODs about students needing attention.

6. Dashboard Visualization: Displays real-time statistics and performance charts.

📂 Project Structure :

Mini3/
│
├── config/              # Database & environment configuration
├── controllers/         # Core logic for routing & data processing
├── init/                # Initialization scripts
├── models/              # Mongoose schemas
├── public/              # Static assets (CSS, JS, Images)
├── services/            # Helper and business logic services
├── uploads/             # Uploaded CSVs or student files
├── utils/               # Utility functions (e.g., csv_reader.py)
│
├── views/
│   ├── includes/        # Reusable components (navbar, footer)
│   ├── layouts/         # Layout templates (boilerplate, dashboard)
│   ├── listings/        # All EJS pages (home, login, dashboard, etc.)
│
├── .env                 # Environment configuration
├── .env.example         # Sample env file for setup
├── csv_reader.py        # Python script for CSV data processing
│
└── package.json
|
└── server.js

📸 Screenshots :

![alt text](<1.png>)

![alt text](<2.png>)

![alt text](<3.png>)

![alt text](<4.png>)

![alt text](<5.png>)

![alt text](<6.png>)

![alt text](<7.png>)

![alt text](<8.png>)

![alt text](<9.png>)

![alt text](<10.png>)








require('dotenv').config();
const express = require("express")
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const port = process.env.PORT || 3000;
const Listing = require("./models/listings.js");
const Student = require("./models/student.js");
const studentController = require("./controllers/studentController.js");
const ejsMate = require("ejs-mate");
const multer = require("multer");
const { spawn } = require("child_process");
const upload = multer({dest :"uploads/"});

app.use(express.urlencoded({extended :true}));
app.use(express.json());
app.set("view engine" ,"ejs");
app.set("views",path.join(__dirname , "views"));
app.use(express.static(path.join(__dirname ,"public")));
app.engine("ejs",ejsMate);


const sessions = new Map();


main().then((res)=>{
    console.log("MongoDB connection established successfully");
}).catch((err)=>{
    console.warn("Failed to connect to MongoDB:", err.message);
    console.warn("Some features may not work without database connection");
});

async function main(){
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/AcademeSense");
}

app.get("/",(req ,res)=>{
    res.render("listings/home.ejs");
});
app.get("/posts" , (req,res)=>{
    res.render("listings/login.ejs");
});
app.get("/createaccount", (req,res)=>{
    res.render("listings/newaccount.ejs");
});
app.get("/contact", (req,res)=>{
    res.render("listings/contact.ejs");
});
app.get("/about", (req,res)=>{
    res.render("listings/about.ejs");
});

app.post("/upload", upload.single("csvFile"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
        
        const analysisResult = await studentController.processStudentData(req.file.path);
      
        const saveResult = await studentController.saveStudentsToDatabase(analysisResult);
        
        console.log(`Saved ${saveResult.savedStudents.length} students to database`);
        if (saveResult.errors.length > 0) {
            console.warn(`Errors saving ${saveResult.errors.length} students:`, saveResult.errors);
        }
        
        
        const dashboardStats = await studentController.getDashboardStats();
        
      
        const enhancedResult = {
            ...analysisResult,
            savedStudents: saveResult.savedStudents,
            dashboardStats: dashboardStats.stats,
            saveErrors: saveResult.errors
        };
        
       
        res.render("listings/enhanced_dashboard.ejs", { 
            username: req.session?.username || "User", 
            csvData: enhancedResult 
        });
        
    } catch (error) {
        console.error("Upload processing error:", error);
        res.status(500).send(`Error processing CSV data: ${error.message}`);
    }
});




app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new Listing({ username, password });
    await newUser.save();
    console.log("Successfully added into MongoDB");
  
    sessions.set(username, { username, loggedInAt: Date.now() });
    req.session = { username };
    res.redirect("/posts");
  } catch (err) {
    console.error("Failed to add:", err);
    res.status(500).send("Failed to add into MongoDB");
  }
});


app.post("/welcome", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Listing.findOne({ username, password });

    if (user) {
      console.log("yes, found:", user);
      // Set session
      sessions.set(username, { username, loggedInAt: Date.now() });
      req.session = { username };
      
    
      const dashboardStats = await studentController.getDashboardStats();
      
      res.render("listings/dashboard.ejs", { 
        username: user.username, 
        csvData: null,
        dashboardStats: dashboardStats.success ? dashboardStats.stats : null
      });
    } else {
      console.log("no, not found");
      res.status(401).send("Invalid username or password");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/dashboard" , (req,res)=>{
    res.redirect("/upload");
});


app.get("/api/student/:studentId", async (req, res) => {
    const result = await studentController.getStudentAnalysis(req.params.studentId);
    res.json(result);
});


app.get("/api/at-risk-students", async (req, res) => {
    const result = await studentController.getAtRiskStudents();
    res.json(result);
});

// Send risk alerts
app.post("/api/send-risk-alerts", async (req, res) => {
    const teacherEmail = req.body.teacherEmail || process.env.TEACHER_EMAIL;
    const result = await studentController.sendRiskAlerts(teacherEmail);
    res.json(result);
});

// Send progress reports
app.post("/api/send-progress-reports", async (req, res) => {
    const { teacherEmail, studentIds } = req.body;
    const result = await studentController.sendProgressReports(
        teacherEmail || process.env.TEACHER_EMAIL,
        studentIds
    );
    res.json(result);
});

// Get dashboard statistics
app.get("/api/dashboard-stats", async (req, res) => {
    const result = await studentController.getDashboardStats();
    res.json(result);
});

// Test email configuration
app.get("/api/test-email", async (req, res) => {
    const result = await studentController.testEmailConfig();
    res.json(result);
});


app.get("/student/:studentId", async (req, res) => {
    const result = await studentController.getStudentAnalysis(req.params.studentId);
    if (result.success) {
        res.render("listings/student_profile.ejs", { 
            username: req.session?.username || "User",
            student: result.student 
        });
    } else {
        res.status(404).render("listings/error.ejs", { 
            error: "Student not found",
            message: result.error 
        });
    }
});

// At-risk students page
app.get("/upload/at-risk-students", async (req, res) => {
    const result = await studentController.getAtRiskStudents();
    if (result.success) {
        res.render("listings/at_risk_students.ejs", { 
            username: req.session?.username || "User",
            students: result.students 
        });
    } else {
        res.status(500).render("listings/error.ejs", { 
            error: "Unable to fetch at-risk students",
            message: result.error 
        });
    }
});
app.get("/at-risk-students", async (req, res) => {
    const result = await studentController.getAtRiskStudents();
    if (result.success) {
        res.render("listings/at_risk_students.ejs", { 
            username: req.session?.username || "User",
            students: result.students 
        });
    } else {
        res.status(500).render("listings/error.ejs", { 
            error: "Unable to fetch at-risk students",
            message: result.error 
        });
    }
});

app.listen(port , ()=>{
    console.log(`Server running on port ${port}`);
    console.log('AcademeSense Is Live Now...');
});



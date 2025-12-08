const Student = require('../models/student');
const emailService = require('../services/emailService');
const { spawn } = require('child_process');
const path = require('path');

class StudentController {
    // Process uploaded CSV and analyze students
    async processStudentData(filePath) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '../utils/enhanced_csv_reader.py');
            const py = spawn('python', [pythonScript, filePath]);

            let dataString = '';
            let errorString = '';

            py.stdout.on('data', (data) => {
                dataString += data.toString();
            });

            py.stderr.on('data', (data) => {
                errorString += data.toString();
            });

            py.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python script error:', errorString);
                    return reject(new Error(`Python script error: ${errorString}`));
                }

                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    reject(new Error('Error parsing CSV analysis results'));
                }
            });
        });
    }

    // Save or update students in database
    async saveStudentsToDatabase(analysisResult) {
        const savedStudents = [];
        const errors = [];

        for (let i = 0; i < analysisResult.data.length; i++) {
            try {
                const studentData = analysisResult.data[i];
                const studentAnalysis = analysisResult.analysis.individual_student_analysis[i];

                // Extract student information
                const studentId = studentData.Student_Id || studentData.student_id || studentData.id || `student_${i + 1}`;
                const name = studentData.Name || studentData.name || `Student ${i + 1}`;
                const email = studentData.Email || studentData.email || null;

                // Create grades map
                const grades = new Map();
                Object.keys(studentData).forEach(key => {
                    if (key.toLowerCase().includes('math') || 
                        key.toLowerCase().includes('english') || 
                        key.toLowerCase().includes('science') || 
                        key.toLowerCase().includes('history') ||
                        key.toLowerCase().includes('grade') ||
                        key.toLowerCase().includes('score')) {
                        grades.set(key, studentData[key]);
                    }
                });

                // Find or create student
                let student = await Student.findOne({ student_id: studentId });

                if (student) {
                    student.name = name;
                    student.email = email;
                    student.grades = grades;
                    student.attendance = studentData.Attendence || studentData.Attendance || studentData.attendance;
                    student.study_hours = studentData.Study_Hours || studentData.study_hours;
                    student.final_grade = studentData.Final_Grade || studentData.final_grade;
                    student.ml_prediction = studentAnalysis.ml_prediction;
                    student.last_updated = new Date();
                } else {
                    student = new Student({
                        student_id: studentId,
                        name,
                        email,
                        grades,
                        attendance: studentData.Attendence || studentData.Attendance || studentData.attendance,
                        study_hours: studentData.Study_Hours || studentData.study_hours,
                        final_grade: studentData.Final_Grade || studentData.final_grade,
                        ml_prediction: studentAnalysis.ml_prediction
                    });
                }

                // 🔹 Calculate initial risk and insights
                try {
                    student.calculateRiskLevel();
                    student.generateInsights();
                } catch (methodError) {
                    console.warn(`Error calculating risk for student ${studentId}:`, methodError.message);
                }

                // 🔹 Enhanced Risk Prediction Logic
                const totalMarks = Array.from(student.grades.values())
                    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                const subjectsCount = student.grades.size || 1;
                const averageMarks = totalMarks / subjectsCount;

                const attendance = parseFloat(student.attendance) || 0;
                const studyHours = parseFloat(student.study_hours) || 0;

                let risk_level = "low";
                let overallPerformance = 0;

                if (averageMarks === 0) {
                    // Anyone with 0 marks is HIGH risk
                    risk_level = "high";
                    overallPerformance = (0.4 * attendance) + (0.6 * studyHours * 10);
                } else {
                    overallPerformance = (0.7 * averageMarks) + (0.2 * attendance) + (0.1 * studyHours * 10);
                    if (overallPerformance >= 85) risk_level = "low";
                    else if (overallPerformance >= 70) risk_level = "medium";
                    else risk_level = "high";
                }

                student.risk_level = risk_level;
                student.at_risk = (risk_level === "high");
                student.overall_performance = Math.min(100, Math.max(0, overallPerformance));

                await student.save();
                savedStudents.push(student);

            } catch (error) {
                console.error(`Error saving student ${i + 1}:`, error);
                errors.push({ index: i + 1, error: error.message });
            }
        }

        return { savedStudents, errors };
    }

    // Get individual student analysis
    async getStudentAnalysis(studentId) {
        try {
            const student = await Student.findOne({ student_id: studentId });
            if (!student) return { success: false, error: 'Student not found' };

            return {
                success: true,
                student: {
                    ...student.toObject(),
                    overall_performance: student.overall_performance
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get all at-risk students
    async getAtRiskStudents() {
        try {
            const students = await Student.find({ at_risk: true })
                .sort({ risk_level: -1, overall_performance: 1 });

            return {
                success: true,
                students: students.map(s => ({
                    ...s.toObject(),
                    overall_performance: s.overall_performance
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Send risk alerts
    async sendRiskAlerts(teacherEmail = null) {
        try {
            const atRiskStudents = await Student.find({ at_risk: true });
            if (atRiskStudents.length === 0) return { success: true, message: 'No at-risk students found', results: [] };

            const results = [];
            for (const student of atRiskStudents) {
                const recentAlert = student.alerts_sent.find(alert => 
                    alert.type === 'risk_alert' && 
                    (new Date() - alert.sent_at) < 24 * 60 * 60 * 1000
                );

                if (!recentAlert) {
                    const emailResult = await emailService.sendRiskAlert(student, teacherEmail);
                    if (emailResult.success) {
                        student.alerts_sent.push({
                            type: 'risk_alert',
                            sent_at: new Date(),
                            email_sent: true
                        });
                        await student.save();
                    }
                    results.push({ studentId: student.student_id, ...emailResult });
                } else {
                    results.push({
                        studentId: student.student_id,
                        success: false,
                        message: 'Alert already sent within 24 hours'
                    });
                }
            }

            return { success: true, message: `Processed ${atRiskStudents.length} at-risk students`, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Send progress reports
    async sendProgressReports(teacherEmail = null, studentIds = null) {
        try {
            const query = studentIds ? { student_id: { $in: studentIds } } : {};
            const students = await Student.find(query);

            const results = [];
            for (const student of students) {
                const emailResult = await emailService.sendProgressReport(student, teacherEmail);
                if (emailResult.success) {
                    student.alerts_sent.push({
                        type: 'progress_report',
                        sent_at: new Date(),
                        email_sent: true
                    });
                    await student.save();
                }
                results.push({ studentId: student.student_id, ...emailResult });
            }

            return { success: true, message: `Sent progress reports to ${students.length} students`, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Dashboard statistics
    async getDashboardStats() {
        try {
            const totalStudents = await Student.countDocuments();
            const atRiskStudents = await Student.countDocuments({ at_risk: true });
            const highRiskStudents = await Student.countDocuments({ risk_level: 'high' });
            const mediumRiskStudents = await Student.countDocuments({ risk_level: 'medium' });

            const students = await Student.find({});
            const performanceDistribution = { excellent: 0, good: 0, average: 0, poor: 0 };

            students.forEach(s => {
                const p = s.overall_performance;
                if (p >= 90) performanceDistribution.excellent++;
                else if (p >= 80) performanceDistribution.good++;
                else if (p >= 70) performanceDistribution.average++;
                else performanceDistribution.poor++;
            });

            return {
                success: true,
                stats: {
                    totalStudents,
                    atRiskStudents,
                    highRiskStudents,
                    mediumRiskStudents,
                    atRiskPercentage: totalStudents ? (atRiskStudents / totalStudents * 100) : 0,
                    performanceDistribution,
                    lastUpdated: new Date()
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testEmailConfig() {
        return await emailService.testConnection();
    }
}

module.exports = new StudentController();

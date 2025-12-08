const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    student_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
            },
            message: "Please enter a valid email address"
        }
    },
    grades: {
        type: Map,
        of: Number,
        default: {}
    },
    attendance: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    study_hours: {
        type: Number,
        min: 0,
        default: 0
    },
    final_grade: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    ml_prediction: {
        type: Number,
        default: null
    },
    risk_level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    at_risk: {
        type: Boolean,
        default: false
    },
    alerts_sent: [{
        type: {
            type: String,
            enum: ['risk_alert', 'progress_report', 'improvement_needed']
        },
        sent_at: {
            type: Date,
            default: Date.now
        },
        email_sent: {
            type: Boolean,
            default: false
        }
    }],
    performance_insights: {
        strengths: [String],
        weaknesses: [String],
        recommendations: [String]
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

studentSchema.index({ student_id: 1 });
studentSchema.index({ at_risk: 1 });
studentSchema.index({ risk_level: 1 });

//  Virtual field for performance average
studentSchema.virtual("overall_performance").get(function() {
    if (this.grades && this.grades instanceof Map && this.grades.size > 0) {
        const numericGrades = Array.from(this.grades.values())
            .filter(g => typeof g === "number" && !isNaN(g));
        if (numericGrades.length > 0) {
            return numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length;
        }
    }
    return this.final_grade || 0;
});

//  Improved Risk Calculation 
studentSchema.methods.calculateRiskLevel = function() {
    const performance = this.overall_performance || 0;
    const attendance = this.attendance || 0;
    const studyHours = this.study_hours || 0;

    let riskScore = 0;

    // Performance Weight (most important)
    if (performance < 40) riskScore += 45;
    else if (performance < 60) riskScore += 30;
    else if (performance < 75) riskScore += 15;

    // Attendance Weight (supportive factor)
    if (attendance < 70) riskScore += 25;
    else if (attendance < 85) riskScore += 10;
    else if (attendance > 95 && performance < 50)
        riskScore += 10; // high attendance but low marks = effort, not success

    // Study Hours Weight
    if (studyHours < 2) riskScore += 25;
    else if (studyHours < 4) riskScore += 15;
    else if (studyHours < 6) riskScore += 5;

    // Final Risk Level
    if (riskScore >= 60) {
        this.risk_level = "high";
        this.at_risk = true;
    } else if (riskScore >= 30) {
        this.risk_level = "medium";
        this.at_risk = true;
    } else {
        this.risk_level = "low";
        this.at_risk = false;
    }

    return this.risk_level;
};

//  Performance Insights 
studentSchema.methods.generateInsights = function() {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    const performance = this.overall_performance || 0;
    const attendance = this.attendance || 0;
    const studyHours = this.study_hours || 0;

    // Strengths
    if (performance >= 85) strengths.push("Excellent academic performance");
    if (attendance >= 95) strengths.push("Exceptional attendance consistency");
    if (studyHours >= 6) strengths.push("Strong study discipline");

    // Weaknesses
    if (performance < 60) weaknesses.push("Low academic performance");
    if (attendance < 80) weaknesses.push("Inconsistent attendance");
    if (studyHours < 4) weaknesses.push("Needs to dedicate more study time");

    // Recommendations
    if (performance < 75)
        recommendations.push("Join study groups or seek mentoring for weak subjects");
    if (attendance < 85)
        recommendations.push("Maintain regular attendance to keep learning continuity");
    if (studyHours < 5)
        recommendations.push("Follow a daily study routine for at least 2 more hours");

    this.performance_insights = { strengths, weaknesses, recommendations };
    return this.performance_insights;
};

const Student = mongoose.model("Student", studentSchema);
module.exports = Student;

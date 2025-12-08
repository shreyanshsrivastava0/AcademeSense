const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // Check if email is properly configured
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        
        if (!emailUser || !emailPass || emailUser === 'your-email@gmail.com' || emailPass === 'your-app-password') {
            console.warn('Email service not properly configured. Email features will be disabled.');
            this.transporter = null;
            return;
        }
        
        // Configure with environment variables
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });
    }

    async sendRiskAlert(student, teacherEmail = null) {
        if (!this.transporter) {
            return { success: false, error: 'Email service not configured' };
        }
        
        const subject = `🚨 Academic Risk Alert - ${student.name}`;
        const studentHtml = this.generateRiskAlertHtml(student, 'student');
        
        try {
            // Send to student if email available
            if (student.email) {
                await this.transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: student.email,
                    subject: subject,
                    html: studentHtml
                });
                console.log(`Risk alert sent to student: ${student.email}`);
            }

            // Send to teacher if provided
            if (teacherEmail) {
                const teacherHtml = this.generateRiskAlertHtml(student, 'teacher');
                await this.transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: teacherEmail,
                    subject: `Teacher Alert: ${subject}`,
                    html: teacherHtml
                });
                console.log(`Risk alert sent to teacher: ${teacherEmail}`);
            }

            return { success: true, message: 'Alerts sent successfully' };
        } catch (error) {
            console.error('Error sending risk alert:', error);
            return { success: false, error: error.message };
        }
    }

    async sendProgressReport(student, teacherEmail = null) {
        if (!this.transporter) {
            return { success: false, error: 'Email service not configured' };
        }
        
        const subject = `📊 Progress Report - ${student.name}`;
        const html = this.generateProgressReportHtml(student);
        
        try {
            const recipients = [];
            if (student.email) recipients.push(student.email);
            if (teacherEmail) recipients.push(teacherEmail);

            if (recipients.length > 0) {
                await this.transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: recipients.join(','),
                    subject: subject,
                    html: html
                });
                console.log(`Progress report sent to: ${recipients.join(', ')}`);
            }

            return { success: true, message: 'Progress report sent successfully' };
        } catch (error) {
            console.error('Error sending progress report:', error);
            return { success: false, error: error.message };
        }
    }

    async sendBulkAlerts(atRiskStudents, teacherEmail = null) {
        const results = [];
        
        for (const student of atRiskStudents) {
            const result = await this.sendRiskAlert(student, teacherEmail);
            results.push({ studentId: student.student_id, ...result });
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }

    generateRiskAlertHtml(student, recipient = 'student') {
        const isStudent = recipient === 'student';
        const salutation = isStudent ? `Dear ${student.name}` : 'Dear Teacher';
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b6b, #feca57); color: white; padding: 20px; border-radius: 10px; text-align: center; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .risk-high { border-left: 5px solid #e74c3c; }
                .risk-medium { border-left: 5px solid #f39c12; }
                .recommendations { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .footer { text-align: center; color: #666; font-size: 14px; }
                ul { padding-left: 20px; }
                li { margin: 8px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Academic Risk Alert</h1>
                    <p>Immediate attention required</p>
                </div>
                
                <div class="content risk-${student.risk_level}">
                    <p><strong>${salutation},</strong></p>
                    
                    ${isStudent ? 
                        `<p>We've identified some areas where you might need additional support to ensure your academic success.</p>` :
                        `<p>Student <strong>${student.name}</strong> (ID: ${student.student_id}) has been identified as requiring additional support.</p>`
                    }
                    
                    <h3>Current Status:</h3>
                    <ul>
                        <li><strong>Risk Level:</strong> ${student.risk_level.toUpperCase()}</li>
                        <li><strong>Overall Performance:</strong> ${student.overall_performance?.toFixed(1) || 'N/A'}%</li>
                        <li><strong>Attendance:</strong> ${student.attendance || 'N/A'}%</li>
                        <li><strong>Study Hours:</strong> ${student.study_hours || 'N/A'} hours/week</li>
                    </ul>
                    
                    ${student.performance_insights?.weaknesses?.length ? `
                    <h3>Areas of Concern:</h3>
                    <ul>
                        ${student.performance_insights.weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
                    </ul>
                    ` : ''}
                    
                    <div class="recommendations">
                        <h3>📋 Recommended Actions:</h3>
                        <ul>
                            ${student.performance_insights?.recommendations?.map(rec => `<li>${rec}</li>`).join('') || 
                              '<li>Schedule a meeting with your academic advisor</li><li>Consider joining study groups</li><li>Improve class attendance</li>'}
                        </ul>
                    </div>
                    
                    ${isStudent ? 
                        `<p>Don't worry - with the right support and effort, you can get back on track! Please reach out to your teachers or advisors for help.</p>` :
                        `<p>Please consider scheduling a meeting with this student to discuss their academic progress and provide additional support.</p>`
                    }
                </div>
                
                <div class="footer">
                    <p>This is an automated message from the Academic Analytics System</p>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateProgressReportHtml(student) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; text-align: center; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .performance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
                .performance-item { background: white; padding: 15px; border-radius: 8px; text-align: center; }
                .strengths { border-left: 5px solid #27ae60; }
                .weaknesses { border-left: 5px solid #e74c3c; }
                .footer { text-align: center; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Progress Report</h1>
                    <p>Academic Performance Overview</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${student.name}!</h2>
                    
                    <div class="performance-grid">
                        <div class="performance-item">
                            <h4>Overall Performance</h4>
                            <h2>${student.overall_performance?.toFixed(1) || 'N/A'}%</h2>
                        </div>
                        <div class="performance-item">
                            <h4>Risk Level</h4>
                            <h2>${student.risk_level?.toUpperCase() || 'N/A'}</h2>
                        </div>
                        <div class="performance-item">
                            <h4>Attendance</h4>
                            <h2>${student.attendance || 'N/A'}%</h2>
                        </div>
                        <div class="performance-item">
                            <h4>Study Hours/Week</h4>
                            <h2>${student.study_hours || 'N/A'}</h2>
                        </div>
                    </div>
                    
                    ${student.performance_insights?.strengths?.length ? `
                    <div class="strengths content">
                        <h3>🌟 Your Strengths:</h3>
                        <ul>
                            ${student.performance_insights.strengths.map(strength => `<li>${strength}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${student.performance_insights?.recommendations?.length ? `
                    <div class="content">
                        <h3>💡 Recommendations for Improvement:</h3>
                        <ul>
                            ${student.performance_insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                
                <div class="footer">
                    <p>Keep up the great work! 🎓</p>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Test email configuration
    async testConnection() {
        if (!this.transporter) {
            return { success: false, error: 'Email service not configured. Please update your .env file with valid email credentials.' };
        }
        
        try {
            await this.transporter.verify();
            return { success: true, message: 'Email service configured successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
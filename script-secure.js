// server.js - Secure Backend API for CV Download
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const nodemailer = require('nodemailer');
const axios = require('axios');
const validator = require('validator');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            frameSrc: ["https://www.google.com"],
            frameAncestors: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS Configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://m3hr4n.com', 'https://www.m3hr4n.com'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 CV downloads per hour
    message: 'You have reached the maximum number of CV downloads. Please try again later.',
    skipSuccessfulRequests: false,
});

// Apply rate limiting to CV download endpoint
app.use('/api/send-cv', limiter);
app.use('/api/send-cv', strictLimiter);

// Request logging middleware
app.use((req, res, next) => {
    const requestId = crypto.randomBytes(16).toString('hex');
    req.requestId = requestId;
    
    console.log(`[${new Date().toISOString()}] ${requestId} - ${req.method} ${req.path} - IP: ${req.ip}`);
    
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${requestId} - Response: ${res.statusCode}`);
    });
    
    next();
});

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: true
    }
});

// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready');
    }
});

// reCAPTCHA verification
async function verifyRecaptcha(token, remoteIP) {
    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: token,
                    remoteip: remoteIP
                }
            }
        );
        
        return response.data.success && response.data.score >= 0.5;
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return false;
    }
}

// Input validation and sanitization
function validateAndSanitizeInput(data) {
    const errors = [];
    const sanitized = {};
    
    // Name validation
    if (!data.name || typeof data.name !== 'string') {
        errors.push('Name is required');
    } else {
        sanitized.name = validator.escape(data.name.trim());
        if (!validator.isLength(sanitized.name, { min: 2, max: 100 })) {
            errors.push('Name must be between 2 and 100 characters');
        }
        if (!validator.matches(sanitized.name, /^[a-zA-Z\s\-']+$/)) {
            errors.push('Name contains invalid characters');
        }
    }
    
    // Email validation
    if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required');
    } else {
        sanitized.email = validator.normalizeEmail(data.email.trim());
        if (!validator.isEmail(sanitized.email)) {
            errors.push('Invalid email address');
        }
        // Check for disposable email domains
        const disposableDomains = ['tempmail', 'throwaway', 'guerrillamail', '10minutemail'];
        const emailDomain = sanitized.email.split('@')[1];
        if (disposableDomains.some(domain => emailDomain.includes(domain))) {
            errors.push('Disposable email addresses are not allowed');
        }
    }
    
    // Company validation (optional)
    if (data.company && typeof data.company === 'string') {
        sanitized.company = validator.escape(data.company.trim());
        if (!validator.isLength(sanitized.company, { max: 200 })) {
            errors.push('Company name is too long');
        }
    } else {
        sanitized.company = 'Not provided';
    }
    
    return { errors, sanitized };
}

// Database logging (implement your database connection)
async function logDownloadRequest(data) {
    // Log to database or file
    const logEntry = {
        timestamp: new Date().toISOString(),
        name: data.name,
        email: data.email,
        company: data.company,
        ip: data.ip,
        userAgent: data.userAgent,
        success: data.success,
        error: data.error || null
    };
    
    // For now, log to file
    try {
        const logPath = path.join(__dirname, 'logs', 'cv_requests.log');
        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
        console.error('Logging error:', error);
    }
}

// Main CV sending endpoint
app.post('/api/send-cv', async (req, res) => {
    const requestId = req.requestId;
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    try {
        // Verify reCAPTCHA
        if (process.env.RECAPTCHA_ENABLED === 'true') {
            const recaptchaToken = req.body.recaptcha_token;
            if (!recaptchaToken) {
                return res.status(400).json({
                    success: false,
                    error: 'reCAPTCHA token is required'
                });
            }
            
            const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, clientIP);
            if (!isValidRecaptcha) {
                await logDownloadRequest({
                    ...req.body,
                    ip: clientIP,
                    userAgent,
                    success: false,
                    error: 'reCAPTCHA verification failed'
                });
                
                return res.status(400).json({
                    success: false,
                    error: 'reCAPTCHA verification failed. Please try again.'
                });
            }
        }
        
        // Validate and sanitize input
        const { errors, sanitized } = validateAndSanitizeInput(req.body);
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: errors
            });
        }
        
        // Read CV file
        const cvPath = path.join(__dirname, 'assets', 'Mehran_Naderizadeh_CV_0808_V1.pdf');
        const cvBuffer = await fs.readFile(cvPath);
        
        // Prepare email to requester
        const mailOptionsToRequester = {
            from: {
                name: 'Mehran Naderizadeh',
                address: process.env.EMAIL_USER || 'inquiry@m3hr4n.com'
            },
            to: sanitized.email,
            subject: 'Mehran Naderizadeh - DevOps Engineer CV',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                        a { color: #667eea; text-decoration: none; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; border-radius: 25px; text-decoration: none; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0;">Thank You for Your Interest!</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${sanitized.name},</p>
                            <p>Thank you for requesting my CV. Please find it attached to this email.</p>
                            <p>I'm a DevOps Engineer with over 6 years of experience in designing and implementing large-scale infrastructure solutions. My expertise includes:</p>
                            <ul>
                                <li>Container Orchestration (Kubernetes, Docker, OpenShift)</li>
                                <li>CI/CD Pipeline Automation (Jenkins, GitLab)</li>
                                <li>Infrastructure as Code (Ansible, Terraform)</li>
                                <li>Cloud Technologies & Monitoring Solutions</li>
                                <li>Linux System Administration</li>
                            </ul>
                            <p>I'm always open to discussing new opportunities and interesting projects. Feel free to reach out if you'd like to connect!</p>
                            <p>You can also find more about my work at:</p>
                            <ul>
                                <li>Portfolio: <a href="https://m3hr4n.com">m3hr4n.com</a></li>
                                <li>GitHub: <a href="https://github.com/m3hr4nn">github.com/m3hr4nn</a></li>
                                <li>LinkedIn: <a href="https://linkedin.com/in/m3hr4nn">linkedin.com/in/m3hr4nn</a></li>
                            </ul>
                            <p>Best regards,<br>
                            <strong>Mehran Naderizadeh</strong><br>
                            DevOps Engineer & Infrastructure Specialist</p>
                        </div>
                        <div class="footer">
                            <p>This email was sent because you requested my CV through my portfolio website.</p>
                            <p>&copy; 2025 Mehran Naderizadeh. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: [{
                filename: 'Mehran_Naderizadeh_CV.pdf',
                content: cvBuffer,
                contentType: 'application/pdf'
            }]
        };
        
        // Prepare notification email to yourself
        const mailOptionsNotification = {
            from: process.env.EMAIL_USER || 'inquiry@m3hr4n.com',
            to: 'mehran.n1995@gmail.com',
            subject: `New CV Download Request from ${sanitized.name}`,
            html: `
                <h2>New CV Download Request</h2>
                <table style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${sanitized.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${sanitized.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Company:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${sanitized.company}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>IP Address:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${clientIP}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>User Agent:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${userAgent}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Request ID:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${requestId}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>Timestamp:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toISOString()}</td>
                    </tr>
                </table>
            `
        };
        
        // Send emails
        await transporter.sendMail(mailOptionsToRequester);
        await transporter.sendMail(mailOptionsNotification);
        
        // Log successful request
        await logDownloadRequest({
            name: sanitized.name,
            email: sanitized.email,
            company: sanitized.company,
            ip: clientIP,
            userAgent,
            success: true
        });
        
        // Send success response
        res.status(200).json({
            success: true,
            message: 'CV has been sent successfully to your email address.'
        });
        
    } catch (error) {
        console.error(`[${requestId}] Error sending CV:`, error);
        
        // Log failed request
        await logDownloadRequest({
            ...req.body,
            ip: clientIP,
            userAgent,
            success: false,
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: 'An error occurred while sending the CV. Please try again later or contact directly.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message
    });
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
fs.mkdir(logsDir, { recursive: true }).catch(console.error);

// Start server
const server = app.listen(PORT, () => {
    console.log(`Secure CV API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
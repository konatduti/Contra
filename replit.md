# Contra - Legal AI Assistant

## Overview

Contra is a Flask-based web application that provides AI-powered legal contract analysis for SMEs (Small and Medium Enterprises) in Central and Eastern Europe. The application allows users to upload contracts in various formats (PDF, DOCX, images) and receive comprehensive analysis including contract type identification, key terms extraction, risk assessment, and actionable recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**2025-07-22**: Successfully restored advanced multi-step contract analyzer
- Restored sophisticated multi-model analysis system with parallel processing architecture
- Fixed SSL/OpenAI connection issues while maintaining advanced functionality
- Implemented 5-phase concurrent analysis: structure extraction, formatting evaluation, risk assessment, consolidation, and user-friendly summarization
- Language detection and contract type classification working properly
- Legal reference extraction and validation system fully operational
- All analysis fields now properly populated: contract summary, key terms, risk assessment, recommendations, legal references, and compliance checking
- Processing uses ThreadPoolExecutor for parallel execution of multiple GPT-4o calls
- Added .txt file support for testing purposes
- Advanced analyzer now stable and fully functional with comprehensive output

**2025-07-11**: Implemented async processing with loading interface
- Added background processing system using threading to prevent worker timeouts
- Created dynamic loading page (processing.html) with progress bar and status updates
- Implemented real-time status checking API (/check_analysis) with JavaScript polling
- Fixed database session handling in background threads using Flask app context
- Users now see professional loading interface instead of browser timeout errors
- Processing happens asynchronously: upload → loading page → automatic redirect to results

**2025-07-10**: Fixed critical timeout and server issues
- Replaced complex multi-model contract analyzer with optimized single-call version
- Resolved worker timeout errors that were causing "Internal server error" on dashboard
- Fixed contract analysis functionality that was failing due to API timeout issues
- Added error handling for dashboard route to prevent crashes
- Application now stable with ~5 second analysis times instead of 2+ minute timeouts

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python) with SQLAlchemy ORM
- **Database**: SQLite for development (configurable via DATABASE_URL environment variable)
- **Authentication**: Flask-Login for session management
- **File Processing**: Multi-format document processing with OCR capabilities
- **AI Integration**: OpenAI GPT-4o for contract analysis

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5
- **Styling**: Bootstrap with custom CSS and Font Awesome icons
- **JavaScript**: Vanilla JS for interactive features like drag-and-drop upload
- **Theme**: Dark theme optimized for professional use

### Data Storage
- **Primary Database**: SQLite (development), PostgreSQL-ready (production)
- **File Storage**: Local filesystem with configurable upload directory
- **Session Management**: Flask sessions with configurable secret key

## Key Components

### Core Models
1. **User Model**: Handles user authentication, profiles, and admin privileges
2. **Document Model**: Stores uploaded file metadata and relationships
3. **Analysis Model**: Contains extracted text and AI analysis results

### Processing Pipeline
1. **File Upload**: Multi-format support (PDF, DOCX, images) with drag-and-drop interface
2. **Text Extraction**: OCR processing using pytesseract and pdf2image
3. **AI Analysis**: OpenAI GPT-4o integration for contract analysis
4. **Result Storage**: Structured analysis results stored in database

### Authentication System
- User registration and login with password hashing
- Role-based access control (regular users and admins)
- Session management with Flask-Login

### Admin Dashboard
- User management and system statistics
- Document processing monitoring
- Analysis success tracking

## Data Flow

1. **User Registration/Login**: Users create accounts and authenticate
2. **Document Upload**: Files uploaded via web interface with validation
3. **Text Extraction**: OCR processing extracts text from various file formats
4. **AI Analysis**: Extracted text sent to OpenAI for comprehensive analysis
5. **Result Storage**: Analysis results stored in database and displayed to user
6. **Dashboard Access**: Users can view all their documents and analyses

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for contract analysis
- **API Key**: Required via OPENAI_API_KEY environment variable

### Document Processing
- **pytesseract**: OCR text extraction from images
- **pdf2image**: PDF to image conversion for OCR
- **python-docx**: Direct text extraction from Word documents
- **PIL (Pillow)**: Image processing and manipulation

### Web Framework
- **Flask**: Core web framework
- **SQLAlchemy**: Database ORM
- **Flask-Login**: Authentication management
- **Werkzeug**: WSGI utilities and security

### Frontend Libraries
- **Bootstrap 5**: UI framework with dark theme
- **Font Awesome 6**: Icon library
- **Custom CSS/JS**: Enhanced user experience

## Deployment Strategy

### Environment Configuration
- **Development**: SQLite database, debug mode enabled
- **Production**: PostgreSQL recommended, environment-based configuration
- **Security**: ProxyFix middleware for HTTPS URL generation

### Required Environment Variables
- `DATABASE_URL`: Database connection string
- `SESSION_SECRET`: Flask session secret key
- `OPENAI_API_KEY`: OpenAI API authentication

### File Storage
- Local filesystem storage in configurable upload directory
- 50MB maximum file size limit
- Automatic directory creation on startup

### Security Considerations
- Password hashing with Werkzeug
- Secure filename handling
- File type validation
- Session security with secret key management
- HTTPS proxy support for production deployment

The application is designed to be easily deployable on cloud platforms with minimal configuration changes, supporting both development and production environments through environment variable configuration.
"""Database models for Contra platform."""

from datetime import datetime
from flask_login import UserMixin
from app import db


class AccessRequest(db.Model):
    """Stores onboarding requests from prospective companies."""

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), nullable=False, default="")
    company = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default="pending")  # pending/accepted/rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    decided_at = db.Column(db.DateTime)


class Company(db.Model):
    """Represents a customer organisation."""

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    seat_limit = db.Column(db.Integer, default=1, nullable=False)
    monthly_quota = db.Column(db.Integer, default=0, nullable=False)
    monthly_used = db.Column(db.Integer, default=0, nullable=False)
    extra_credits = db.Column(db.Integer, default=0, nullable=False)
    last_reset_at = db.Column(db.DateTime)

    users = db.relationship("User", backref="company", lazy=True)
    activity_logs = db.relationship(
        "ActivityLog",
        backref="company",
        lazy=True,
        order_by="ActivityLog.occurred_at.desc()",
    )

class User(UserMixin, db.Model):
    __table_args__ = (
        db.CheckConstraint("language IN ('en','hu')", name="user_language_check"),
    )

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    language = db.Column(db.String(2), nullable=False, default="en")
    is_admin = db.Column(db.Boolean, default=False)  # platform admin
    is_comorg = db.Column(db.Boolean, default=False)  # company organiser
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Individual credits
    monthly_quota = db.Column(db.Integer, default=0, nullable=False)
    monthly_used = db.Column(db.Integer, default=0, nullable=False)
    extra_credits = db.Column(db.Integer, default=0, nullable=False)
    last_reset_at = db.Column(db.DateTime)

    # Relationship to documents
    documents = db.relationship("Document", backref="user", lazy=True)
    credit_transactions = db.relationship(
        "CreditTransaction",
        backref="user",
        lazy=True,
        order_by="CreditTransaction.created_at.desc()",
    )
    activity_logs = db.relationship(
        "ActivityLog",
        backref="user",
        lazy=True,
        order_by="ActivityLog.occurred_at.desc()",
    )
    
    def get_upload_count(self):
        return len(self.documents)

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # pdf, docx, image
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    file_size = db.Column(db.Integer)  # in bytes

    # Foreign key to user
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Training data permissions
    allow_training = db.Column(db.Boolean, default=False, nullable=False)
    allow_training_locked_at = db.Column(db.DateTime)
    training_credit_awarded = db.Column(db.Boolean, default=False, nullable=False)

    # Relationship to analysis
    analysis = db.relationship('Analysis', backref='document', uselist=False)

    credit_transactions = db.relationship('CreditTransaction', backref='document', lazy=True)
    activity_logs = db.relationship(
        "ActivityLog",
        backref="document",
        lazy=True,
        order_by="ActivityLog.occurred_at.desc()",
    )

    @property
    def is_private(self):
        return not self.allow_training

class Analysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'), nullable=False)
    
    # Extracted text from document
    extracted_text = db.Column(db.Text)
    # JSON mapping of placeholders to original PII values
    pii_map = db.Column(db.Text)
    
    # Analysis results
    contract_type = db.Column(db.String(200))
    key_terms = db.Column(db.Text)
    risks = db.Column(db.Text)
    summary = db.Column(db.Text)
    summary_detailed_en = db.Column(db.Text)
    summary_normal_en = db.Column(db.Text)
    summary_short_en = db.Column(db.Text)
    summary_detailed_hu = db.Column(db.Text)
    summary_normal_hu = db.Column(db.Text)
    summary_short_hu = db.Column(db.Text)
    
    # Advanced analysis data
    detected_language = db.Column(db.String(50))
    legal_references = db.Column(db.Text)  # JSON string of legal references
    legal_reference_issues = db.Column(db.Text)  # JSON string of legal reference issues
    
    # Processing info
    processing_time = db.Column(db.Float)  # seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Status
    status = db.Column(db.String(50), default='pending')  # pending, completed, failed
    error_message = db.Column(db.Text)
    credit_deducted = db.Column(db.Boolean, default=False)
    credit_type = db.Column(db.String(50))  # which credit was used

    # Encryption metadata
    is_encrypted = db.Column(db.Boolean, default=False, nullable=False)
    encrypted_extracted_text = db.Column(db.Text)
    encrypted_pii_map = db.Column(db.Text)
    encrypted_contract_type = db.Column(db.Text)
    encrypted_key_terms = db.Column(db.Text)
    encrypted_risks = db.Column(db.Text)
    encrypted_summary = db.Column(db.Text)
    encrypted_summary_detailed_en = db.Column(db.Text)
    encrypted_summary_normal_en = db.Column(db.Text)
    encrypted_summary_short_en = db.Column(db.Text)
    encrypted_summary_detailed_hu = db.Column(db.Text)
    encrypted_summary_normal_hu = db.Column(db.Text)
    encrypted_summary_short_hu = db.Column(db.Text)
    encrypted_legal_references = db.Column(db.Text)
    encrypted_legal_reference_issues = db.Column(db.Text)

    feedback_entries = db.relationship('AnalysisFeedback', backref='analysis', lazy=True)

    def _resolve_field(self, field_name):
        value = getattr(self, field_name)
        if self.is_encrypted:
            encrypted_value = getattr(self, f"encrypted_{field_name}", None)
            if encrypted_value:
                from encryption_utils import decrypt_value  # Local import to avoid circular

                return decrypt_value(encrypted_value)
            return ""
        return value or ""

    def resolved_summary(self):
        return self._resolve_field('summary')

    def resolved_summary_detailed_en(self):
        return self._resolve_field('summary_detailed_en')

    def resolved_summary_normal_en(self):
        return self._resolve_field('summary_normal_en')

    def resolved_summary_short_en(self):
        return self._resolve_field('summary_short_en')

    def resolved_summary_detailed_hu(self):
        return self._resolve_field('summary_detailed_hu')

    def resolved_summary_normal_hu(self):
        return self._resolve_field('summary_normal_hu')

    def resolved_summary_short_hu(self):
        return self._resolve_field('summary_short_hu')

    def resolved_summary_variants(self):
        def _clean(value):
            if not value:
                return ""
            return value.strip()

        variants = {
            "en": {
                "detailed": _clean(self.resolved_summary_detailed_en()),
                "normal": _clean(self.resolved_summary_normal_en()),
                "short": _clean(self.resolved_summary_short_en()),
            },
            "hu": {
                "detailed": _clean(self.resolved_summary_detailed_hu()),
                "normal": _clean(self.resolved_summary_normal_hu()),
                "short": _clean(self.resolved_summary_short_hu()),
            },
        }

        cleaned = {
            lang: {length: text for length, text in options.items() if text}
            for lang, options in variants.items()
        }
        cleaned = {lang: options for lang, options in cleaned.items() if options}

        base_summary = _clean(self.resolved_summary())
        if base_summary:
            cleaned.setdefault("en", {})
            cleaned["en"].setdefault("normal", base_summary)

        return cleaned

    def resolved_key_terms(self):
        return self._resolve_field('key_terms')

    def resolved_risks(self):
        return self._resolve_field('risks')

    def resolved_contract_type(self):
        return self._resolve_field('contract_type')

    def resolved_legal_references(self):
        return self._resolve_field('legal_references')

    def resolved_legal_reference_issues(self):
        return self._resolve_field('legal_reference_issues')

    def resolved_extracted_text(self):
        return self._resolve_field('extracted_text')

    def resolved_pii_map(self):
        return self._resolve_field('pii_map')


class AnalysisFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('analysis.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    rating = db.Column(db.Integer)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    credit_awarded = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref='feedback_submissions', lazy=True)


class CreditTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'))
    amount = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    credit_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    company = db.relationship('Company', backref='credit_transactions', lazy=True)


class PlatformSetting(db.Model):
    """Stores simple key/value settings for the platform."""

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.String(100), nullable=False)

    @staticmethod
    def get(key, default=None):
        setting = PlatformSetting.query.filter_by(key=key).first()
        return setting.value if setting else default

    @staticmethod
    def set(key, value):
        setting = PlatformSetting.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            setting = PlatformSetting(key=key, value=value)
            db.session.add(setting)
        db.session.commit()


class LegalDocument(db.Model):
    """Stores editable draft/published legal documents by locale and type."""

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(50), unique=True, nullable=False)
    draft_content = db.Column(db.Text, nullable=False, default="")
    published_content = db.Column(db.Text, nullable=False, default="")

    @staticmethod
    def get(key):
        return LegalDocument.query.filter_by(key=key).first()

    @staticmethod
    def get_or_create(key, default_content=""):
        document = LegalDocument.get(key)
        if document:
            return document
        document = LegalDocument(
            key=key,
            draft_content=default_content or "",
            published_content=default_content or "",
        )
        db.session.add(document)
        db.session.commit()
        return document

class ActivityLog(db.Model):
    """Combined visit and analysis activity feed entries."""

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(20), nullable=False)
    occurred_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'))
    document_id = db.Column(db.Integer, db.ForeignKey('document.id'))
    ip_address = db.Column(db.String(45))
    location_label = db.Column(db.String(255))
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    duration_seconds = db.Column(db.Integer)
    analysis_status = db.Column(db.String(50))
    shared_with_contra = db.Column(db.Boolean)
    credit_type = db.Column(db.String(50))
    visit_type = db.Column(db.String(20))
    user_agent = db.Column(db.String(255))
    path = db.Column(db.String(512))
    details = db.Column(db.JSON, default=dict)

    def __repr__(self):
        return f"<ActivityLog {self.event_type} #{self.id}>"

    @property
    def details_dict(self):
        return self.details or {}

    def detail(self, key, default=None):
        return self.details_dict.get(key, default)

    @property
    def is_visit(self):
        return self.event_type == "visit"

    @property
    def is_analysis(self):
        return self.event_type == "analysis"

    @property
    def visit_type_label(self):
        mapping = {
            "human": "Human",
            "bot": "Bot",
            "unknown": "Unknown",
        }
        return mapping.get((self.visit_type or "").lower(), self.visit_type)

    @property
    def duration_label(self):
        if self.duration_seconds is None:
            return None
        seconds = max(int(self.duration_seconds), 0)
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        parts = []
        if hours:
            parts.append(f"{hours}h")
        if minutes:
            parts.append(f"{minutes}m")
        if seconds and not hours:
            parts.append(f"{seconds}s")
        if not parts:
            parts.append(f"{seconds}s")
        return " ".join(parts)

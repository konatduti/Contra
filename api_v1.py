import os
from datetime import datetime
from threading import Thread

from flask import Blueprint, jsonify, request
from flask_login import current_user
from werkzeug.utils import secure_filename

from app import app, db
from models import AccessRequest, Analysis, Company, Document, User
from utils import allowed_file, get_file_type

api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")

_PROCESSING_STATUSES = {"ocr", "analysis", "processing"}


def _is_authenticated():
    return bool(getattr(current_user, "is_authenticated", False))


def _unauthorized_response():
    return jsonify({"error": "Unauthorized"}), 401


def _forbidden_response():
    return jsonify({"error": "Forbidden"}), 403


def _analysis_status_for_ui(analysis):
    if not analysis:
        return "queued"
    status = (analysis.status or "").lower()
    if status in {"pending", "queued"}:
        return "queued"
    if status in _PROCESSING_STATUSES:
        return "processing"
    if status in {"completed", "done"}:
        return "done"
    if status == "failed":
        return "failed"
    return "processing"


def _serialize_document(document):
    analysis = document.analysis
    return {
        "id": document.id,
        "filename": document.original_filename,
        "storedFilename": document.filename,
        "fileType": document.file_type,
        "fileSize": document.file_size,
        "uploadedAt": document.upload_date.isoformat() if document.upload_date else None,
        "status": _analysis_status_for_ui(analysis),
        "analysisId": analysis.id if analysis else None,
        "allowTraining": bool(document.allow_training),
    }


def _serialize_user(user):
    role = "user"
    if user.is_admin:
        role = "admin"
    elif user.is_comorg:
        role = "company_organizer"

    company = None
    if user.company:
        company = {
            "id": user.company.id,
            "name": user.company.name,
        }

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": role,
        "language": user.language,
        "company": company,
        "isAdmin": bool(user.is_admin),
        "isCompanyOrganizer": bool(user.is_comorg),
    }


@api_v1.route("/me", methods=["GET"])
def me():
    if not _is_authenticated():
        return _unauthorized_response()
    return jsonify({"user": _serialize_user(current_user)})


@api_v1.route("/dashboard", methods=["GET"])
def dashboard():
    if not _is_authenticated():
        return _unauthorized_response()

    document_query = Document.query.filter_by(user_id=current_user.id)
    documents = document_query.order_by(Document.upload_date.desc()).all()

    total_documents = len(documents)
    completed = sum(1 for doc in documents if _analysis_status_for_ui(doc.analysis) == "done")
    processing = sum(1 for doc in documents if _analysis_status_for_ui(doc.analysis) in {"queued", "processing"})
    failed = sum(1 for doc in documents if _analysis_status_for_ui(doc.analysis) == "failed")

    payload = {
        "stats": {
            "totalDocuments": total_documents,
            "completedDocuments": completed,
            "processingDocuments": processing,
            "failedDocuments": failed,
        },
        "credits": {
            "monthlyQuota": current_user.monthly_quota,
            "monthlyUsed": current_user.monthly_used,
            "extraCredits": current_user.extra_credits,
        },
        "recentDocuments": [_serialize_document(doc) for doc in documents[:10]],
    }
    return jsonify(payload)


@api_v1.route("/documents", methods=["GET"])
def list_documents():
    if not _is_authenticated():
        return _unauthorized_response()

    documents = (
        Document.query.filter_by(user_id=current_user.id)
        .order_by(Document.upload_date.desc())
        .all()
    )
    return jsonify({"documents": [_serialize_document(doc) for doc in documents]})


@api_v1.route("/documents/<int:document_id>", methods=["GET"])
def get_document(document_id):
    if not _is_authenticated():
        return _unauthorized_response()

    document = Document.query.get(document_id)
    if not document:
        return jsonify({"error": "Not found"}), 404
    if document.user_id != current_user.id and not current_user.is_admin:
        return _forbidden_response()

    analysis = document.analysis
    return jsonify(
        {
            "document": _serialize_document(document),
            "analysis": {
                "id": analysis.id if analysis else None,
                "status": _analysis_status_for_ui(analysis),
                "rawStatus": analysis.status if analysis else "pending",
                "error": analysis.error_message if analysis else None,
            },
        }
    )


@api_v1.route("/documents/upload", methods=["POST"])
def upload_document():
    if not _is_authenticated():
        return _unauthorized_response()

    file = (
        request.files.get("file")
        or request.files.get("document")
        or request.files.get("upload")
    )
    if not file or not file.filename:
        return jsonify({"error": "No file provided"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    safe_name = secure_filename(file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_")
    stored_name = f"{timestamp}{safe_name}"
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], stored_name)
    file.save(file_path)

    allow_training_choice = str(request.form.get("allow_training", "")).lower() in {
        "1",
        "true",
        "on",
        "yes",
    }
    credit_type = request.form.get("credit_type")

    document = Document(
        filename=stored_name,
        original_filename=file.filename,
        file_type=get_file_type(file.filename),
        user_id=current_user.id,
        file_size=os.path.getsize(file_path),
        allow_training=allow_training_choice,
        allow_training_locked_at=datetime.utcnow() if allow_training_choice else None,
    )
    db.session.add(document)
    db.session.commit()

    analysis = Analysis(document_id=document.id, status="pending", credit_type=credit_type)
    db.session.add(analysis)
    db.session.commit()

    from routes import get_client_ip, process_document

    Thread(
        target=process_document,
        args=(document.id, file_path, document.file_type, get_client_ip()),
        daemon=True,
    ).start()

    return (
        jsonify(
            {
                "document": _serialize_document(document),
                "analysis": {
                    "id": analysis.id,
                    "status": _analysis_status_for_ui(analysis),
                    "rawStatus": analysis.status,
                },
            }
        ),
        201,
    )


@api_v1.route("/analysis/<int:item_id>/status", methods=["GET"])
def analysis_status(item_id):
    if not _is_authenticated():
        return _unauthorized_response()

    analysis = Analysis.query.filter_by(document_id=item_id).first()
    document_id = item_id
    if not analysis:
        analysis = Analysis.query.get(item_id)
        if analysis:
            document_id = analysis.document_id

    if not analysis:
        return jsonify({"error": "Not found"}), 404

    document = Document.query.get(document_id)
    if document and document.user_id != current_user.id and not current_user.is_admin:
        return _forbidden_response()

    return jsonify(
        {
            "id": document_id,
            "analysisId": analysis.id,
            "status": _analysis_status_for_ui(analysis),
            "rawStatus": analysis.status,
            "error": analysis.error_message,
        }
    )


@api_v1.route("/admin/requests", methods=["GET"])
def admin_requests():
    if not _is_authenticated():
        return _unauthorized_response()
    if not current_user.is_admin:
        return _forbidden_response()

    requests = AccessRequest.query.order_by(AccessRequest.created_at.desc()).all()
    return jsonify(
        {
            "requests": [
                {
                    "id": req.id,
                    "name": req.name,
                    "username": req.username,
                    "company": req.company,
                    "email": req.email,
                    "message": req.message,
                    "status": req.status,
                    "createdAt": req.created_at.isoformat() if req.created_at else None,
                }
                for req in requests
            ]
        }
    )


@api_v1.route("/admin/companies", methods=["GET"])
def admin_companies():
    if not _is_authenticated():
        return _unauthorized_response()
    if not current_user.is_admin:
        return _forbidden_response()

    companies = Company.query.order_by(Company.name.asc()).all()
    return jsonify(
        {
            "companies": [
                {
                    "id": company.id,
                    "name": company.name,
                    "seatLimit": company.seat_limit,
                    "monthlyQuota": company.monthly_quota,
                    "monthlyUsed": company.monthly_used,
                    "extraCredits": company.extra_credits,
                    "memberCount": len(company.users),
                }
                for company in companies
            ]
        }
    )


@api_v1.route("/companies/<int:company_id>/members", methods=["GET"])
def company_members(company_id):
    if not _is_authenticated():
        return _unauthorized_response()

    company = Company.query.get(company_id)
    if not company:
        return jsonify({"error": "Not found"}), 404

    can_access = current_user.is_admin or (
        current_user.company_id == company_id and current_user.is_comorg
    )
    if not can_access:
        return _forbidden_response()

    members = User.query.filter_by(company_id=company_id).order_by(User.username.asc()).all()
    return jsonify(
        {
            "company": {"id": company.id, "name": company.name},
            "members": [
                {
                    "id": member.id,
                    "username": member.username,
                    "email": member.email,
                    "isAdmin": bool(member.is_admin),
                    "isCompanyOrganizer": bool(member.is_comorg),
                }
                for member in members
            ],
        }
    )

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from werkzeug.security import generate_password_hash


TEST_DB = Path(__file__).resolve().parent / "activity_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["IP_GEOLOCATION_LOOKUP_ENABLED"] = "0"

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import app, db  # noqa: E402
from models import ActivityLog, Company, User  # noqa: E402
from routes import record_activity  # noqa: E402


app.config.setdefault("TESTING", True)


@pytest.fixture(scope="session", autouse=True)
def _cleanup_db_file():
    yield
    with app.app_context():
        db.engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()


@pytest.fixture(autouse=True)
def _reset_db():
    with app.app_context():
        db.drop_all()
        db.create_all()
    yield
    with app.app_context():
        db.session.remove()


def _create_user(username="tester", is_admin=False):
    with app.app_context():
        company = Company(name=f"{username}-co")
        user = User(
            username=username,
            email=f"{username}@example.com",
            password_hash="hash",
            is_admin=is_admin,
        )
        user.company = company
        db.session.add(company)
        db.session.add(user)
        db.session.commit()
        return user.id, company.id


def test_record_activity_creates_visit_entry():
    user_id, company_id = _create_user()
    with app.app_context():
        user = db.session.get(User, user_id)
        company = db.session.get(Company, company_id)
        entry = record_activity(
            "visit",
            user=user,
            company=company,
            ip_address="203.0.113.1",
            user_agent="Mozilla/5.0",
            visit_type="human",
            path="/dashboard",
            details={"path": "/dashboard", "method": "GET"},
        )
        assert entry is not None
        stored = ActivityLog.query.one()
        assert stored.event_type == "visit"
        assert stored.details_dict["path"] == "/dashboard"
        assert stored.company_id == company.id
        assert stored.path == "/dashboard"
        assert stored.visit_type == "human"
        assert stored.user_agent == "Mozilla/5.0"
        assert stored.details_dict["user_agent_full"] == "Mozilla/5.0"
        assert stored.country is None
        assert stored.city is None


def test_record_activity_updates_previous_duration():
    user_id, company_id = _create_user("duration")
    with app.app_context():
        user = db.session.get(User, user_id)
        company = db.session.get(Company, company_id)
        first = record_activity(
            "visit",
            user=user,
            company=company,
            details={"path": "/dashboard"},
        )
        first_entry = db.session.get(ActivityLog, first.id)
        first_entry.occurred_at = datetime.utcnow() - timedelta(minutes=5)
        db.session.commit()

        record_activity(
            "visit",
            user=user,
            company=company,
            details={"path": "/upload"},
        )

        updated = db.session.get(ActivityLog, first.id)
        assert 290 <= (updated.duration_seconds or 0) <= 310


def test_platform_admin_dashboard_renders_activity_table():
    with app.app_context():
        company = Company(name="AdminCo")
        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=generate_password_hash("secret"),
            is_admin=True,
        )
        admin.company = company
        db.session.add(company)
        db.session.add(admin)
        db.session.commit()
        record_activity(
            "visit",
            user=admin,
            company=company,
            details={"path": "/platform-admin"},
        )

    with app.test_client() as client:
        login_response = client.post(
            "/login",
            data={"username": "admin", "password": "secret"},
            follow_redirects=True,
        )
        assert login_response.status_code == 200
        response = client.get("/platform-admin")
        assert response.status_code == 200
        assert b"activityLogModal" in response.data


def test_anonymous_visit_is_recorded_in_activity_log():
    with app.test_client() as client:
        response = client.get(
            "/",
            headers={
                "X-Forwarded-For": "198.51.100.5",
                "User-Agent": "Mozilla/5.0 (TestBrowser/1.0)",
            },
        )
        assert response.status_code == 200

    with app.app_context():
        entries = ActivityLog.query.all()
        assert len(entries) == 1
        entry = entries[0]
        assert entry.user_id is None
        assert entry.details_dict["path"] == "/"
        assert entry.ip_address == "198.51.100.5"
        assert entry.visit_type == "human"
        assert entry.user_agent.startswith("Mozilla/5.0")
        assert entry.details_dict["user_agent_full"].startswith("Mozilla/5.0")


def test_bot_visit_is_classified_as_bot():
    bot_agent = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    with app.test_client() as client:
        response = client.get(
            "/",
            headers={
                "User-Agent": bot_agent,
                "X-Forwarded-For": "203.0.113.55",
            },
        )
        assert response.status_code == 200

    with app.app_context():
        entry = ActivityLog.query.one()
        assert entry.visit_type == "bot"
        assert entry.user_agent is not None
        assert entry.details_dict["user_agent_full"] == bot_agent

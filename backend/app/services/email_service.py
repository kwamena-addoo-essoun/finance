"""Email delivery via Resend — https://resend.com"""
import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")

_FROM = os.getenv("FROM_EMAIL", "Finsight <noreply@finsight.app>")
_FRONTEND = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _send(to: str, subject: str, html: str) -> None:
    """Low-level send. Raises on failure."""
    if not resend.api_key:
        # Dev fallback — just print so the flow works without a real API key
        print(f"\n[EMAIL] To: {to} | Subject: {subject}\n{html}\n")
        return
    resend.Emails.send({"from": _FROM, "to": [to], "subject": subject, "html": html})


def send_verification_email(to_email: str, token: str) -> None:
    url = f"{_FRONTEND}/verify-email?token={token}"
    _send(
        to=to_email,
        subject="Verify your Finsight account",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#6366f1">Welcome to Finsight 👋</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="{url}" style="display:inline-block;padding:12px 24px;
             background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;
             font-weight:600">Verify Email</a>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">
            This link expires in 24 hours. If you didn't create a Finsight account, ignore this email.
          </p>
        </div>
        """,
    )


def send_password_reset_email(to_email: str, token: str) -> None:
    url = f"{_FRONTEND}/reset-password?token={token}"
    _send(
        to=to_email,
        subject="Reset your Finsight password",
        html=f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#6366f1">Reset your password</h2>
          <p>Click the button below to choose a new password:</p>
          <a href="{url}" style="display:inline-block;padding:12px 24px;
             background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;
             font-weight:600">Reset Password</a>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">
            This link expires in 1 hour. If you didn't request this, you can safely ignore it.
          </p>
        </div>
        """,
    )

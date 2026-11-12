import importlib
import sys


def reload_settings(monkeypatch, *, secret: str, cors: str):
    monkeypatch.setenv("SECRET_KEY", secret)
    monkeypatch.setenv("CORS_ORIGINS", cors)
    sys.modules.pop("app.core.config", None)
    import app.core.config as config
    return importlib.reload(config)


def test_settings_reads_secure_secret_and_json_cors(monkeypatch):
    secret = "dev-secret-key-for-local-running-Agni-Capsule-32chars"
    cors = '["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000"]'

    config_module = reload_settings(monkeypatch, secret=secret, cors=cors)

    assert config_module.settings.SECRET_KEY == secret
    assert config_module.settings.CORS_ORIGINS == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

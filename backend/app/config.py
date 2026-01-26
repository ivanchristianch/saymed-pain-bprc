import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

def _get(name: str, default: str | None = None) -> str:
    v = os.getenv(name, default)
    if v is None:
        raise RuntimeError(f"Missing env var: {name}")
    return v

@dataclass(frozen=True)
class Settings:
    app_env: str = _get("APP_ENV", "local")
    app_name: str = _get("APP_NAME", "SayMed Pain BPRC API")
    jwt_secret: str = _get("JWT_SECRET", "CHANGE_ME_SUPER_SECRET")
    jwt_alg: str = _get("JWT_ALG", "HS256")
    access_token_minutes: int = int(_get("ACCESS_TOKEN_MINUTES", "720"))
    database_url: str = _get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/saymed")
    cors_origins_csv: str = _get("CORS_ORIGINS", "http://localhost:3000")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")

    @property
    def cors_origins(self) -> list[str]:
        # split + trim, ignore empty
        return [x.strip() for x in self.cors_origins_csv.split(",") if x.strip()]

settings = Settings()

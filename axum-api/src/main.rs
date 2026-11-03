use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Path, Query, State},
    http::{
        HeaderMap, HeaderValue, Method, StatusCode,
        header::{
            AUTHORIZATION, CACHE_CONTROL, CONTENT_SECURITY_POLICY, CONTENT_TYPE, REFERRER_POLICY,
            X_CONTENT_TYPE_OPTIONS, X_FRAME_OPTIONS,
        },
    },
    middleware,
    response::{IntoResponse, Response},
    routing::{get, post},
};
use bcrypt::{DEFAULT_COST, hash, verify};
use chrono::{DateTime, Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    signature::{Signer, read_keypair_file},
    transaction::Transaction,
};
use sqlx::{FromRow, PgPool, postgres::PgPoolOptions};
use std::{env, net::SocketAddr};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    db: PgPool,
    jwt_secret: String,
    solana: Option<SolanaConfig>,
}
#[derive(Clone)]
struct SolanaConfig {
    rpc_url: String,
    keypair_path: String,
}
#[derive(Serialize)]
struct Health {
    status: &'static str,
}
#[derive(Serialize, FromRow)]
struct User {
    id: Uuid,
    email: String,
}
#[derive(Deserialize)]
struct Register {
    email: String,
    password: String,
    display_name: String,
}
#[derive(Deserialize)]
struct Login {
    email: String,
    password: String,
}
#[derive(Serialize)]
struct AuthResponse {
    token: String,
    user: User,
}
#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}
#[derive(Serialize, FromRow)]
struct Profile {
    user_id: Uuid,
    display_name: String,
    bio: String,
    wallet_address: Option<String>,
}
#[derive(Serialize)]
struct PublicProfile {
    #[serde(flatten)]
    profile: Profile,
    reviews: Vec<Review>,
}
#[derive(Serialize)]
struct Me {
    user: User,
    profile: Profile,
}
#[derive(Deserialize)]
struct UpdateProfile {
    display_name: String,
    bio: String,
    wallet_address: Option<String>,
}
#[derive(Serialize, FromRow)]
struct Agreement {
    id: Uuid,
    creator_id: Uuid,
    participant_id: Uuid,
    title: String,
    description: String,
    status: String,
    accepted_at: Option<DateTime<Utc>>,
    completed_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
}
#[derive(Deserialize)]
struct CreateAgreement {
    participant_id: Uuid,
    title: String,
    description: String,
}
#[derive(Deserialize)]
struct AgreementQuery {
    status: Option<String>,
}
#[derive(Serialize, FromRow)]
struct Review {
    id: Uuid,
    agreement_id: Uuid,
    reviewer_id: Uuid,
    reviewed_user_id: Uuid,
    rating: i16,
    review_text: String,
    verification_status: String,
    blockchain_transaction: Option<String>,
    created_at: DateTime<Utc>,
}
#[derive(Deserialize)]
struct CreateReview {
    agreement_id: Uuid,
    rating: i16,
    review_text: String,
}
#[derive(Deserialize)]
struct ReviewQuery {
    scope: Option<String>,
}

struct ApiError(StatusCode, String);
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(serde_json::json!({"error": self.1}))).into_response()
    }
}
type ApiResult<T> = Result<T, ApiError>;
fn bad(message: impl Into<String>) -> ApiError {
    ApiError(StatusCode::BAD_REQUEST, message.into())
}

const MAX_EMAIL_LENGTH: usize = 254;
const MAX_DISPLAY_NAME_LENGTH: usize = 80;
const MAX_BIO_LENGTH: usize = 2_000;
const MAX_WALLET_ADDRESS_LENGTH: usize = 64;
const MAX_AGREEMENT_TITLE_LENGTH: usize = 160;
const MAX_AGREEMENT_DESCRIPTION_LENGTH: usize = 5_000;
const MAX_REVIEW_LENGTH: usize = 2_000;

fn is_valid_email(email: &str) -> bool {
    let email = email.trim();
    email.len() <= MAX_EMAIL_LENGTH
        && email.contains('@')
        && email.split('@').count() == 2
        && email.split('@').all(|part| !part.is_empty())
}

fn validate_registration(input: &Register) -> ApiResult<()> {
    if !is_valid_email(&input.email) {
        return Err(bad("enter a valid email address"));
    }
    if input.password.len() < 12 {
        return Err(bad("use a password with at least 12 characters"));
    }
    if input.display_name.trim().is_empty()
        || input.display_name.trim().len() > MAX_DISPLAY_NAME_LENGTH
    {
        return Err(bad("display name must be between 1 and 80 characters"));
    }
    Ok(())
}

fn validate_profile(input: &UpdateProfile) -> ApiResult<()> {
    if input.display_name.trim().is_empty()
        || input.display_name.trim().len() > MAX_DISPLAY_NAME_LENGTH
    {
        return Err(bad("display name must be between 1 and 80 characters"));
    }
    if input.bio.len() > MAX_BIO_LENGTH {
        return Err(bad("bio must be 2,000 characters or fewer"));
    }
    if input
        .wallet_address
        .as_ref()
        .is_some_and(|address| address.len() > MAX_WALLET_ADDRESS_LENGTH)
    {
        return Err(bad("wallet address must be 64 characters or fewer"));
    }
    Ok(())
}

fn validate_agreement(input: &CreateAgreement, creator_id: Uuid) -> ApiResult<()> {
    if input.title.trim().is_empty() || input.title.trim().len() > MAX_AGREEMENT_TITLE_LENGTH {
        return Err(bad("agreement title must be between 1 and 160 characters"));
    }
    if input.description.len() > MAX_AGREEMENT_DESCRIPTION_LENGTH {
        return Err(bad(
            "agreement description must be 5,000 characters or fewer",
        ));
    }
    if creator_id == input.participant_id {
        return Err(bad(
            "choose another user's ID; you cannot create an agreement with yourself",
        ));
    }
    Ok(())
}

fn validate_review(input: &CreateReview) -> ApiResult<()> {
    if !(1..=5).contains(&input.rating)
        || input.review_text.trim().is_empty()
        || input.review_text.trim().len() > MAX_REVIEW_LENGTH
    {
        return Err(bad(
            "rating must be 1 through 5 and review text must be between 1 and 2,000 characters",
        ));
    }
    Ok(())
}

fn cors_layer() -> CorsLayer {
    let origin = env::var("FRONTEND_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".into());
    let origin =
        HeaderValue::from_str(&origin).expect("FRONTEND_ORIGIN must be a valid HTTP origin");
    CorsLayer::new()
        .allow_origin(origin)
        .allow_methods([Method::GET, Method::POST, Method::PUT])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE])
}

async fn security_headers(mut response: Response) -> Response {
    let headers = response.headers_mut();
    headers.insert(X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
    headers.insert(X_FRAME_OPTIONS, HeaderValue::from_static("DENY"));
    headers.insert(REFERRER_POLICY, HeaderValue::from_static("no-referrer"));
    headers.insert(
        CONTENT_SECURITY_POLICY,
        HeaderValue::from_static("default-src 'none'; frame-ancestors 'none'"),
    );
    headers.insert(CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}
fn internal(_: sqlx::Error) -> ApiError {
    ApiError(
        StatusCode::INTERNAL_SERVER_ERROR,
        "database request failed".into(),
    )
}

fn actor(headers: &HeaderMap, state: &AppState) -> ApiResult<Uuid> {
    let token = headers
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or_else(|| ApiError(StatusCode::UNAUTHORIZED, "missing bearer token".into()))?;
    let claims = decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map_err(|_| ApiError(StatusCode::UNAUTHORIZED, "invalid or expired token".into()))?
    .claims;
    Uuid::parse_str(&claims.sub)
        .map_err(|_| ApiError(StatusCode::UNAUTHORIZED, "invalid token subject".into()))
}
fn token(user_id: Uuid, secret: &str) -> String {
    let claims = Claims {
        sub: user_id.to_string(),
        exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .expect("JWT encoding")
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("axum_api=debug,tower_http=info")
        .init();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must point to PostgreSQL");
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    assert!(
        jwt_secret.len() >= 32,
        "JWT_SECRET must be at least 32 characters long"
    );
    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("could not connect to PostgreSQL");
    sqlx::migrate!()
        .run(&db)
        .await
        .expect("could not run migrations");
    let solana = env::var("SOLANA_KEYPAIR_PATH")
        .ok()
        .map(|keypair_path| SolanaConfig {
            rpc_url: env::var("SOLANA_RPC_URL")
                .unwrap_or_else(|_| "https://api.devnet.solana.com".into()),
            keypair_path,
        });
    if solana.is_none() {
        tracing::warn!(
            "Solana verification is disabled: set SOLANA_KEYPAIR_PATH to enable Devnet records"
        );
    }
    let state = AppState {
        db,
        jwt_secret,
        solana,
    };
    let app = Router::new()
        .route("/health", get(health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/me", get(me))
        .route("/profiles/{user_id}", get(profile).put(update_profile))
        .route("/agreements", get(list_agreements).post(create_agreement))
        .route("/agreements/{id}", get(agreement))
        .route("/agreements/{id}/accept", post(accept_agreement))
        .route("/agreements/{id}/complete", post(complete_agreement))
        .route("/reviews", get(list_reviews).post(create_review))
        .route("/reviews/{id}/verification", get(verification))
        .with_state(state)
        .layer(DefaultBodyLimit::max(16 * 1024))
        .layer(middleware::map_response(security_headers))
        .layer(cors_layer())
        .layer(TraceLayer::new_for_http());
    let addr = SocketAddr::from((
        [127, 0, 0, 1],
        env::var("PORT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3001),
    ));
    tracing::info!(%addr, "TrustLayer API listening");
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}
async fn health() -> Json<Health> {
    Json(Health { status: "ok" })
}

async fn register(
    State(s): State<AppState>,
    Json(input): Json<Register>,
) -> ApiResult<(StatusCode, Json<AuthResponse>)> {
    validate_registration(&input)?;
    let email = input.email.trim().to_lowercase();
    let id = Uuid::new_v4();
    let password_hash =
        hash(input.password, DEFAULT_COST).map_err(|_| bad("could not secure password"))?;
    let result = sqlx::query("INSERT INTO users (id,email,password_hash) VALUES ($1,$2,$3)")
        .bind(id)
        .bind(&email)
        .bind(password_hash)
        .execute(&s.db)
        .await;
    if result.is_err() {
        return Err(ApiError(
            StatusCode::CONFLICT,
            "email is already registered".into(),
        ));
    }
    sqlx::query("INSERT INTO profiles (user_id,display_name) VALUES ($1,$2)")
        .bind(id)
        .bind(input.display_name.trim())
        .execute(&s.db)
        .await
        .map_err(internal)?;
    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            token: token(id, &s.jwt_secret),
            user: User { id, email },
        }),
    ))
}
async fn login(
    State(s): State<AppState>,
    Json(input): Json<Login>,
) -> ApiResult<Json<AuthResponse>> {
    let row = sqlx::query_as::<_, (Uuid, String, String)>(
        "SELECT id,email,password_hash FROM users WHERE email=$1",
    )
    .bind(input.email.trim().to_lowercase())
    .fetch_optional(&s.db)
    .await
    .map_err(internal)?
    .ok_or_else(|| ApiError(StatusCode::UNAUTHORIZED, "invalid email or password".into()))?;
    if !verify(input.password, &row.2).unwrap_or(false) {
        return Err(ApiError(
            StatusCode::UNAUTHORIZED,
            "invalid email or password".into(),
        ));
    }
    Ok(Json(AuthResponse {
        token: token(row.0, &s.jwt_secret),
        user: User {
            id: row.0,
            email: row.1,
        },
    }))
}
async fn me(State(s): State<AppState>, headers: HeaderMap) -> ApiResult<Json<Me>> {
    let id = actor(&headers, &s)?;
    let user = sqlx::query_as("SELECT id,email FROM users WHERE id=$1")
        .bind(id)
        .fetch_optional(&s.db)
        .await
        .map_err(internal)?
        .ok_or_else(|| ApiError(StatusCode::UNAUTHORIZED, "account not found".into()))?;
    let profile = sqlx::query_as(
        "SELECT user_id,display_name,bio,wallet_address FROM profiles WHERE user_id=$1",
    )
    .bind(id)
    .fetch_one(&s.db)
    .await
    .map_err(internal)?;
    Ok(Json(Me { user, profile }))
}
async fn profile(
    State(s): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> ApiResult<Json<PublicProfile>> {
    let profile = sqlx::query_as(
        "SELECT user_id,display_name,bio,wallet_address FROM profiles WHERE user_id=$1",
    )
    .bind(user_id)
    .fetch_optional(&s.db)
    .await
    .map_err(internal)?
    .ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "profile not found".into()))?;
    let reviews = sqlx::query_as("SELECT id,agreement_id,reviewer_id,reviewed_user_id,rating,review_text,verification_status,blockchain_transaction,created_at FROM reviews WHERE reviewed_user_id=$1 ORDER BY created_at DESC")
        .bind(user_id)
        .fetch_all(&s.db)
        .await
        .map_err(internal)?;
    Ok(Json(PublicProfile { profile, reviews }))
}
async fn update_profile(
    State(s): State<AppState>,
    Path(user_id): Path<Uuid>,
    headers: HeaderMap,
    Json(input): Json<UpdateProfile>,
) -> ApiResult<Json<Profile>> {
    if actor(&headers, &s)? != user_id {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "you can only update your own profile".into(),
        ));
    }
    validate_profile(&input)?;
    sqlx::query_as("UPDATE profiles SET display_name=$1,bio=$2,wallet_address=$3,updated_at=now() WHERE user_id=$4 RETURNING user_id,display_name,bio,wallet_address").bind(input.display_name.trim()).bind(input.bio.trim()).bind(input.wallet_address).bind(user_id).fetch_one(&s.db).await.map(Json).map_err(internal)
}
async fn create_agreement(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<CreateAgreement>,
) -> ApiResult<(StatusCode, Json<Agreement>)> {
    let creator_id = actor(&headers, &s)?;
    validate_agreement(&input, creator_id)?;
    let participant_exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE id=$1)")
            .bind(input.participant_id)
            .fetch_one(&s.db)
            .await
            .map_err(internal)?;
    if !participant_exists {
        return Err(bad(
            "no TrustLayer account exists for that participant user ID",
        ));
    }
    let id = Uuid::new_v4();
    let agreement=sqlx::query_as("INSERT INTO agreements (id,creator_id,participant_id,title,description) VALUES ($1,$2,$3,$4,$5) RETURNING id,creator_id,participant_id,title,description,status,accepted_at,completed_at,created_at").bind(id).bind(creator_id).bind(input.participant_id).bind(input.title.trim()).bind(input.description.trim()).fetch_one(&s.db).await.map_err(internal)?;
    Ok((StatusCode::CREATED, Json(agreement)))
}
async fn list_agreements(
    State(s): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AgreementQuery>,
) -> ApiResult<Json<Vec<Agreement>>> {
    let user = actor(&headers, &s)?;
    if let Some(status) = query.status {
        if status != "open" && status != "completed" {
            return Err(bad("status must be open or completed"));
        }
        let agreements = sqlx::query_as("SELECT id,creator_id,participant_id,title,description,status,accepted_at,completed_at,created_at FROM agreements WHERE (creator_id=$1 OR participant_id=$1) AND status=$2 ORDER BY created_at DESC")
            .bind(user).bind(status).fetch_all(&s.db).await.map_err(internal)?;
        return Ok(Json(agreements));
    }
    let agreements = sqlx::query_as("SELECT id,creator_id,participant_id,title,description,status,accepted_at,completed_at,created_at FROM agreements WHERE creator_id=$1 OR participant_id=$1 ORDER BY created_at DESC")
        .bind(user).fetch_all(&s.db).await.map_err(internal)?;
    Ok(Json(agreements))
}
async fn agreement(
    State(s): State<AppState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> ApiResult<Json<Agreement>> {
    let user = actor(&headers, &s)?;
    sqlx::query_as("SELECT id,creator_id,participant_id,title,description,status,accepted_at,completed_at,created_at FROM agreements WHERE id=$1 AND (creator_id=$2 OR participant_id=$2)")
        .bind(id).bind(user).fetch_optional(&s.db).await.map_err(internal)?
        .map(Json).ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "agreement not found".into()))
}
async fn accept_agreement(
    State(s): State<AppState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> ApiResult<Json<Agreement>> {
    let participant = actor(&headers, &s)?;
    let agreement=sqlx::query_as("UPDATE agreements SET accepted_at=now() WHERE id=$1 AND participant_id=$2 AND accepted_at IS NULL AND status='open' RETURNING id,creator_id,participant_id,title,description,status,accepted_at,completed_at,created_at").bind(id).bind(participant).fetch_optional(&s.db).await.map_err(internal)?.ok_or_else(|| bad("agreement is unavailable, already accepted, or you are not its participant"))?;
    Ok(Json(agreement))
}
async fn complete_agreement(
    State(s): State<AppState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> ApiResult<Json<Agreement>> {
    let user = actor(&headers, &s)?;
    let agreement=sqlx::query_as("UPDATE agreements SET status='completed',completed_at=now() WHERE id=$1 AND (creator_id=$2 OR participant_id=$2) AND status='open' AND accepted_at IS NOT NULL RETURNING id,creator_id,participant_id,title,description,status,accepted_at,completed_at,created_at").bind(id).bind(user).fetch_optional(&s.db).await.map_err(internal)?.ok_or_else(|| bad("agreement must be accepted and open, and you must be a participant"))?;
    Ok(Json(agreement))
}
async fn create_review(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<CreateReview>,
) -> ApiResult<(StatusCode, Json<Review>)> {
    let reviewer = actor(&headers, &s)?;
    validate_review(&input)?;
    let agreement = sqlx::query_as::<_, (Uuid, Uuid, String)>(
        "SELECT creator_id,participant_id,status FROM agreements WHERE id=$1",
    )
    .bind(input.agreement_id)
    .fetch_optional(&s.db)
    .await
    .map_err(internal)?
    .ok_or_else(|| ApiError(StatusCode::NOT_FOUND, "agreement not found".into()))?;
    if agreement.2 != "completed" || (reviewer != agreement.0 && reviewer != agreement.1) {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "only participants may review a completed agreement".into(),
        ));
    }
    let reviewed = if reviewer == agreement.0 {
        agreement.1
    } else {
        agreement.0
    };
    let id = Uuid::new_v4();
    let record=sqlx::query_as("INSERT INTO reviews (id,agreement_id,reviewer_id,reviewed_user_id,rating,review_text) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,agreement_id,reviewer_id,reviewed_user_id,rating,review_text,verification_status,blockchain_transaction,created_at").bind(id).bind(input.agreement_id).bind(reviewer).bind(reviewed).bind(input.rating).bind(input.review_text.trim()).fetch_one(&s.db).await.map_err(|_| ApiError(StatusCode::CONFLICT,"you have already reviewed this agreement".into()))?;
    let verification = match &s.solana {
        Some(config) => {
            submit_verification(
                config.clone(),
                id,
                input.agreement_id,
                reviewer,
                reviewed,
                input.rating,
            )
            .await
        }
        None => Err("Solana verification is not configured on this server".into()),
    };
    let (status, transaction) = match verification {
        Ok(signature) => ("verified", Some(signature)),
        Err(error) => {
            tracing::warn!(review_id = %id, %error, "review verification failed");
            ("failed", None)
        }
    };
    sqlx::query("UPDATE reviews SET verification_status=$1, blockchain_transaction=$2 WHERE id=$3")
        .bind(status)
        .bind(&transaction)
        .bind(id)
        .execute(&s.db)
        .await
        .map_err(internal)?;
    let record = Review {
        verification_status: status.into(),
        blockchain_transaction: transaction,
        ..record
    };
    Ok((StatusCode::CREATED, Json(record)))
}

async fn submit_verification(
    config: SolanaConfig,
    review_id: Uuid,
    agreement_id: Uuid,
    reviewer_id: Uuid,
    reviewed_user_id: Uuid,
    rating: i16,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let payload = format!("trustlayer:v1|review:{review_id}|agreement:{agreement_id}|reviewer:{reviewer_id}|reviewed:{reviewed_user_id}|rating:{rating}");
        let digest = hex::encode(Sha256::digest(payload.as_bytes()));
        let memo = format!("trustlayer:v1:{digest}");
        let payer = read_keypair_file(&config.keypair_path).map_err(|error| format!("could not read Solana signer: {error}"))?;
        let client = RpcClient::new_with_commitment(config.rpc_url, CommitmentConfig::confirmed());
        let instruction = spl_memo::build_memo(memo.as_bytes(), &[&payer.pubkey()]);
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&payer.pubkey()),
            &[&payer],
            client.get_latest_blockhash().map_err(|error| format!("could not get Solana blockhash: {error}"))?,
        );
        client.send_and_confirm_transaction(&transaction).map(|signature| signature.to_string()).map_err(|error| format!("Solana transaction failed: {error}"))
    }).await.map_err(|error| format!("verification task failed: {error}"))?
}
async fn list_reviews(
    State(s): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<ReviewQuery>,
) -> ApiResult<Json<Vec<Review>>> {
    let user = actor(&headers, &s)?;
    match query.scope.as_deref().unwrap_or("received") {
        "received" => sqlx::query_as("SELECT id,agreement_id,reviewer_id,reviewed_user_id,rating,review_text,verification_status,blockchain_transaction,created_at FROM reviews WHERE reviewed_user_id=$1 ORDER BY created_at DESC").bind(user).fetch_all(&s.db).await.map(Json).map_err(internal),
        "given" => sqlx::query_as("SELECT id,agreement_id,reviewer_id,reviewed_user_id,rating,review_text,verification_status,blockchain_transaction,created_at FROM reviews WHERE reviewer_id=$1 ORDER BY created_at DESC").bind(user).fetch_all(&s.db).await.map(Json).map_err(internal),
        _ => Err(bad("scope must be received or given")),
    }
}
async fn verification(State(s): State<AppState>, Path(id): Path<Uuid>) -> ApiResult<Json<Review>> {
    sqlx::query_as("SELECT id,agreement_id,reviewer_id,reviewed_user_id,rating,review_text,verification_status,blockchain_transaction,created_at FROM reviews WHERE id=$1").bind(id).fetch_optional(&s.db).await.map_err(internal)?.map(Json).ok_or_else(|| ApiError(StatusCode::NOT_FOUND,"review not found".into()))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn error_message(result: ApiResult<()>) -> String {
        match result {
            Ok(()) => panic!("expected validation to fail"),
            Err(ApiError(_, message)) => message,
        }
    }

    #[test]
    fn registration_requires_valid_email_password_and_display_name() {
        let valid = Register {
            email: "member@example.com".into(),
            password: "a-long-development-password".into(),
            display_name: "Trust Member".into(),
        };
        assert!(validate_registration(&valid).is_ok());

        let invalid_email = Register {
            email: "not-an-email".into(),
            ..valid
        };
        assert_eq!(
            error_message(validate_registration(&invalid_email)),
            "enter a valid email address"
        );
    }

    #[test]
    fn agreement_cannot_target_creator_or_exceed_limits() {
        let creator = Uuid::new_v4();
        let self_targeted = CreateAgreement {
            participant_id: creator,
            title: "Website redesign".into(),
            description: "A scoped project".into(),
        };
        assert!(
            error_message(validate_agreement(&self_targeted, creator))
                .contains("cannot create an agreement with yourself")
        );

        let too_long = CreateAgreement {
            participant_id: Uuid::new_v4(),
            title: "x".repeat(MAX_AGREEMENT_TITLE_LENGTH + 1),
            description: String::new(),
        };
        assert!(error_message(validate_agreement(&too_long, creator)).contains("1 and 160"));
    }

    #[test]
    fn review_requires_valid_rating_and_bounded_text() {
        let invalid_rating = CreateReview {
            agreement_id: Uuid::new_v4(),
            rating: 6,
            review_text: "Excellent work".into(),
        };
        assert!(validate_review(&invalid_rating).is_err());

        let too_long = CreateReview {
            agreement_id: Uuid::new_v4(),
            rating: 5,
            review_text: "x".repeat(MAX_REVIEW_LENGTH + 1),
        };
        assert!(validate_review(&too_long).is_err());
    }

    #[test]
    fn profile_validation_bounds_public_fields() {
        let valid = UpdateProfile {
            display_name: "Trust Member".into(),
            bio: "A short public biography.".into(),
            wallet_address: Some("ExampleWalletAddress".into()),
        };
        assert!(validate_profile(&valid).is_ok());

        let oversized_bio = UpdateProfile {
            bio: "x".repeat(MAX_BIO_LENGTH + 1),
            ..valid
        };
        assert!(error_message(validate_profile(&oversized_bio)).contains("2,000"));
    }

    #[tokio::test]
    async fn security_headers_prevent_embedding_and_content_sniffing() {
        let response = security_headers(StatusCode::OK.into_response()).await;
        let headers = response.headers();
        assert_eq!(headers.get(X_CONTENT_TYPE_OPTIONS).unwrap(), "nosniff");
        assert_eq!(headers.get(X_FRAME_OPTIONS).unwrap(), "DENY");
        assert_eq!(headers.get(REFERRER_POLICY).unwrap(), "no-referrer");
        assert_eq!(headers.get(CACHE_CONTROL).unwrap(), "no-store");
    }

    #[tokio::test]
    async fn jwt_authentication_rejects_bad_or_missing_tokens() {
        let user_id = Uuid::new_v4();
        let secret = "a-secure-test-secret-that-is-long-enough";
        let state = AppState {
            db: PgPool::connect_lazy("postgres://localhost/not_used").expect("valid lazy URL"),
            jwt_secret: secret.into(),
            solana: None,
        };
        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            format!("Bearer {}", token(user_id, secret))
                .parse()
                .unwrap(),
        );
        assert!(matches!(actor(&headers, &state), Ok(id) if id == user_id));

        headers.insert(AUTHORIZATION, "Bearer invalid".parse().unwrap());
        assert!(matches!(
            actor(&headers, &state),
            Err(ApiError(StatusCode::UNAUTHORIZED, _))
        ));
    }
}

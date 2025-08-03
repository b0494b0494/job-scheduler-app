# プロトタイプ設計・構成概要

## 1. アプリケーションの概要

本プロトタイプは、カジュアル面談のフィードバックを効率的に管理・分析するためのジョブスケジューラーアプリケーションです。特に、LLM（大規模言語モデル）を活用したフィードバックの自動分類機能と、ユーザーの思考を深めるための「壁打ち」機能を提供します。

## 2. 主要コンポーネントと役割

本アプリケーションは、以下の主要なコンポーネントで構成されています。

### 2.1. Frontend (フロントエンド)
- **役割:** ユーザーインターフェースを提供し、ユーザーからの入力（スケジュール登録、フィードバック入力、LLMとの対話など）を受け付け、Backend APIと連携します。
- **技術スタック:** Next.js (React), TypeScript, Material-UI (MUI)

### 2.2. Backend (バックエンド)
- **役割:** フロントエンドからのリクエストを受け付け、データベース操作、およびLLM Serviceへのリクエストの中継を行います。ビジネスロジックを担います。
- **技術スタック:** Node.js (tRPC/Express.js), PostgreSQL (データベース)

### 2.3. LLM Service (Python/FastAPI)
- **Technology:** Python, FastAPI
- **Role:** Provides an API for LLM-related functionalities, such as chat and feedback classification. It acts as an intermediary between the `backend` and the actual LLM server.
- **Communication:** Communicates with `llama-server` for LLM inference. Sends OpenTelemetry traces and logs to `otel-collector`.

### 2.4. Llama Server (Python/llama.cpp)
- **Technology:** Python, llama.cpp (for local LLM inference)
- **Role:** Hosts and serves the large language model (LLM) for inference requests.
- **Communication:** Exposes a REST API for the `llm-service`.

### 2.5. Database (PostgreSQL)
- **Technology:** PostgreSQL
- **Role:** Stores application data, including scheduled jobs and feedback.
- **Communication:** Accessed by the `backend` service.

### 2.6. Observability (OpenTelemetry Collector, Phoenix)
- **Technology:** OpenTelemetry Collector, Phoenix
- **Role:** Collects and processes telemetry data (traces, metrics, logs) from various services. Phoenix provides a UI for visualizing and analyzing LLM-specific traces and logs.
- **Communication:**
    - `llm-service` (and potentially other services in the future) sends OTLP (OpenTelemetry Protocol) data to `otel-collector`.
    - `otel-collector` processes and exports data to `phoenix`.

## 3. Data Flow Example (Job Scheduling)

- **Frontend ↔ Backend:** RESTful APIを通じてHTTP/HTTPS通信を行います。
- **Backend ↔ Database:** BackendがORM (Sequelize) を介してデータベースにアクセスします。
- **Backend ↔ LLM Service:** BackendがHTTPリクエストを介してLLM ServiceのAPIエンドポイントを呼び出します.
- **LLM Service ↔ Llama Server:** LLM ServiceがHTTPリクエスト (`httpx`) を介してLlama ServerのAPIエンドポイントを呼び出し、LLM推論を実行します。
- **LLM Service ↔ OpenTelemetry Collector:** LLM ServiceはOpenTelemetry SDKで計装されており、トレースデータをOTLP (OpenTelemetry Protocol) 形式でOpenTelemetry Collectorに送信します。
- **OpenTelemetry Collector ↔ Phoenix:** OpenTelemetry Collectorは受信したトレースデータを処理し、Phoenixが理解できる形式でPhoenixのOTLPエンドポイントにエクスポートします。

## 4. LLM機能の詳細

LLM Serviceは、以下の2つの主要な機能を提供します。

### 4.1. フィードバック自動分類
- **目的:** ユーザーが入力したフィードバックテキストを、事前に定義されたカテゴリ（感想、魅力点、懸念点、志望度、次のステップ、その他）に自動で分類し、構造化されたJSON形式で返します。
- **APIエンドポイント:** `POST /classify-feedback`
- **LLMモデル:** `mistral-7b-instruct-v0.2.Q2_K.gguf` (GGUF形式)
- **内部処理:** `services/llm_service.py` の `call_llm` 関数を通じてLLMサーバーを呼び出し、`prompts/classify_feedback.py` からロードされたプロンプトを使用します。

### 4.2. 壁打ち機能 (チャット)
ユーザーの思考を深めるための対話型アシスタント機能です。

#### 4.2.1. 壁打ちモード (短文対話)
- **目的:** ユーザーの短い発言に対して、深掘りを促す質問を返します。テンポの良い対話を通じて、ユーザーが自身の考えを整理するのを支援します。
- **APIエンドポイント:** `POST /chat`
- **内部処理:** `services/llm_service.py` の `call_llm` 関数を通じてLLMサーバーを呼び出し、`prompts/chat.py` からロードされたシステムプロンプトを使用します。

#### 4.2.2. 分析モード (長文分析からの対話)
- **目的:** ユーザーが入力した長文のフィードバックテキストをLLMが分析し、その内容に基づいた最初の質問を生成します。
- **APIエンドポイント:** `POST /chat/analyze`
- **内部処理:** このエンドポイントは、バックエンドでLLM Serviceの複数のエンドポイントを**ステップバイステップで順次呼び出す**ことで、複雑な分析と質問生成を実現しています。
    1.  **整形エージェント (`POST /chat/rephrase`):** ユーザーの長文を、意図を損なうことなく、より論理的で読みやすい日本語の文章に再構成します。
        - **内部処理:** `services/llm_service.py` の `call_llm` 関数を通じてLLMサーバーを呼び出し、`prompts/rephrase.py` からロードされたプロンプトを使用します。
    2.  **深掘り質問エージェント (`POST /chat/deep_dive_questions`):** 整形されたテキストに基づき、ユーザーの思考を促す深掘り質問を生成します。
        - **内部処理:** `services/llm_service.py` の `call_llm` 関数を通じてLLMサーバーを呼び出し、`prompts/deep_dive_questions.py` からロードされたプロンプトを使用します。
    3.  バックエンドがこれら2つのエージェントの応答を組み合わせて、最終的な応答を構成し、フロントエンドに返します。

## 5. 開発環境の概要

- **Docker Compose:** Backend, Llama Server, LLM Service, OpenTelemetry Collector, Phoenix, Databaseのコンテナ化と連携を管理します。
- **ローカル開発:** Frontendはローカル環境で直接実行されます。
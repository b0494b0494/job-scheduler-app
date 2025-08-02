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
- **技術スタック:** Node.js (Express.js), PostgreSQL (データベース), `node-fetch` (LLM Serviceとの通信)

### 2.3. LLM Service (LLMサービス)
- **役割:** LLMサーバーへのリクエストを処理し、FastAPIエンドポイントを提供します。LLMモデルのロードや推論は、独立した`llama-server`が担当します。
- **技術スタック:** Python (FastAPI), `httpx` (LLMサーバーとの通信), Uvicorn (ASGIサーバー)
- **内部構造:**
    - `main.py`: FastAPIアプリケーションの初期化、ルーターの登録のみを行う。
    - `routers/`: 各APIエンドポイントの定義と、対応するプロンプトやサービス層の呼び出しを行う。
    - `prompts/`: 各APIエンドポイントで使用されるプロンプト文字列を個別のファイルで管理する。
    - `services/`: LLMサーバーを呼び出す共通のロジックを管理する。

### 2.4. Llama Server (LLMサーバー)
- **役割:** 大規模言語モデルをホスティングし、フィードバックの分類や対話応答の生成といった推論処理を実行します。`llama-cpp-python`の組み込みサーバー機能を利用します。
- **技術スタック:** Python, `llama-cpp-python` (LLM推論ライブラリ), Uvicorn (ASGIサーバー)

### 2.5. OpenTelemetry Collector (OTel Collector)
- **役割:** アプリケーションから送信されるトレース、メトリクス、ログなどのテレメトリデータを受信、処理、エクスポートします。様々なフォーマットに対応し、バックエンドシステムへの橋渡し役となります。
- **技術スタック:** Go (OpenTelemetry Collector Contrib)

### 2.6. Phoenix (可視化ツール)
- **役割:** OpenTelemetry Collectorからエクスポートされたトレースデータを可視化し、LLMの動作やアプリケーション全体のパフォーマンスを分析するためのUIを提供します。
- **技術スタック:** Python (Arize AI Phoenix)

### 2.7. Database (データベース)
- **役割:** スケジュール情報、フィードバックデータなどのアプリケーションデータを永続化します。
- **技術スタック:** PostgreSQL

## 3. コンポーネント間の連携

- **Frontend ↔ Backend:** RESTful APIを通じてHTTP/HTTPS通信を行います。
- **Backend ↔ Database:** BackendがORM (Sequelize) を介してデータベースにアクセスします。
- **Backend ↔ LLM Service:** BackendがHTTPリクエスト (`node-fetch`) を介してLLM ServiceのAPIエンドポイントを呼び出します。
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
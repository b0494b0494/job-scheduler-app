# プロジェクト起動手順

このドキュメントでは、Job Schedulerアプリケーションの各サービスを起動するための手順を説明します。

## Docker Compose を使用したサービス起動 (backend, llm-service, llama-server, db)

`frontend`以外のサービスはDocker Composeを使用して起動します。

1.  **プロジェクトルートディレクトリへ移動**
    ```bash
    cd C:\Users\b0949\Desktop\develop\job-scheduler-app
    ```

2.  **Docker Composeでサービスを起動**
    ```bash
    docker-compose up --build -d
    ```
    *   `up`: サービスを起動します。
    *   `--build`: Dockerfileに変更があった場合や、初めて起動する場合にイメージを再ビルドします。
    *   `-d`: バックグラウンドでサービスを起動します。

    これにより、`backend`、`llm-service`、`llama-server`、`db`サービスが起動します。

## Frontend のローカル起動

FrontendはDocker Composeではなく、ローカル環境で直接起動します。

1.  **frontendディレクトリへ移動**
    ```bash
    cd frontend
    ```

2.  **必要なパッケージのインストール**
    ```bash
    npm install
    ```

3.  **Frontendの起動**
    ```bash
    npm run dev
    ```
    このコマンドを実行すると、Frontend開発サーバーがポート3000で起動します。
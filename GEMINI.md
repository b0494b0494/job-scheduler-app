# Gemini CLI 開発ガイドライン

## LLM Service (Uvicorn) のポート競合防止策

`llm-service` (Uvicorn) を起動する際に、`[Errno 48] address already in use` エラーが発生することがあります。これは、以前に起動した `llm-service` のプロセスが完全に終了しておらず、ポート `8000` を占有したままになっていることが原因です。

この問題を防止し、確実に `llm-service` を再起動するためには、以下のコマンドを使用して既存の `uvicorn` プロセスを終了させてください。

```bash
ps aux | grep "uvicorn main:app" | grep -v "grep" | awk '{print $2}' | xargs kill -9
```

**使用例:**

`llm-service` を再起動する前や、開発作業を終了する際にこのコマンドを実行することで、ポート競合によるエラーを防ぐことができます。

---

## macOS 環境での LLM Service の起動方法

LLM Service をローカルで起動し、検証するための手順は以下の通りです。

1.  **既存の `uvicorn` プロセスの終了**
    ポート競合を避けるため、まず既存の `uvicorn` プロセスを終了します。
    ```bash
    ps aux | grep "uvicorn main:app" | grep -v "grep" | awk '{print $2}' | xargs kill -9
    ```

2.  **依存関係のインストール (初回のみ、または変更があった場合)**
    `llm-service` ディレクトリに移動し、仮想環境をアクティブにしてから依存関係をインストールします。
    ```bash
    cd job-scheduler-app/llm-service
    source ../venv-llm/bin/activate
    pip install -r requirements.txt
    ```

3.  **LLM Service の起動**
    `job-scheduler-app` ディレクトリに戻り、`uvicorn` コマンドを実行して LLM Service をバックグラウンドで起動します。ログは `llm-service/uvicorn_llm_service.log` に出力されます。
    ```bash
    cd .. # job-scheduler-app ディレクトリに移動
    source venv-llm/bin/activate && uvicorn llm-service.main:app --host 0.0.0.0 --port 8000 > llm-service/uvicorn_llm_service.log 2>&1 &
    ```
    これにより、LLM Service は `http://0.0.0.0:8000` で利用可能になります。

4.  **起動ログの確認**
    サービスが正常に起動したか確認するには、ログファイルの内容を確認します。
    ```bash
    cat llm-service/uvicorn_llm_service.log
    ```

---

## Windows 環境での LLM Service の起動方法 (仮)

**注: このセクションはまだ動作確認が完了していません。**

Windows環境、特にゲーミングPCのような高性能な環境でLLM Serviceを起動し、GPUを活用するための手順は以下の通りです。

1.  **既存の `uvicorn` プロセスの終了**
    ポート競合を避けるため、まず既存の `uvicorn` プロセスを終了します。
    ```bash
    # PowerShellの場合
    Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
    # または、タスクマネージャーから手動で終了
    ```

2.  **仮想環境の作成とアクティベート**
    `job-scheduler-app` ディレクトリに移動し、Pythonの仮想環境を作成してアクティベートします。
    ```bash
    cd job-scheduler-app
    python -m venv venv-llm
    .\venv-llm\Scripts\activate
    ```

3.  **`llama-cpp-python` (DirectML対応版) のインストール**
    AMD GPU (Radeon RX 7700など) を活用するために、DirectML対応版の `llama-cpp-python` をインストールします。
    既存の `llama-cpp-python` がインストールされている場合は、一度アンインストールしてからインストールします。
    ```bash
    pip uninstall llama-cpp-python -y
    pip install llama-cpp-python[all] --extra-index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple/
    ```
    **注:** 上記コマンドでエラーが発生する場合や、最新のインストール手順については、`llama-cpp-python` の公式ドキュメント（特にDirectMLに関するセクション）を参照してください。

4.  **残りの依存関係のインストール**
    `requirements.txt` に記載されている残りの依存関係をインストールします。
    ```bash
    pip install -r llm-service/requirements.txt
    ```

5.  **LLM Service の起動**
    `job-scheduler-app` ディレクトリで `uvicorn` コマンドを実行して LLM Service をバックグラウンドで起動します。ログは `llm-service/uvicorn_llm_service.log` に出力されます。
    ```bash
    # PowerShellの場合
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c venv-llm\Scripts\uvicorn llm-service.main:app --host 0.0.0.0 --port 8000 > llm-service\uvicorn_llm_service.log 2>&1" -NoNewWindow
    # または、手動でコマンドプロンプトを開き、仮想環境をアクティベートしてから実行
    # .\venv-llm\Scripts\activate
    # uvicorn llm-service.main:app --host 0.0.0.0 --port 8000 > llm-service\uvicorn_llm_service.log 2>&1 &
    ```
    これにより、LLM Service は `http://0.0.0.0:8000` で利用可能になります。

6.  **起動ログの確認**
    サービスが正常に起動したか確認するには、ログファイルの内容を確認します。
    ```bash
    # PowerShellの場合
    Get-Content llm-service\uvicorn_llm_service.log
    ```

---

## プロジェクト構成の理解と活用

`ARCHITECTURE.md` に記載されているプロジェクトの設計と構成を理解しました。これにより、今後の開発作業において、各コンポーネントの役割、技術スタック、連携方法、およびLLM機能の詳細（壁打ちモード、分析モード、使用モデルなど）を考慮した上で、より的確なサポートを提供できます。

特に、LLM Serviceがホストマシン上で実行され、Backendから`http://host.docker.internal:8000`でアクセスされる点、および`mistral-7b-instruct-v0.2.Q4_K_M.gguf`モデルを使用している点を把握しています。

この情報は、問題の診断、機能追加の提案、コード修正の際に常に考慮されます。
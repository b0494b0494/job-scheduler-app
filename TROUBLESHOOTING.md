## LLM Service トラブルシューティングノート

### 既知の問題と対策

#### 1. メモリ不足エラー (`Insufficient Memory`, `llama_decode returned -3`)

**現象:**
LLM Serviceの起動時、または推論実行時に`Insufficient Memory`や`llama_decode returned -3`といったエラーが発生し、サービスがクラッシュする。ログには`ggml_metal_graph_compute: command buffer 1 failed with status 5`のようなMetal関連のエラーが出力されることがある。

**原因:**
`llama-cpp-python`がLLMモデルのロードや推論を行う際に、GPU（特にApple SiliconのMetal）のメモリが不足しているため。`n_gpu_layers=-1`（全レイヤーをGPUにオフロード）の設定が、利用可能なGPUメモリを超過している可能性がある。また、`n_ctx`（コンテキスト長）が大きい場合もメモリ消費が増大する。

**対策:**
1.  **`n_gpu_layers`の調整:**
    `llm-service/services/llm_service.py`内の`Llama`インスタンス初期化時、`n_gpu_layers`の値を調整する。
    *   `n_gpu_layers=0`: 全てのレイヤーをCPUで実行する（GPUを使用しない）。これにより、GPUメモリ不足は解消されるが、推論速度は低下する可能性がある。
    *   `n_gpu_layers`に具体的な数値を指定: GPUにオフロードするレイヤー数を制限する。例えば、`n_gpu_layers=10`など。最適な値は環境とモデルによって異なるため、試行錯誤が必要。
2.  **`n_ctx`（コンテキスト長）の削減:**
    `llm-service/services/llm_service.py`内の`Llama`インスタンス初期化時、`n_ctx`の値を減らす。デフォルトの`2048`は比較的大きいため、`512`や`1024`など、より小さい値に設定することでメモリ使用量を削減できる。

#### 2. モデルパスの誤認識エラー (`Model not found at ...`)

**現象:**
LLM Service起動時に`Model not found at /Users/.../llm-service/services/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf`のようなエラーが発生し、モデルファイルが見つからない。

**原因:**
`llm-service/services/llm_service.py`内でモデルパスを構築する際の相対パス指定が誤っているため。`script_dir`が`llm-service/services/`を指す場合、`models`ディレクトリは`llm-service/`直下にあるため、`os.path.join(script_dir, "models", ...)`では`llm-service/services/models/`を探してしまう。

**対策:**
`llm-service/services/llm_service.py`内の`default_model_path`の定義を以下のように修正する。
```python
# servicesディレクトリから一つ上の階層のmodelsディレクトリを参照
default_model_path = os.path.join(script_dir, "..", "models", "mistral-7b-instruct-v0.2.Q4_K_M.gguf")
```

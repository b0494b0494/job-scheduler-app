#!/bin/bash

# 仮想環境をアクティベート
source /Users/yusukematsumoto/Desktop/my_develop/schedule/venv-llm/bin/activate

# uvicornを起動
uvicorn main:app --host 0.0.0.0 --port 8000 &
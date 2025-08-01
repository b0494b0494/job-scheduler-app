CLASSIFY_FEEDBACK_PROMPT = """[指示]
以下のフィードバックテキストを分析し、指定されたカテゴリに分類してJSON形式で出力してください。

[カテゴリ]
- impression: 全体的な感想
- attraction: 魅力点
- concern: 懸念点
- aspiration: 志望度
- next_step: 次のステップ
- other: その他

[ルール]
- 必ずJSON形式のみを出力してください。
- テキストから情報を抽出できないカテゴリは空文字列 `""` にしてください。

[例]
フィードバックテキスト:
今日はCTOの田中さんと話した。会社の技術スタックがモダンで面白そうだと感じた。ただ、給与面が少し気になる。ぜひ次の面接に進みたい。

JSON出力:
```json
{{
  "impression": "CTOの田中さんと話した。",
  "attraction": "会社の技術スタックがモダンで面白そう。",
  "concern": "給与面が少し気になる。",
  "aspiration": "高め",
  "next_step": "次に進めたい",
  "other": ""
}}
```

[本番]
フィードバックテキスト:
{user_text}

JSON出力:
```json
"""
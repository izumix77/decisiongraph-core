# DecisionGraph Core — ロードマップ

DecisionGraph Core は、人間の意思決定をグラフ資産として記録・検証・再現する決定論的カーネルです。
目的は機能追加ではなく、長期的な構造的安定性の確保です。

---

## Phase 0 — 概念基盤

**ステータス:** ✅ 完了

- 決定論的挙動 / 再現可能な状態
- AI 推論なし / 確率論的ロジックなし
- 明確な境界: Core ≠ Schema ≠ IO ≠ CLI
- 原則: カーネルは決定を行わず、検証と再現のみを担当

成果物: README、Constitution ドキュメント

---

## Phase 1 — 構造的インフラ

**ステータス:** ✅ 完了

- 安定した monorepo + TypeScript プロジェクト参照
- 開発時の型チェックとビルド出力の分離
- `src/` 下に生成物なし
- ルートグラフの検証と CI `tsc -b`
- 環境整合性: macOS / Windows, Node 20.x, pnpm 9.x

保証: 再現可能なビルド、決定論的依存関係、CI/ローカルの整合性

---

## Phase 2 — コア成熟度 & 不変条件

**ステータス:** ✅ 完了
(バイパス不可の不変条件が適用済み)

### 達成事項
- Constitution v0.2 を確定、仕様先行で実装
- バイパス不可の憲法適用:
  - `apply/applyBatch` は呼び出しポリシー前に Constitution を適用
  - `lint` は呼び出しポリシー前に Constitution を適用
- コミット後の不変性 + 単一コミットルールを適用
- 実行時語彙の適用: NodeStatus / EdgeStatus / EdgeType
- ID 一意性の適用: node.id / edge.id / commitId
- 違反の重大度を導入、決定論的エラー分類
- ゴールデンフィクスチャ (≥10) に決定論的 `replayAt` スナップショットを含む

> Constitution は実行可能な法である

### 明示的な非ゴール (Phase 2)
- パフォーマンス最適化、ストレージ実装
- 保証を弱める便利 API
- 表面上の機能拡張

---

## Phase 3a — マルチグラフカーネル

**ステータス:** 🟡 設計中
**権限:** Constitution v0.3 (DRAFT)

### 背景

CLI 検証中に、コミット済みグラフ間のクロスファイル (`depends_on`) 参照が `IMMUTABLE_AFTER_COMMIT` として拒否される設計上の制約が判明しました。
これにより、単一グラフモデルでは DecisionGraph のコアユースケースが満たせないことがわかりました:

> 「誰が、どの前提の下で何を決定したか、それが他の決定とどう関係するか？」

クロスグラフ参照は回避策ではなく、必須の機能です。

### 目標

- `GraphStore` をトップレベルコンテナとして導入
- `resolveNode(id)` / `resolveEdge(id)` をカーネル操作として実装
- クロスグラフエッジ対応: `Edge.from` / `Edge.to` は他グラフノードを参照可能
- クロスグラフエッジ検証: 解決不能な場合は `EDGE_NOT_RESOLVED`
- グラフ境界をまたぐ循環依存検出
- グラフ単位のコミット不変性保持
- 単一グラフ (v0.2) 操作との完全互換性保持

### 成果物

- Constitution v0.3 (DRAFT → 確定)
- `GraphStore` 型および操作 (`@decisiongraph/core`)
- `applyBatch` / `lint` の更新、GraphStore 対応
- クロスグラフ循環依存検出
- Migration Guide v0.2 → v0.3
- クロスグラフシナリオ用ゴールデンフィクスチャ

### 保持される不変条件

- コミット後のグラフ単位不変性は変更なし
- Supersession モデル (`supersede_edge`) は変更なし
- Node / Edge / Commit スキーマは変更なし
- 単一グラフの GraphStore は v0.2 完全互換

---

## Phase 3b — ポリシー境界 & 拡張安全性

**ステータス:** ⚪ 計画中

- ポリシーロジックがカーネルを侵食しないように維持
- ドメインポリシーを外部化 (例: `@decisiongraph/policies`)
- ポリシー互換性およびバージョン境界 (Core / Schema / IO) を明文化
- 拡張パッケージが憲法上の保証を弱めないようにする
- Core は構造・責任・再現性を定義し、意味は定義しない

---

## Phase 4 — エコシステム & ツール

**ステータス:** 🟡 進行中

- CLI の洗練 (抽象漏れなし)
  - ✅ `traverse <directory>` — 違反のツリー表示と依存チェーン可視化
  - ✅ `DEPENDENCY_ON_SUPERSEDED` 検出 (Constitution Section 6)
  - ✅ Cross-graph 違反のレンダリング (`payload` ベースのチェーントレース)
  - ✅ `DEPENDENCY_ON_DEPRECATED` 検出 (Constitution Section 6、WARN)
  - ✅ `--strict` フラグ — WARN を ERROR として扱う
- 可視化 / 解析ツール
- 統合例 (ClaimAtom, TraceOS)

全てのツールは Core の外側に配置する必要があります。

---

## 永続的非ゴール (常に)

AI 推論、確率的挙動、ワークフローエンジン、権限システム、組織固有ロジック、UI/UX は含まれません。
これらは上位層に属します。

---

## 指針

> DecisionGraph Core はインフラストラクチャである。
> 退屈であることは美徳、予測可能性は必須。
> すべての変更は決定論を強化するものでなければならない。

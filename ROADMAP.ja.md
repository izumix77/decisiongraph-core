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

**ステータス:** ✅ 完了

### 達成事項

- Constitution v0.3 確定
- `GraphStore` をトップレベルコンテナとして導入
- `graphId` を全 Graph およびログファイルで必須化
- ID 一意性を GraphStore 全体で適用 (node.id / edge.id / commitId)
- クロスグラフエッジ対応: `Edge.from` / `Edge.to` が他 Graph のノードを参照可能
- 解決不能なクロスグラフ参照に `EDGE_NOT_RESOLVED` を適用
- グラフ境界をまたぐ循環依存検出 (DFS)
- グラフ単位のコミット不変性を保持
- 単一グラフ (v0.2) 操作との完全互換性
- ストア全体のクロスグラフ検証に `lintStore` を追加
- `resolveNode` / `resolveEdge` をカーネルのファーストクラス操作として実装
- Migration Guide v0.2 → v0.3

---

## Phase 3b — ポリシー境界 & 拡張安全性

**ステータス:** ⚪ 計画中

- ポリシーロジックがカーネルを侵食しないように維持
- ドメインポリシーを外部化 (例: `@decisiongraph/policies`)
- ポリシー互換性およびバージョン境界 (Core / Schema / IO) を明文化
- 拡張パッケージが憲法上の保証を弱めないようにする
- Core は構造・責任・再現性を定義し、意味は定義しない

---

## Phase 3c — トポロジー導出による状態モデル

**ステータス:** ✅ 完了
**権限:** Constitution v0.4 RC

### 背景

v0.3 では `Superseded` を Node の属性として保存していた。これはカテゴリエラーである。
Node は命題であり、命題は自身の否定や置換状態を内包できない。
Supersession は Node 間の関係であり、個々の Node の属性ではない。

### 達成事項

- Constitution v0.4 RC 確定
- `Node.status` を削除 — Node はライフサイクル状態を持たない
- `effectiveStatus(store, nodeId)` を純粋なトポロジー導出として導入
- `Deprecated` および `overrides` を Core 語彙から除去
- `EdgeStatus` をバイナリに簡略化: `Active | Superseded`
- `SELF_LOOP` 検出を追加 (`from === to` → ERROR)
- `supersedes` の循環を `CIRCULAR_DEPENDENCY` として検出
- `Policy` インターフェースを GraphStore ベースのシグネチャに更新
- `replay` / `replayAt` → `GraphLog[]` → `GraphStore`（ストア全体の境界モデル）
- `diffStore()` を追加
- `supersede_edge` のアトミック性をテストスイートで形式化・証明
- ゴールデンフィクスチャ v0.4 (pass: 7件、fail: 6件)
- Migration Guide v0.3 → v0.4
- JSON Schema v0.4 (op ごとの discriminated union、`Node.status` を禁止)
- README に導出状態モデルおよび replay 順序契約を追記

### 保持された不変条件

- v0.3 の全憲法的保証を維持 (著者性・不変性・決定論性)
- 単一グラフの GraphStore は引き続き完全に有効
- Node / Edge / Commit スキーマは構造的に互換 (Node.status 削除のみが破壊的変更)

---

## Phase 3b — ポリシー境界 & 拡張安全性（再掲）

> Phase 3c 完了後の次の優先フェーズ。

- ポリシーロジックとカーネルの境界を明文化
- ドメインポリシーパッケージの設計
- 拡張が Constitution を弱めないことの保証メカニズム

---

## Phase 4 — エコシステム & ツール

**ステータス:** 🟡 進行中

- CLI の洗練 (抽象漏れなし)
  - ✅ `traverse <directory>` — 違反のツリー表示と依存チェーン可視化
  - ✅ `DEPENDENCY_ON_SUPERSEDED` 検出 (Constitution Section 6)
  - ✅ Cross-graph 違反のレンダリング (`payload` ベースのチェーントレース)
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

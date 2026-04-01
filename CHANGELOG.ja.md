# 変更履歴

このプロジェクトに対するすべての主要な変更はこのファイルに記録されます。

## [0.4.6] - 2026-04-02

### 修正
- `@decisiongraph/cli`: `validate`, `lint`, `replay`, `diff` コマンドの `JSON.parse` を try/catch でラップ — 不正なJSON入力時に生のスタックトレースが露出しなくなり、ファイルパス付きのユーザーフレンドリーなエラーメッセージを返すように改善

---

## [0.4.5] - 2026-03-20

### 修正
- `@decisiongraph/cli`: `lint <directory>` と `traverse` での違反の重複表示 — `lintStore` が内部ポリシーと呼び出し元ポリシーの両方で `ConstitutionalPolicy` を使用していたため、ストアレベルの違反が二重に表示されていた

### 変更
- パッケージ更新:
  - `@decisiongraph/cli@0.1.6`

---

## [0.4.4] - 2026-03-20

### 修正
- `@decisiongraph/schema`: `package.json` に `files` フィールドを追加 — npm パブリッシュ時に `schemas/` ディレクトリが欠落していた
- `@decisiongraph/schema`: v0.4 スキーマを完全実装にアップグレード — 型付き判別共用体（`AddNodeOp` / `AddEdgeOp` / `SupersedeEdgeOp` / `CommitOp`）と `Node.status` 禁止（`"not": {}`）をスキーマ層で強制
- `@decisiongraph/io-json` / `@decisiongraph/cli`: `workspace:*` 依存関係がパブリッシュ時に解決されていなかった — 明示的なバージョン範囲に置換
- `@decisiongraph/cli`: `cmdLint` が `emptyStore()` ではなく `emptyGraph(graphId)` を使用するように修正 — ops 適用前にグラフが存在する必要がある
- `@decisiongraph/cli`: `cmdLintDir` が `applyBatch` 前にストア内の各グラフを初期化するように修正
- `@decisiongraph/schema`: v0.4 JSON Schema を追加（`schemas/v0.4/decision.schema.json`）
- `@decisiongraph/io-json`: `version.ts` を更新 — `SUPPORTED_VERSIONS` に `"0.4"` を追加、`CURRENT_SCHEMA_VERSION` を `"0.4"` に設定
- `decisions/demo.json` を v0.4 フォーマットに更新（`version: "0.4"`、`graphId` を追加）
- CI `decision-lint.yml`: `pnpm install`（旧 `pnpm -w install`）でワークスペース全体を解決
- すべてのワークスペース依存を `workspace:*` に統一し、CI での turbo ビルド順序を一貫化

### 変更
- パッケージ更新:
  - `@decisiongraph/schema@0.2.2`
  - `@decisiongraph/io-json@0.2.2`
  - `@decisiongraph/cli@0.1.5`
  - `@decisiongraph/core@0.4.2`
  - `@decisiongraph/schema@0.2.0`
  - `@decisiongraph/io-json@0.2.0`
  - `@decisiongraph/cli@0.1.3`

---

## [0.4.3] - 2026-03-05

### 変更
- **破壊的変更**: `Node.status` を削除 — 置換状態は `effectiveStatus(store, nodeId)` によるトポロジー導出に変更
- **破壊的変更**: `NodeStatus` 型を公開APIから削除
- **破壊的変更**: `EdgeStatus` をバイナリに簡素化: `"Active" | "Superseded"`（`"Deprecated"` を削除）
- **破壊的変更**: `EdgeType` から `"overrides"` を削除 — 置換関係には `"supersedes"` を使用
- **破壊的変更**: `supersede_node` op を削除 — 置換は `supersedes` エッジのみで表現
- **破壊的変更**: `DEPENDENCY_ON_DEPRECATED` 違反コードを削除（ノードの Deprecated ステータス削除に伴い）
- **破壊的変更**: すべてのカーネル関数が `GraphStore` + `GraphId` を要求するように変更

### 追加
- `effectiveStatus(store, nodeId): "Active" | "Superseded"` — トポロジー導出、ノード置換状態の唯一の権限
- `SELF_LOOP` 違反コード — ノードから自身へのエッジを拒否
- `supersede_edge` の原子性保証 — 旧エッジの Superseded マーク付けと新エッジの追加を単一操作で実行
- `ResolvedNode` / `ResolvedEdge` 型を `@decisiongraph/core` からエクスポート
- `emptyGraph(graphId)` ヘルパー（単一グラフのストア初期化用）
- ゴールデンフィクスチャ C01〜C20（v0.4 の全憲法不変条件をカバー）
- `io-json/decode.ts` を v0.4 に更新（Node.status 削除、supersede_node 削除）

### 修正
- `fixtures.test.ts`: ops 適用前にグラフが存在するよう `emptyGraph(graphId)` でストアを初期化
- すべての v0.2 ゴールデンフィクスチャを v0.4 フォーマットに更新（node.status 削除、edge.status 追加）
- `core.test.ts`: すべてのテストデータから node.status を削除

### 変更
- パッケージ更新:
  - `@decisiongraph/core@0.4.2`
  - `@decisiongraph/io-json@0.2.0`

---

## [0.4.2] - 2026-03-02

### 修正
- `@decisiongraph/cli`: npm パブリッシュ用に `workspace:*` 依存関係を明示的バージョンに解決
- `@decisiongraph/io-json`: npm パブリッシュ用に `workspace:*` 依存関係を明示的バージョンに解決
- ルートに `.npmrc` を追加（`link-workspace-packages=false`）— パブリッシュパッケージへの `workspace:*` 漏洩を防止

### 変更
- `scripts/validate-decisions.mjs`: v0.3 GraphStore API に更新（`emptyStore`、`applyBatch(store, graphId, ops, policy)`）
- `scripts/validate-decisions.mjs`: ANSI カラー出力を追加（`NO_COLOR` / `--no-color` 対応）
- `scripts/validate-decisions.mjs`: 全ファイル適用後に `lintStore` を呼び出し、`DEPENDENCY_ON_SUPERSEDED` と `DEPENDENCY_ON_DEPRECATED` を検出
- README: クイックスタートセクションを追加（CLI ファースト）
- README_ja: クイックスタートセクションを追加
- ROADMAP: Phase 3b の重複セクションを削除、Phase 4 CLI 項目を更新

### 変更
- パッケージ更新:
  - `@decisiongraph/io-json@0.1.1`
  - `@decisiongraph/cli@0.1.2`

---

## [0.4.1] - 2026-03-01

### 追加
- `DEPENDENCY_ON_DEPRECATED` 違反コード（Constitution Section 6、severity: WARN）
- CLI `--strict` フラグ — WARN を ERROR として扱う

### 変更
- パッケージ更新:
  - `@decisiongraph/core@0.4.1`
  - `@decisiongraph/cli@0.1.0`（初回パブリッシュ）

---

## [0.3.1] - 2026-02-27

### 変更
- **破壊的変更**: `Graph` に `graphId` が必須に
- **破壊的変更**: `applyBatch`、`lint`、`replay` のシグネチャを `GraphStore` と `GraphId` を受け取るように更新
- **破壊的変更**: すべてのID（`NodeId`、`EdgeId`、`CommitId`）が GraphStore 全体で一意に

### 追加
- `GraphStore` をトップレベルコンテナとして導入（`GraphStore = one world`）
- `GraphId` ブランド型
- `lintStore` — ストア全体のクロスグラフバリデーション
- `resolveNode` / `resolveEdge` をファーストクラスのカーネル操作として追加
- `EDGE_NOT_RESOLVED` 違反コード — 解決不能なクロスグラフ参照用
- `CIRCULAR_DEPENDENCY` 違反コード（グラフ境界を越えた DFS）
- `DEPENDENCY_ON_SUPERSEDED` 違反コード（Constitution Section 6）
- CLI `traverse <directory>` コマンド（違反ツリー表示付き）
- `Violation.payload` — 構造化されたコンテキスト（`fromNodeId`）
- `traceDependencyPath` カーネル関数（チェーン走査用）

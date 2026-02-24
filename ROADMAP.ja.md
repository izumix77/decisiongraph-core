# DecisionGraph Core – ロードマップ（日本語・改訂版）

このドキュメントは **DecisionGraph Core** の開発ロードマップを示します。
目的は機能追加ではなく、**決定論的な判断カーネルとしての長期的な構造安定性**です。

---

## Phase 0 — 概念・思想の確立（完了）

**ステータス:** ✅ 完了

### 内容

- コア思想の確立

    - 決定論的であること

    - 状態を再生（Replay）可能であること

    - AIによる推論を行わない

    - 確率・ヒューリスティックを用いない

- 明確な責務分離

    - Core ≠ Schema ≠ IO ≠ CLI

- 「Kernel は判断しない。検証し、再生するのみ」という原則


### 成果物

- README.md（Non-goals / パッケージ境界）

- Constitution / 哲学ドキュメント（概念層）


---

## Phase 1 — 構造基盤の確立（完了）

**ステータス:** ✅ 完了

このフェーズでは、プロジェクトを**構造的に信用できる状態**にすることを目的としました。

### 達成事項

- モノレポ構造の安定化

- TypeScript Project References の完全導入

- dev用型チェックと build用 emit の明確な分離

- `src/` 配下に生成物を置かない構成の確立

- ルート `tsconfig.json` による全体グラフ検証

- CI で `tsc -b` を実行し、構造破壊を防止

- macOS / Windows 間での環境一致確認

- Node.js 20.x / pnpm 9.x 固定


### このフェーズで保証されたこと

- 再現可能なビルド

- 決定論的な型依存グラフ

- 暗黙的依存の排除

- ローカルと CI の挙動一致


このフェーズは、プロジェクトの
**「荷重を支える骨格（load-bearing skeleton）」** を確立しました。

---

## Phase 2 — Core の成熟と不変条件（進行中）

**ステータス:** 🟡 進行中（非バイパス不変条件は達成済み）

目的は、**表面積を増やさずに意味的正しさを強化すること**です。

---

### すでに達成されている事項

- Constitution v0.2 の確定

- 「実装より仕様が上位」という秩序の確立

- Commit immutability の非バイパス強制（apply / lint 両方）

- Policy injection による Constitution 回避の排除

- append-only 制約の kernel 強制

- runtime vocabulary enforcement

    - NodeStatus

    - EdgeStatus

    - EdgeType

- Violation に severity 導入

- deterministic error 分類の確立

- 複数 commit の禁止（single-commit 制約）

- ID 重複検知（node / edge / commit）


---

### Exit Criteria

Phase 2 は「完成」ではなく、
**上位レイヤーが安心して構築できる地盤完成**を意味します。

---

#### A) 最小シナリオの往復保証

- Node / Edge 作成

- Operation apply

- commit 作成

- replay(asOf) による復元


**ステータス:** 🟡 部分達成（Golden fixture 未整備）

---

#### B) 不変条件がバイパス不能

- commit 後 mutation 不可

- policy による回避不可

- append-only 破壊不可


**ステータス:** ✅ 完了
（ConstitutionalPolicy が常に apply / lint で先行実行）

---

#### C) 失敗が deterministic に分類される

- 不変条件違反は必ず ERROR

- violation code が安定

- 出力が環境差で変化しない


**ステータス:** ✅ 完了

---

#### D) Golden Test が存在する

- JSON fixture ≥ 10

- apply → commit → replay 往復確認

- CI 実行


**ステータス:** 🔲 未着手

---

### 明確な非目標（Phase 2）

- パフォーマンス最適化

- ストレージ実装追加

- 便利 API の導入

- 抽象の緩和


---

Phase 2 完了時、DecisionGraph Core は：

> **制度として破壊不能な最小判断カーネル**

になります。

---

## Phase 3 — Policy と拡張境界の確立（将来）

**ステータス:** ⚪ 計画中

目的は、**将来的な複雑性崩壊を防ぐこと**です。

### 想定内容

- policy の外部化検討

    - `@decisiongraph/policies`

- Policy 互換性ルール明確化

- Core / Schema / IO のバージョン関係整理

- 拡張ポイントの固定


これは、**長期保守性の防波堤**です。

---

## Phase 4 — エコシステム・周辺ツール（将来）

**ステータス:** ⚪ 下流フェーズ

目的は、Core 外側の使いやすさ向上です。

- CLI 改善（抽象漏洩禁止）

- 可視化ツール

- ClaimAtom / TraceOS 連携例


※ すべて Core の外側に置く

---

## 恒久的な非目標（Always）

DecisionGraph Core は一貫して以下を行いません：

- AI 推論

- 確率的挙動

- ワークフローエンジン

- 権限管理

- 組織依存ロジック

- UI


---

## 指導原則

> DecisionGraph Core はインフラである。
> 退屈であることは美徳であり、
> 予測可能性は必須条件である。
>
> すべての変更は、
> 決定論性を強化するものでなければならない。

---

- English roadmap: [ROADMAP.md](./ROADMAP.md)
- 日本語ロードマップ: [ROADMAP.ja.md](./ROADMAP.ja.md)

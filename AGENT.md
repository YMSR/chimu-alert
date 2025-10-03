# AGENT.md

## 0. プロジェクト定義
- **サービス名（仮）**：{{ SERVICE_NAME }}（例：ChimuAlert / ちむアラート）
- **タグライン**：見逃さないための“候補通知”。ビジネスとご縁を守る。
- **主目的**：沖縄の告別・訃報文化に即し、**登録した氏名に一致“する可能性がある”訃報**をアラートとして通知し、見逃しを減らす。
- **初期リリース範囲**：**Webアプリ（PWA対応）**＋**メール通知**。のちに LINE Notify 追加可。
- **初期ユーザー**：40–60代ビジネスマン／中高年利用者の家族（代理設定）
- **収益化（検証）**：月額¥100–¥300 個人サブスク（将来：B2B/新聞社ライセンス）

---

## 1. コア価値／非機能要件
- **価値**：  
  - 「断定」ではなく**候補通知**で“気づき”を与える  
  - **喪主名／地域／享年**などの文脈付きでユーザーが最終判断
- **非機能**：  
  - A11y: WCAG 2.1 AA 相当（文字サイズ/コントラスト/キーボード操作）  
  - パフォーマンス: 初回 LCP < 2.5s（4G相当/ミドル端末）  
  - セキュリティ: パスワードハッシュ（Argon2/Bcrypt）、CSRF対策、HTTPS 前提  
  - プライバシー: 最小限収集（名前・メール）、削除機能、ログ最小化

---

## 2. ペルソナ & トーン
- **ペルソナA：営業部長（50代・那覇）**  
  - ニーズ：取引先・OBの訃報見逃し防止、香典/弔電の迅速対応  
  - KPI：見逃しゼロ、通知の“的外れ感”が低い  
- **ペルソナB：娘/息子（30代）**  
  - ニーズ：親のために代理設定、家族LINEに通知を流す  
- **トーン**：慎み・簡潔・断定回避（例：「候補のお知らせ」「ご確認ください」）

---

## 3. MVP機能スコープ（必須）
1) **アカウント作成／ログイン**（Email/Password）  
2) **氏名登録**（複数可、漢字＋かな任意、ON/OFFスイッチ）  
3) **データ投入（管理専用）**  
   - シード：CSVインポート（`date,deceased_name,related_names,region,age,source_url`）  
   - 当面は**手動/CSV**のみ（スクレイピング等は行わない）  
4) **名寄せ照合（バッチ/トリガー）**  
   - ルール初期：  
     - ①漢字完全一致 or ②かな一致  
     - 全角/半角・空白は正規化  
   - マッチ発生時に**通知キュー**へ積む  
5) **通知送信（メール）**  
   - 文面は「候補通知」フォーマット（下記 §11）  
   - 通知履歴をユーザー別に保持（件名/時刻/候補数/レコードID）  
6) **設定**  
   - 通知頻度：即時 / 1日まとめ  
   - 退会・データ削除（即時反映）  
7) **静的ページ**  
   - LP（価値提案/スクショ）  
   - 料金（サブスク実験はv2で）  
   - 利用規約 / プライバシーポリシー（ドラフト同梱）  
   - お問い合わせフォーム（メール送信のみ）

> **非スコープ（MVPではやらない）**：新聞紙面の自動取得/OCR、LINE友だち自動照合、故人情報の断定通知

---

## 4. 情報設計／サイトマップ
```
/                 … ランディング（価値・特徴・CTA）
/app              … 認証ゲート
/app/dashboard    … 登録名一覧・通知履歴（直近10件）
/app/names        … 氏名の追加/編集/ON-OFF
/app/settings     … 通知頻度・退会
/admin/ingest     … CSVアップロード（管理者のみ）
/legal/tos        … 利用規約
/legal/privacy    … プライバシーポリシー
/contact          … お問い合わせ
```

---

## 5. UIコンポーネント（最小）
- Header（ロゴ/ログイン/言語JP-EN切替）  
- 名簿Card（氏名、かな、ON/OFF、削除）  
- 通知履歴List（日時・候補件名・「詳細」）  
- CSVアップローダ（.csv、ドラッグ&ドロップ）  
- モーダル（候補詳細：故人名/喪主/地域/享年/出典URL）  
- Toast（登録完了/エラー）  
- フォーム入力（バリデーション：必須/最大長/かな）

---

## 6. スタイルガイド
- フォント：Noto Sans JP（本文）, Inter（英）  
- カラー：  
  - Primary：#1F2937（Gray-800）  
  - Accent：#2563EB（Blue-600）  
  - Background：#F9FAFB（Gray-50）  
  - Feedback：注意 #F59E0B（Amber-500）, 成功 #10B981（Emerald-500）  
- 角丸：`rounded-2xl`, 影：`shadow-lg`

---

## 7. 技術選定（推奨）
- **Next.js 14+/App Router + TypeScript**  
- **Auth**：NextAuth（Email/Password or Magic Link）  
- **DB**：PostgreSQL（Supabase/Neon）  
- **ORM**：Prisma  
- **Queue/Jobs**：Inngest or simple cron（Vercel Cron）  
- **Mail**：Resend/SendGrid（開発はMailhog）  
- **デプロイ**：Vercel（環境：`preview`/`production`）  
- **監視**：Vercel Analytics + Sentry

環境変数（例）：
```
DATABASE_URL=
NEXTAUTH_SECRET=
EMAIL_SERVER_API_KEY=
EMAIL_FROM="alerts@{{domain}}"
ADMIN_EMAILS="you@example.com"
```

---

## 8. データモデル（初期）
```prisma
model User {
  id           String  @id @default(cuid())
  email        String  @unique
  hash         String
  createdAt    DateTime @default(now())
  names        Name[]
  notifications Notification[]
  settings     UserSettings?
}

model Name {
  id        String  @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  kanji     String
  kana      String?
  enabled   Boolean @default(true)
  createdAt DateTime @default(now())
}

model Obituary {
  id        String   @id @default(cuid())
  date      DateTime
  deceased  String
  related   String?   // comma-separated
  region    String?
  age       Int?
  sourceUrl String?
  createdAt DateTime  @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  nameId    String
  obituaryId String
  sentAt    DateTime
  channel   String   // "email"
  summary   String?
}

model UserSettings {
  userId   String  @id
  user     User    @relation(fields: [userId], references: [id])
  digest   String  @default("immediate") // or "daily"
}
```

---

## 9. 照合ロジック（初期擬似コード）
```ts
function normalize(s: string) {
  return s.toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, toHalfWidth);
}

function isMatch(userName, obituary) {
  const k = normalize(userName.kanji);
  const kk = normalize(userName.kana || "");
  const d = normalize(obituary.deceased);
  // ①漢字完全一致 or ②かな一致
  if (k && d && k === d) return true;
  if (kk && toKana(d) === kk) return true;
  return false;
}
```

---

## 10. 通知フォーマット（メール例）
**件名**：`【候補あり】登録名「{{name}}」に一致する訃報が見つかりました`  
**本文（テキスト）**：
```
【候補のお知らせ】登録名「{{name}}」に一致する訃報が見つかりました。

故人：{{deceased}}
喪主：{{related_primary}}
地域：{{region}}
享年：{{age}}
出典：{{source_url}}

※同姓同名の可能性があります。必ず内容をご確認ください。
通知設定の変更：{{app_url}}/app/settings
```

---

## 11. 法務・ポリシー（ドラフト要件）
- **位置づけ**：本サービスは「見逃しを減らすための**候補通知**」であり、**本人と断定しません**。  
- **著作権**：新聞本文の転載は行わず、**出典URLへの誘導**のみ。  
- **個人情報**：  
  - 収集：メール・登録氏名・設定のみ  
  - 利用：通知提供と品質改善のため  
  - 保管：削除要求で即時削除  
- **免責**：名寄せの誤り・同姓同名に伴う誤解について、損害責任を負わない旨を明記。  
- **退会**：UIから即時削除、通知停止。

---

## 12. SEO / コンテンツ
- **タイトル**：{{ SERVICE_NAME }}｜沖縄の訃報“候補”通知で見逃し防止  
- **説明**：登録した名前に一致する可能性がある訃報を、喪主名・地域情報とともにお知らせします。  
- **構造化データ**：`Organization`, `WebSite`, `FAQPage`  
- **FAQ**：  
  - Q. 同姓同名の誤通知は？ → 候補通知です。必ず詳細をご確認ください。  
  - Q. データはどこから？ → 公開情報をもとにし、本文転載は行いません。

---

## 13. 計測/KPI
- **Activation**：初回氏名登録率 ≥ 70%  
- **Value**：週あたり候補通知率（Activeユーザーのうち通知を受けた割合）  
- **Quality**：誤通知フィードバック率 ≤ 5%  
- **Retention**：4週継続率 ≥ 40%  
- **B2B種**：問い合わせCV（/contact送信数）

---

## 14. 開発タスク（優先順）
1. Next.js 初期化・認証・DBスキーマ・種データ投入  
2. `/app/names` CRUD + ON/OFF  
3. `/admin/ingest` CSVインポート（管理者メール制限）  
4. バッチ（Cron）で照合→通知キュー→メール送信  
5. `/app/dashboard`（通知履歴/候補詳細モーダル）  
6. LP/規約/プライバシー/問い合わせ  
7. A11y・性能調整・E2E テスト（Playwright）

**受け入れ条件（DoD）**  
- CSV投入→通知メールが届くデモ動画を録画  
- 新規ユーザーが3分以内に登録→氏名追加→テスト通知受領  
- 退会で全データが消えることを確認

---

## 15. テスト観点
- 名寄せ正規化（全角/半角/スペース/かな）  
- 多重通知防止（同レコードに対して1ユーザー1回）  
- 誤通知報告フロー（v2で簡易ボタン追加）  
- 日本語IME入力・携帯キャリアメールでの受信可否  
- アクセシビリティ（スクリーンリーダー読み上げ）

---

## 16. デプロイ/運用
- Vercel Production ブランチ：`main`  
- 監視：Vercel Analytics、Sentry（エラー）  
- バックアップ：DB 日次スナップショット  
- 権限：`ADMIN_EMAILS` のみ `/admin/ingest` へアクセス可

---

## 17. 将来ロードマップ（抜粋）
- v2：LINE Notify / 日次ダイジェスト、地域フィルタ  
- v3：法人アカウント（ユーザーグループ）、弔電・供花導線  
- v4：新聞社提携モード（公式データ連携・ネイティブApp連携）

---

## 18. コピー例（LP）
- **見出し**：  
  「訃報の**見逃し**を減らす。あなたの“ご縁”を守るアラート。」  
- **サブ**：  
  「登録した名前に一致“する可能性がある”訃報を、喪主名・地域と一緒にお知らせ。」  
- **CTA**：  
  「無料で始める（メールだけでOK）」  

---

## 19. 既知の制約（正直に表記）
- 本サービスは**候補通知**であり、**断定しません**。  
- データは公開情報へリンクし、本文転載は行いません。  
- 同姓同名・異体字等により誤検知の可能性があります。

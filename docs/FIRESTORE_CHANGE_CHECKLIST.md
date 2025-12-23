# Firestore 變更檢查清單 (AI Agent Reference)

> **重要**: 每次修改 Firestore 前必須完成檢查！

---

## 快速檢查清單

### ✅ 階段 1: 變更前

- [ ] 確認變更必要性（能否用計算欄位/前端邏輯解決？）
- [ ] 檢查冗餘欄位（是否已存在其他 Collection？）
- [ ] 評估影響範圍（哪些檔案？哪些功能？）
- [ ] 確認遷移需求（需要回填舊資料嗎？）

### ✅ 階段 2: Schema 設計

- [ ] 必填欄位明確定義（TypeScript 不加 `?`）
- [ ] 欄位類型正確 (string/number/Timestamp/boolean/array)
- [ ] 日期格式統一（無時區用 `string: YYYY-MM-DD`，精確時間用 `Timestamp`）
- [ ] 命名符合 camelCase（布林值: `is/has/can`, 時間: `At/Date`）
- [ ] 避免保留字

### ✅ 階段 3: 驗證規則

- [ ] **Firestore Rules 已更新** (`firestore/firestore.rules`)
- [ ] 必填欄位驗證: `data.keys().hasAll([...])`
- [ ] 格式驗證: 日期 `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, URL `^https://.*`, ID `^u[0-9]+$`
- [ ] 權限控制: read/create/update/delete 正確設定
- [ ] 防越權: 檢查 `request.auth.uid`, `getBoundUserId()`, `isSquadMember()`

### ✅ 階段 4: 程式碼同步

- [ ] **TypeScript 類型** (`src/types/firestore.ts`) - 加 `@since` 註解
- [ ] **Service 層** (`src/services/firestore/operations/`)
- [ ] **Composable 層** (`src/composables/`)
- [ ] **UI 組件** (`src/components/`) - 若需顯示/輸入

### ✅ 階段 5: 測試驗證

- [ ] CRUD 操作測試 (Create/Read/Update/Delete)
- [ ] Firestore Rules 生效確認（未授權操作被拒絕）
- [ ] 舊資料相容性測試（用 optional chaining 和預設值）
- [ ] UI 顯示正確

### ✅ 階段 6: 文件更新

- [ ] 更新 `docs/FIRESTORE_SCHEMA.md`（若有新欄位/Collection）
- [ ] 更新 `docs/TECHNICAL_SPEC.md`（若架構變更）
- [ ] 記錄變更歷史（日期 + 原因）

---

## 變更類型快速參考

| 類型                | 必須完成                                   |
| ------------------- | ------------------------------------------ |
| **新增欄位**        | 階段 2,3,4,5,6                             |
| **修改欄位**        | 階段 1,3,4,5,6 + 遷移腳本                  |
| **刪除欄位**        | 先標 `@deprecated` → 移除程式碼 → 清理資料 |
| **新增 Collection** | 完整 Schema + Rules + 索引 + 文件          |
| **修改查詢**        | Rules 確認 + Service 更新 + 效能測試       |

---

## 範例流程（新增欄位）

```typescript
// 1. TypeScript (src/types/firestore.ts)
/** @since v1.2 */ tags?: string[];

// 2. Rules (firestore/firestore.rules)
(data.tags == null || (data.tags is list && data.tags.size() <= 10))

// 3. Service (src/services/firestore/operations/workout.ts)
tags: data.tags || []

// 4. 測試 + 文件更新
```

---

## 常見錯誤

| 錯誤            | 結果       | 預防                           |
| --------------- | ---------- | ------------------------------ |
| 忘記更新 Rules  | 安全漏洞   | 每次改 Schema 必須同時改 Rules |
| Type 與資料不符 | 執行時錯誤 | 寫完立即測試實際資料讀寫       |
| 冗餘資料不同步  | 資料不一致 | 搜尋所有使用該欄位的地方       |
| 舊資料不相容    | 功能損壞   | 用 optional chaining + 預設值  |
| 缺少索引        | 查詢失敗   | Emulator 測試複合查詢          |

---

## 最佳實踐

- ✅ **小步迭代**：一次改一個欄位，立即測試
- ✅ **TypeScript strict mode**：強制處理 null/undefined
- ✅ **Firestore Emulator**：避免污染生產資料
- ✅ **版本控制 Schema**：用 `@since`/`@deprecated` 註解
- ✅ **Code Review**：檢查安全性和資料一致性

---

**變更歷史**: 2025-12-23 - 精簡版給 AI agent 使用

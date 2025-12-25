# Firestore Schema - AI Agent Reference

> **注意**: 完整資料模型定義請參考 [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)  
> 本文件僅包含驗證規則、CRUD 範例和關鍵操作指引

---

## 資料結構速覽

```
firestore/
├── squads/{squadId} + members/{userId}
├── users/{userId} + stats/{date}
├── auth-bindings/{firebaseAuthUid}
└── workouts/{workoutId}
```

---

## 關鍵驗證規則

### Firestore Rules 關鍵驗證

**日期格式**: `data.date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')`  
**HTTPS URL**: `data.imageUrl.matches('^https://.*')`  
**必填欄位**: `data.keys().hasAll(['id', 'userId', 'squadId', ...])`  
**數值範圍**: `data.count >= 0 && data.count <= 10`  
**ID 格式**: `data.appUserId.matches('^u[0-9]+$')`

### 權限控制摘要

- **auth-bindings**: 只能讀寫自己的綁定，建立僅一次
- **squads**: 已綁定使用者可讀，成員可更新統計，隊長可更新設定
- **users**: 已綁定使用者可讀全部，只能更新自己的非保護欄位
- **workouts**: 團隊成員可讀，只能建立/更新/刪除自己的記錄

---

## 關鍵 CRUD 範例

**1. Check-in（建立 Workout + 更新統計）**

```typescript
// 使用 Firestore 自動生成 ID
const workoutsRef = collection(db, "workouts");
const workoutDoc = doc(workoutsRef);
const workoutId = workoutDoc.id;

await setDoc(workoutDoc, {
  id: workoutId,
  userId,
  squadId,
  date,
  completedAt: serverTimestamp(),
  imageUrl,
  note: note || "",
  createdAt: serverTimestamp(),
});

// 更新 user stats
await setDoc(
  doc(db, "users", userId, "stats", date),
  {
    date,
    userId,
    count: increment(1),
    workoutIds: arrayUnion(workoutId),
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);
```

**2. 查詢今日團隊訓練**

```typescript
const q = query(
  collection(db, "workouts"),
  where("squadId", "==", squadId),
  where("date", "==", date)
);
```

**需要索引**: `squadId (ASC) + date (ASC)`

**3. Transaction 範例（確保原子性）**

```typescript
await runTransaction(db, async (tx) => {
  tx.set(workoutRef, workoutData);
  tx.update(statsRef, { count: increment(1) });
  tx.update(squadRef, { totalWorkouts: increment(1) });
});
```

---

## 索引配置

**firestore.indexes.json**:

```json
{
  "indexes": [
    {
      "collectionGroup": "workouts",
      "fields": [
        { "fieldPath": "squadId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "workouts",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 遷移快速參考

### 新增欄位

1. 更新 TypeScript 類型（加 `@since` 註解）
2. 更新 Firestore Rules 驗證
3. 程式碼加入新欄位處理（含預設值）
4. 選擇性回填舊資料

### 刪除欄位

1. 標記 `@deprecated`
2. 移除所有程式碼引用
3. 清理舊資料（批次 `deleteField()`）
4. 下版本移除類型定義

### 格式轉換

1. 雙寫新舊格式
2. 執行資料遷移腳本
3. 確認遷移完成後移除舊欄位

---

## 關鍵注意事項

- **日期欄位**: 不需時區用 `string` (YYYY-MM-DD)，需精確時間用 `Timestamp`
- **冗餘資料**: `squads/.../members` 冗餘 user 資料為效能，需同步更新
- **WorkoutId 格式**: Firestore 自動生成的 ID（保證唯一性）
- **Streak 計算**: 只計算已綁定使用者，全部完成才 +1
- **備份**: 使用 `firebase firestore:export/import`

---

**變更歷史**: 2025-12-23 - 初始版本（精簡版給 AI agent 使用）

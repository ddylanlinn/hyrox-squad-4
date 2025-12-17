# 多帳號綁定系統實作完成 ✅

## 📋 功能概述

已成功實作**多帳號綁定系統**，允許使用者將不同的登入方式（Google、Facebook 等）綁定到固定的應用使用者身份（Dylan、Crystal、Sylvi、Andrew）。

---

## 🎯 核心概念

### **雙層使用者系統**

1. **Firebase Auth User（認證帳號）**

   - Google、Facebook、Email 等登入方式
   - 每次登入產生的 Firebase UID
   - 一個人可以有多個認證帳號

2. **App User（應用使用者）**

   - 固定的四位團隊成員：Dylan、Crystal、Sylvi、Andrew
   - ID：u1, u2, u3, u4
   - 所有訓練記錄都綁定到應用使用者 ID

3. **綁定關係（Auth Binding）**
   - 連接 Firebase Auth UID 與 App User ID
   - 儲存在 Firestore `auth-bindings` collection
   - 支援一對多關係（一個 App User 可以有多個 Auth Account）

---

## 🔄 使用者流程

```
1. 使用者選擇登入方式（Google/FB/匿名）
   ↓
2. Firebase Authentication 驗證
   ↓
3. 檢查 auth-bindings/{firebaseAuthUid}
   ↓
4a. 已綁定
    → 直接進入應用（使用綁定的 appUserId）
    → 載入該使用者的訓練記錄
   ↓
4b. 未綁定
    → 顯示使用者選擇畫面
    → 選擇 Dylan/Crystal/Sylvi/Andrew
    → 建立綁定關係
    → 進入應用
```

---

## 📁 資料結構

### **Firestore Collections**

#### **auth-bindings/{firebaseAuthUid}**

```typescript
{
  firebaseAuthUid: string,      // Firebase Auth UID (document ID)
  appUserId: string,             // 綁定的應用使用者 ID (u1, u2, u3, u4)
  provider: string,              // 登入方式 (google.com, facebook.com)
  email: string,                 // 登入的 Email
  displayName: string,           // 登入的顯示名稱
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **users/{appUserId}**

```typescript
{
  id: string,                    // u1, u2, u3, u4
  name: string,                  // Dylan, Crystal, Sylvi, Andrew
  initials: string,              // DL, CH, SB, AC
  email: string,
  avatarUrl: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  // ... 其他欄位
}
```

---

## 🛠️ 實作檔案

### **1. Types**

- ✅ `src/types/firestore.ts`
  - 新增 `AuthBindingDocument` 介面

### **2. Services**

- ✅ `src/services/auth/binding.ts`

  - `getAuthBinding()` - 檢查綁定狀態
  - `createAuthBinding()` - 建立綁定
  - `updateAuthBindingTimestamp()` - 更新時間戳記
  - `getAvailableAppUsers()` - 取得可綁定的使用者列表

- ✅ `src/services/auth/index.ts`
  - 移除自動同步使用者到 Firestore 的邏輯
  - 保持純粹的認證功能

### **3. Composables**

- ✅ `src/composables/useAuth.ts`
  - 新增 `appUserId` - 綁定的應用使用者 ID
  - 新增 `needsBinding` - 是否需要選擇綁定
  - 新增 `bindAppUser()` - 綁定應用使用者
  - 自動檢查綁定狀態

### **4. Components**

- ✅ `src/components/UserSelection.vue`

  - 使用者選擇畫面
  - 顯示四位團隊成員供選擇
  - 精美的 UI 設計

- ✅ `src/components/LoginView.vue`
  - 登入頁面（已存在）
  - 支援 Google 和匿名登入

### **5. Main App**

- ✅ `src/App.vue`
  - 整合使用者選擇流程
  - 更新所有 `user.uid` 改為 `appUserId`
  - 監聽 `appUserId` 變化而非 `user` 變化

---

## 🎨 UI 流程

### **1. 未登入**

```
┌─────────────────────┐
│   Login View        │
│                     │
│  🏃‍♂️ HYROX          │
│  login to start     │
│                     │
│  [Google Login]     │
│  [Guest Mode]       │
└─────────────────────┘
```

### **2. 已登入但未綁定**

```
┌─────────────────────┐
│  User Selection     │
│                     │
│  Select Your Profile│
│                     │
│  ┌─────────────┐    │
│  │ DL  Dylan   │ →  │
│  └─────────────┘    │
│  ┌─────────────┐    │
│  │ CH  Crystal │ →  │
│  └─────────────┘    │
│  ┌─────────────┐    │
│  │ SB  Sylvi   │ →  │
│  └─────────────┘    │
│  ┌─────────────┐    │
│  │ AC  Andrew  │ →  │
│  └─────────────┘    │
└─────────────────────┘
```

### **3. 已登入且已綁定**

```
┌─────────────────────┐
│ [👤 Dylan] [Logout] │ ← User Info Bar
├─────────────────────┤
│                     │
│  History Heatmap    │
│  Energy Dashboard   │
│  Action Section     │
│                     │
└─────────────────────┘
```

---

## 🔍 範例場景

### **場景 1：Dylan 第一次用 Google 登入**

```
1. Dylan 點擊 "login with google"
2. 選擇 Google 帳號 dylan@gmail.com
3. Firebase Auth 建立使用者（UID: abc123）
4. 系統檢查 auth-bindings/abc123 → 不存在
5. 顯示使用者選擇畫面
6. Dylan 選擇 "Dylan"
7. 建立綁定：
   {
     firebaseAuthUid: "abc123",
     appUserId: "u1",
     provider: "google.com",
     email: "dylan@gmail.com"
   }
8. 進入應用，使用 appUserId = "u1"
```

### **場景 2：Dylan 用 Facebook 登入（第二個帳號）**

```
1. Dylan 點擊 "login with facebook"（假設已實作）
2. 選擇 Facebook 帳號
3. Firebase Auth 建立使用者（UID: xyz789）
4. 系統檢查 auth-bindings/xyz789 → 不存在
5. 顯示使用者選擇畫面
6. Dylan 選擇 "Dylan"（再次）
7. 建立綁定：
   {
     firebaseAuthUid: "xyz789",
     appUserId: "u1",  ← 綁定到同一個 App User
     provider: "facebook.com",
     email: "dylan@fb.com"
   }
8. 進入應用，使用 appUserId = "u1"
9. 可以看到之前用 Google 登入時的所有訓練記錄！
```

### **場景 3：Dylan 下次用 Google 登入**

```
1. Dylan 點擊 "login with google"
2. 選擇 Google 帳號 dylan@gmail.com
3. Firebase Auth 驗證（UID: abc123）
4. 系統檢查 auth-bindings/abc123 → 已存在
5. 取得 appUserId = "u1"
6. 直接進入應用，不需要再選擇！
```

---

## 🔐 安全性考量

### **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Auth Bindings - 只能讀寫自己的綁定
    match /auth-bindings/{firebaseAuthUid} {
      allow read: if request.auth != null && request.auth.uid == firebaseAuthUid;
      allow create: if request.auth != null && request.auth.uid == firebaseAuthUid;
      allow update: if request.auth != null && request.auth.uid == firebaseAuthUid;
      allow delete: if false; // 不允許刪除綁定
    }

    // Users - 所有登入使用者可讀
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // 使用者資料由管理員管理

      match /stats/{date} {
        allow read: if request.auth != null;
        // 只能寫入自己綁定的使用者的統計
        allow write: if request.auth != null &&
                        exists(/databases/$(database)/documents/auth-bindings/$(request.auth.uid)) &&
                        get(/databases/$(database)/documents/auth-bindings/$(request.auth.uid)).data.appUserId == userId;
      }
    }

    // Workouts - 只能建立綁定使用者的訓練記錄
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                       exists(/databases/$(database)/documents/auth-bindings/$(request.auth.uid)) &&
                       get(/databases/$(database)/documents/auth-bindings/$(request.auth.uid)).data.appUserId == request.resource.data.userId;
      allow update, delete: if false; // 不允許修改或刪除訓練記錄
    }
  }
}
```

---

## ✅ 測試檢查清單

- [ ] Google 登入 → 選擇使用者 → 成功綁定
- [ ] 匿名登入 → 選擇使用者 → 成功綁定
- [ ] 重新登入（相同帳號）→ 直接進入，不需再選擇
- [ ] 不同登入方式 → 可綁定到同一個 App User
- [ ] 打卡功能使用正確的 appUserId
- [ ] 訓練記錄顯示正確
- [ ] 登出後清除綁定狀態
- [ ] 錯誤處理（綁定失敗、網路錯誤等）

---

## 🚀 後續優化建議

1. **解除綁定功能**

   - 允許使用者解除特定認證帳號的綁定
   - 需要至少保留一個綁定

2. **綁定管理頁面**

   - 顯示當前使用者的所有綁定帳號
   - 顯示最後登入時間
   - 管理多個綁定

3. **Facebook 登入**

   - 新增 Facebook 登入支援
   - 測試多帳號綁定流程

4. **管理員功能**

   - 查看所有綁定關係
   - 手動調整綁定（如果需要）

5. **綁定歷史記錄**
   - 記錄綁定建立時間
   - 記錄每個帳號的使用頻率

---

## 📝 重要提醒

1. **appUserId 是核心**

   - 所有訓練記錄都使用 `appUserId`（u1, u2, u3, u4）
   - `firebaseAuthUid` 只用於認證和綁定查詢

2. **綁定是永久的**

   - 一旦綁定，除非手動解除，否則永久有效
   - 即使 Token 過期，綁定關係仍然存在

3. **多帳號支援**

   - 一個 App User 可以有多個 Auth Account
   - 但一個 Auth Account 只能綁定一個 App User

4. **資料一致性**
   - 所有訓練記錄都綁定到 appUserId
   - 不同認證帳號登入後看到相同的資料

---

## 🎉 總結

多帳號綁定系統已成功實作！現在：

- ✅ 支援多種登入方式
- ✅ 固定的四位團隊成員
- ✅ 一個人可以用多個帳號登入
- ✅ 所有訓練記錄正確綁定
- ✅ 流暢的使用者體驗

**下一步：**

1. 在 Firebase Console 啟用 Google Authentication
2. 測試完整的登入和綁定流程
3. 根據需求調整 Firestore Security Rules

有任何問題歡迎隨時詢問！🚀

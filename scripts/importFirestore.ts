#!/usr/bin/env tsx

/**
 * Firestore 資料匯入腳本
 *
 * 使用方式：
 * 1. 確保已設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數
 * 2. 執行: npm run init-firestore
 *
 * 或直接執行:
 * GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run init-firestore
 */

import admin from "firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";
import initialData from "./initial-data.json" assert { type: "json" };
import type {
  InitialData,
  SquadData,
  UserData,
  WorkoutData,
} from "../src/types/firestore.js";
import {
  getTodayString,
  calculateDaysUntil,
  getLastNDays,
} from "../src/utils/dateHelpers.js";

// ==================== 初始化 Firebase Admin ====================

function initializeFirebase() {
  try {
    // 檢查是否已初始化（安全檢查）
    const isInitialized = admin.apps && admin.apps.length > 0;

    if (!isInitialized) {
      // 方式 1: 使用環境變數 GOOGLE_APPLICATION_CREDENTIALS
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const keyPath = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        console.log(`🔑 使用 Service Account: ${keyPath}`);

        try {
          const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log("✅ Firebase Admin 已初始化 (使用 Service Account)");
        } catch (fileError) {
          if (fileError instanceof Error) {
            if (fileError.message.includes("ENOENT")) {
              console.error("\n❌ 錯誤：找不到 Service Account Key 檔案\n");
              console.log(`檔案路徑: ${keyPath}`);
              console.log("\n請確認：");
              console.log("1. 檔案是否存在");
              console.log("2. 路徑是否正確");
              console.log(
                "3. 是否已從 Firebase Console 下載 Service Account Key\n"
              );
              console.log("📖 詳細說明: docs/FIRESTORE_SETUP.md");
            } else {
              console.error("\n❌ 錯誤：無法讀取 Service Account Key 檔案\n");
              console.error(fileError.message);
            }
          }
          process.exit(1);
        }
      }
      // 方式 2: 使用專案 ID (僅限 Emulator)
      else if (process.env.FIREBASE_PROJECT_ID) {
        console.log(`🔑 使用 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log("✅ Firebase Admin 已初始化 (使用 Project ID)");
      } else {
        console.error("\n❌ 錯誤：未設定 Firebase 認證資訊\n");
        console.log("請使用以下其中一種方式執行：\n");
        console.log("方式 1: 使用 Service Account Key (推薦)");
        console.log(
          "  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json yarn init-firestore\n"
        );
        console.log("方式 2: 使用 Project ID (僅限 Emulator)");
        console.log(
          "  FIREBASE_PROJECT_ID=your-project-id yarn init-firestore\n"
        );
        console.log("📖 詳細說明請參考: docs/FIRESTORE_SETUP.md");
        process.exit(1);
      }
    } else {
      console.log("ℹ️  Firebase Admin 已經初始化過了");
    }

    return getFirestore();
  } catch (error) {
    console.error("\n❌ Firebase 初始化失敗:\n");

    if (error instanceof Error) {
      console.error(`錯誤訊息: ${error.message}\n`);

      // 提供更具體的錯誤提示
      if (error.message.includes("credential")) {
        console.log("💡 提示：認證檔案格式可能有誤");
        console.log(
          "   請確認 serviceAccountKey.json 是從 Firebase Console 下載的正確檔案\n"
        );
      }

      console.log("📖 完整設定指南: docs/FIRESTORE_SETUP.md");
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// ==================== 資料匯入函數 ====================

async function importSquads(
  db: admin.firestore.Firestore,
  squads: SquadData[]
) {
  console.log("\n📦 開始匯入 Squads...");

  for (const squadData of squads) {
    const squadRef = db.collection("squads").doc(squadData.id);

    await squadRef.set({
      id: squadData.id,
      name: squadData.name,
      description: squadData.description || "",
      competitionDate: squadData.competitionDate,
      memberIds: squadData.memberIds,
      memberCount: squadData.memberIds.length,
      captainId: squadData.captainId || squadData.memberIds[0],
      currentStreak: 0,
      averageStreak: 0,
      totalWorkouts: 0,
      targetDailyWorkouts: squadData.targetDailyWorkouts || 4,
      color: squadData.color || "#FF6B6B",
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`  ✓ Squad: ${squadData.name} (${squadData.id})`);
  }
}

async function importUsers(
  db: admin.firestore.Firestore,
  users: UserData[],
  squads: SquadData[]
) {
  console.log("\n👥 開始匯入 Users...");

  for (const userData of users) {
    const userRef = db.collection("users").doc(userData.id);

    // 找出使用者所屬的 squad
    const userSquads = squads.filter((s) => s.memberIds.includes(userData.id));
    const currentSquadId = userSquads[0]?.id;

    await userRef.set({
      id: userData.id,
      name: userData.name,
      initials: userData.initials,
      avatarUrl: userData.avatarUrl || "",
      currentSquadId: currentSquadId || "",
      squadIds: userSquads.map((s) => s.id),
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`  ✓ User: ${userData.name} (${userData.id})`);
  }
}

async function importSquadMembers(
  db: admin.firestore.Firestore,
  squads: SquadData[],
  users: UserData[]
) {
  console.log("\n👤 開始匯入 Squad Members...");

  for (const squad of squads) {
    for (const userId of squad.memberIds) {
      const user = users.find((u) => u.id === userId);
      if (!user) continue;

      const memberRef = db
        .collection("squads")
        .doc(squad.id)
        .collection("members")
        .doc(userId);

      await memberRef.set({
        userId: userId,
        squadId: squad.id,
        role: userId === squad.captainId ? "captain" : "member",
        joinedAt: Timestamp.now(),
        currentStreak: 0,
        totalWorkouts: 0,
        name: user.name,
        initials: user.initials,
        avatarUrl: user.avatarUrl || "",
      });

      console.log(`  ✓ Member: ${user.name} → ${squad.name}`);
    }
  }
}

async function importWorkouts(
  db: admin.firestore.Firestore,
  workouts: WorkoutData[],
  squads: SquadData[]
) {
  console.log("\n🏋️ 開始匯入 Workouts...");

  const today = getTodayString();

  for (const workoutData of workouts) {
    // 找出使用者所屬的 squad
    const userSquad = squads.find((s) =>
      s.memberIds.includes(workoutData.userId)
    );
    if (!userSquad) {
      console.warn(`  ⚠️  找不到使用者 ${workoutData.userId} 的 squad，跳過`);
      continue;
    }

    const workoutRef = db.collection("workouts").doc();
    const workoutDate = workoutData.date || today;

    await workoutRef.set({
      id: workoutRef.id,
      userId: workoutData.userId,
      squadId: userSquad.id,
      date: workoutDate,
      completedAt: Timestamp.now(),
      imageUrl: workoutData.imageUrl,
      note: workoutData.note || "",
      createdAt: Timestamp.now(),
    });

    console.log(`  ✓ Workout: ${workoutData.userId} @ ${workoutDate}`);
  }
}

async function generateHistoricalStats(
  db: admin.firestore.Firestore,
  users: UserData[],
  squads: SquadData[]
) {
  console.log("\n📊 開始產生歷史統計資料...");

  const last70Days = getLastNDays(70);

  for (const dateStr of last70Days) {
    // 隨機決定當天有多少人訓練
    const rand = Math.random();
    let activeUserCount = 0;
    if (rand > 0.8) activeUserCount = 4;
    else if (rand > 0.5) activeUserCount = 3;
    else if (rand > 0.3) activeUserCount = 2;
    else if (rand > 0.1) activeUserCount = 1;

    if (activeUserCount === 0) continue;

    // 隨機選擇活躍使用者
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
    const activeUsers = shuffledUsers.slice(0, activeUserCount);

    for (const user of activeUsers) {
      // 建立使用者每日統計
      const userStatsRef = db
        .collection("users")
        .doc(user.id)
        .collection("stats")
        .doc(dateStr);

      await userStatsRef.set({
        date: dateStr,
        userId: user.id,
        count: 1,
        workoutIds: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  }

  console.log(`  ✓ 已產生 ${last70Days.length} 天的歷史統計`);
}

// ==================== 主程式 ====================

async function main() {
  console.log("🚀 開始匯入 Firestore 資料...\n");
  console.log("📄 資料來源: scripts/data/initial-data.json\n");

  const db = initializeFirebase();
  const data = initialData as InitialData;

  try {
    // 1. 匯入 Squads
    await importSquads(db, data.squads);

    // 2. 匯入 Users
    await importUsers(db, data.users, data.squads);

    // 3. 匯入 Squad Members
    await importSquadMembers(db, data.squads, data.users);

    // 4. 匯入 Workouts
    if (data.workouts && data.workouts.length > 0) {
      await importWorkouts(db, data.workouts, data.squads);
    }

    // 5. 產生歷史統計資料（最近 70 天）
    await generateHistoricalStats(db, data.users, data.squads);

    console.log("\n✅ 所有資料匯入完成！");
    console.log("\n📊 匯入摘要:");
    console.log(`  - Squads: ${data.squads.length}`);
    console.log(`  - Users: ${data.users.length}`);
    console.log(`  - Workouts: ${data.workouts?.length || 0}`);
    console.log(`  - Historical Stats: 最近 70 天`);
  } catch (error) {
    console.error("\n❌ 匯入失敗:", error);
    process.exit(1);
  }
}

// 執行主程式
main();

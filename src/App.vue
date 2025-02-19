<template>
  <div>
    <!-- 輸入待辦事項區塊 -->
    <div class="flex justify-center mt-4 gap-2">
      <!-- 待辦事項輸入框 -->
      <input type="text" placeholder="今天要做什麼呢?" v-model="text" class="input input-bordered input-md w-full max-w-xs">
      <!-- 按鈕在「儲存中」或「輸入框為空」時按鈕不可點擊。 -->
      <button @click="save" :disabled="isSave || text === ''" class="btn">
        <!-- 當 isSave 為 true 時，顯示載入動畫 -->
        <span v-if="isSave" class="loading loading-spinner loading-xs"></span>
        儲存
      </button>
      <!-- 刪除已完成按鈕，當沒有已完成項目或 isLoading 為 true 時，按鈕不可點擊 -->
      <button @click="deleteCompleted" :disabled="!hasCompletedItems || isLoading" class="btn">
        <!-- 當 isLoading 為 true 時，顯示載入動畫 -->
        <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
        刪除已完成
      </button>
    </div>
    <!-- 顯示 To-Do List 的區塊 -->
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <!-- 表格標題 -->
        <thead>
          <tr>
            <th>編號</th>
            <th>內容</th>
            <th>編輯</th>
            <th>進度</th>
          </tr>
        </thead>
        <!-- 表格內容 -->
        <tbody>
          <!-- 使用 v-for 走訪 items 陣列，顯示所有待辦事項 -->
          <tr v-for="(item, index) in items" :key="index">
            <!-- 顯示資料編號，從 1 開始 -->
            <th>{{ index + 1 }}</th>
            <td>
              <!-- 當 item.isEdit 為 false 時，顯示文字 -->
              <!-- 當 item.isFinished 為 true 時，文字加刪除線並變成灰色 -->
              <p v-if="!item.isEdit" :class="{ 'line-through text-gray-400': item.isFinished }">{{ item.text }}</p>
              <!-- 當 item.isEdit 為 true 時，顯示可編輯的輸入框 -->
              <input v-else type="text" placeholder="今天要做甚麼呢?" v-model="item.text"
                class="input input-bordered input-md w-full max-w-xs">
            </td>
            <td>
              <!-- 若未進入編輯模式，顯示「編輯」按鈕 -->
              <button v-if="!item.isEdit" @click="changeMode(index)"
                class="btn btn-neutral btn-outline btn-xs">編輯</button>
              <!-- 若進入編輯模式，顯示「更新」和「刪除」按鈕 -->
              <div v-if="item.isEdit" class="flex gap-2">
                <button @click="update(index)" class="btn btn-success btn-outline btn-xs">更新</button>
                <button @click="remove(index)" class="btn btn-error btn-outline btn-xs">刪除</button>
              </div>
            </td>
            <td>
              <button @click="finished(index)" v-if="!item.isFinished"
                class="btn btn-warning btn-outline btn-xs">未完成</button>
              <button @click="finished(index)" v-else class="btn btn-info btn-outline btn-xs">已完成</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <!-- 返回頂部按鈕，當滾動超過一定距離時顯示 -->
      <button @click="goToTop" v-show="showGoToTop"
        class="fixed bottom-4 right-4 bg-gray-400 text-white px-2 py-2 rounded-full hover:bg-gray-500 transition">
        TOP ⭡
      </button>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Parse } from 'parse/dist/parse.min.js';

// 儲存輸入框內容的變數
const text = ref('');
// 控制儲存按鈕狀態，避免重複提交
const isSave = ref(false);
// 存儲待辦事項的陣列
const items = ref([]);
// 新增 isLoading 變數來控制載入狀態
const isLoading = ref(false);
// 控制「返回頂部」按鈕的顯示狀態
const showGoToTop = ref(false);

// 計算是否有已完成的項目，若有則返回 true
const hasCompletedItems = computed(() => {
  return items.value.some(item => item.isFinished);
});

// 監聽滾動事件，當滾動超過 50px 時顯示「返回頂部」按鈕
function handleScroll() {
  showGoToTop.value = window.scrollY > 50;
}

// 平滑滾動回頂部
function goToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// 讀取待辦事項，並更新 items 陣列
async function getData() {
  try {
    // 建立查詢物件，查詢 ToDo 資料表中的所有資料
    const query = new Parse.Query("ToDo");
    // 執行查詢
    let datas = await query.find();
    // 將查詢到的資料轉換成前端需要的格式
    items.value = datas.map(data => ({
      // 取得唯一id
      id: data.id,
      // 取得 ToDo 文字內容
      text: data.get("text"),
      // 取得是否完成狀態，若無則預設為 false
      isFinished: data.get("isFinished") || false,
      // 預設不在編輯模式
      isEdit: false,
    }));
  } catch (error) {
    console.log(error);
  }
}

// 新增待辦事項
async function save() {

  // 設定 isSave 為 true，顯示 loading 動畫
  isSave.value = true;
  // 創建新的 Parse 物件
  const toDoList = new Parse.Object("ToDo");
  // 設定為 text 屬性
  toDoList.set("text", text.value);

  try {
    // await 會讓 JavaScript 等待儲存完成才執行下一行
    // 儲存到 Parse 資料庫
    await toDoList.save()
    // 清空輸入框
    text.value = "";
    // 重新讀取資料
    await getData();
    // 隱藏 loading 動畫
    isSave.value = false;
  } catch (error) {
    alert('上傳失敗' + error.message);
  }
}

// 進入編輯模式
function changeMode(index) {
  // 設定 isEdit 為 true，進入編輯模式
  items.value[index].isEdit = true;
}

// 更新待辦事項內容
async function update(index) {
  let item = items.value[index];
  try {
    // 建立查詢物件，查詢 ToDo 資料表中的所有資料
    const query = new Parse.Query("ToDo");
    // 查詢目標 To-Do
    query.equalTo("objectId", item.id);
    // 獲取資料
    const toDo = await query.first();
    // 更新內容
    toDo.set("text", item.text);
    // 儲存變更
    await toDo.save();
    // 退出編輯模式
    items.value[index].isEdit = false;

  } catch (error) {
    alert('更新失敗' + error.message);
  }
}

// 刪除待辦事項
async function remove(index) {
  let item = items.value[index];
  try {
    // 建立查詢物件，查詢 ToDo 資料表中的所有資料
    const query = new Parse.Query("ToDo");
    // 查詢目標 To-Do
    query.equalTo("objectId", item.id);
    // 取得資料
    const toDo = await query.first();
    // 刪除資料
    await toDo.destroy();
    // 重新讀取資料
    await getData();
  } catch (error) {
    console.log(error);
  }
}

// 刪除所有已完成的待辦事項
async function deleteCompleted() {
  try {
    // 顯示載入動畫
    isLoading.value = true;

    // 篩選出所有已完成的待辦事項
    const completedItems = items.value.filter(item => item.isFinished);

    // 逐一刪除已完成的待辦事項
    for (let item of completedItems) {
      // 建立查詢物件，查詢 ToDo 資料表中的所有資料
      const query = new Parse.Query("ToDo");
      // 查詢特定的待辦事項
      query.equalTo("objectId", item.id);
      // 獲取對應的 ToDo 物件
      const toDo = await query.first();
      if (toDo) {
        // 刪除 ToDo 項目
        await toDo.destroy();
      }
    }

    // 刪除後重新讀取資料
    await getData();

  } catch (error) {
    console.log("刪除已完成項目失敗:", error);
  } finally {
    // 隱藏載入動畫
    isLoading.value = false;
  }
}


// 切換待辦事項的完成狀態
async function finished(index) {
  // 取得對應索引的待辦事項
  let item = items.value[index];
  try {
    // 建立查詢物件，查詢 ToDo 資料表中的所有資料
    const query = new Parse.Query("ToDo");
    // 透過 item.id 查詢對應的待辦事項
    const toDo = await query.get(item.id);
    // 反轉 isFinished 狀態 (true <-> false)
    const newStatus = !item.isFinished;
    // 更新資料庫中的 isFinished 欄位
    toDo.set("isFinished", newStatus);
    // 儲存變更至 Parse 資料庫
    await toDo.save();
    // 更新前端顯示狀態
    item.isFinished = newStatus;
  } catch (error) {
    alert('完成失敗: ' + error.message);
  }
}

// 在組件掛載時，"讀取待辦事項資料"並"監聽滾動事件"
onMounted(() => {
  // 讀取 ToDo 清單資料
  getData();
  // 監聽滾動事件
  window.addEventListener('scroll', handleScroll);
});

// 當組件被銷毀時，移除滾動監聽，避免效能問題
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style></style>

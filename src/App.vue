<template>
  <div>
    <!-- 輸入區塊 -->
    <div class="container mx-auto">
      <div class="flex justify-center mt-4 gap-2">
        <!-- 新增輸入框 -->
        <input type="text" placeholder="今天要做甚麼呢?" v-model="text" class="input input-bordered input-md w-full max-w-xs">
        <!-- 新增按鈕 -->
        <!-- 按鈕在「儲存中」或「輸入框為空」時會變成不可點擊狀態。 -->
        <button @click="save" :disabled="isSave || text === ''" class="btn">
          <span class="loading loading-spinner loading-xs" v-if="isSave"></span>
          儲存
        </button>
      </div>
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
          <!-- v-for走訪items所有資料 -->
          <tr v-for="(item, index) in items" :key="index">
            <!-- 顯示資料編號 -->
            <th>{{ index + 1 }}</th>
            <td>
              <!-- 如果 item.isEdit = false，則顯示 <p> (只顯示文字)。 -->
              <!-- 當 item.isFinished === true 時，讓文字加上刪除線和變成灰色。 -->
              <p v-if="!item.isEdit" :class="{ 'line-through text-gray-400': item.isFinished }">{{ item.text }}</p>
              <!-- 如果 item.isEdit = true，則顯示 <input> (可編輯文字)。 -->
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
      <button @click="goToTop" v-show="showGoToTop"
        class="fixed bottom-4 right-4 bg-gray-400 text-white px-2 py-2 rounded-full hover:bg-gray-500 transition">
        TOP ⭡
      </button>
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Parse } from 'parse/dist/parse.min.js';

// 新增text變數，儲存輸入框內容
const text = ref('');
// 新增新增isSave變數，控制儲存按鈕的狀態 (避免重複提交)
const isSave = ref(false);
// 新增items陣列，儲存ToDo資料表
const items = ref([]);

const showGoToTop = ref(false); // 控制按鈕顯示狀態

// 監聽滾動事件
function handleScroll() {
  showGoToTop.value = window.scrollY > 50; // 滾動超過 100px 才顯示按鈕
}

// 滾動至頂部
function goToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// 新增一個getData函式，讀取ToDo資料表
async function getData() {
  try {
    // 查詢 ToDo 資料表
    const query = new Parse.Query("ToDo");
    // 獲取所有資料
    let datas = await query.find();
    // 將查詢到的資料轉換成前端需要的格式
    items.value = datas.map(data => ({
      // 取得 Parse 物件的唯一 ID
      id: data.id,
      // 取得 ToDo 的文字內容
      text: data.get("text"),
      // 取得是否完成狀態，若無則預設為 false
      isFinished: data.get("isFinished") || false,
      // 預設編輯模式為 false
      isEdit: false,
    }));

  } catch (error) {
    console.log(error);
  }
}

// 新增一個save函式，會將text內容上傳到ToDo資料表內
async function save() {

  // 設定 isSave 為 true，顯示 loading 動畫
  isSave.value = true;
  // 創建新的 Parse 物件
  const toDoList = new Parse.Object("ToDo");
  // 設定為 text 屬性
  toDoList.set("text", text.value);

  try {
    // await 會讓 JavaScript 等待儲存完成才執行下一行
    await toDoList.save()// 儲存到 Parse 資料庫
    text.value = "";// 清空輸入框
    await getData();// 重新讀取資料
    isSave.value = false;// 隱藏 loading 動畫
  } catch (error) {
    alert('上傳失敗' + error.message);
  }

}

// 新增一個changeMode函式，將陣列items某一筆的isEdit設為true
function changeMode(index) {
  // 設定 isEdit 為 true，進入編輯模式
  items.value[index].isEdit = true;
}

// 新增一個update函式，可以編輯資料
async function update(index) {
  let item = items.value[index];
  try {
    // 查詢 ToDo 資料表
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

// 新增一個remove函式，可以刪除資料
async function remove(index) {
  let item = items.value[index];
  try {
    // 查詢 ToDo 資料表
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

// 新增一個finished函式，可以將已完成事項加上刪除線
async function finished(index) {
  // 取得對應索引的待辦事項
  let item = items.value[index];
  try {
    // 創建 Parse 查詢物件
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

// 在onMounted上呼叫getData()來讀取ToDo資料表
onMounted(() => {
  getData(); // 讀取 ToDo 清單資料
  window.addEventListener('scroll', handleScroll); // 監聽滾動事件
});

// 當組件被銷毀時，移除滾動監聽，避免效能問題
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style></style>

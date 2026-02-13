<template>
  <div class="config-page">
    <div class="config-container">
      <header class="config-header">
        <button class="back-btn" @click="router.push('/tcm-study')">← 返回目录</button>
        <h1>学习计划设置</h1>
        <p class="book-name">《{{ bookTitle }}》</p>
      </header>

      <div class="config-card">
        <div class="config-section">
          <div class="section-info">
            <span class="icon">🎴</span>
            <div class="text">
              <h3>记忆卡片</h3>
              <p>原文背诵与释义解析</p>
            </div>
          </div>
          <div class="counter">
            <button @click="counts.flashcards = Math.max(0, counts.flashcards - 1)">-</button>
            <input type="number" v-model.number="counts.flashcards" min="0">
            <button @click="counts.flashcards++">+</button>
          </div>
        </div>

        <div class="config-section">
          <div class="section-info">
            <span class="icon">📝</span>
            <div class="text">
              <h3>选择题</h3>
              <p>核心考点与临床应用辨析</p>
            </div>
          </div>
          <div class="counter">
            <button @click="counts.choices = Math.max(0, counts.choices - 1)">-</button>
            <input type="number" v-model.number="counts.choices" min="0">
            <button @click="counts.choices++">+</button>
          </div>
        </div>

        <div class="config-section">
          <div class="section-info">
            <span class="icon">✍️</span>
            <div class="text">
              <h3>填空题</h3>
              <p>条文关键名词精准记忆</p>
            </div>
          </div>
          <div class="counter">
            <button @click="counts.fills = Math.max(0, counts.fills - 1)">-</button>
            <input type="number" v-model.number="counts.fills" min="0">
            <button @click="counts.fills++">+</button>
          </div>
        </div>

        <div class="summary">
          <p>预计本次学习共计 <strong>{{ totalItems }}</strong> 项任务</p>
        </div>

        <button class="start-btn" @click="handleStart">开始研习</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const bookTitles = {
  'shanghanlun': '伤寒论',
  'jingui': '金匮要略',
  'wenbing': '温病学',
  'neijing': '黄帝内经'
}

const bookTitle = computed(() => bookTitles[route.params.bookId] || '经典著作')

const counts = ref({
  flashcards: 10,
  choices: 5,
  fills: 5
})

const totalItems = computed(() => counts.value.flashcards + counts.value.choices + counts.value.fills)

const handleStart = () => {
  // Store session config in session storage to pass to study view
  sessionStorage.setItem('tcm_session_config', JSON.stringify(counts.value))
  router.push(`/tcm-study/${route.params.bookId}/run`)
}
</script>

<style scoped>
.config-page {
  min-height: 100vh;
  background-color: #fcf9f2;
  padding: 2rem 1rem;
  font-family: 'Noto Serif SC', serif;
}

.config-container {
  max-width: 500px;
  margin: 0 auto;
}

.config-header {
  text-align: center;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: #8a98a5;
  cursor: pointer;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.8rem;
  color: #3e4a52;
  margin-bottom: 0.5rem;
}

.book-name {
  color: #b35c44;
  font-weight: bold;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid #efeadd;
}

.config-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.config-section:last-of-type {
  border-bottom: none;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon {
  font-size: 1.5rem;
}

.text h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.text p {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}

.counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.counter button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #666;
}

.counter input {
  width: 40px;
  text-align: center;
  border: none;
  font-size: 1rem;
  font-weight: bold;
  color: #3e4a52;
}

/* Remove arrows from number input */
.counter input::-webkit-outer-spin-button,
.counter input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.summary {
  margin: 2rem 0;
  text-align: center;
  color: #8a98a5;
  font-size: 0.9rem;
}

.summary strong {
  color: #b35c44;
  font-size: 1.2rem;
}

.start-btn {
  width: 100%;
  padding: 1rem;
  background: #3e4a52;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.start-btn:hover {
  background: #2c3e50;
}
</style>

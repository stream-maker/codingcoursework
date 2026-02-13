<template>
  <div class="tcm-page">
    <div class="tcm-container">
      <header class="tcm-header">
        <div class="seal">医</div>
        <h1>中医经典研习</h1>
        <p class="subtitle">勤求古训 · 博采众方</p>
      </header>

      <div class="book-grid">
        <div 
          v-for="book in books" 
          :key="book.id" 
          class="book-card" 
          @click="startStudy(book.id)"
        >
          <div class="book-spine"></div>
          <div class="book-content">
            <h2 class="book-title">{{ book.title }}</h2>
            <div class="book-status">
              <span class="status-badge">已开放</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer-nav">
        <router-link to="/" class="back-btn">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const books = [
  { id: 'shanghanlun', title: '伤寒论' },
  { id: 'jingui', title: '金匮要略' },
  { id: 'wenbing', title: '温病学' },
  { id: 'neijing', title: '黄帝内经' }
]

const startStudy = (bookId) => {
  router.push(`/tcm-study/${bookId}`)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

.tcm-page {
  min-height: 100vh;
  background-color: #fcf9f2; /* Rice paper color */
  font-family: 'Noto Serif SC', 'Songti SC', 'SimSun', serif;
  color: #3e4a52;
  padding: 2rem 1rem;
}

.tcm-container {
  max-width: 800px;
  margin: 0 auto;
}

.tcm-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.seal {
  width: 60px;
  height: 60px;
  border: 3px solid #b35c44;
  color: #b35c44;
  font-size: 32px;
  line-height: 54px;
  text-align: center;
  border-radius: 8px;
  margin: 0 auto 1rem;
  font-weight: bold;
  opacity: 0.8;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: 0.2rem;
}

.subtitle {
  color: #8a98a5;
  font-size: 1.1rem;
  letter-spacing: 0.5rem;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.book-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  cursor: pointer;
  display: flex;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 160px;
  border: 1px solid #efeadd;
}

.book-card:hover:not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.book-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.book-spine {
  width: 24px;
  background-color: #2c3e50;
  position: relative;
}

.book-card:nth-child(1) .book-spine { background-color: #4a708b; } /* Blue */
.book-card:nth-child(2) .book-spine { background-color: #b35c44; } /* Red/Ochre */
.book-card:nth-child(3) .book-spine { background-color: #6b8e23; } /* Green */
.book-card:nth-child(4) .book-spine { background-color: #d2691e; } /* Brown */

.book-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.book-title {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  font-weight: bold;
}

.status-badge {
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 20px;
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-badge.pending {
  background-color: #f5f5f5;
  color: #999;
}

.footer-nav {
  text-align: center;
}

.back-btn {
  color: #8a98a5;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #3e4a52;
}

@media (max-width: 600px) {
  .book-grid {
    grid-template-columns: 1fr;
  }
}
</style>

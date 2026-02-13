<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="home-page">
    <div class="container home-container">
      <h1>vibe-coding实践</h1>
      <p>选择一个项目开始体验</p>
      <div class="game-list">
        <div class="game-card-wrapper">
          <router-link to="/game" class="game-card">
            <div class="game-icon">🐍</div>
            <div class="game-info">
              <div class="game-title">贪吃蛇</div>
              <div class="game-desc">经典怀旧游戏</div>
            </div>
          </router-link>
        </div>

        <div class="game-card-wrapper">
          <router-link to="/tcm-study" class="game-card tcm-card">
            <div class="game-icon">💊</div>
            <div class="game-info">
              <div class="game-title">中医经典研习</div>
              <div class="game-desc">伤寒 · 金匮 · 温病</div>
            </div>
          </router-link>
        </div>
        
        <div class="game-card coming-soon">
          <div class="game-icon">➕</div>
          <div class="game-info">
            <div class="game-title">敬请期待</div>
            <div class="game-desc">更多项目开发中...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, mostly using global style.css */
.home-page {
    width: 100%;
    height: 100%;
}

.tcm-card {
  background: linear-gradient(135deg, #2c3e50 0%, #4a708b 100%);
  color: white;
  border: 1px solid #4a708b;
}

.tcm-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(74, 112, 139, 0.3);
  background: linear-gradient(135deg, #34495e 0%, #5d8aa8 100%);
}

.tcm-card .game-title {
  color: white;
}

.tcm-card .game-desc {
  color: rgba(255, 255, 255, 0.8);
}
</style>
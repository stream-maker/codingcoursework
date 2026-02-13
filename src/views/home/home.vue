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
</style>
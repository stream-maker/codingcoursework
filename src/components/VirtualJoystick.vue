<template>
  <div class="d-pad-container">
    <div class="d-pad">
      <button class="d-btn up" @touchstart.prevent="emitDirection('UP')" @mousedown.prevent="emitDirection('UP')">
        <span class="arrow">▲</span>
      </button>
      <div class="middle-row">
        <button class="d-btn left" @touchstart.prevent="emitDirection('LEFT')" @mousedown.prevent="emitDirection('LEFT')">
          <span class="arrow">◀</span>
        </button>
        <div class="center-spacer"></div>
        <button class="d-btn right" @touchstart.prevent="emitDirection('RIGHT')" @mousedown.prevent="emitDirection('RIGHT')">
          <span class="arrow">▶</span>
        </button>
      </div>
      <button class="d-btn down" @touchstart.prevent="emitDirection('DOWN')" @mousedown.prevent="emitDirection('DOWN')">
        <span class="arrow">▼</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['changeDirection'])

const emitDirection = (direction) => {
  emit('changeDirection', direction)
}
</script>

<style scoped>
.d-pad-container {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 160px;
  height: 160px;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  touch-action: none;
}

.d-pad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.middle-row {
  display: flex;
  gap: 5px;
}

.center-spacer {
  width: 50px;
  height: 50px;
}

.d-btn {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.1s;
  padding: 0;
}

.d-btn:active {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0.95);
}

.arrow {
  color: white;
  font-size: 1.2rem;
  opacity: 0.9;
}

/* Optional: Add specific styling for active state if needed via class binding */
</style>

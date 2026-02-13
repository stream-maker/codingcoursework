<template>
  <div class="study-page">
    <div class="study-header">
      <button class="icon-btn" @click="handleExit">←</button>
      <div class="progress-bar-container">
        <div class="progress-text">
          <span>进度: {{ currentSessionIndex + 1 }} / {{ sessionQueue.length }}</span>
          <span>类型: {{ modeLabel }}</span>
        </div>
        <div class="progress-track">
          <div 
            class="progress-fill" 
            :style="{ width: ((currentSessionIndex + 1) / sessionQueue.length * 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="card-container" v-if="!isFinished && currentSessionItem">
      <!-- 1. Flashcard Mode -->
      <div v-if="currentSessionItem.type === 'flashcard'" class="flashcard-wrapper">
        <div 
          class="flashcard" 
          :class="{ flipped: isFlipped }" 
          @click="isFlipped = !isFlipped"
        >
          <div class="card-face card-front">
            <div class="card-content">
              <span class="card-label">原文背诵</span>
              <p class="original-text">{{ currentSessionItem.data.original_text }}</p>
              <p class="tap-hint">点击查看解析</p>
            </div>
          </div>
          <div class="card-face card-back">
            <div class="card-content">
              <span class="card-label">解析</span>
              <p class="translation-text">{{ currentSessionItem.data.translation }}</p>
            </div>
          </div>
        </div>
        <div class="action-bar" v-if="isFlipped">
          <button class="action-btn forgot" @click="submitResult('forgot')">模糊</button>
          <button class="action-btn vague" @click="submitResult('vague')">有印象</button>
          <button class="action-btn mastered" @click="submitResult('mastered')">掌握</button>
        </div>
      </div>

      <!-- 2. Choice Mode -->
      <div v-else-if="currentSessionItem.type === 'choice'" class="choice-wrapper">
        <div class="question-card">
          <span class="card-label">单选题</span>
          <p class="question-text">{{ currentSessionItem.data.choice.question }}</p>
          
          <div class="options-list">
            <button 
              v-for="opt in currentSessionItem.data.choice.options" 
              :key="opt"
              class="option-btn"
              :class="{ 
                selected: selectedOption === opt,
                correct: showAnswer && opt === currentSessionItem.data.choice.answer,
                wrong: showAnswer && selectedOption === opt && opt !== currentSessionItem.data.choice.answer
              }"
              @click="handleSelect(opt)"
              :disabled="showAnswer"
            >
              {{ opt }}
            </button>
          </div>

          <div v-if="showAnswer" class="feedback-area">
            <p :class="isCorrect ? 'correct-text' : 'wrong-text'">
              {{ isCorrect ? '回答正确！' : '回答错误，正确答案是：' + currentSessionItem.data.choice.answer }}
            </p>
            <button class="next-btn" @click="submitResult(isCorrect ? 'correct' : 'wrong')">下一步</button>
          </div>
        </div>
      </div>

      <!-- 3. Fill Mode -->
      <div v-else-if="currentSessionItem.type === 'fill'" class="fill-wrapper">
        <div class="question-card">
          <span class="card-label">填空题</span>
          <p class="fill-text" v-html="formattedFillText"></p>
          
          <div class="fill-inputs">
            <input 
              v-for="(ans, idx) in currentSessionItem.data.fill.answers" 
              :key="idx"
              type="text"
              v-model="userFills[idx]"
              :placeholder="'第' + (idx+1) + '空'"
              :disabled="showAnswer"
              @keyup.enter="handleFillSubmit"
            >
          </div>

          <div v-if="!showAnswer" class="submit-area">
            <button class="check-btn" @click="handleFillSubmit">检查答案</button>
          </div>

          <div v-if="showAnswer" class="feedback-area">
            <p :class="isFillCorrect ? 'correct-text' : 'wrong-text'">
              {{ isFillCorrect ? '完全正确！' : '不完全正确' }}
            </p>
            <div class="correct-answers" v-if="!isFillCorrect">
              正确答案：{{ currentSessionItem.data.fill.answers.join('，') }}
            </div>
            <button class="next-btn" @click="submitResult(isFillCorrect ? 'correct' : 'wrong')">下一步</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Session Completed -->
    <div v-else-if="isFinished" class="empty-state">
      <div class="zen-circle"></div>
      <h2>功德圆满</h2>
      <p class="completion-desc">本次研习已完成，共 {{ sessionResults.length }} 题。</p>
      
      <div class="results-summary">
          <div class="stat-box correct">
              <span class="stat-value">{{ correctCount }}</span>
              <span class="stat-label">掌握/正确</span>
          </div>
          <div class="stat-box wrong">
              <span class="stat-value">{{ wrongCount }}</span>
              <span class="stat-label">模糊/错误</span>
          </div>
      </div>

      <div class="results-list">
          <div v-for="(item, index) in sessionResults" :key="index" class="result-item" :class="getResultClass(item)">
              <div class="result-info">
                  <span class="result-index">{{ index + 1 }}</span>
                  <span class="result-type">{{ getModeLabel(item.type) }}</span>
              </div>
              <div class="result-content" :title="getResultContent(item)">{{ getResultContent(item) }}</div>
              <span class="result-status">{{ getResultStatus(item.userResult) }}</span>
          </div>
      </div>
      
      <div class="summary-actions">
        <button class="action-btn-outline" @click="handleBackToHome">返回目录</button>
        <button class="action-btn-primary" @click="handleRestart">继续研习</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTcmStudy } from '../../composables/useTcmStudy'

const route = useRoute()
const router = useRouter()
const { loadBook, startSession, sessionQueue, currentSessionIndex, currentSessionItem, sessionResults, nextSessionItem, handleResult } = useTcmStudy()

const isFinished = ref(false)
const currentConfig = ref(null)

// Common state
const isFlipped = ref(false)
const showAnswer = ref(false)

// Choice state
const selectedOption = ref(null)
const isCorrect = computed(() => selectedOption.value === currentSessionItem.value?.data.choice.answer)

// Fill state
const userFills = ref([])
const isFillCorrect = computed(() => {
    if (!currentSessionItem.value) return false
    return currentSessionItem.value.data.fill.answers.every((ans, idx) => 
        (userFills.value[idx] || '').trim() === ans
    )
})

const modeLabel = computed(() => {
    if (!currentSessionItem.value) return ''
    const labels = { flashcard: '记忆卡片', choice: '单选题', fill: '填空题' }
    return labels[currentSessionItem.value.type]
})

const formattedFillText = computed(() => {
    if (currentSessionItem.value?.type !== 'fill') return ''
    // Replace ____ with styled span
    return currentSessionItem.value.data.fill.text.replace(/____/g, '<span class="blank">____</span>')
})

onMounted(() => {
  const bookId = route.params.bookId
  if (bookId) {
    loadBook(bookId)
    // Get config from session storage
    const configStr = sessionStorage.getItem('tcm_session_config')
    let config = { flashcards: 10, choices: 5, fills: 5 }
    
    if (configStr) {
        config = JSON.parse(configStr)
    }
    
    currentConfig.value = config
    startSession(config)
  }
})

// Reset states when item changes
watch(currentSessionItem, (newItem) => {
    isFlipped.value = false
    showAnswer.value = false
    selectedOption.value = null
    userFills.value = []
})

const handleSelect = (opt) => {
    selectedOption.value = opt
    showAnswer.value = true
}

const handleFillSubmit = () => {
    if (userFills.value.length === 0) return
    showAnswer.value = true
}

const correctCount = computed(() => sessionResults.value.filter(r => ['mastered', 'correct'].includes(r.userResult)).length)
const wrongCount = computed(() => sessionResults.value.filter(r => ['forgot', 'vague', 'wrong'].includes(r.userResult)).length)

const getResultClass = (item) => {
    const result = item.userResult
    if (['mastered', 'correct'].includes(result)) return 'result-correct'
    if (result === 'vague') return 'result-vague'
    return 'result-wrong'
}

const getModeLabel = (type) => {
    const labels = { flashcard: '背诵', choice: '选择', fill: '填空' }
    return labels[type] || type
}

const getResultContent = (item) => {
    if (item.type === 'flashcard') return item.data.original_text
    if (item.type === 'choice') return item.data.choice.question
    if (item.type === 'fill') return item.data.fill.text.replace(/____/g, '___')
    return ''
}

const getResultStatus = (result) => {
    const map = {
        'mastered': '掌握',
        'correct': '正确',
        'vague': '有印象',
        'forgot': '模糊',
        'wrong': '错误'
    }
    return map[result] || result
}

const submitResult = (result) => {
    if (currentSessionItem.value) {
        handleResult(currentSessionItem.value.data.id, result)
    }
    const hasNext = nextSessionItem()
    if (!hasNext) {
        isFinished.value = true
    }
}

const handleRestart = () => {
    isFinished.value = false
    if (currentConfig.value) {
        startSession(currentConfig.value)
    }
}

const handleBackToHome = () => {
    router.push('/tcm-study')
}

const handleExit = () => {
    if (confirm('确定要退出本次研习吗？进度将不会保存。')) {
        router.push(`/tcm-study/${route.params.bookId}/config`)
    }
}
</script>

<style scoped>
.study-page {
  min-height: 100vh;
  background-color: #fcf9f2;
  font-family: 'Noto Serif SC', serif;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.study-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #3e4a52;
}

.progress-bar-container {
  flex: 1;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #8a98a5;
  margin-bottom: 0.25rem;
}

.progress-track {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #b35c44;
  transition: width 0.3s ease;
}

.card-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

/* Flashcard Styles (Keep existing) */
.flashcard-wrapper {
  width: 100%;
  max-width: 400px;
  perspective: 1000px;
}
.flashcard {
  position: relative;
  width: 100%;
  min-height: 400px;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  cursor: pointer;
}
.flashcard.flipped { transform: rotateY(180deg); }
.card-face {
  position: absolute;
  width: 100%; height: 100%;
  backface-visibility: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
  justify-content: center; padding: 2rem;
  border: 1px solid #efeadd;
  box-sizing: border-box;
}
.card-back { transform: rotateY(180deg); background: #fffaf0; }
.card-label {
  position: absolute; top: 1.5rem; left: 1.5rem;
  font-size: 0.8rem; color: #b35c44;
  border: 1px solid #b35c44; padding: 2px 8px; border-radius: 4px;
}
.original-text { font-size: 1.5rem; font-weight: bold; text-align: center; }
.translation-text { font-size: 1.1rem; line-height: 1.8; color: #555; }

/* Choice & Fill Styles */
.question-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 1px solid #efeadd;
  position: relative;
}

.question-text, .fill-text {
  font-size: 1.3rem;
  line-height: 1.6;
  color: #000000; /* 纯黑色增强对比度 */
  margin-bottom: 2rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-btn {
  padding: 1rem;
  border: 1px solid #efeadd;
  background: #fcf9f2;
  border-radius: 8px;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  color: #000000; /* 选项文字设为黑色 */
}

.option-btn:hover:not(:disabled) {
  background: #efeadd;
}

.option-btn.selected {
  border-color: #b35c44;
}

.option-btn.correct {
  background: #e8f5e9;
  border-color: #2e7d32;
  color: #2e7d32;
}

.option-btn.wrong {
  background: #ffebee;
  border-color: #d32f2f;
  color: #d32f2f;
}

.fill-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.fill-inputs input {
  padding: 0.8rem;
  border: 1px solid #efeadd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.completion-desc {
  color: #666;
  margin-bottom: 2rem;
}

.results-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #efeadd;
  min-width: 120px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
}

.stat-box.correct .stat-value { color: #2e7d32; }
.stat-box.wrong .stat-value { color: #d32f2f; }

.results-list {
  width: 100%;
  max-width: 600px;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  border: 1px solid #efeadd;
  padding: 1rem;
  margin-bottom: 2rem;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid #f5f5f5;
  gap: 1rem;
}

.result-item:last-child { border-bottom: none; }

.result-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.result-index {
  background: #f0f0f0;
  color: #666;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.result-type {
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fcf9f2;
  border: 1px solid #efeadd;
  color: #8a6d3b;
}

.result-content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
  font-size: 0.95rem;
  text-align: left;
}

.result-status {
  font-size: 0.9rem;
  font-weight: 500;
}

.result-correct .result-status { color: #2e7d32; }
.result-vague .result-status { color: #f57f17; }
.result-wrong .result-status { color: #d32f2f; }


.feedback-area {
  margin-top: 2rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.correct-text { color: #2e7d32; font-weight: bold; }
.wrong-text { color: #d32f2f; font-weight: bold; }

.next-btn, .check-btn {
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  background: #3e4a52;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.action-bar {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.forgot { background: #ffebee; color: #d32f2f; }
.vague { background: #fff3e0; color: #ef6c00; }
.mastered { background: #e8f5e9; color: #2e7d32; }

.empty-state { text-align: center; padding: 2rem; }
.zen-circle { width: 80px; height: 80px; border: 3px solid #efeadd; border-radius: 50%; margin: 0 auto 2rem; }
.home-btn { padding: 1rem 2rem; background: #3e4a52; color: white; border: none; border-radius: 4px; cursor: pointer; }

.summary-actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
}

.action-btn-primary {
  padding: 0.8rem 2rem;
  background: #3e4a52;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.action-btn-primary:hover {
  background: #2c3e50;
}

.action-btn-outline {
  padding: 0.8rem 2rem;
  background: transparent;
  color: #3e4a52;
  border: 1px solid #3e4a52;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-btn-outline:hover {
  background: #3e4a52;
  color: white;
}

:deep(.blank) {
    color: #b35c44;
    font-weight: bold;
    text-decoration: underline;
}
</style>

import { ref, computed, reactive, onUnmounted } from 'vue'
import shanghanlunData from '../data/shanghanlun.json'
import jinguiData from '../data/jingui.json'
import wenbingData from '../data/wenbing.json'
import neijingData from '../data/neijing.json'

const BOOKS = {
  'shanghanlun': shanghanlunData,
  'jingui': jinguiData,
  'wenbing': wenbingData,
  'neijing': neijingData
}

const STORAGE_KEY = 'tcm_study_progress'

export function useTcmStudy() {
  const currentBookId = ref('shanghanlun')
  const allCards = ref([])
  const progress = reactive({}) 
  const nowRef = ref(Date.now())
  
  // Session state
  const sessionQueue = ref([])
  const currentSessionIndex = ref(0)
  const sessionResults = ref([])

  const loadProgress = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        Object.assign(progress, JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load progress', e)
    }
  }

  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }

  const loadBook = (bookId) => {
    currentBookId.value = bookId
    if (BOOKS[bookId]) {
      allCards.value = BOOKS[bookId]
    } else {
      allCards.value = []
    }
    loadProgress()
  }

  // Spaced Repetition Logic for "Due" cards (Flashcards only)
  const dueCards = computed(() => {
    const now = nowRef.value
    return allCards.value.filter(card => {
      const cardProgress = progress[card.id]
      if (!cardProgress) return true 
      return cardProgress.nextReview <= now
    })
  })

  // Start a new study session with specified counts for each mode
  const startSession = (config) => {
    sessionResults.value = []
    const { flashcards, choices, fills } = config
    const queue = []

    // 1. Flashcards (Prefer due cards, then others)
    const sortedForFlash = [...allCards.value].sort((a, b) => {
        const pA = progress[a.id]?.nextReview || 0
        const pB = progress[b.id]?.nextReview || 0
        return pA - pB
    })
    sortedForFlash.slice(0, flashcards).forEach(card => {
        queue.push({ type: 'flashcard', data: card })
    })

    // 2. Choices (Randomly select)
    const cardsWithChoice = allCards.value.filter(c => c.choice)
    const selectedChoices = [...cardsWithChoice]
        .sort(() => Math.random() - 0.5)
        .slice(0, choices)
    selectedChoices.forEach(card => {
        queue.push({ type: 'choice', data: card })
    })

    // 3. Fills (Randomly select)
    const cardsWithFill = allCards.value.filter(c => c.fill)
    const selectedFills = [...cardsWithFill]
        .sort(() => Math.random() - 0.5)
        .slice(0, fills)
    selectedFills.forEach(card => {
        queue.push({ type: 'fill', data: card })
    })

    sessionQueue.value = queue
    currentSessionIndex.value = 0
  }

  const currentSessionItem = computed(() => {
    if (sessionQueue.value.length === 0) return null
    return sessionQueue.value[currentSessionIndex.value]
  })

  const nextSessionItem = () => {
    if (currentSessionIndex.value < sessionQueue.value.length - 1) {
        currentSessionIndex.value++
        return true
    }
    return false // Session finished
  }

  const handleResult = (cardId, result) => {
     // Record result for summary
     const currentItem = sessionQueue.value[currentSessionIndex.value]
     if (currentItem && currentItem.data.id === cardId) {
       sessionResults.value.push({
         ...currentItem,
         userResult: result,
         timestamp: Date.now()
       })
     }

     const now = Date.now()
     let nextReview = now
     let level = 0
     
     const current = progress[cardId] || { level: 0 }
     
     if (result === 'forgot' || result === 'wrong') {
         nextReview = now + 5 * 60 * 1000 
         level = 0
     } else if (result === 'vague') {
         nextReview = now + 24 * 60 * 60 * 1000 
         level = 1
     } else if (result === 'mastered' || result === 'correct') {
         const days = current.level >= 2 ? 7 : 3
         nextReview = now + days * 24 * 60 * 60 * 1000
         level = Math.max(2, current.level + 1)
     }

     progress[cardId] = { nextReview, level }
     saveProgress()
  }

  let timer
  const startTimer = () => {
    timer = setInterval(() => {
      nowRef.value = Date.now()
    }, 60000)
  }
  startTimer()
  onUnmounted(() => { if (timer) clearInterval(timer) })

  return {
    currentBookId,
    allCards,
    dueCards,
    sessionQueue,
    currentSessionIndex,
    currentSessionItem,
    sessionResults,
    startSession,
    nextSessionItem,
    loadBook,
    handleResult
  }
}

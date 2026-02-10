document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userDisplay = document.getElementById('userDisplay');
    
    const authModal = document.getElementById('authModal');
    const authForm = document.getElementById('authForm');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authMessage = document.getElementById('authMessage');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    const leaderboardBtns = document.querySelectorAll('.leaderboard-btn');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const leaderboardList = document.getElementById('leaderboardList');
    
    // Export/Import Elements
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');

    const closeModals = document.querySelectorAll('.close-modal');

    let currentAuthMode = 'login'; // 'login' or 'register'
    let currentLeaderboardGame = 'snake';

    // --- UI Update Functions ---
    
    function updateAuthUI() {
        const user = Utils.getCurrentUser();
        if (user) {
            userInfo.classList.remove('hidden');
            loginBtn.classList.add('hidden');
            userDisplay.textContent = Utils.getUserDisplay(user);
        } else {
            userInfo.classList.add('hidden');
            loginBtn.classList.remove('hidden');
            userDisplay.textContent = '';
        }
    }

    // --- Event Listeners ---

    // Initial check
    updateAuthUI();

    // Login Button
    loginBtn.addEventListener('click', () => {
        authModal.classList.remove('hidden');
        resetAuthForm();
    });

    // Logout Button
    logoutBtn.addEventListener('click', () => {
        Utils.logout();
        updateAuthUI();
    });

    // Close Modals
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            authModal.classList.add('hidden');
            leaderboardModal.classList.add('hidden');
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.add('hidden');
        if (e.target === leaderboardModal) leaderboardModal.classList.add('hidden');
    });

    // Auth Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAuthMode = btn.dataset.tab;
            
            const nicknameInput = document.getElementById('nicknameInput');
            if (currentAuthMode === 'login') {
                authTitle.textContent = '登录';
                authSubmitBtn.textContent = '登录';
                nicknameInput.placeholder = '请输入 昵称#后四位';
            } else {
                authTitle.textContent = '注册';
                authSubmitBtn.textContent = '注册';
                nicknameInput.placeholder = '请输入 昵称';
            }
            authMessage.textContent = '';
        });
    });

    function resetAuthForm() {
        authForm.reset();
        authMessage.textContent = '';
        // Reset to login tab
        tabBtns[0].click(); 
    }

    // Auth Form Submit
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nickname = document.getElementById('nicknameInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim();

        if (!nickname || !password) {
            authMessage.textContent = '请填写所有字段';
            return;
        }

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = '处理中...';

        let result;
        if (currentAuthMode === 'login') {
            result = await Utils.login(nickname, password);
        } else {
            result = await Utils.register(nickname, password);
            if (result.success) {
                alert(`注册成功！您的全称是：${result.user.nickname}\n请牢记此名称用于后续登录。`);
            }
        }

        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = currentAuthMode === 'login' ? '登录' : '注册';

        if (result.success) {
            authModal.classList.add('hidden');
            updateAuthUI();
        } else {
            authMessage.textContent = result.message;
        }
    });

    // Leaderboard
    leaderboardBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent clicking game card
            const game = btn.dataset.game;
            currentLeaderboardGame = game;
            showLeaderboard(game);
        });
    });

    // Export/Import Handlers
    exportBtn.addEventListener('click', async () => {
        exportBtn.textContent = '导出中...';
        exportBtn.disabled = true;
        
        const result = await Utils.exportLeaderboard(currentLeaderboardGame);
        
        if (result.success) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentLeaderboardGame}_leaderboard_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert('导出失败: ' + result.message);
        }
        
        exportBtn.textContent = '导出数据';
        exportBtn.disabled = false;
    });

    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            importBtn.textContent = '导入中...';
            importBtn.disabled = true;
            
            const content = event.target.result;
            const result = await Utils.importLeaderboard(content);
            
            if (result.success) {
                alert(`成功导入 ${result.count} 条记录！`);
                showLeaderboard(currentLeaderboardGame); // Refresh
            } else {
                alert('导入失败: ' + result.message);
            }
            
            importBtn.textContent = '导入数据';
            importBtn.disabled = false;
            importInput.value = ''; // Reset
        };
        reader.readAsText(file);
    });

    async function showLeaderboard(game) {
        leaderboardModal.classList.remove('hidden');
        leaderboardList.innerHTML = '<p class="loading-text">加载数据库...</p>';

        const scores = await Utils.getLeaderboard(game);
        
        if (scores.length === 0) {
            leaderboardList.innerHTML = '<p class="empty-text">暂无记录，快去挑战吧！</p>';
            return;
        }

        let html = '<table class="leaderboard-table"><thead><tr><th>排名</th><th>玩家</th><th>分数</th><th>日期</th></tr></thead><tbody>';
        
        scores.forEach((s, index) => {
            const date = new Date(s.date).toLocaleDateString();
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1;
            
            // Format user display for leaderboard (Nickname #Last4)
            // If nickname already contains #, use it directly
            let playerDisplay;
            if (s.nickname.includes('#')) {
                const parts = s.nickname.split('#');
                const name = parts.slice(0, -1).join('#');
                const suffix = parts[parts.length - 1];
                playerDisplay = `${name} <span class="uuid-tag">#${suffix}</span>`;
            } else {
                const shortUuid = s.uuid.slice(-4);
                playerDisplay = `${s.nickname} <span class="uuid-tag">#${shortUuid}</span>`;
            }

            html += `
                <tr class="${rankClass}">
                    <td class="rank-col">${rankIcon}</td>
                    <td class="player-col">${playerDisplay}</td>
                    <td class="score-col">${s.score}</td>
                    <td class="date-col">${date}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        leaderboardList.innerHTML = html;
    }
});

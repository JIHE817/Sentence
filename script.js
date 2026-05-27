// API 基础地址（后端运行地址）
const API_BASE = 'http://127.0.0.1:5000';

// 辅助函数：发送请求（自动携带 cookie）
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',  // 重要：携带 session cookie
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    return response;
}

// 显示消息
function showMessage(element, message, isError = true) {
    element.textContent = message;
    element.className = `message ${isError ? 'error' : 'success'}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 3000);
}

// 检查登录状态，并切换界面
async function checkLogin() {
    const res = await apiRequest('/me');
    if (res.ok) {
        const data = await res.json();
        // 原有界面切换
        document.getElementById('displayUsername')?.setAttribute('data-username', data.username); // 不再使用底部欢迎标题，但仍保留变量
        document.getElementById('unauth-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'block';
        
        // 显示右上角区域并设置用户名
        document.getElementById('welcome-area').style.display = 'flex';
        document.getElementById('topUsername').innerText = data.username;
        
        // 自动获取一条随机句子
        fetchRandomSentence();
    } else {
        document.getElementById('unauth-section').style.display = 'block';
        document.getElementById('auth-section').style.display = 'none';
        
        // 未登录时隐藏右上角区域
        document.getElementById('welcome-area').style.display = 'none';
    }
}

// 获取随机句子
async function fetchRandomSentence() {
    const sentenceElement = document.getElementById('sentenceContent');
    sentenceElement.innerText = '加载中...';
    const res = await apiRequest('/random-sentence');
    if (res.ok) {
        const data = await res.json();
        sentenceElement.innerText = data.content;
    } else if (res.status === 401) {
        sentenceElement.innerText = '请先登录';
        checkLogin();
    } else {
        const err = await res.json();
        sentenceElement.innerText = err.error || '获取失败';
    }
}

// 注册
async function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msgDiv = document.getElementById('authMessage');

    if (!username || !password) {
        showMessage(msgDiv, '用户名和密码不能为空', true);
        return;
    }

    const res = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        showMessage(msgDiv, data.message || '注册成功，请登录', false);
        document.getElementById('password').value = '';
    } else {
        showMessage(msgDiv, data.error || '注册失败', true);
    }
}

// 登录
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msgDiv = document.getElementById('authMessage');

    if (!username || !password) {
        showMessage(msgDiv, '用户名和密码不能为空', true);
        return;
    }

    const res = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        showMessage(msgDiv, data.message || '登录成功', false);
        checkLogin();  // 刷新界面
    } else {
        showMessage(msgDiv, data.error || '登录失败', true);
    }
}

// 上传句子
async function uploadSentence() {
    const content = document.getElementById('newSentence').value.trim();
    const msgDiv = document.getElementById('uploadMessage');
    if (!content) {
        showMessage(msgDiv, '句子内容不能为空', true);
        return;
    }

    const res = await apiRequest('/add-sentence', {
        method: 'POST',
        body: JSON.stringify({ content })
    });
    const data = await res.json();
    if (res.ok) {
        showMessage(msgDiv, data.message || '上传成功', false);
        document.getElementById('newSentence').value = '';
    } else {
        showMessage(msgDiv, data.error || '上传失败', true);
        if (res.status === 401) checkLogin();
    }
}

// 登出
async function logout() {
    await apiRequest('/logout', { method: 'POST' });
    checkLogin();
}

// 绑定事件
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('registerBtn').addEventListener('click', register);
document.getElementById('randomBtn').addEventListener('click', fetchRandomSentence);
document.getElementById('uploadBtn').addEventListener('click', uploadSentence);
document.getElementById('topLogoutBtn').addEventListener('click', logout);

// 页面加载时检查登录状态
checkLogin();
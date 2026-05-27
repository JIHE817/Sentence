const API_BASE = 'http://127.0.0.1:5000';

// 获取当前输入的管理密钥
function getAdminKey() {
    return document.getElementById('adminKey').value.trim();
}

// 发起带管理密钥的请求
async function adminRequest(endpoint, options = {}) {
    const adminKey = getAdminKey();
    if (!adminKey) {
        alert('请先输入管理密钥');
        throw new Error('No admin key');
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey,
            ...options.headers
        }
    });
    if (response.status === 403) {
        alert('管理密钥错误，操作被拒绝');
        throw new Error('Unauthorized');
    }
    return response;
}

// 加载所有句子并渲染列表
async function loadSentences() {
    const listDiv = document.getElementById('sentenceList');
    listDiv.innerHTML = '<p class="placeholder">加载中...</p>';
    
    try {
        const res = await adminRequest('/sentences');
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '加载失败');
        }
        const sentences = await res.json();
        renderSentenceList(sentences);
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            listDiv.innerHTML = `<p class="placeholder">加载失败: ${err.message}</p>`;
        } else {
            listDiv.innerHTML = '<p class="placeholder">请检查管理密钥后重新加载</p>';
        }
    }
}

// 渲染句子列表（支持编辑和删除）
function renderSentenceList(sentences) {
    const listDiv = document.getElementById('sentenceList');
    if (!sentences.length) {
        listDiv.innerHTML = '<p class="placeholder">暂无句子，请添加</p>';
        return;
    }

    listDiv.innerHTML = '';
    sentences.forEach(s => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.dataset.id = s.id;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'sentence-info';
        infoDiv.innerHTML = `
            <div>
                <span class="sentence-id">#${s.id}</span>
                <span class="sentence-content">${escapeHtml(s.content)}</span>
            </div>
            <div class="sentence-meta">上传者: ${s.user_id === null ? '系统' : `用户ID ${s.user_id}`}</div>
        `;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = '编辑';
        editBtn.className = 'edit-btn';
        editBtn.onclick = () => editSentence(s.id, s.content);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteSentence(s.id);
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        listDiv.appendChild(card);
    });
}

// 简单的防XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 编辑句子
async function editSentence(id, oldContent) {
    const newContent = prompt('编辑句子内容:', oldContent);
    if (newContent === null || newContent.trim() === '') return;
    try {
        const res = await adminRequest(`/sentences/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ content: newContent.trim() })
        });
        if (res.ok) {
            alert('编辑成功');
            loadSentences();
        } else {
            const err = await res.json();
            alert(err.error || '编辑失败');
        }
    } catch (err) {
        alert('请求失败');
    }
}

// 删除句子
async function deleteSentence(id) {
    if (!confirm('确定要删除这条句子吗？')) return;
    try {
        const res = await adminRequest(`/sentences/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            alert('删除成功');
            loadSentences();
        } else {
            const err = await res.json();
            alert(err.error || '删除失败');
        }
    } catch (err) {
        alert('请求失败');
    }
}

// 添加新句子
async function addSentence() {
    const content = document.getElementById('newSentence').value.trim();
    if (!content) {
        alert('请输入句子内容');
        return;
    }
    try {
        const res = await adminRequest('/sentences', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        if (res.ok) {
            alert('添加成功');
            document.getElementById('newSentence').value = '';
            loadSentences();
        } else {
            const err = await res.json();
            alert(err.error || '添加失败');
        }
    } catch (err) {
        alert('请求失败');
    }
}

// 绑定事件
document.getElementById('loadBtn').addEventListener('click', loadSentences);
document.getElementById('addBtn').addEventListener('click', addSentence);

// 初次加载时提示输入密钥（不自动加载）
const state = {
    bots: [],
    currentBot: null,
    chats: {},
    currentChatId: null,
    pollAbort: null,
    polling: false,
    offset: 0
};

let selectedBotForMenu = null;

const viewLogin = document.getElementById('view-login');
const viewMain = document.getElementById('view-main');
const botListEl = document.getElementById('botList');

const addOverlay = document.getElementById('addOverlay');
const tokenInput = document.getElementById('tokenInput');
const addBtn = document.getElementById('addBtn');
const addSpinner = document.getElementById('addSpinner');
const addError = document.getElementById('addError');
const cancelAddBtn = document.getElementById('cancelAddBtn');

const dropmenu = document.getElementById('dropmenu');
const deleteBotOption = document.getElementById('deleteBotOption');

const backToLoginBtn = document.getElementById('backToLogin');
const currentBotMini = document.getElementById('currentBotMini');
const chatListEl = document.getElementById('chatList');
const searchInput = document.getElementById('searchInput');

const chatPanel = document.getElementById('chatPanel');
const chatEmpty = document.getElementById('chatEmpty');
const chatActive = document.getElementById('chatActive');
const mobileBackBtn = document.getElementById('mobileBackBtn');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderStatus = document.getElementById('chatHeaderStatus');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

document.addEventListener('contextmenu', (e) => e.preventDefault());

function renderBotList() {
    state.bots = loadBots();
    botListEl.innerHTML = '';

    state.bots.forEach((bot) => {
        const el = document.createElement('div');
        el.className = 'acc';
        el.dataset.botId = bot.id;
        el.innerHTML = `
          ${renderAvatarHTML(bot.name, bot.id)}
          <div class="text">
            <h2 class="botname">${escapeHtml(bot.name)}</h2>
            <p>@${escapeHtml(bot.username)}</p>
          </div>
        `;
        el.addEventListener('click', () => openBot(bot));
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            selectedBotForMenu = bot;
            openDropMenu(e.pageX, e.pageY);
        });

        botListEl.appendChild(el);
    });

    const addTile = document.createElement('div');
    addTile.className = 'acc add-acc';
    addTile.id = 'open-bot-menu';
    addTile.innerHTML = `
      <div class="avatar">
        <svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
      </div>
      <div class="text"><h2>Add a bot</h2></div>
    `;
    addTile.addEventListener('click', openAddMenu);
    botListEl.appendChild(addTile);
}

function appendMessageIfOpen(botId, chatId, m) {
    if (!(state.currentBot && state.currentBot.id === botId && state.currentChatId === chatId)) return;
    
    const day = formatDayDivider(m.date);
    const dividers = messagesContainer.querySelectorAll('.day-divider');
    const lastDividerText = dividers.length ? dividers[dividers.length - 1].textContent : null;
    
    if (day !== lastDividerText) {
        messagesContainer.appendChild(buildDayDivider(day));
    }
    messagesContainer.appendChild(buildMessageRow(m));
    scrollMessagesToBottom();
}

function openDropMenu(x, y) {
    dropmenu.classList.add('active');
    const menuW = 190, menuH = 60;
    const left = Math.min(x, window.innerWidth - menuW - 8);
    const top = Math.min(y, window.innerHeight - menuH - 8);
    dropmenu.style.left = `${left}px`;
    dropmenu.style.top = `${top}px`;
}

document.addEventListener('click', (e) => {
    if (!dropmenu.contains(e.target)) dropmenu.classList.remove('active');
});

deleteBotOption.addEventListener('click', () => {
    if (!selectedBotForMenu) return;
    const bot = selectedBotForMenu;

    saveBots(loadBots().filter((b) => b.id !== bot.id));
    deleteBotStorage(bot.id);

    dropmenu.classList.remove('active');
    selectedBotForMenu = null;
    renderBotList();
    showToast('Bot deleted');
});

function openAddMenu() {
    tokenInput.value = '';
    addError.textContent = '';
    addOverlay.classList.add('active');
    setTimeout(() => tokenInput.focus(), 150);
}

function closeAddMenu() {
    addOverlay.classList.remove('active');
}

cancelAddBtn.addEventListener('click', closeAddMenu);
addOverlay.addEventListener('click', (e) => {
    if (e.target === addOverlay) closeAddMenu();
});

tokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

addBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    addError.textContent = '';
    if (!token) {
        addError.textContent = 'Please paste a bot token.';
        return;
    }

    if (loadBots().some((b) => b.token === token)) {
        addError.textContent = 'This bot is already added.';
        return;
    }

    addBtn.disabled = true;
    addSpinner.hidden = false;

    const result = await checkToken(token);

    addBtn.disabled = false;
    addSpinner.hidden = true;

    if (!result.ok) {
        addError.textContent = result.error || 'Invalid token — could not verify this bot.';
        return;
    }

    const me = result.me;
    const bot = {
        id: String(me.id),
        token,
        name: me.first_name || me.username || 'Bot',
        username: me.username || ''
    };

    const bots = loadBots();
    bots.push(bot);
    saveBots(bots);

    closeAddMenu();
    renderBotList();
    showToast(`Added @${bot.username}`);
});

function switchView(name) {
    viewLogin.classList.toggle('active', name === 'login');
    viewMain.classList.toggle('active', name === 'main');
}

async function openBot(bot) {
    state.currentBot = bot;
    state.currentChatId = null;
    state.chats = loadChats(bot.id);
    state.offset = loadOffset(bot.id);

    currentBotMini.innerHTML = renderAvatarHTML(bot.name, bot.id, 'bot-mini-img');
    currentBotMini.title = `@${bot.username}`;

    switchView('main');
    chatActive.hidden = true;
    chatEmpty.hidden = false;
    chatPanel.classList.remove('open');

    renderChatList();

    try {
        await tgApi(bot.token, 'deleteWebhook', { drop_pending_updates: false });
    } catch (e) {}

    startPolling();
}

backToLoginBtn.addEventListener('click', () => {
    stopPolling();
    state.currentBot = null;
    switchView('login');
    renderBotList();
});

function getSortedChats() {
    return Object.values(state.chats).sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0));
}

function renderChatList() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const chats = getSortedChats().filter((c) => {
        if (!query) return true;
        return chatDisplayName(c).toLowerCase().includes(query);
    });
  
    chatListEl.innerHTML = '';
  
    if (chats.length === 0) {
        chatListEl.innerHTML = `<div class="empty-list">No chats</div>`;
        return;
    }
  
    chats.forEach((chat) => {
        const el = document.createElement('div');
        el.className = 'chat-item' + (chat.id === state.currentChatId ? ' selected' : '');
        el.dataset.chatId = chat.id;
        
        const preview = chat.lastMessage ? escapeHtml(chat.lastMessage) : '';
        const time = chat.lastTime ? formatListTime(chat.lastTime) : '';
        const unread = chat.unread ? `<span class="unread-badge">${chat.unread > 99 ? '99+' : chat.unread}</span>` : '';
        
        el.innerHTML = `
            ${renderAvatarHTML(chatDisplayName(chat), chat.id)}
            <div class="meta">
              <div class="row1">
                <span class="name">${escapeHtml(chatDisplayName(chat))}</span>
                <span class="time">${time}</span>
              </div>
              <div class="row2">
                <span class="preview">${preview}</span>
                ${unread}
              </div>
            </div>
        `;
        el.addEventListener('click', () => openChat(chat.id));
        chatListEl.appendChild(el);
    });
}

searchInput.addEventListener('input', renderChatList);

function openChat(chatId) {
    state.currentChatId = chatId;
    const chat = state.chats[chatId];
    if (!chat) return;

    chat.unread = 0;
    saveChats(state.currentBot.id, state.chats);

    chatHeaderAvatar.innerHTML = renderAvatarHTML(chatDisplayName(chat), chat.id, 'avatar');
    chatHeaderName.textContent = chatDisplayName(chat);
    chatHeaderStatus.textContent = chat.username
        ? `@${chat.username}`
        : (chat.type === 'private' ? 'private chat' : chat.type || '');

    chatEmpty.hidden = true;
    chatActive.hidden = false;
    chatPanel.classList.add('open');

    renderMessages();
    renderChatList();
    messageInput.focus();
}

mobileBackBtn.addEventListener('click', () => {
    chatPanel.classList.remove('open');
    state.currentChatId = null;
});

function renderMessages() {
    const chatId = state.currentChatId;
    if (!chatId) return;

    const msgs = loadMessages(state.currentBot.id, chatId);
    messagesContainer.innerHTML = '';

    let lastDay = null;
    msgs.forEach((m) => {
        const day = formatDayDivider(m.date);
        if (day !== lastDay) {
            messagesContainer.appendChild(buildDayDivider(day));
            lastDay = day;
        }
        messagesContainer.appendChild(buildMessageRow(m));
    });

    scrollMessagesToBottom();
}

function buildDayDivider(text) {
    const divider = document.createElement('div');
    divider.className = 'day-divider';
    divider.textContent = text;
    return divider;
}

function buildMessageRow(m) {
    const row = document.createElement('div');
    row.className = 'msg-row ' + (m.from === 'bot' ? 'out' : 'in');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = `<span class="msg-text">${escapeHtml(m.text)}</span><span class="msg-time">${formatTime(m.date)}</span>`;
    row.appendChild(bubble);
    return row;
}

function scrollMessagesToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
});

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCurrentMessage();
    }
});

sendBtn.addEventListener('click', sendCurrentMessage);

async function sendCurrentMessage() {
    const text = messageInput.value.trim();
    if (!text || !state.currentChatId || !state.currentBot) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';

    const botId = state.currentBot.id;
    const chatId = state.currentChatId;
    const token = state.currentBot.token;

    const optimisticMsg = {
        id: 'local-' + Date.now(),
        from: 'bot',
        text,
        date: Math.floor(Date.now() / 1000),
        status: 'sending'
    };

    const msgs = loadMessages(botId, chatId);
    msgs.push(optimisticMsg);
    saveMessages(botId, chatId, msgs);
    appendMessageIfOpen(botId, chatId, optimisticMsg);
    updateChatPreview(botId, chatId, text, optimisticMsg.date, false);

    try {
        await tgApi(token, 'sendMessage', { chat_id: chatId, text });
        optimisticMsg.status = 'sent';
        saveMessages(botId, chatId, msgs);
    } catch (e) {
        optimisticMsg.status = 'failed';
        saveMessages(botId, chatId, msgs);
        showToast('Failed to send: ' + e.message);
        if (state.currentChatId === chatId) renderMessages();
    }
}

function updateChatPreview(botId, chatId, text, time, incrementUnread) {
    const chats = loadChats(botId);
    if (!chats[chatId]) return;

    chats[chatId].lastMessage = text;
    chats[chatId].lastTime = time;

    const chatIsOpen = state.currentBot && state.currentBot.id === botId && state.currentChatId === chatId;
    if (incrementUnread && !chatIsOpen) {
        chats[chatId].unread = (chats[chatId].unread || 0) + 1;
    }

    saveChats(botId, chats);

    if (state.currentBot && state.currentBot.id === botId) {
        state.chats = chats;
        renderChatList();
    }
}

function startPolling() {
    stopPolling();
    state.polling = true;
    pollLoop();
}

function stopPolling() {
    state.polling = false;
    if (state.pollAbort) {
        state.pollAbort.abort();
        state.pollAbort = null;
    }
}

async function pollLoop() {
    if (!state.polling || !state.currentBot) return;

    const bot = state.currentBot;
    const controller = new AbortController();
    state.pollAbort = controller;

    try {
        const updates = await tgApi(bot.token, 'getUpdates', {
          offset: state.offset ? state.offset + 1 : undefined,
          timeout: 25,
          allowed_updates: ['message']
        }, controller.signal);

        processUpdates(bot.id, updates);
    } catch (e) {
        if (e.name !== 'AbortError') {
            await sleep(3000);
        }
    }

    if (state.polling && state.currentBot && state.currentBot.id === bot.id) {
        pollLoop();
    }
}

function processUpdates(botId, updates) {
    if (!updates || updates.length === 0) return;

    let maxUpdateId = state.offset;
    const chats = loadChats(botId);

    updates.forEach((update) => {
        if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;

        const message = update.message;
        if (!message) return;

        const chat = message.chat;
        const chatId = String(chat.id);

        if (!chats[chatId]) {
            chats[chatId] = {
                id: chatId,
                type: chat.type,
                title: chat.title || null,
                first_name: chat.first_name || null,
                last_name: chat.last_name || null,
                username: chat.username || null,
                lastMessage: '',
                lastTime: 0,
                unread: 0
            };
        }

        const text = message.text || message.caption || '[non-text message]';
        const msgObj = { id: 'tg-' + message.message_id, from: 'user', text, date: message.date };

        const msgs = loadMessages(botId, chatId);
        msgs.push(msgObj);
        saveMessages(botId, chatId, msgs);

        chats[chatId].lastMessage = text;
        chats[chatId].lastTime = message.date;

        const isOpenHere = state.currentBot && state.currentBot.id === botId && state.currentChatId === chatId;
        if (isOpenHere) {
            appendMessageIfOpen(botId, chatId, msgObj);
        } else {
            chats[chatId].unread = (chats[chatId].unread || 0) + 1;
        }
    });

    saveChats(botId, chats);
    state.offset = maxUpdateId;
    saveOffset(botId, maxUpdateId);

    if (state.currentBot && state.currentBot.id === botId) {
        state.chats = chats;
        renderChatList();
    }
}

function handleAndroidBack() {
    if(dropmenu.classList.contains("active")){
        dropmenu.classList.remove("active");
        return true;
    }

    if(addOverlay.classList.contains("active")) {
        addOverlay.classList.remove("active");
        return true;
    }

    if(viewMain.classList.contains("active")){
        viewMain.classList.remove("active");
        viewLogin.classList.add("active");
        return true;
    }

    return false;
}

renderBotList();

window.addEventListener('beforeunload', () => {
    stopPolling();
});
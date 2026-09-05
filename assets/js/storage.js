const STORAGE_KEYS = {
    bots: 'tgbc_bots',
    chats: (botId) => `tgbc_chats_${botId}`,
    messages: (botId, chatId) => `tgbc_msgs_${botId}_${chatId}`,
    offset: (botId) => `tgbc_offset_${botId}`
};

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadBots() {
    return loadJSON(STORAGE_KEYS.bots, []);
}

function saveBots(bots) {
    saveJSON(STORAGE_KEYS.bots, bots);
}

function loadChats(botId) {
    return loadJSON(STORAGE_KEYS.chats(botId), {});
}

function saveChats(botId, chats) {
    saveJSON(STORAGE_KEYS.chats(botId), chats);
}

function loadMessages(botId, chatId) {
    return loadJSON(STORAGE_KEYS.messages(botId, chatId), []);
}

function saveMessages(botId, chatId, msgs) {
    saveJSON(STORAGE_KEYS.messages(botId, chatId), msgs);
}

function loadOffset(botId) {
    return Number(localStorage.getItem(STORAGE_KEYS.offset(botId)) || 0);
    
}
function saveOffset(botId, offset) {
    localStorage.setItem(STORAGE_KEYS.offset(botId), String(offset));
}

function deleteBotStorage(botId) {
    localStorage.removeItem(STORAGE_KEYS.chats(botId));
    localStorage.removeItem(STORAGE_KEYS.offset(botId));
    Object.keys(localStorage)
        .filter((k) => k.startsWith(`tgbc_msgs_${botId}_`))
        .forEach((k) => localStorage.removeItem(k));
}
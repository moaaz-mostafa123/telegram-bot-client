const avatarColors = ['#e17076', '#eda86c', '#a695e7', '#7bc862', '#6ec9cb', '#65aadd', '#ee7aae'];

function colorFor(id) {
    const n = Math.abs(String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    return avatarColors[n % avatarColors.length];
}

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '';
    const second = parts.length > 1 ? parts[1][0] : '';
    return (first + second).toUpperCase();
}

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderAvatarHTML(name, id, className) {
    return `<div class="${className || 'avatar'}" style="background:${colorFor(id)}">${escapeHtml(initials(name))}</div>`;
}

function formatTime(unixSeconds) {
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleTimeString([],
        { hour: '2-digit', minute: '2-digit' }
    );
}

function formatListTime(unixSeconds) {
    const d = new Date(unixSeconds * 1000);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([],
        { hour: '2-digit', minute: '2-digit' }
    );
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 7) return d.toLocaleDateString([],
        { weekday: 'short' }
    );
    return d.toLocaleDateString([],
        { day: '2-digit', month: '2-digit', year: '2-digit' }
    );
}

function formatDayDivider(unixSeconds) {
    const d = new Date(unixSeconds * 1000);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([],
        { day: 'numeric', month: 'long', year: 'numeric' }
    );
}

function chatDisplayName(chat) {
    if (chat.title) return chat.title;
    const full = [chat.first_name, chat.last_name].filter(Boolean).join(' ');
    return full || chat.username || `Chat ${chat.id}`;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2600);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
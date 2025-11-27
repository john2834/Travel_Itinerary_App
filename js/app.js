const app = {
    data: null,
    currentDayIndex: 0,
    isEditMode: false,
    editingItemId: null,

    init: function() {
        this.loadData();
        this.renderHeader();
        this.renderDateBar();
        this.renderTimeline();
    },

    // --- 資料存取 (PWA/Offline 核心) ---
    loadData: function() {
        const localData = localStorage.getItem('tripData');
        if (localData) {
            this.data = JSON.parse(localData);
        } else {
            this.data = defaultTripData; // 來自 data.js
        }
        document.getElementById('trip-title').innerText = this.data.title;
    },

    saveData: function() {
        localStorage.setItem('tripData', JSON.stringify(this.data));
        this.renderTimeline(); // 重新渲染
    },

    exportData: function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = "trip_backup.json";
        a.click();
    },

    // --- 渲染邏輯 ---
    renderHeader: function() {
        const header = document.getElementById('hero-header');
        document.getElementById('trip-title').innerText = this.data.title;
        
        // 防呆：如果 JSON 裡沒有 heroImage，給個預設值
        const bgUrl = this.data.heroImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800';
        
        // 動態設定背景圖 (疊加漸層以確保文字可讀)
        header.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${bgUrl}')`;
    },

    renderDateBar: function() {
        const container = document.getElementById('date-scroller');
        container.innerHTML = '';
        
        // 渲染現有的天數
        this.data.days.forEach((day, index) => {
            const el = document.createElement('div');
            el.className = `date-card ${index === this.currentDayIndex ? 'active' : ''}`;
            el.innerHTML = `<div>Day ${index + 1}</div><div style="font-size:12px">${day.date.slice(5)}</div>`;
            el.onclick = () => {
                this.currentDayIndex = index;
                this.renderDateBar();
                this.renderTimeline();
            };
            
            // 只有在編輯模式下，長按或點擊特定區域可以刪除天數的功能先保留，避免誤觸
            // 目前先專注於「顯示」
            
            container.appendChild(el);
        });

        // 新增：如果是編輯模式，在最後面加一個「+」按鈕
        if (this.isEditMode) {
            const addBtn = document.createElement('div');
            addBtn.className = 'date-card';
            // 給它一點不同的樣式，讓它看起來像功能鍵
            addBtn.style.border = '2px dashed #0071E3'; 
            addBtn.style.color = '#0071E3';
            addBtn.style.opacity = '1';
            addBtn.innerHTML = `<div style="font-size:16px; font-weight:bold;">+</div><div style="font-size:12px">Add</div>` ;
            addBtn.onclick = () => this.addDay(); // 綁定新增天數函式
            container.appendChild(addBtn);
        }
    },

    renderTimeline: function() {
        const dayData = this.data.days[this.currentDayIndex];
        const container = document.getElementById('timeline');
        
        document.getElementById('current-date-title').innerText = `Day ${this.currentDayIndex + 1}`;
        document.getElementById('current-date-meta').innerText = dayData.date;
        document.getElementById('add-btn-area').classList.toggle('hidden', !this.isEditMode);

        container.innerHTML = '';

        // 排序：確保時間順序正確
        dayData.items.sort((a, b) => a.startTime.localeCompare(b.startTime));

        let lastEndTime = null;

        dayData.items.forEach(item => {
            // Gap Analysis: 計算空檔
            if (lastEndTime) {
                const gapMinutes = this.calculateGap(lastEndTime, item.startTime);
                if (gapMinutes > 15) { // 超過 15 分鐘才顯示 Gap
                    container.innerHTML += `
                        <div class="gap-item">
                            <div class="time-col"></div>
                            <div class="gap-col">☕ 自由時間 ${this.formatDuration(gapMinutes)}</div>
                        </div>`;
                }
            }

            // 渲染一般卡片
            const itemEl = document.createElement('div');
            itemEl.className = 'timeline-item';
            itemEl.innerHTML = `
                <div class="time-col">${item.startTime}</div>
                <div class="card-col" onclick="app.openDetail('${item.id}')">
                    <div class="card-title">${item.name}</div>
                    <div class="card-note" style="margin-bottom:0">${item.note || ''}</div>
                    
                    <!-- Level 2: 簡易資訊與按鈕列 -->
                    <div class="action-buttons" style="margin-top:10px; display:flex; gap:10px;">
                        ${item.transport ? `
                        <button class="btn-sub-action" onclick="event.stopPropagation(); app.showInfoModal('交通資訊', '${item.transport.info.replace(/\n/g, '<br>')}')">
                            🚇 交通方式
                        </button>` : ''}
                        
                        ${item.detailNote ? `
                        <button class="btn-sub-action" onclick="event.stopPropagation(); app.showInfoModal('詳細清單/備註', '${item.detailNote.replace(/\n/g, '<br>')}')">
                            📋 查看清單
                        </button>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(itemEl);
            lastEndTime = item.endTime;
        });
    },

    // --- 輔助功能 ---
    addDay: function() {
        const days = this.data.days;
        const lastDay = days[days.length - 1];
        
        let nextDateStr = "";
        
        if (lastDay) {
            // 取得最後一天的日期並加 1 天
            // 注意：這裡補上 T00:00:00 是為了避免時區導致的日期偏移
            const dateObj = new Date(lastDay.date + "T00:00:00");
            dateObj.setDate(dateObj.getDate() + 1);
            
            // 轉回 YYYY-MM-DD 格式
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            nextDateStr = `${y}-${m}-${d}`;
        } else {
            // 如果原本完全沒資料 (雖然不可能)，預設為今天
            nextDateStr = new Date().toISOString().split('T')[0];
        }

        // 推入新的一天
        this.data.days.push({
            date: nextDateStr,
            items: [] // 空行程
        });

        this.saveData(); // 存檔
        
        // UX 優化：自動切換到新的一天，讓使用者可以直接開始編輯
        this.currentDayIndex = this.data.days.length - 1;
        
        this.renderDateBar(); // 重繪上面日期列
        this.renderTimeline(); // 重繪下面時間軸
        
        // 滑動到最新的日期卡片 (選用，增加體驗)
        setTimeout(() => {
            const scroller = document.getElementById('date-scroller');
            scroller.scrollLeft = scroller.scrollWidth;
        }, 100);
    },

    calculateGap: function(start, end) {
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    },

    formatDuration: function(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}小時 ${m}分` : `${m}分鐘`;
    },

    toggleEditMode: function() {
        this.isEditMode = !this.isEditMode;
        const btn = document.getElementById('btn-edit-toggle');
        const coverBtn = document.getElementById('btn-change-cover');

        if (this.isEditMode) {
            // 進入編輯模式：按鈕變紅，文字變成「完成」
            btn.innerText = "✓ 完成編輯";
            btn.style.background = "rgba(255, 59, 48, 0.8)"; // Apple System Red
            btn.style.borderColor = "rgba(255, 59, 48, 1)";
            
            // 顯示更換封面按鈕
            coverBtn.classList.remove('hidden');
        } else {
            // 回到瀏覽模式：按鈕復原
            btn.innerText = "✎ 編輯模式";
            btn.style.background = ""; // 回復 CSS 預設值 (btn-glass)
            btn.style.borderColor = "";
            
            // 隱藏更換封面按鈕
            coverBtn.classList.add('hidden');
        }

        // 修正關鍵：除了重繪時間軸，也要重繪日期列，這樣「+ Add」按鈕才會立即出現/消失
        this.renderDateBar(); 
        this.renderTimeline();
    },

    editHeroImage: function() {
        const newUrl = prompt('請輸入新的封面圖片網址');
        if (newUrl) {
            this.data.heroImage = newUrl;
            this.renderHeader();
            this.saveData();
        }
    },

    // --- 新增：通用的資訊彈窗函式 ---
    showInfoModal: function(title, content) {
        // 使用現有的 Modal 結構，但設為「純瀏覽模式」
        const overlay = document.getElementById('modal-overlay');
        const viewMode = document.getElementById('modal-view-mode');
        const editMode = document.getElementById('modal-edit-mode');
        
        // 隱藏編輯表單，顯示瀏覽區塊
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
        
        // 設定標題與內容
        document.getElementById('modal-title').innerText = title;
        
        // 這裡我們直接用innerHTML放入內容，讓它簡單呈現
        viewMode.innerHTML = `
            <div style="font-size:16px; line-height:1.6; color:#333; white-space: pre-wrap;">${content}</div>
            <button class="btn-primary" style="margin-top:20px;" onclick="app.closeModal()">關閉</button>
        `;
        
        overlay.style.display = 'flex';
    },

    // --- Modal 與 編輯邏輯 ---
    openDetail: function(id) {
        const day = this.data.days[this.currentDayIndex];
        const item = day.items.find(i => i.id === id);
        this.editingItemId = id;

        const overlay = document.getElementById('modal-overlay');
        const viewMode = document.getElementById('modal-view-mode');
        const editMode = document.getElementById('modal-edit-mode');

        overlay.style.display = 'flex';
        document.getElementById('modal-title').innerText = item.name;

        if (this.isEditMode) {
            viewMode.classList.add('hidden');
            editMode.classList.remove('hidden');
            
            // --- 原有的欄位 ---
            document.getElementById('edit-name').value = item.name;
            document.getElementById('edit-start').value = item.startTime;
            document.getElementById('edit-end').value = item.endTime;
            document.getElementById('edit-address').value = item.address || '';
            document.getElementById('edit-map').value = item.mapLink || '';
            document.getElementById('edit-note').value = item.note || '';
            
            // --- 新增：填入深度資訊 ---
            // 檢查有沒有 transport 物件，有的話取 info，沒有則空字串
            document.getElementById('edit-transport').value = item.transport ? item.transport.info : '';
            document.getElementById('edit-detail-note').value = item.detailNote || '';

            document.getElementById('btn-delete').classList.remove('hidden');
        } else {
            viewMode.classList.remove('hidden');
            editMode.classList.add('hidden');
            // 顯示瀏覽內容 (注意：這裡不需要顯示交通和詳細清單，因為它們是在時間軸上用按鈕觸發的)
            viewMode.innerHTML = `
                <p><strong>時間：</strong> ${item.startTime} - ${item.endTime}</p>
                <div class="address-box">📍 地址：${item.address || '無地址資訊'}</div>
                <p>${item.note || '無備註'}</p>
                <a href="${item.mapLink}" target="_blank" class="btn-primary" style="display:block;text-align:center;text-decoration:none;margin-top:20px;">開啟 Google 地圖</a>
            `;
        }
    },

    openEditor: function() {
        this.editingItemId = null;
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('modal-view-mode').classList.add('hidden');
        document.getElementById('modal-edit-mode').classList.remove('hidden');
        document.getElementById('modal-title').innerText = "新增景點";
        document.getElementById('btn-delete').classList.add('hidden');
        
        // 清空表單 (這會重置所有 input/textarea，包含我們新加的)
        document.getElementById('modal-edit-mode').reset();
    },

    saveItem: function() {
        const name = document.getElementById('edit-name').value;
        const start = document.getElementById('edit-start').value;
        const end = document.getElementById('edit-end').value;
        
        if(!name || !start || !end) { alert('請填寫完整名稱與時間'); return; }

        // 讀取新欄位的值
        const transportInfo = document.getElementById('edit-transport').value.trim();
        const detailNoteInfo = document.getElementById('edit-detail-note').value.trim();

        const newItem = {
            id: this.editingItemId || 'loc_' + Date.now(),
            name: name,
            startTime: start,
            endTime: end,
            address: document.getElementById('edit-address').value,
            mapLink: document.getElementById('edit-map').value,
            note: document.getElementById('edit-note').value,
            
            // --- 新增：儲存深度資訊 ---
            // 如果有填寫交通資訊，就存成物件；否則存 null (這樣按鈕就不會顯示)
            transport: transportInfo ? { type: 'custom', info: transportInfo } : null,
            
            // 如果有填寫詳細清單，就存字串；否則存 null
            detailNote: detailNoteInfo ? detailNoteInfo : null
        };

        const day = this.data.days[this.currentDayIndex];

        if (this.editingItemId) {
            const idx = day.items.findIndex(i => i.id === this.editingItemId);
            day.items[idx] = newItem;
        } else {
            day.items.push(newItem);
        }

        this.saveData();
        this.closeModal();
    },

    deleteItem: function() {
        if(!confirm("確定要刪除嗎？")) return;
        const day = this.data.days[this.currentDayIndex];
        day.items = day.items.filter(i => i.id !== this.editingItemId);
        this.saveData();
        this.closeModal();
    },

    closeModal: function() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
};

// 啟動
document.addEventListener('DOMContentLoaded', () => app.init());
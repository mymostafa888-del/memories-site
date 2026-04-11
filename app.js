let user = "", room = "", code = "", posts = [], messages = [];

// تبديل المنيو والـ Overlay
function toggleMenu() {
    const menu = document.getElementById("menu");
    const overlay = document.getElementById("overlay");
    menu.classList.toggle("show");
    overlay.classList.toggle("active");
}

// تصحيح منطق الوضع الليلي
function toggleDark() {
    const isDark = document.getElementById("themeCheck").checked;
    if (isDark) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

function updateLabel() { 
    if(document.getElementById("memFile").files[0]) 
        document.getElementById("fileLabel").innerText = "✅ الصورة جاهزة"; 
}

function showPage(p) {
    document.querySelectorAll('.container').forEach(div => div.style.display = 'none');
    document.getElementById(p).style.display = 'block';
    if(p === 'create') {
        code = Math.random().toString(36).substring(2,7).toUpperCase();
        document.getElementById("generatedCode").innerText = code;
    }
    if(p === 'hallPage') renderHall();
    
    // إغلاق المنيو عند اختيار صفحة
    if(document.getElementById("menu").classList.contains("show")) toggleMenu();
}

function initRoom(isCreate) {
    user = isCreate ? document.getElementById("userName1").value : document.getElementById("userName2").value;
    room = isCreate ? document.getElementById("roomNameInput").value : "غرفة ذكريات";
    code = isCreate ? code : document.getElementById("roomCodeInput").value;
    if(!user) return alert("الاسم مطلوب!");
    
    document.getElementById("home").style.display = "none";
    document.getElementById("create").style.display = "none";
    document.getElementById("join").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    
    document.getElementById("displayRoomName").innerText = room;
    document.getElementById("displayRoomCode").innerText = "كود الغرفة: " + code;
    showPage('memPage');
}

function uploadMemory() {
    let text = document.getElementById("memText").value;
    let file = document.getElementById("memFile").files[0];
    if(!text && !file) return;
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if(file) {
        let r = new FileReader();
        r.onload = (e) => { 
            posts.push({id: Date.now(), user, text, img: e.target.result, likedBy: [], time}); 
            renderPosts(); 
        };
        r.readAsDataURL(file);
    } else {
        posts.push({id: Date.now(), user, text, img: null, likedBy: [], time});
        renderPosts();
    }
    document.getElementById("memText").value = ""; 
    document.getElementById("memFile").value = "";
    document.getElementById("fileLabel").innerText = "📸 اختر صورة";
}

function renderPosts() {
    let list = document.getElementById("postsList");
    list.innerHTML = posts.map(p => `
        <div class="post">
            <div class="post-header">
                <div><b>${p.user}</b> <small style="font-size:10px; color:gray">${p.time}</small></div>
                ${p.user === user ? `<span style="color:red; cursor:pointer; font-size:12px" onclick="delPost(${p.id})">حذف</span>` : ''}
            </div>
            ${p.img ? `<div class="post-img-container"><img src="${p.img}" class="post-img" onclick="zoom('${p.img}')"></div>` : ''}
            <div class="post-actions">
                <div style="display:flex; gap:10px; align-items:center">
                    <span style="cursor:pointer; font-size:22px" onclick="toggleLike(${p.id})">
                        ${p.likedBy.includes(user) ? '❤️' : '🤍'}
                    </span>
                    <b>${p.likedBy.length}</b>
                </div>
                ${p.img ? `<a href="${p.img}" download="memory.png" style="text-decoration:none; color:#ff4081; font-size:13px">⬇️ حفظ</a>` : ''}
            </div>
            <div style="padding:0 15px 15px; font-size:14px; text-align:right">${p.text}</div>
        </div>
    `).reverse().join('');
}

function toggleLike(id) {
    let p = posts.find(x => x.id === id);
    let idx = p.likedBy.indexOf(user);
    if(idx === -1) p.likedBy.push(user); else p.likedBy.splice(idx, 1);
    renderPosts();
}

function sendMsg() {
    let val = document.getElementById("chatInput").value;
    if(!val) return;
    let time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    messages.push({user, text: val, time});
    document.getElementById("chatInput").value = "";
    renderChat();
}

function renderChat() {
    let div = document.getElementById("chatMsgs");
    div.innerHTML = messages.map(m => `
        <div class="msg ${m.user === user ? 'msg-me' : 'msg-other'}">
            <span class="msg-sender">${m.user}</span>
            <div>${m.text}</div>
            <small style="font-size:8px; display:block; margin-top:5px; opacity:0.6">${m.time}</small>
        </div>
    `).join('');
    div.scrollTop = div.scrollHeight;
}

function renderHall() {
    if(posts.length === 0) return;
    // ترتيب البوستات حسب عدد اللايكات
    let sorted = [...posts].sort((a,b) => b.likedBy.length - a.likedBy.length);
    let best = sorted[0];
    
    const hallBox = document.getElementById("hallBox");
    const content = document.getElementById("bestMemoryContent");

    if(best && best.likedBy.length > 0) {
        hallBox.style.display = "block";
        content.innerHTML = `
            <p>صاحب الذكرى: <b>${best.user}</b></p>
            <p>عدد التفاعلات: <b>${best.likedBy.length} ❤️</b></p>
            ${best.img ? `<img src="${best.img}">` : ''}
            <p style="margin-top:10px">${best.text}</p>
        `;
    } else {
        hallBox.style.display = "none";
    }
}

function showTyping() {
    document.getElementById("typingArea").innerText = user + " يكتب الآن...";
    clearTimeout(window.t); window.t = setTimeout(() => document.getElementById("typingArea").innerText = "", 2000);
}

function delPost(id) { if(confirm("حذف؟")) { posts = posts.filter(x => x.id !== id); renderPosts(); } }
function zoom(src) { document.getElementById("imgModal").style.display='flex'; document.getElementById("modalImg").src=src; }
function copyLink() { navigator.clipboard.writeText(code); alert("تم نسخ الكود!"); }
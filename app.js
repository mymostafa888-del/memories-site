/* Created by: Mostafa Mabrok
   Feature: Image Upload (ImgBB) + Real-time Database (Firebase)
*/

let user = "", room = "", code = "", posts = [], messages = [];
const IMGBB_KEY = "02e53bd2cb207b79a2d6cdc72860038e";

// التحكم في القائمة الجانبية
function toggleMenu() {
    document.getElementById("menu").classList.toggle("show");
    document.getElementById("overlay").classList.toggle("active");
}

// الوضع الليلي
function toggleDark() {
    document.body.classList.toggle("dark-mode", document.getElementById("themeCheck").checked);
}

// تحديث نص اختيار الصورة
function updateLabel() { 
    if(document.getElementById("memFile").files[0]) 
        document.getElementById("fileLabel").innerText = "✅ الصورة جاهزة"; 
}

// التنقل بين الصفحات
function showPage(p) {
    document.querySelectorAll('.container').forEach(div => div.style.display = 'none');
    document.getElementById(p).style.display = 'block';
    if(p === 'create') {
        code = Math.random().toString(36).substring(2,7).toUpperCase();
        document.getElementById("generatedCode").innerText = code;
    }
    if(p === 'hallPage') renderHall();
    if(document.getElementById("menu").classList.contains("show")) toggleMenu();
}

// بدء الغرفة (إنشاء أو انضمام)
async function initRoom(isCreate) {
    user = isCreate ? document.getElementById("userName1").value : document.getElementById("userName2").value;
    room = isCreate ? document.getElementById("roomNameInput").value : "غرفة ذكريات";
    code = isCreate ? code : document.getElementById("roomCodeInput").value.toUpperCase();
    
    if(!user || !code) return alert("الاسم والكود مطلوبين!");
    
    document.getElementById("home").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("displayRoomName").innerText = room;
    document.getElementById("displayRoomCode").innerText = "كود: " + code;

    listenToFirebase();
    showPage('memPage');
}

// الاستماع للبيانات من فايربيز (لايف)
function listenToFirebase() {
    const { onSnapshot, collection, query, orderBy } = window.fbTools;
    
    // استماع للبوستات
    onSnapshot(query(collection(window.db, "rooms", code, "posts"), orderBy("id", "desc")), (snap) => {
        posts = snap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        renderPosts();
    });

    // استماع للشات
    onSnapshot(query(collection(window.db, "rooms", code, "msgs"), orderBy("time", "asc")), (snap) => {
        messages = snap.docs.map(doc => doc.data());
        renderChat();
    });
}

// رفع الذكرى (صورة + نص)
async function uploadMemory() {
    const { collection, addDoc } = window.fbTools;
    let text = document.getElementById("memText").value;
    let file = document.getElementById("memFile").files[0];
    let label = document.getElementById("fileLabel");

    if(!text && !file) return;
    
    let imgUrl = null;
    if(file) {
        label.innerText = "⏳ جاري الرفع...";
        let formData = new FormData();
        formData.append("image", file);
        try {
            let res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: formData });
            let data = await res.json();
            imgUrl = data.data.url;
        } catch (e) {
            alert("فشل رفع الصورة");
            label.innerText = "📸 اختر صورة";
            return;
        }
    }

    await addDoc(collection(window.db, "rooms", code, "posts"), {
        id: Date.now(), user, text, img: imgUrl, likedBy: [], 
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });

    document.getElementById("memText").value = ""; 
    document.getElementById("memFile").value = "";
    label.innerText = "📸 اختر صورة";
}

// عرض البوستات (الذكريات)
function renderPosts() {
    document.getElementById("postsList").innerHTML = posts.map(p => `
        <div class="post">
            <div class="post-header"><b>${p.user}</b> <small>${p.timeStr}</small></div>
            ${p.img ? `<div class="post-img-container"><img src="${p.img}" class="post-img" onclick="zoom('${p.img}')"></div>` : ''}
            <div class="post-actions">
                <div style="display:flex; align-items:center; gap:5px;">
                   <span style="cursor:pointer; font-size:22px" onclick="toggleLike('${p.docId}', ${JSON.stringify(p.likedBy)})">
                        ${p.likedBy.includes(user) ? '❤️' : '🤍'}
                    </span>
                    <b>${p.likedBy.length}</b>
                </div>
                ${p.img ? `<a href="${p.img}" target="_blank" style="text-decoration:none; font-size:20px">💾</a>` : ''}
            </div>
            <div style="padding:15px; text-align:right">${p.text}</div>
        </div>
    `).join('');
}

// عرض رسايل الشات
function renderChat() {
    let div = document.getElementById("chatMsgs");
    div.innerHTML = messages.map(m => `
        <div class="msg ${m.user === user ? 'msg-me' : 'msg-other'}">
            <span class="msg-sender">${m.user}</span>
            <div>${m.text}</div>
            <small style="opacity:0.6; font-size:8px; display:block; margin-top:3px">${m.timeStr}</small>
        </div>
    `).join('');
    div.scrollTop = div.scrollHeight;
}

// نظام اللايكات
async function toggleLike(docId, likedBy) {
    const { doc, updateDoc, arrayUnion, arrayRemove } = window.fbTools;
    const postRef = doc(window.db, "rooms", code, "posts", docId);
    if (likedBy.includes(user)) {
        await updateDoc(postRef, { likedBy: arrayRemove(user) });
    } else {
        await updateDoc(postRef, { likedBy: arrayUnion(user) });
    }
}

// إرسال رسالة شات
async function sendMsg() {
    const { collection, addDoc } = window.fbTools;
    let val = document.getElementById("chatInput").value;
    if(!val) return;
    await addDoc(collection(window.db, "rooms", code, "msgs"), {
        user, text: val, time: Date.now(),
        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    document.getElementById("chatInput").value = "";
}

// لوحة الشرف (أعلى لايكات)
function renderHall() {
    if(posts.length === 0) return;
    let best = [...posts].sort((a,b) => b.likedBy.length - a.likedBy.length)[0];
    if(best && best.likedBy.length > 0) {
        document.getElementById("hallBox").style.display = "block";
        document.getElementById("bestMemoryContent").innerHTML = `
            <p>صاحب الذكرى: <b>${best.user}</b></p>
            ${best.img ? `<img src="${best.img}" style="width:100%; border-radius:15px">` : ''}
            <p>${best.text}</p>
        `;
    }
}

// إشعار "يكتب الآن"
function showTyping() {
    document.getElementById("typingArea").innerText = user + " يكتب الآن...";
    clearTimeout(window.t); window.t = setTimeout(() => document.getElementById("typingArea").innerText = "", 2000);
}

// تكبير الصورة
function zoom(src) { document.getElementById("imgModal").style.display='flex'; document.getElementById("modalImg").src=src; }

// نسخ كود الغرفة
function copyLink() { navigator.clipboard.writeText(code); alert("تم نسخ الكود! ابعته لصحابك"); }
const medicationTypes = ['ยาแก้ปวด', 'ยาความดัน', 'ยาลดไขมัน', 'ยาลดเสมหะ'];
const seed = [
  { id: 1, name: 'Amlodipine', type: 'ยาความดัน', time: '08:00', dose: '1 เม็ด', taken: false },
  { id: 2, name: 'Atorvastatin', type: 'ยาลดไขมัน', time: '20:00', dose: '1 เม็ด', taken: false },
  { id: 3, name: 'Paracetamol', type: 'ยาแก้ปวด', time: 'เมื่อมีอาการ', dose: '1 เม็ด', taken: false }
];

let meds = JSON.parse(localStorage.getItem('dose-day-meds') || 'null') || seed;
let activeDate = new Date();
let timer;

const dateKey = date => date.toISOString().slice(0, 10);
const thaiDate = date => new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);

function calendarHtml() {
  const year = activeDate.getFullYear(); const month = activeDate.getMonth();
  const first = new Date(year, month, 1); const leading = first.getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(activeDate);
  const cells = Array.from({ length: leading + last }, (_, i) => {
    if (i < leading) return '<span class="calendar-day empty"></span>';
    const day = i - leading + 1; const date = new Date(year, month, day);
    const selected = dateKey(date) === dateKey(activeDate); const today = dateKey(date) === dateKey(new Date());
    return `<button class="calendar-day ${selected ? 'selected' : ''} ${today ? 'today' : ''}" data-calendar-day="${dateKey(date)}">${day}</button>`;
  }).join('');
  return `<section class="calendar"><div class="calendar-head"><button id="prevMonth" aria-label="เดือนก่อนหน้า">‹</button><h2>${esc(monthName)}</h2><button id="nextMonth" aria-label="เดือนถัดไป">›</button></div><div class="weekdays"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="calendar-grid">${cells}</div></section>`;
}

function save() { localStorage.setItem('dose-day-meds', JSON.stringify(meds)); }
function getTaken() { return JSON.parse(localStorage.getItem(`dose-day-taken-${dateKey(activeDate)}`) || '{}'); }
function setTaken(id, value) { const taken = getTaken(); taken[id] = value; localStorage.setItem(`dose-day-taken-${dateKey(activeDate)}`, JSON.stringify(taken)); }

function render() {
  const taken = getTaken();
  const scheduled = meds.filter(m => m.time !== 'เมื่อมีอาการ');
  const complete = scheduled.filter(m => taken[m.id]).length;
  const percent = scheduled.length ? Math.round((complete / scheduled.length) * 100) : 0;
  const isToday = dateKey(activeDate) === dateKey(new Date());
  document.querySelector('#app').innerHTML = `
    <main class="shell">
      <header class="topbar">
        <a class="brand" href="#" aria-label="Dose Day หน้าหลัก"><span class="brand-mark">+</span><span>Dose <b>Day</b></span></a>
        <div class="top-actions"><button class="text-button" id="loginBtn">เข้าสู่ระบบ</button><button class="avatar" id="profileBtn" aria-label="เปิดเมนูผู้ใช้">ก</button></div>
      </header>
      <section class="hero">
        <div><p class="eyebrow">${isToday ? 'วันนี้' : 'ตารางยา'}</p><h1>${esc(thaiDate(activeDate))}</h1><p class="greeting">สวัสดีค่ะ ดูแลตัวเองให้ดีในทุกวันนะ</p></div>
        <button class="add-button" id="addBtn"><span>+</span> เพิ่มรายการยา</button>
      </section>
      ${calendarHtml()}
      <section class="progress-section">
        <div class="progress-copy"><div><p class="eyebrow">ความคืบหน้าวันนี้</p><strong>${complete} จาก ${scheduled.length} รายการ</strong></div><span>${percent}%</span></div>
        <div class="progress-track"><div style="width:${percent}%"></div></div>
      </section>
      <section class="schedule" aria-label="รายการยา">
        <div class="section-heading"><h2>รายการยา</h2><span>${meds.length} รายการ</span></div>
        <div class="med-list">
          ${meds.map(med => `<article class="med-card ${taken[med.id] ? 'is-taken' : ''}">
            <label class="check-wrap"><input type="checkbox" data-check="${med.id}" ${taken[med.id] ? 'checked' : ''} aria-label="ทำเครื่องหมายว่ากิน ${esc(med.name)} แล้ว"/><span class="custom-check">✓</span></label>
            <div class="pill-art" aria-hidden="true">💊</div><div class="time"><strong>${esc(med.time)}</strong><span>${med.time === 'เมื่อมีอาการ' ? 'ตามความจำเป็น' : 'ทุกวัน'}</span></div>
            <div class="med-detail"><h3>${esc(med.name)}</h3><p>${esc(med.type)} · ${esc(med.dose)}</p></div>
            ${!taken[med.id] ? '<span class="missed" aria-label="ยังไม่ได้กิน">*</span>' : ''}
            <button class="more" data-delete="${med.id}" aria-label="ลบ ${esc(med.name)}">×</button>
          </article>`).join('')}
        </div>
      </section>
      <section class="reminder-card"><div class="bell">♧</div><div><h2>ตั้งการแจ้งเตือน</h2><p>รับการเตือนตามเวลาที่คุณกำหนด</p></div><button class="outline-button" id="notifyBtn">เปิดการแจ้งเตือน</button></section>
      <p class="privacy-note">ใช้งานได้ทันทีโดยไม่ต้องเข้าสู่ระบบ · ข้อมูลของคุณจะอยู่ในอุปกรณ์นี้</p>
    </main>
    <dialog id="medicineDialog"><form method="dialog" id="medicineForm"><div class="modal-top"><div><p class="eyebrow">เพิ่มรายการใหม่</p><h2>เพิ่มยาของคุณ</h2></div><button class="close" value="cancel" aria-label="ปิด">×</button></div><label>ชื่อยา<input required name="name" placeholder="เช่น Amlodipine" /></label><label>ประเภทยา<select name="type">${medicationTypes.map(t => `<option>${t}</option>`).join('')}</select></label><div class="form-grid"><label>เวลาที่ต้องกิน<input required type="time" name="time" value="08:00" /></label><label>ปริมาณ<input required name="dose" value="1 เม็ด" /></label></div><label class="as-needed"><input type="checkbox" name="needed" /> กินเมื่อมีอาการ</label><button class="save-button" value="default">บันทึกรายการยา</button></form></dialog>
    <dialog id="loginDialog"><form method="dialog"><div class="modal-top"><div><p class="eyebrow">Dose Day</p><h2>เข้าสู่ระบบ</h2></div><button class="close" value="cancel" aria-label="ปิด">×</button></div><p class="login-copy">สำรองข้อมูลยาและใช้งานข้ามอุปกรณ์ได้</p><label>อีเมล<input type="email" placeholder="you@example.com" /></label><label>รหัสผ่าน<input type="password" placeholder="••••••••" /></label><button class="save-button" value="default">เข้าสู่ระบบ</button><p class="signup">ยังไม่มีบัญชี? <a href="#">สมัครใช้งาน</a></p></form></dialog>
  `;
  bindEvents();
}

function bindEvents() {
  document.querySelector('#addBtn').onclick = () => document.querySelector('#medicineDialog').showModal();
  document.querySelector('#loginBtn').onclick = () => document.querySelector('#loginDialog').showModal();
  document.querySelector('#prevMonth').onclick = () => { activeDate.setMonth(activeDate.getMonth() - 1); render(); };
  document.querySelector('#nextMonth').onclick = () => { activeDate.setMonth(activeDate.getMonth() + 1); render(); };
  document.querySelectorAll('[data-calendar-day]').forEach(button => button.onclick = () => { activeDate = new Date(`${button.dataset.calendarDay}T12:00:00`); render(); });
  document.querySelectorAll('[data-check]').forEach(box => box.onchange = e => { setTaken(Number(e.target.dataset.check), e.target.checked); render(); });
  document.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => { meds = meds.filter(med => med.id !== Number(button.dataset.delete)); save(); render(); });
  document.querySelector('#medicineForm').onsubmit = event => {
    const data = new FormData(event.currentTarget);
    meds.push({ id: Date.now(), name: data.get('name'), type: data.get('type'), time: data.get('needed') ? 'เมื่อมีอาการ' : data.get('time'), dose: data.get('dose') });
    save(); render();
  };
  document.querySelector('#notifyBtn').onclick = enableNotifications;
}

async function enableNotifications() {
  if (!('Notification' in window)) return alert('เบราว์เซอร์นี้ยังไม่รองรับการแจ้งเตือน');
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    localStorage.setItem('dose-day-notifications', 'enabled');
    scheduleCheck();
    alert('เปิดการแจ้งเตือนแล้ว ระบบจะตรวจเวลายาของคุณขณะเปิดแอป');
  }
}
function scheduleCheck() {
  clearInterval(timer);
  timer = setInterval(() => {
    const now = new Date(); const current = now.toTimeString().slice(0, 5); const sent = JSON.parse(localStorage.getItem(`dose-day-sent-${dateKey(now)}`) || '[]');
    meds.filter(m => m.time === current && !sent.includes(m.id)).forEach(m => {
      new Notification('ถึงเวลากินยา', { body: `${m.name} · ${m.dose}`, icon: '/icon.svg' }); sent.push(m.id);
    }); localStorage.setItem(`dose-day-sent-${dateKey(now)}`, JSON.stringify(sent));
  }, 30000);
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
if (localStorage.getItem('dose-day-notifications') === 'enabled') scheduleCheck();
render();

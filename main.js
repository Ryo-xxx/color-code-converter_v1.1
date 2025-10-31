// === State ===
let state = { r:0, g:0, b:0, a:1 };

// === DOM ===
const hex6 = document.getElementById('hex6');
const hex = document.getElementById('hex');
const picker = document.getElementById('picker');
const pickerA = document.getElementById('pickerA');
const pickerAOut = document.getElementById('pickerAOut');
const swatch = document.getElementById('swatch');
const cssVarCode = document.getElementById('cssVarCode');

// === Utils ===
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const toHex2 = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
const toHexA = (a) => clamp(Math.round(a * 255), 0, 255).toString(16).padStart(2, '0');

function parseHex6(str) {
  const s = str.trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return null;
  if (s.length === 4) {
    const r = parseInt(s[1] + s[1], 16);
    const g = parseInt(s[2] + s[2], 16);
    const b = parseInt(s[3] + s[3], 16);
    return {r,g,b};
  } else {
    const r = parseInt(s.slice(1,3), 16);
    const g = parseInt(s.slice(3,5), 16);
    const b = parseInt(s.slice(5,7), 16);
    return {r,g,b};
  }
}
function parseHexa(str) {
  const s = str.trim().toLowerCase();
  if (!/^#([0-9a-f]{6}|[0-9a-f]{8}|[0-9a-f]{3}|[0-9a-f]{4})$/.test(s)) return null;
  let r,g,b,a=1;
  if (s.length===4 || s.length===5) {
    r = parseInt(s[1]+s[1],16);
    g = parseInt(s[2]+s[2],16);
    b = parseInt(s[3]+s[3],16);
    if (s.length===5) a = parseInt(s[4]+s[4],16)/255;
  } else {
    r = parseInt(s.slice(1,3),16);
    g = parseInt(s.slice(3,5),16);
    b = parseInt(s.slice(5,7),16);
    if (s.length===9) a = parseInt(s.slice(7,9),16)/255;
  }
  return {r,g,b,a};
}
function toHex6(r,g,b){ return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`; }
function toHexa(r,g,b,a){ return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHexA(a)}`; }
function toRgba(r,g,b,a){ return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Math.round(a*100)/100})`; }

function setRGBA(r,g,b,a, from){
  state = { r:clamp(r,0,255), g:clamp(g,0,255), b:clamp(b,0,255), a:clamp(a,0,1) };
  render(from);
}

function render(from){
  // swatch
  swatch.style.backgroundColor = toRgba(state.r,state.g,state.b,state.a);
  // fields
  if(from!=='hex6') hex6.value = toHex6(state.r,state.g,state.b);
  if(from!=='hex')  hex.value  = toHexa(state.r,state.g,state.b,state.a);
  if(from!=='picker'){
    picker.value = toHex6(state.r,state.g,state.b);
    pickerA.value = String(Math.round(state.a*100)/100);
    pickerAOut.textContent = String(Math.round(state.a*100)/100);
  }
  // preview text color
  const rgba = toRgba(state.r,state.g,state.b,state.a);
  document.querySelectorAll('.preview-text').forEach(el => el.style.color = rgba);
  if (cssVarCode) {
    const isOpaque = state.a >= 1;
    const value = isOpaque
      ? `rgb(${Math.round(state.r)}, ${Math.round(state.g)}, ${Math.round(state.b)})`
      : `rgba(${Math.round(state.r)}, ${Math.round(state.g)}, ${Math.round(state.b)}, ${Math.round(state.a * 100) / 100})`;
    cssVarCode.textContent = value;
  }
}

// === Events ===

// === Copy (mobile-safe with fallback) ===
async function copyTextSafe(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  // Fallback: temporary textarea + execCommand
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    document.body.removeChild(ta);
    return false;
  }
}


document.body.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy], [data-copy-text]');
  if (!btn) return;
  const sel = btn.getAttribute('data-copy') || btn.getAttribute('data-copy-text');
  const el = document.querySelector(sel);
  if (!el) return;
  const val = btn.hasAttribute('data-copy-text') ? (el.textContent || '') : (el.value || '');
  const ok = await copyTextSafe(val);
  btn.classList.toggle('copied', ok);
  setTimeout(()=>btn.classList.remove('copied'),700);
});


hex6.addEventListener('input', () => {
  const p = parseHex6(hex6.value);
  if (!p) return;
  setRGBA(p.r,p.g,p.b,state.a,'hex6');
});
hex.addEventListener('input', () => {
  const p = parseHexa(hex.value);
  if (!p) return;
  setRGBA(p.r,p.g,p.b,p.a,'hex');
});
picker.addEventListener('input', () => {
  const p = parseHex6(picker.value);
  setRGBA(p.r,p.g,p.b,state.a,'picker');
});
pickerA.addEventListener('input', () => {
  const a = parseFloat(pickerA.value);
  pickerAOut.textContent = a;
  setRGBA(state.r,state.g,state.b,a,'picker');
});


// === Name preview handlers ===
const nameText = document.getElementById('nameText');
const nameReset = document.getElementById('nameReset');
function applyNameToPreview(value) {
  document.querySelectorAll('.preview-text').forEach(el => el.textContent = value || '');
}
if (nameText) {
  nameText.addEventListener('input', () => applyNameToPreview(nameText.value));
}
if (nameReset) {
  nameReset.addEventListener('click', () => {
    nameText.value = '12345';
    applyNameToPreview(nameText.value);
  });
}

// init
setRGBA(0,0,0,1,'init');

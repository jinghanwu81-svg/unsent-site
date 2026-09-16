(() => {
  'use strict';
  const STORAGE_KEY = 'unsent.impulses.v1';
  const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const level = count => count === null ? 'empty' : count === 0 ? 'bright' : count < 3 ? 'medium' : count <= 5 ? 'dim' : 'off';
  const names = {empty:'未记录',bright:'最亮',medium:'中亮',dim:'微亮',off:'熄灯'};
  let records = Object.create(null), storageIssue = '';
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw Error('Invalid data');
    for (const [key,value] of Object.entries(saved)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isSafeInteger(value) && value >= 0) records[key] = value;
    }
  } catch { storageIssue = '无法读取本地记录。新记录可在本页使用；请检查浏览器存储设置。'; }
  let selected = localDay(), month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const panel = document.createElement('aside');
  panel.className = 'lights-panel';
  panel.lang = 'zh-CN';
  panel.setAttribute('aria-labelledby','lights-title');
  panel.innerHTML = `
    <span class="lights-eyebrow">A LITTLE LIGHT, EVERY DAY</span>
    <h2 id="lights-title">为自己，留一盏灯</h2>
    <p>把想联系 TA 的冲动记在这里。<br>明亮或微弱，每一天都值得被温柔看见。</p>
    <div class="lights-toolbar"><button id="lights-prev" aria-label="上个月">‹</button><strong id="lights-month" aria-live="polite"></strong><button id="lights-next" aria-label="下个月">›</button></div>
    <div class="lights-week" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
    <div class="lights-grid" id="lights-grid" role="group" aria-label="选择日期查看冲动记录"></div>
    <div class="lights-legend"><span><i class="light light-bright" aria-hidden="true"></i>0 次 · 最亮</span><span><i class="light light-medium" aria-hidden="true"></i>1–2 次 · 中亮</span><span><i class="light light-dim" aria-hidden="true"></i>3–5 次 · 微亮</span><span><i class="light light-off" aria-hidden="true"></i>6+ 次 · 熄灯</span><span><i class="light light-empty" aria-hidden="true"></i>未记录</span></div>
    <section class="lights-detail"><h3 id="lights-date"></h3><div class="lights-count" id="lights-count" aria-live="polite"></div>
    <div class="lights-actions"><button class="lights-primary" id="lights-add">记录一次冲动 +1</button><button id="lights-zero">今天 0 次</button></div>
    
    <div class="lights-status" id="lights-status" role="status"></div>
    </section>`;
  document.body.append(panel);
  const el = id => panel.querySelector(`#lights-${id}`);
  const countFor = key => Object.hasOwn(records,key) ? records[key] : null;
  function render() {
    const today = localDay();
    el('month').textContent = `${month.getFullYear()} 年 ${month.getMonth()+1} 月`;
    el('next').disabled = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();
    el('grid').replaceChildren();
    const offset = (month.getDay()+6)%7, days = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    for(let i=0;i<offset;i++) el('grid').append(document.createElement('span'));
    for(let day=1;day<=days;day++) {
      const key = localDay(new Date(month.getFullYear(),month.getMonth(),day));
      const count = countFor(key), state = level(count), future = key > today;
      const button = document.createElement('button');
      button.type='button';button.disabled=future;button.dataset.today=String(key===today);
      button.setAttribute('aria-pressed',String(key===selected));
      button.setAttribute('aria-label',`${key}，${future?'未来日期':count===null?'未记录':`${count} 次冲动，${names[state]}`}`);
      if(key===today) button.setAttribute('aria-current','date');
      button.innerHTML=`<span>${day}</span><i aria-hidden="true" class="light light-${future?'empty':state}"></i>`;
      button.addEventListener('click',()=>{selected=key;el('status').textContent=storageIssue;render();const selectedButton=Array.from(el('grid').children).find(node=>node.getAttribute('aria-pressed')==='true');selectedButton?.focus({preventScroll:true});});
      el('grid').append(button);
    }
    const count = countFor(selected), state = level(count);
    el('date').textContent = `${selected.replaceAll('-',' / ')}${selected===today?' · 今天':''}`;
    el('count').innerHTML=`<i aria-hidden="true" class="light light-${state}"></i><span>${count===null?'这一天还没有记录':`${count} 次冲动 · ${names[state]}`}</span>`;
    el('zero').textContent=selected===today?'今天 0 次':'这天 0 次';
    el('zero').disabled=count!==null;
  }
  function save(value) {
    if(selected>localDay()) return;
    if(value===null) delete records[selected]; else records[selected]=value;
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(records));storageIssue=''; }
    catch { storageIssue='本次未能保存到浏览器，刷新后可能丢失。'; }
    render();
    el('status').textContent=storageIssue || (value===null?'已移除，可重新记录。':`已保存：${value} 次冲动。`);
  }
  el('add').addEventListener('click',()=>{const next=(countFor(selected)??0)+1;if(Number.isSafeInteger(next))save(next);});
  el('zero').addEventListener('click',()=>save(0));
  function moveMonth(delta){month=new Date(month.getFullYear(),month.getMonth()+delta,1);selected=localDay(month);if(month.getFullYear()===new Date().getFullYear()&&month.getMonth()===new Date().getMonth())selected=localDay();render();}
  el('prev').addEventListener('click',()=>moveMonth(-1));
  el('next').addEventListener('click',()=>moveMonth(1));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  render();el('status').textContent=storageIssue;
})();


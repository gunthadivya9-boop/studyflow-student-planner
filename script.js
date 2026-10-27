const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const today = new Date();
const localDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const prettyDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const timeLabel = (time) => {
  if (!time) return '';
  const [h,m] = time.split(':').map(Number);
  return `${h%12 || 12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
};
$('#todayLabel').textContent = today.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
$('#greeting').textContent = `${today.getHours()<12?'GOOD MORNING':today.getHours()<18?'GOOD AFTERNOON':'GOOD EVENING'}, LET'S FOCUS`;
$('#taskDate').value = localDate(today);

const defaultTasks = [
  {id:1,title:'Review chapter 4 notes',subject:'Biology',time:'09:30',date:localDate(today),priority:'High',completed:false},
  {id:2,title:'Complete algebra problem set',subject:'Mathematics',time:'11:00',date:localDate(today),priority:'Medium',completed:false},
  {id:3,title:'Read research paper',subject:'Computer Science',time:'14:00',date:localDate(today),priority:'Low',completed:true},
  {id:4,title:'Prepare presentation slides',subject:'English',time:'16:30',date:localDate(today),priority:'Medium',completed:false}
];
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem('studyflowTasks')) || defaultTasks; } catch { tasks = defaultTasks; }
let activeFilter = 'all';
let currentView = 'dashboard';
const save = () => localStorage.setItem('studyflowTasks',JSON.stringify(tasks));
const toast = (message) => {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(window.toastTimer); window.toastTimer = setTimeout(()=>el.classList.remove('show'),2300);
};
function renderStats(){
  const completed = tasks.filter(t=>t.completed).length;
  $('#completedCount').innerHTML = `${completed} <small>/ ${tasks.length}</small>`;
  $('#taskProgress').style.width = `${tasks.length ? completed/tasks.length*100 : 0}%`;
  $('#dueCount').textContent = tasks.filter(t=>t.date===localDate(today)&&!t.completed).length;
  $('#examCount').textContent = '2';
}
function renderTasks(){
  const list = $('#taskList'); list.innerHTML = '';
  let filtered = tasks.filter(t => activeFilter==='all' || (activeFilter==='active'&&!t.completed) || (activeFilter==='completed'&&t.completed));
  if(currentView==='tasks') filtered = filtered.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  else filtered = filtered.filter(t=>t.date===localDate(today)).sort((a,b)=>a.time.localeCompare(b.time));
  $('#listTitle').textContent = currentView==='tasks'?'All tasks':activeFilter==='completed'?'Completed tasks':activeFilter==='active'?'Tasks in progress':"Today's tasks";
  $('#emptyState').hidden = filtered.length>0;
  filtered.forEach(task=>{
    const row = document.createElement('div'); row.className='task-row';
    const check = document.createElement('input'); check.type='checkbox'; check.className='task-check'; check.checked=task.completed; check.setAttribute('aria-label',`Mark ${task.title} completed`);
    check.addEventListener('change',()=>{task.completed=check.checked;save();render();toast(task.completed?'Task completed! Great work.':'Task moved back to in progress.');});
    const info = document.createElement('div'); info.className='task-info';
    const title = document.createElement('div'); title.className='task-title'+(task.completed?' done':''); title.textContent=task.title;
    const meta = document.createElement('div'); meta.className='task-meta';
    const subject = document.createElement('span'); subject.innerHTML='<span class="subject-dot"></span>'; subject.append(document.createTextNode(task.subject||'General'));
    const date = document.createElement('span'); date.textContent = currentView==='tasks' ? prettyDate(task.date) : 'Due today';
    meta.append(subject,date); info.append(title,meta);
    const time = document.createElement('span'); time.className='task-time'; time.textContent=timeLabel(task.time);
    const priority = document.createElement('span'); priority.className=`priority ${task.priority}`; priority.textContent=task.priority;
    row.append(check,info,time,priority); list.append(row);
  });
}
function renderSchedule(){
  const schedule = $('#scheduleList'); schedule.innerHTML='';
  const todays = tasks.filter(t=>t.date===localDate(today)).sort((a,b)=>a.time.localeCompare(b.time)).slice(0,4);
  const items = todays.length ? todays : [
    {time:'09:00',title:'Morning review',subject:'Plan your priorities'},
    {time:'11:00',title:'Focus session',subject:'Deep work'},
    {time:'14:00',title:'Study break',subject:'Recharge and reset'}
  ];
  items.forEach(task=>{
    const item=document.createElement('div');item.className='schedule-item';
    item.innerHTML=`<div class="schedule-time">${timeLabel(task.time)}</div><div class="timeline"><span class="timeline-dot"></span></div><div><div class="schedule-title"></div><div class="schedule-sub"></div></div>`;
    item.querySelector('.schedule-title').textContent=task.title;
    item.querySelector('.schedule-sub').textContent=task.subject||'Study session';
    schedule.append(item);
  });
}
function render(){renderStats();renderTasks();renderSchedule();}
function setView(view){
  currentView=view;
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $('#pageName').textContent=({dashboard:'Dashboard',tasks:'My Tasks',timetable:'Timetable',exams:'Exams'})[view]||'Dashboard';
  $('#heading').innerHTML=({dashboard:'Good to see you, Student <span>✦</span>',tasks:'Your task list <span>✓</span>',timetable:'Your study timetable <span>▤</span>',exams:'Exam planner <span>✦</span>'})[view]||'StudyFlow';
  $('#viewAll').textContent=view==='tasks'?'Back to dashboard →':'View all →';
  if(view==='timetable'){toast('Your schedule is shown in the panel. Add tasks with times to personalize it.');}
  if(view==='exams'){toast('Exam planner preview: add exam dates as tasks to keep track.');}
  if(view==='tasks') activeFilter='all';
  $$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===activeFilter));
  renderTasks();
  $('.sidebar').classList.remove('open');
}
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$$('.filter').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('active',x===b));renderTasks();}));
$('#viewAll').addEventListener('click',()=>setView(currentView==='tasks'?'dashboard':'tasks'));
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.open)));
$('#menuBtn').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
const dialog=$('#taskDialog');
function openDialog(){dialog.showModal();$('#taskTitle').focus();}
$('#quickAdd').addEventListener('click',openDialog);$('#emptyAdd').addEventListener('click',openDialog);
$('#closeDialog').addEventListener('click',()=>dialog.close());
$('#upgradeBtn').addEventListener('click',()=>toast('Premium plans are a demo feature in this student project.'));
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
$('#taskForm').addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(e.currentTarget);
  tasks.push({id:Date.now(),title:String(data.get('title')).trim(),subject:String(data.get('subject')).trim()||'General',time:String(data.get('time')),date:String(data.get('date')),priority:String(data.get('priority')),completed:false});
  save();render();dialog.close();e.currentTarget.reset();$('#taskDate').value=localDate(today);$('#taskTime').value='16:00';setView('tasks');toast('Task added to your planner.');
});
render();

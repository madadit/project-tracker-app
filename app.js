const PROJECTS_KEY = 'project-tracker:projects'
const TASKS_KEY = 'project-tracker:tasks'

function $(id){return document.getElementById(id)}

let projects = []
let tasks = []
let selectedProjectId = null
let confirmCallback = null

function loadData(){
  try{ projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]') }catch(e){projects=[]}
  try{ tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]') }catch(e){tasks=[]}
}

function saveData(){
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

function computeProjectProgress(projectId){
  const rel = tasks.filter(t=>t.projectId===projectId)
  const total = rel.reduce((s,t)=>s + (Number(t.weight)||0),0)
  if(total===0) return 0
  const done = rel.reduce((s,t)=> s + ((t.status==='done')? (Number(t.weight)||0) : 0), 0)
  return (done/total)*100
}

function deriveProjectStatus(projectId){
  const rel = tasks.filter(t=>t.projectId===projectId)
  if(rel.length===0) return 'draft'
  const allDone = rel.every(t=>t.status==='done')
  if(allDone) return 'done'
  const anyInProgress = rel.some(t=>t.status==='inprogress')
  if(anyInProgress) return 'inprogress'
  return 'draft'
}

function updateDerivedProject(projectId){
  const idx = projects.findIndex(p=>p.id===projectId)
  if(idx===-1) return
  const progress = computeProjectProgress(projectId)
  const status = deriveProjectStatus(projectId)
  projects[idx].progress = Number(progress.toFixed(1))
  projects[idx].status = status
}

function renderProjects(){
  const container = $('projects-list')
  container.innerHTML = ''
  if(projects.length===0){
    container.innerHTML = '<div class="muted">No projects — add one.</div>'
    return
  }
  projects.slice().reverse().forEach(p=>{
    updateDerivedProject(p.id)
    const card = document.createElement('div')
    card.className = 'card'
    if(p.id===selectedProjectId) card.classList.add('selected')
    card.style.cursor = 'pointer'
    card.onclick = (e)=>{
      if(e.target.tagName !== 'BUTTON') {
        selectedProjectId = p.id
        renderProjects()
        renderTasks()
      }
    }
    const left = document.createElement('div')
    left.className = 'left'
    const title = document.createElement('h3')
    title.textContent = p.name
    const meta = document.createElement('div')
    meta.className = 'meta'
    meta.innerHTML = `<span class="pill ${p.status}">${p.status.replace('-',' ')}</span> • ${p.progress || 0}%`
    const desc = document.createElement('div')
    desc.className = 'desc'
    desc.textContent = p.description || ''
    left.appendChild(title)
    left.appendChild(meta)
    if(p.description) left.appendChild(desc)

    const btns = document.createElement('div')
    btns.className = 'btns'
    const add = document.createElement('button')
    add.textContent = '+'
    add.onclick = (e)=>{ e.stopPropagation(); openTaskModal(null, p.id) }
    const edit = document.createElement('button')
    edit.textContent = 'Edit'
    edit.onclick = (e)=>{ e.stopPropagation(); openProjectModal(p.id) }
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.className = 'muted'
    del.onclick = (e)=>{ e.stopPropagation(); deleteProject(p.id) }
    btns.appendChild(add)
    btns.appendChild(edit)
    btns.appendChild(del)

    card.appendChild(left)
    card.appendChild(btns)
    container.appendChild(card)
  })
  saveData()
}

function renderTasks(){
  const list = $('tasks-list')
  const info = $('tasks-info')
  const title = $('tasks-title')
  list.innerHTML = ''
  if(!selectedProjectId){
    title.textContent = 'Tasks'
    info.textContent = 'No project selected'
    return
  }
  const project = projects.find(p=>p.id===selectedProjectId)
  title.textContent = `Tasks — ${project?.name || 'Untitled'}`
  info.textContent = `Progress: ${project?.progress || 0}% • Status: ${project?.status || 'draft'}`
  const rel = tasks.filter(t=>t.projectId===selectedProjectId)
  if(rel.length===0){ list.innerHTML = '<div class="muted">No tasks for this project.</div>'; return }
  rel.slice().reverse().forEach(t=>{
    const card = document.createElement('div')
    card.className = 'card task-row'
    const left = document.createElement('div')
    left.className = 'task-left'
    const h = document.createElement('h3')
    h.textContent = t.name
    const meta = document.createElement('div')
    meta.className = 'task-meta'
    meta.textContent = `Status: ${t.status} • Weight: ${t.weight}`
    left.appendChild(h); left.appendChild(meta)

    const btns = document.createElement('div')
    btns.className = 'btns'
    const edit = document.createElement('button')
    edit.textContent = 'Edit'
    edit.onclick = ()=>openTaskModal(t.id)
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.className = 'muted'
    del.onclick = ()=>deleteTask(t.id)
    btns.appendChild(edit); btns.appendChild(del)

    card.appendChild(left); card.appendChild(btns)
    list.appendChild(card)
  })
}

/* Projects CRUD */
function addProject(data){
  const p = { id: Date.now().toString(), name: data.name, description: data.description || '', progress:0, status:'draft' }
  projects.push(p)
  saveData(); renderProjects()
}

function updateProject(id,data){
  const i = projects.findIndex(p=>p.id===id); if(i===-1) return
  projects[i] = {...projects[i], name:data.name, description:data.description||projects[i].description}
  saveData(); renderProjects(); renderTasks()
}

function openConfirmModal(title, message, callback){
  $('confirm-title').textContent = title
  $('confirm-message').textContent = message
  confirmCallback = callback
  $('confirm-modal').setAttribute('aria-hidden','false')
}

function closeConfirmModal(){
  $('confirm-modal').setAttribute('aria-hidden','true')
  confirmCallback = null
}

function deleteProject(id){
  openConfirmModal(
    'Delete Project',
    'Delete this project and its tasks? This action cannot be undone.',
    () => {
      projects = projects.filter(p=>p.id!==id)
      tasks = tasks.filter(t=>t.projectId!==id)
      if(selectedProjectId===id) selectedProjectId = null
      saveData(); renderProjects(); renderTasks()
    }
  )
}

/* Tasks CRUD */
function addTask(data){
  const t = { id: Date.now().toString(), name:data.name, status:data.status || 'draft', projectId:data.projectId, weight: Number(data.weight)||1 }
  tasks.push(t)
  updateDerivedProject(t.projectId)
  saveData(); renderTasks(); renderProjects()
}

function updateTask(id,data){
  const i = tasks.findIndex(t=>t.id===id); if(i===-1) return
  const pidBefore = tasks[i].projectId
  tasks[i] = {...tasks[i], name:data.name, status:data.status, projectId:data.projectId, weight:Number(data.weight)||1}
  updateDerivedProject(tasks[i].projectId)
  if(pidBefore!==tasks[i].projectId) updateDerivedProject(pidBefore)
  saveData(); renderTasks(); renderProjects()
}

function deleteTask(id){
  openConfirmModal(
    'Delete Task',
    'Delete this task? This action cannot be undone.',
    () => {
      const t = tasks.find(x=>x.id===id)
      tasks = tasks.filter(x=>x.id!==id)
      if(t) updateDerivedProject(t.projectId)
      saveData(); renderTasks(); renderProjects()
    }
  )
}

/* Modal helpers */
function openProjectModal(id){
  const modal = $('project-modal');
  modal.setAttribute('aria-hidden','false')
  if(id){
    const p = projects.find(x=>x.id===id)
    $('project-id').value = p.id
    $('project-name').value = p.name
    $('project-desc').value = p.description || ''
    $('project-modal-title').textContent = 'Edit Project'
  } else {
    $('project-id').value = ''
    $('project-name').value = ''
    $('project-desc').value = ''
    $('project-modal-title').textContent = 'Add Project'
  }
}

function closeProjectModal(){
  $('project-modal').setAttribute('aria-hidden','true')
}

function openTaskModal(taskId, preSelectedProjectId){
  const modal = $('task-modal'); modal.setAttribute('aria-hidden','false')
  // populate project select
  const sel = $('task-project'); sel.innerHTML = ''
  projects.forEach(p=>{ const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; sel.appendChild(opt) })
  
  const isEditing = taskId !== null && taskId !== undefined && taskId !== ''
  if(isEditing){
    // Edit existing task
    const t = tasks.find(x=>x.id===taskId)
    $('task-id').value = t.id
    $('task-name').value = t.name
    $('task-status').value = t.status
    $('task-project').value = t.projectId
    $('task-weight').value = t.weight
    $('task-modal-title').textContent = 'Edit Task'
    $('task-project').disabled = false
  } else {
    // Add new task
    $('task-id').value = ''
    $('task-name').value = ''
    $('task-status').value = 'draft'
    const projId = preSelectedProjectId || selectedProjectId || (projects[0] && projects[0].id) || ''
    $('task-project').value = projId
    $('task-weight').value = 1
    $('task-modal-title').textContent = 'Add Task'
    $('task-project').disabled = !!preSelectedProjectId
  }
}

function closeTaskModal(){ $('task-modal').setAttribute('aria-hidden','true') }

/* Form handlers */
document.addEventListener('DOMContentLoaded', ()=>{
  loadData();
  renderProjects(); renderTasks();

  // buttons
  $('add-project-btn').addEventListener('click', ()=>openProjectModal())
  $('add-task-btn').addEventListener('click', ()=>{
    if(projects.length===0){ openConfirmModal('Info', 'Please create a project first'); return }
    openTaskModal()
  })

  // project form
  $('project-form').addEventListener('submit', e=>{
    e.preventDefault()
    const id = $('project-id').value
    const data = { name: $('project-name').value.trim(), description: $('project-desc').value.trim() }
    if(!data.name){ openConfirmModal('Warning', 'Project name is required'); return }
    if(id) updateProject(id,data)
    else addProject(data)
    closeProjectModal()
  })
  $('project-cancel').addEventListener('click', ()=>closeProjectModal())

  // task form
  $('task-form').addEventListener('submit', e=>{
    e.preventDefault()
    const id = $('task-id').value
    const data = { name:$('task-name').value.trim(), status:$('task-status').value, projectId:$('task-project').value, weight: Number($('task-weight').value)||1 }
    if(!data.name){ openConfirmModal('Warning', 'Task name is required'); return }
    if(!data.projectId){ openConfirmModal('Warning', 'Please select a project'); return }
    if(id) updateTask(id,data)
    else addTask(data)
    closeTaskModal()
  })
  $('task-cancel').addEventListener('click', ()=>closeTaskModal())

  // confirm modal
  $('confirm-yes').addEventListener('click', ()=>{
    if(confirmCallback) confirmCallback()
    closeConfirmModal()
  })
  $('confirm-no').addEventListener('click', ()=>closeConfirmModal())

  // close modals on background click
  document.querySelectorAll('.modal').forEach(m=>{
    m.addEventListener('click', e=>{ if(e.target===m) m.setAttribute('aria-hidden','true') })
  })
})

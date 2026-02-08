const PROJECTS_KEY = 'project-tracker:projects'
const TASKS_KEY = 'project-tracker:tasks'

function $(id){return document.getElementById(id)}

let projects = []
let tasks = []
let selectedProjectId = null
let confirmCallback = null

function hasCircularTaskDependency(taskId, targetId, visited = new Set()) {
  if (taskId === targetId) return true
  if (visited.has(taskId)) return false
  visited.add(taskId)
  
  const task = tasks.find(t => t.id === taskId)
  if (!task || !task.dependencies) return false
  
  for (const depId of task.dependencies) {
    if (hasCircularTaskDependency(depId, targetId, new Set(visited))) return true
  }
  return false
}

function canTaskBeDone(taskId) {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return false
  if (!task.dependencies || task.dependencies.length === 0) return true
  return task.dependencies.every(depId => {
    const dep = tasks.find(t => t.id === depId)
    return dep && dep.status === 'done'
  })
}

function revalidateDependentTasks(changedTaskId) {
  tasks.forEach(t => {
    if (t.dependencies && t.dependencies.includes(changedTaskId) && t.status === 'done') {
      if (!canTaskBeDone(t.id)) t.status = 'inprogress'
    }
  })
}

function hasCircularProjectDependency(projectId, targetId, visited = new Set()) {
  if (projectId === targetId) return true
  if (visited.has(projectId)) return false
  visited.add(projectId)
  
  const proj = projects.find(p => p.id === projectId)
  if (!proj || !proj.dependencies) return false
  
  for (const depId of proj.dependencies) {
    if (hasCircularProjectDependency(depId, targetId, new Set(visited))) return true
  }
  return false
}

function canProjectChangeStatus(projectId, newStatus) {
  if (newStatus === 'draft') return true
  const proj = projects.find(p => p.id === projectId)
  if (!proj || !proj.dependencies || proj.dependencies.length === 0) return true
  return proj.dependencies.every(depId => {
    const dep = projects.find(p => p.id === depId)
    return dep && dep.status === 'done'
  })
}

function cascadeProjectStatusChange(changedProjectId) {
  const changedProj = projects.find(p => p.id === changedProjectId)
  if (!changedProj) return
  
  projects.forEach(p => {
    if (p.dependencies && p.dependencies.includes(changedProjectId)) {
      if (changedProj.status !== 'done' && (p.status === 'inprogress' || p.status === 'done')) {
        p.status = 'draft'
      }
    }
  })
}

function findScheduleConflict(startDate, endDate, excludeProjectId = null) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (const p of projects) {
    if (excludeProjectId && p.id === excludeProjectId) continue
    if (!p.start_date || !p.end_date) continue
    
    const pStart = new Date(p.start_date)
    const pEnd = new Date(p.end_date)
    
    if (start <= pEnd && end >= pStart) return p
  }
  return null
}

function getTaskChildren(parentId) {
  return tasks.filter(t => t.parentId === parentId)
}

function getAllDescendants(taskId) {
  const children = getTaskChildren(taskId)
  let all = [...children]
  children.forEach(child => {
    all = all.concat(getAllDescendants(child.id))
  })
  return all
}

function getTaskHierarchicalStatus(taskId) {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return 'draft'
  
  const descendants = getAllDescendants(taskId)
  if (descendants.length === 0) return task.status
  
  const allDone = descendants.every(d => d.status === 'done') && task.status === 'done'
  if (allDone) return 'done'
  
  const anyInProgress = descendants.some(d => d.status === 'inprogress') || task.status === 'inprogress'
  if (anyInProgress) return 'inprogress'
  
  return 'draft'
}

function taskMatchesFilter(taskId, query) {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return false
  
  const queryLower = query.toLowerCase()

  if (task.name.toLowerCase().includes(queryLower)) return true
  
  let current = task
  while (current.parentId) {
    current = tasks.find(t => t.id === current.parentId)
    if (!current) break
    if (current.name.toLowerCase().includes(queryLower)) return true
  }

  const descendants = getAllDescendants(taskId)
  if (descendants.some(d => d.name.toLowerCase().includes(queryLower))) return true
  
  return false
}

function getHierarchyForDisplay(taskId) {
  const related = new Set()
  related.add(taskId)
  
  let current = tasks.find(t => t.id === taskId)
  while (current && current.parentId) {
    related.add(current.parentId)
    current = tasks.find(t => t.id === current.parentId)
  }
  
  const descendants = getAllDescendants(taskId)
  descendants.forEach(d => related.add(d.id))
  
  return related
}

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
    
    if (p.start_date || p.end_date) {
      const dateDiv = document.createElement('div')
      dateDiv.className = 'meta'
      dateDiv.style.fontSize = '0.85em'
      dateDiv.style.opacity = '0.75'
      dateDiv.textContent = `${p.start_date || '?'} to ${p.end_date || '?'}`
      meta.appendChild(dateDiv)
    }

    if (p.dependencies && p.dependencies.length > 0) {
      const depNames = p.dependencies.map(dId => projects.find(d => d.id === dId)?.name || 'Unknown').join(', ')
      const depDiv = document.createElement('div')
      depDiv.className = 'meta'
      depDiv.style.fontSize = '0.85em'
      depDiv.style.opacity = '0.7'
      depDiv.textContent = `Depends on: ${depNames}`
      meta.appendChild(depDiv)
    }
    
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
  const rel = tasks.filter(t=>t.projectId===selectedProjectId && !t.parentId) // Only show root tasks
  if(rel.length===0){ list.innerHTML = '<div class="muted">No tasks for this project.</div>'; return }
  
  rel.slice().reverse().forEach(t=>{
    renderTaskHierarchy(t, list, 0)
  })
}

function renderTaskHierarchy(task, container, level) {
  const card = document.createElement('div')
  card.className = 'card task-row'
  card.style.marginLeft = (level * 20) + 'px'
  
  const left = document.createElement('div')
  left.className = 'task-left'
  const h = document.createElement('h3')
  h.textContent = task.name

  const hierarchicalStatus = getTaskHierarchicalStatus(task.id)
  
  const meta = document.createElement('div')
  meta.className = 'task-meta'
  let metaText = `Status: ${hierarchicalStatus} • Weight: ${task.weight}`

  if (task.dependencies && task.dependencies.length > 0) {
    const depNames = task.dependencies.map(dId => tasks.find(d => d.id === dId)?.name || 'Unknown').join(', ')
    metaText += ` • Depends on: ${depNames}`
  }
  
  meta.textContent = metaText
  left.appendChild(h); left.appendChild(meta)

  const btns = document.createElement('div')
  btns.className = 'btns'
  const edit = document.createElement('button')
  edit.textContent = 'Edit'
  edit.onclick = ()=>openTaskModal(task.id)
  const del = document.createElement('button')
  del.textContent = 'Delete'
  del.className = 'muted'
  del.onclick = ()=>deleteTask(task.id)
  btns.appendChild(edit); btns.appendChild(del)

  card.appendChild(left); card.appendChild(btns)
  container.appendChild(card)

  const children = getTaskChildren(task.id)
  children.forEach(child => {
    renderTaskHierarchy(child, container, level + 1)
  })
}

function addProject(data){
  if (data.start_date && data.end_date) {
    const conflict = findScheduleConflict(data.start_date, data.end_date)
    if (conflict) {
      return { error: `Schedule conflict with project "${conflict.name}" (${conflict.start_date} - ${conflict.end_date})` }
    }
  }

  if (data.dependencies) {
    for (const depId of data.dependencies) {
      if (!projects.find(p => p.id === depId)) {
        return { error: 'One or more dependencies do not exist' }
      }
    }
  }
  
  const p = {
    id: Date.now().toString(),
    name: data.name,
    description: data.description || '',
    progress: 0,
    status: 'draft',
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    dependencies: data.dependencies || []
  }
  projects.push(p)
  saveData(); renderProjects()
  return { success: true }
}

function updateProject(id,data){
  const i = projects.findIndex(p=>p.id===id); if(i===-1) return
  const oldProj = projects[i]
  
  if (data.start_date && data.end_date) {
    const conflict = findScheduleConflict(data.start_date, data.end_date, id)
    if (conflict) {
      return { error: `Schedule conflict with project "${conflict.name}" (${conflict.start_date} - ${conflict.end_date})` }
    }
  }
  
  if (data.dependencies) {
    for (const depId of data.dependencies) {
      if (depId === id) {
        return { error: 'Project cannot depend on itself' }
      }
      if (hasCircularProjectDependency(depId, id)) {
        return { error: 'Circular project dependency detected' }
      }
      if (!projects.find(p => p.id === depId)) {
        return { error: 'One or more dependencies do not exist' }
      }
    }
  }
  
  projects[i] = {
    ...projects[i],
    name: data.name,
    description: data.description || projects[i].description,
    start_date: data.start_date || oldProj.start_date,
    end_date: data.end_date || oldProj.end_date,
    dependencies: data.dependencies || oldProj.dependencies || []
  }

  if (data.status && data.status !== oldProj.status) {
    if (!canProjectChangeStatus(id, data.status)) {
      return { error: 'Cannot change project status: one or more dependencies are not done' }
    }
    projects[i].status = data.status
    cascadeProjectStatusChange(id)
  }
  
  saveData(); renderProjects(); renderTasks()
  return { success: true }
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

function updateTask(id,data){
  const i = tasks.findIndex(t=>t.id===id); if(i===-1) return
  const oldTask = tasks[i]
  const pidBefore = oldTask.projectId
  
  if (data.status === 'done' && !canTaskBeDone(id)) {
    return { error: 'Cannot mark task as done: one or more dependencies are not done' }
  }
  
  if (data.dependencies) {
    for (const depId of data.dependencies) {
      if (hasCircularTaskDependency(depId, id)) {
        return { error: 'Circular task dependency detected' }
      }
    }
  }

  if (data.parentId && data.parentId === id) {
    return { error: 'Task cannot be its own parent' }
  }
  if (data.parentId && hasCircularTaskDependency(data.parentId, id)) {
    return { error: 'Creating this parent-child relationship would create a cycle' }
  }
  
  tasks[i] = {
    ...tasks[i],
    name: data.name,
    status: data.status,
    projectId: data.projectId,
    weight: Number(data.weight) || 1,
    dependencies: data.dependencies || oldTask.dependencies || [],
    parentId: data.parentId || oldTask.parentId || null
  }
  
  revalidateDependentTasks(id)
  updateDerivedProject(tasks[i].projectId)
  if (pidBefore !== tasks[i].projectId) updateDerivedProject(pidBefore)
  saveData(); renderTasks(); renderProjects()
  return { success: true }
}

function addTask(data){
  if (data.dependencies) {
    for (const depId of data.dependencies) {
      if (hasCircularTaskDependency(depId, 'new')) {
        return { error: 'Circular task dependency detected' }
      }
    }
  }
  
  const newId = Date.now().toString()
  
  if (data.parentId && hasCircularTaskDependency(data.parentId, newId)) {
    return { error: 'Creating this parent-child relationship would create a cycle' }
  }
  
  const t = {
    id: newId,
    name: data.name,
    status: data.status || 'draft',
    projectId: data.projectId,
    weight: Number(data.weight) || 1,
    dependencies: data.dependencies || [],
    parentId: data.parentId || null
  }
  tasks.push(t)
  updateDerivedProject(t.projectId)
  saveData(); renderTasks(); renderProjects()
  return { success: true }
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
  const depsSelect = $('project-dependencies')
  depsSelect.innerHTML = ''
  projects.forEach(p => {
    if (p.id === id) return
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = p.name
    depsSelect.appendChild(opt)
  })
  
  if(id){
    const p = projects.find(x=>x.id===id)
    $('project-id').value = p.id
    $('project-name').value = p.name
    $('project-desc').value = p.description || ''
    $('project-start-date').value = p.start_date || ''
    $('project-end-date').value = p.end_date || ''
    $('project-status').value = p.status || 'draft'

    if (p.dependencies && p.dependencies.length > 0) {
      Array.from(depsSelect.options).forEach(opt => {
        opt.selected = p.dependencies.includes(opt.value)
      })
    }
    
    $('project-modal-title').textContent = 'Edit Project'
    $('project-status').style.display = 'block'
    document.querySelector('label[for="project-status"]').style.display = 'block'
  } else {
    $('project-id').value = ''
    $('project-name').value = ''
    $('project-desc').value = ''
    $('project-start-date').value = ''
    $('project-end-date').value = ''
    $('project-status').value = 'draft'
    $('project-modal-title').textContent = 'Add Project'
    $('project-status').style.display = 'none'
    document.querySelector('label[for="project-status"]').style.display = 'none'
  }
}

function closeProjectModal(){
  $('project-modal').setAttribute('aria-hidden','true')
}

function openTaskModal(taskId, preSelectedProjectId){
  const modal = $('task-modal'); modal.setAttribute('aria-hidden','false')

  const sel = $('task-project'); sel.innerHTML = ''
  projects.forEach(p=>{ const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; sel.appendChild(opt) })

  const parentSelect = $('task-parent')
  parentSelect.innerHTML = '<option value="">No parent</option>'
  tasks.filter(t => t.projectId === (preSelectedProjectId || selectedProjectId || (projects[0] && projects[0].id))).forEach(t => {
    const opt = document.createElement('option')
    opt.value = t.id
    opt.textContent = `${t.name} (${t.status})`
    parentSelect.appendChild(opt)
  })
  
  const depsSelect = $('task-dependencies')
  depsSelect.innerHTML = ''
  tasks.filter(t => t.projectId === (preSelectedProjectId || selectedProjectId || (projects[0] && projects[0].id))).forEach(t => {
    const opt = document.createElement('option')
    opt.value = t.id
    opt.textContent = `${t.name} (${t.status})`
    depsSelect.appendChild(opt)
  })
  
  const isEditing = taskId !== null && taskId !== undefined && taskId !== ''
  if(isEditing){
    const t = tasks.find(x=>x.id===taskId)
    $('task-id').value = t.id
    $('task-name').value = t.name
    $('task-status').value = t.status
    $('task-project').value = t.projectId
    $('task-weight').value = t.weight
    $('task-parent').value = t.parentId || ''

    if (t.dependencies && t.dependencies.length > 0) {
      Array.from(depsSelect.options).forEach(opt => {
        opt.selected = t.dependencies.includes(opt.value)
      })
    }
    
    $('task-modal-title').textContent = 'Edit Task'
    $('task-project').disabled = false
  } else {
    $('task-id').value = ''
    $('task-name').value = ''
    $('task-status').value = 'draft'
    const projId = preSelectedProjectId || selectedProjectId || (projects[0] && projects[0].id) || ''
    $('task-project').value = projId
    $('task-weight').value = 1
    $('task-parent').value = ''
    $('task-modal-title').textContent = 'Add Task'
    $('task-project').disabled = !!preSelectedProjectId
  }
}

function closeTaskModal(){ $('task-modal').setAttribute('aria-hidden','true') }
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
    const data = {
      name: $('project-name').value.trim(),
      description: $('project-desc').value.trim(),
      start_date: $('project-start-date').value || null,
      end_date: $('project-end-date').value || null,
      dependencies: Array.from($('project-dependencies').selectedOptions).map(o => o.value),
      status: id ? $('project-status').value : 'draft'
    }
    if(!data.name){ openConfirmModal('Warning', 'Project name is required'); return }
    if(data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)){
      openConfirmModal('Warning', 'Start date must be before end date'); return
    }
    const result = id ? updateProject(id, data) : addProject(data)
    if(result && result.error){ openConfirmModal('Error', result.error); return }
    closeProjectModal()
  })
  $('project-cancel').addEventListener('click', ()=>closeProjectModal())

  // task form
  $('task-form').addEventListener('submit', e=>{
    e.preventDefault()
    const id = $('task-id').value
    const data = {
      name: $('task-name').value.trim(),
      status: $('task-status').value,
      projectId: $('task-project').value,
      weight: Number($('task-weight').value) || 1,
      parentId: $('task-parent').value || null,
      dependencies: Array.from($('task-dependencies').selectedOptions).map(o => o.value)
    }
    if(!data.name){ openConfirmModal('Warning', 'Task name is required'); return }
    if(!data.projectId){ openConfirmModal('Warning', 'Please select a project'); return }
    const result = id ? updateTask(id, data) : addTask(data)
    if(result && result.error){ openConfirmModal('Error', result.error); return }
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

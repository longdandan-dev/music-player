import './style.css'

// 数据区
const tracks = [
    {
        id:'t1',
        title:'凌晨四点的代码',
        artist:'深夜电台',
        album:'代码之夜',
        mood:'lo-fi',
        duration:35.89,
        src:'/audio/01-lingchen.wav',
        c1:'#3b6df5',
        c2:'#8b5cf6',
    },

    {
        id:'t2',
        title:'深圳湾的风',
        artist:'海风组合',
        album:'南方海岸',
        mood:'民谣',
        duration:31.6,
        src:'/audio/02-shenzhenwan.wav',
        c1:'#0ea5e9',
        c2:'#22d3ee',
    },

    {
        id:'t3',
        title:'海边的信号塔',
        artist:'海风组合',
        album:'南方海岸',
        mood:'city pop',
        duration:27.78,
        src:'/audio/03-xinhaota.wav',
        c1:'#f472b6',
        c2:'#fb923c',
    },

    {
        id:'t4',
        title:'像素心跳',
        artist:'八比特工坊',
        album:'像素时代',
        mood:'8-bit',
        duration:24.1,
        src:'/audio/04-xiangsu.wav',
        c1:'#22c55e',
        c2:'#a3e635',
    },

    {
        id:'t5',
        title:'雨停之后',
        artist:'木子',
        album:'雨与钢琴',
        mood:'钢琴',
        duration:28.27,
        src:'/audio/05-yuting.wav',
        c1:'#6366f1',
        c2:'#38bdf8',
    },

    {
        id:'t6',
        title:'前进吧，前端',
        artist:'木子',
        album:'出发',
        mood:'流行',
        duration:25.21,
        src:'/audio/06-qianjin.wav',
        c1:'#f59e0b',
        c2:'#ef4444',
    },

    {
        id:'t7',
        title:'错误音频',
        artist:'木子',
        album:'出发',
        mood:'流行',
        duration:25.21,
        src:'/audio/07-broken.wav',
        c1:'#f59e0b',
        c2:'#ef4444',
    },
]

const LOOP_MODES= {
    list: {text:'列表循环', next:'single'},
    single: {text:'单曲循环', next:'none'},
    none: {text:'顺序播放', next:'list'},
}

//状态区
let keyword = ''
let currentIndex = -1  //还没选过歌
let loopMode = 'list'
let isSeeking = false
let filter = 'all'
let favorites = []
let brokenIds = []
let toastTimer = null

const STORAGE_KEY = 'tingfeng-player-state'
const listEl = document.querySelector('#trackList')
const countEl = document.querySelector('#listCount')
const audio = document.querySelector('#audio')
const playBtn = document.querySelector('#playBtn')
const playerEl = document.querySelector('#player')
const playerTitle = document.querySelector('#playerTitle')
const playerArtist = document.querySelector('#playerArtist')
const playerCover = document.querySelector('#playerCover')
const loopBtn = document.querySelector('#loopBtn')
const loopText = document.querySelector('#loopText')
const prevBtn = document.querySelector('#prevBtn')
const nextBtn = document.querySelector('#nextBtn')
const seek = document.querySelector('#seek')
const timeNow = document.querySelector('#timeNow')
const timeTotal = document.querySelector('#timeTotal')
const muteBtn = document.querySelector('#muteBtn')
const volumeEl = document.querySelector('#volume')
const emptyEl = document.querySelector('#empty')
const toastEl = document.querySelector('#toast')


//事件监听
audio.addEventListener('error',handleAudioError)
audio.addEventListener('play',renderPlayState)
audio.addEventListener('pause',renderPlayState)
audio.addEventListener('timeupdate',()=>{if(!isSeeking) renderProgress()})
audio.addEventListener('loadedmetadata',renderProgress)
audio.addEventListener('durationchange',renderProgress)
seek.addEventListener('input',(event)=>{
    isSeeking = true
    const percent = Number(event.target.value) / 10
    seek.style.setProperty('--played', percent.toFixed(1) + '%')
    timeNow.textContent = formatTime((percent / 100)* audio.duration)

    saveState()
})
seek.addEventListener('change',(event)=>{
    seekTo(Number(event.target.value) / 10)
    isSeeking = false
})
//拖音量条
volumeEl.addEventListener('input',(event)=>{
    audio.volume = Number(event.target.value)   // 0 ~ 1，原样给它，不用换算
    audio.muted = audio.volume === 0            // 拖到 0 就算静音
    renderVolumeState()
})

//点喇叭：静音 / 取消静音
muteBtn.addEventListener('click',()=>{
    audio.muted = !audio.muted
    //取消静音时如果音量是 0，抬回一半，不然点了没反应
    if(!audio.muted && audio.volume === 0){
        audio.volume = 0.5
        volumeEl.value = '0.5'
    }
    renderVolumeState()
})
audio.addEventListener('ended',()=>{
    if(loopMode === 'single'){
        audio.currentTime = 0
        audio.play()
        return 
    }

    const queue = getQueue()
    const current = tracks[currentIndex]
    const lastOne = queue[queue.length -1]
    if(loopMode === 'none' && current && lastOne && current.id === lastOne.id){
        stopAtEnd()
        return
    }
       playSibling(1)
})

const onSearchInput = debounce((event)=>{
    keyword = event.target.value
    renderlist()
},250)
const searchEl = document.querySelector('#search')
searchEl.addEventListener('input',onSearchInput)

loopBtn.addEventListener('click',cycleLoopMode)
prevBtn.addEventListener('click',playPrev)
nextBtn.addEventListener('click',()=>playSibling(1))
//播放按钮的点击
playBtn.addEventListener('click',togglePlay)

function togglePlay(){
    if(audio.paused){
        playTrack(currentIndex < 0 ? 0 : currentIndex)
    }else{
        audio.pause()
    }
}

//事件委托
listEl.addEventListener('click',(event)=>{
    const row = event.target.closest('.track')
    const favBtn = event.target.closest('.fav-btn')
    if(favBtn){
        toggleFavorite(favBtn.dataset.fav)
        return
    }
    if(!row)return
    const index =tracks.findIndex((track) =>track.id === row.dataset.id)
    if(index < 0)return

    if(index === currentIndex && !audio.paused){
        audio.pause()
        return
    }
    playTrack(index)
})  



// 函数渲染区
// 模板函数
const trackTemplate = (track, index) =>{
    const isFav = favorites.includes(track.id)
    return `
    <li class="track${brokenIds.includes(track.id) ? ' is-broken' : ''}" data-id="${track.id}">
        <span class="track-index">${index + 1}</span>
        <span class="track-cover" style="--c1:${track.c1};--c2:${track.c2}">${track.title.slice(0,1)}</span>
        <span class="track-title">${track.title}</span>
        <span class="track-meta">${track.artist} · ${track.album}</span>
        <span class="track-mood">${track.mood }</span>
        <span class="track-duration">${formatTime(track.duration) }</span>
        <button class="fav-btn${isFav ? ' is-fav' : ''}" type="button"
                data-fav="${track.id}" aria-pressed="${isFav}" aria-label="${isFav ? '取消收藏' : '收藏'} 《${track.title}》">
        <svg class="icon-heart" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19.6c-1.5-.9-6.4-4.2-6.4-8.3A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 6.4 2.7c0 4.1-4.9 7.4-6.4 8.3z">
            </path>
        </svg>
    </li>`     
}
//时长换算函数
function formatTime(seconds){
    if(!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const total = Math.floor(seconds)
    const m = Math.floor(total / 60)
    const s = total % 60
    const two = (n) => String(n).padStart(2,'0')

    return `${m}:${two(s)}`
}
// 渲染函数

function renderlist(){
    const list = getQueue()
    listEl.innerHTML = list.map(trackTemplate).join('')
    countEl.textContent = list.length === tracks.length 
    ? `${tracks.length}首`
    :`匹配${list.length}首 / 共 ${tracks.length}首`

    if(list.length === 0){
        emptyEl.textContent = (filter === 'fav' && !keyword.trim())
        ? '还没有收藏的歌曲，点击右边的爱心试试'
        : '没有找到匹配的歌，换个词语试试'
    }
    emptyEl.hidden = list.length > 0

    renderPlayState()
}
renderlist()

//防抖函数
function debounce(fn,delay){
    let timer = null
    return (...args)=>{
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay);
    }
}

function toggleFavorite(id){
    const index = favorites.indexOf(id)
    if(index === -1) favorites.push(id)
        else favorites.splice(index, 1)
    renderlist()
    renderFavCount()
    saveState()
}

// 播放器区
//把当前在播放那一首歌画在画板上
function renderNowPlaying(){
    const track = tracks[currentIndex]
    if(!track) return
    playerTitle.textContent = track.title
    playerArtist.textContent = `${track.artist} · ${track.album}`
    playerCover.textContent = track.title.slice(0,1)
    playerCover.style.setProperty('--c1',track.c1)
    playerCover.style.setProperty('--c2',track.c2)
}

//播放第index首
function playTrack(index){
    const track = tracks[index]
    if(!track)return

    if(index !==currentIndex){ //真换歌再动src
        currentIndex = index
        audio.src = track.src
        renderNowPlaying()
        renderProgress()
    }

    audio.play().catch((err) =>{
        console.error('播放失败:',err)
    })

    saveState()
}

//状态写回
function renderPlayState(){
    const isPlaying = !audio.paused

    playBtn.classList.toggle('is-playing',isPlaying)
    playerEl.classList.toggle('is-playing',isPlaying)
    listEl.classList.toggle('is-playing',isPlaying)
   
    const current = tracks[currentIndex]
    document.querySelectorAll('#trackList .track').forEach((li)=>{
        const isCurrent = li.dataset.id === (current ? current.id : '')
        li.classList.toggle('is-current',isCurrent)
        li.setAttribute('aria-current', isCurrent ? 'true' : 'false')
    })

    
}

function renderLoopState(){
    const mode = LOOP_MODES[loopMode]
    loopBtn.dataset.mode = loopMode
    loopText.textContent = mode.text
}

function renderProgress(){
    const duration = audio.duration || 0
    const percent = duration > 0 ? (audio.currentTime / duration) *100 : 0

    timeNow.textContent = formatTime(audio.currentTime)
    timeTotal.textContent = formatTime(duration)

    seek.disabled = currentIndex < 0
    seek.value = String(Math.round(percent * 10))
    seek.style.setProperty('--played',percent.toFixed(1) + '%')

    saveState()

}

function seekTo(percent){
    if(!audio.duration) return
    audio.currentTime  = (percent / 100) * audio.duration
    renderProgress()
}

function renderVolumeState(){
    const muted = audio.muted || audio.volume === 0 
    muteBtn.classList.toggle('is-muted',muted)
    muteBtn.setAttribute('aria-label',muted ? '取消静音' : '静音')
}


// 键盘键快捷键、空格播放暂停、左右键前后5秒、上下键调音量
function onKeyDown(event){
    const tag = event.target.tagName
    if(tag === 'INPUT' || tag === 'TEXTAREA')return
    if(event.metaKey || event.ctrlKey || event.altKey)return

    if(event.code === 'Space'){
        event.preventDefault()
        togglePlay()
    }else if(event.code === 'ArrowRight'){
        event.preventDefault()
        audio.currentTime = Math.min(audio.duration || 0,audio.currentTime + 5)
        renderProgress()
    }else if(event.code === 'ArrowLeft'){
        event.preventDefault()
        audio.currentTime = Math.max(0, audio.currentTime - 5)
        renderProgress()
    }else if(event.code ==='ArrowUp' || event.code === 'ArrowDown'){
        event.preventDefault()
        const step = event.code === 'ArrowUp' ? 0.05 : -0.05
        const next = Math.min(1, Math.max(0, audio.volume + step))
        audio.volume = next
        audio.muted = next === 0
        volumeEl.value = String(next)
        renderVolumeState()
    }
}
document.addEventListener('keydown',onKeyDown)


//切歌永远走屏幕上看的到的队列
function getQueue(){
    const word = keyword.trim().toLowerCase()
    return tracks.filter((track)=>{
        if(filter === 'fav' && !favorites.includes(track.id))
            return false
        if(!word) return tracks
        const text = `${track.title} ${track.artist} ${track.album}`.toLowerCase()
        return text.includes(word)
    })
}

//切歌函数
function playSibling(dir){
    const queue = getQueue()
    if(queue.length === 0) return 

    const current = tracks[currentIndex]
    let pos = current ? queue.findIndex((track)=> track.id === current.id): -1
    if(pos < 0 ) pos = dir > 0 ? -1 :0
    let next = pos + dir
    if(next >= queue.length) next = 0
    if(next < 0)next = queue.length - 1
    playTrack(tracks.findIndex((track)=> track.id === queue[next].id))


}

function playPrev(){
    if (audio.currentTime > 3) audio.currentTime = 0
    else playSibling(-1)
}

function stopAtEnd(){
    audio.pause()
    audio.currentTime = 0

}
// 切换函数
function cycleLoopMode(){
    loopMode = LOOP_MODES[loopMode].next
    renderLoopState()
    saveState()
}

function renderFavCount(){
    document.querySelector('#favCount').textContent = String(favorites.length)
}

for(const tab of document.querySelectorAll('.tab')){
    tab.addEventListener('click',()=>{
        filter = tab.dataset.filter
        const isAll = filter === 'all'

    document.querySelector('#filterAll').classList.toggle('is-active',isAll)
    document.querySelector('#filterFav').classList.toggle('is-active',!isAll)
    document.querySelector('#filterAll').setAttribute('aria-pressed',isAll)
    document.querySelector('#filterFav').setAttribute('aria-pressed',!isAll)
        renderlist()
    })
}

// 存重新加载页面需要的几个值
function saveState(){
    try{
        const track = tracks[currentIndex]
        localStorage.setItem(STORAGE_KEY,JSON.stringify({
            favorites: favorites,
            loopMode: loopMode,
            volume: audio.volume,
            lastId: track ? track.id : null,
        }))}
        catch(err){
            console.warn('保存本地记录失败：', err.message)
        }
    }

// 取：读不出来（第一次来、 数据别改坏 、隐私模式）就当没有
function loadState(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY)
        if(!raw)return null 
        const saved = JSON.parse(raw)
        return saved && typeof saved === 'object' ? saved : null 
    }catch(err){
        console.warn('读取本地记录失败：',err.message)
        return null
    }
}

// 恢复：只装弹，不开火（不调用play）
function restoreState(){
    const saved = loadState()
    if(!saved)return

    if(Array.isArray(saved.favorites)){
        favorites = saved.favorites.filter((id)=>tracks.some((track)=> track.id === id))
    }
    if(saved.loopMode && LOOP_MODES[saved.loopMode]){
        loopMode = saved.loopMode
    }
    if(typeof saved.volume === 'number'){
        const v = Math.min(1, Math.max(0, saved.volume))
        audio.volume = volumeEl.value = String(v)
        audio.muted = v === 0
    }

    const index =saved.lastId ? tracks.findIndex((track)=> track.id === saved.lastId) : -1
    if(index >= 0){
        currentIndex = index
        audio.src =tracks[index].src
    }
}

function handleAudioError(){
    const track = getCurrentTrack()
    if(!track)return 
    if(!brokenIds.includes(track.id)) brokenIds.push(track.id)
    renderlist()

    const playable = getQueue().filter((item) => !brokenIds.includes(item.id))
    if(playable.length === 0 ){
        showToasts('这个列表的歌都放不出来,检查一下音频文件吧','error')
        renderPlayState()
        return
    }
    showToasts(`《${track.title}》播放失败，已自动跳到下一首`,'error')
    playSibling(1)
}

function getCurrentTrack(){
    const track = tracks[currentIndex]
    return track || null
}

function showToasts(message,type = 'info'){
    toastEl.textContent = message
    toastEl.dataset.type = type
    toastEl.classList.add('is-show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
        toastEl.classList.remove('is-show')
    }, 4000);
}

audio.volume = Number(volumeEl.value)

restoreState()        // 1. 先把存的东西装回来
renderlist()          // 2. 再画列表（顺序在这儿很重要：画之前必须先恢复好）
renderFavCount()      // 3. 收藏数字
renderNowPlaying()    // 4. 播放器面板（恢复的那首要显示歌名+封面，而不是"还没选歌"）
renderLoopState()     // 5. 循环按钮的字
renderProgress()      // 6. 进度条与总时长
renderVolumeState()   // 7. 喇叭图标


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
]

const LOOP_MODES= {
    list: {text:'列表循环', next:'single'},
    single: {text:'单曲循环', next:'none'},
    none: {text:'顺序播放', next:'list'},
}

// 函数渲染区
// 模板函数
const trackTemplate = (track, index) =>`
    <li class="track" data-id="${track.id}">
        <span class="track-index">${index + 1}</span>
        <span class="track-cover" style="--c1:${track.c1};--c2:${track.c2}">${track.title.slice(0,1)}</span>
        <span class="track-title">${track.title}</span>
        <span class="track-meta">${track.artist} · ${track.album}</span>
        <span class="track-mood">${track.mood }</span>
        <span class="track-duration">${formatTime(track.duration) }</span>
    </li>  
`
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
const listEl = document.querySelector('#trackList')
const countEl = document.querySelector('#listCount')

function renderlist(){
    listEl.innerHTML = tracks.map(trackTemplate).join('')
    countEl.textContent = `${tracks.length}首`
}
renderlist()


// 播放器区
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

let currentIndex = -1  //还没选过歌
let loopMode = 'list'
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
}

//状态写回
function renderPlayState(){
    const isPlaying = !audio.paused

    playBtn.classList.toggle('is-playing',isPlaying)
    playerEl.classList.toggle('is-playing',isPlaying)
    listEl.classList.toggle('is-playing',isPlaying)

    document.querySelectorAll('#trackList .track').forEach((li,index)=>{
        li.classList.toggle('is-current',index === currentIndex)
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

}

//事件监听
audio.addEventListener('play',renderPlayState)
audio.addEventListener('pause',renderPlayState)
audio.addEventListener('timeupdate',renderProgress)
audio.addEventListener('loadedmetadata',renderProgress)
audio.addEventListener('durationchange',renderProgress)
audio.addEventListener('ended',()=>{
    if(loopMode === 'single'){
        audio.currentTime = 0
        audio.play()
        return 
    }
    if(loopMode === 'none' && currentIndex === tracks.length - 1){
        stopAtEnd()
        return
    }
       playSibling(1)
})
loopBtn.addEventListener('click',cycleLoopMode)
prevBtn.addEventListener('click',playPrev)
nextBtn.addEventListener('click',()=>playSibling(1))
//播放按钮的点击
playBtn.addEventListener('click',()=>{
    if(audio.paused){
        playTrack(currentIndex < 0 ? 0 : currentIndex)
    }else{
        audio.pause()
    }
})

//事件委托
listEl.addEventListener('click',(event)=>{
    const row = event.target.closest('.track')
    if(!row)return
    const index =tracks.findIndex((track) =>track.id === row.dataset.id)
    if(index < 0)return

    if(index === currentIndex && !audio.paused){
        audio.pause()
        return
    }
    playTrack(index)
})  


//切歌永远走屏幕上看的到的队列
function getQueue(){
    return tracks
}
//切歌函数
function playSibling(dir){
    const queue = getQueue()
    if(queue.length === 0) return 
    if(currentIndex < 0 ){
        playTrack(0)
        return
    }
    let next = currentIndex + dir
    if(next >= queue.length) next = 0
    if(next < 0)next = queue.length - 1
    playTrack(next)


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
}
renderLoopState()
renderProgress()

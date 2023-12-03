const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio


c.scale(devicePixelRatio, devicePixelRatio)


const x = canvas.width / 2
const y = canvas.height / 2

const frontendPlayers = {}
const frontendPurposes = {}



socket.on('updatePurpose', ( backendPurposes ) => {

  for(const id in backendPurposes) {
    const backendPurpose = backendPurposes[id]

    if(!frontendPurposes[id]) {
      frontendPurposes[id] = new Purpose({
        x: backendPurpose.x * devicePixelRatio,        
        y: backendPurpose.y * devicePixelRatio,
        radius: backendPurpose.radius,
        color: backendPurpose.color
      })
    } else {
      frontendPurposes[id].x = backendPurpose.x * devicePixelRatio
      frontendPurposes[id].y = backendPurpose.y * devicePixelRatio
    }

  }

  for(const id in frontendPurposes){
    if (!backendPurposes[id]) {
      delete frontendPurposes[id]
    }
  }

  console.log(frontendPurposes)

})


socket.on('updatePlayers', (backendPlayers) => {
  for(const id in backendPlayers) {
    const backendPlayer = backendPlayers[id]
    
    if(!frontendPlayers[id]) {
      frontendPlayers[id] = new Player({
        x: backendPlayer.x,
        y: backendPlayer.y,
        radius: backendPlayer.radius,
        color: backendPlayer.color
      })

      document
      .querySelector('#playerLabels')
      .innerHTML += `<div data-id="${id}" data-score="${backendPlayer.score}">${backendPlayer.username}: ${backendPlayer.score}</div>`
    } else {
      document
      .querySelector(`div[data-id="${id}"]`)
      .innerHTML = `${backendPlayer.username}: ${backendPlayer.score}`

      document
      .querySelector(`div[data-id="${id}"]`)
      .setAttribute('data-score', backendPlayer.score)

      const parentDiv = document.querySelector('#playerLabels')
      const childDiv = Array.from(parentDiv.querySelector('div'))
      childDiv.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))

        return scoreB - scoreA 
      })

      childDiv.forEach(div => {
        parentDiv.removeChild(div)
      })
      childDiv.forEach(div => {
        parentDiv.appendChild(div)
      })


      if(id === socket.id) {
        const lastBackendInputIndex = playerInputs.findIndex(input => {
          return backendPlayer.sequenceNumber === input.sequenceNumber
        })
        
        if (lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1)
  
        playerInputs.forEach(input => {
          frontendPlayers[id].x += input.dx
          frontendPlayers[id].y += input.dy
        })
      } else {
        frontendPlayers[id].x = backendPlayer.x
        frontendPlayers[id].y = backendPlayer.y
      }
    }
  }

  for(const id in frontendPlayers) {
    if (!backendPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)

      if (id === socket.id) {
        document.querySelector('#usernameForm').style.display = 'block'
      }

      delete frontendPlayers[id]
    }
  }
})

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for(const id in frontendPlayers) {
    const player = frontendPlayers[id]
    player.draw()
  }

  for (const id in frontendPurposes) {
    const localFrontendPurpose = frontendPurposes[id]
    localFrontendPurpose.draw()
  }
}



animate()

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  },

}

const SPEED = 5
const playerInputs = []
let sequenceNumber = 0
setInterval(() => {
  if(keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    frontendPlayers[socket.id].y -= SPEED
    socket.emit('keydown', { keycode: 'keyW', sequenceNumber })
  }
  if(keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    
    frontendPlayers[socket.id].x -= SPEED
    socket.emit('keydown', { keycode: 'keyA', sequenceNumber })
  } 
  if(keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    
    frontendPlayers[socket.id].y += SPEED
    socket.emit('keydown', { keycode: 'keyS', sequenceNumber })
  }
  if(keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 })
    
    frontendPlayers[socket.id].x += SPEED
    socket.emit('keydown', { keycode: 'keyD', sequenceNumber })
  }
}, 15)

window.addEventListener('keydown', (event) => {
  if(!frontendPlayers[socket.id]) return

  switch(event.code) {
    case 'KeyW':
      keys.w.pressed = true
      break
  
    case 'KeyA':
      keys.a.pressed = true
      break
  
    case 'KeyS':
      keys.s.pressed = true
      break
  
    case 'KeyD':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  if(!frontendPlayers[socket.id]) return
  console.log(event.code)
  
  switch(event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break
  
    case 'KeyA':
      keys.a.pressed = false
      break
  
    case 'KeyS':
      keys.s.pressed = false
      break
  
    case 'KeyD':
      keys.d.pressed = false
      break  
  }

})

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault()
  document.querySelector('#usernameForm').style.display = 'none'
  socket.emit('initGame', {
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio,
    username: document.querySelector('#usernameInput').value
  })
})


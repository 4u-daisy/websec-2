const { Socket } = require('dgram');
const express = require('express')
const app = express()

// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io");
const io = new Server(server, {pingInterval: 2000, pingTimeout: 5000})

const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

const players = { }
const purposes = { }


const SPEED = 5
const RADIUS = 10
const PROJECTILE_RADIUS = 5
let purposeId = 0

purposes[purposeId] = {
    x: Math.random() * 500,
    y: Math.random() * 500,
    radius: Math.random() * 50,
    color: `hsl(${360*Math.random()}, 100%, 50%)`,
    id: purposeId
}

io.on('connection', (socket) => {
    console.log('a user connected');

    io.emit('updatePlayers', players)

    socket.on('initGame', ({ username, width, height, devicePixelRatio }) => {
        players[socket.id] = {
            x: 500 * Math.random(),
            y: 500 * Math.random(),
            radius: 10,
            color: `hsl(${360*Math.random()}, 100%, 50%)`,
            sequenceNumber: 0,
            score: 0,
            username: username,
            id: socket.id
        }

        // init canvas
        players[socket.id].canvas = {
            width,
            height
        }
        players[socket.id].radius  = RADIUS

        if(devicePixelRatio > 1) {
            players[socket.id].radius = 2 * RADIUS
        }

    })

    socket.on('disconnect', (reason) => {
        console.log(reason)
        delete players[socket.id]
        io.emit('updatePlayers', players)
    })

    socket.on('keydown', ({ keycode, sequenceNumber }) => {
        players[socket.id].sequenceNumber = sequenceNumber
        switch(keycode) {
            case 'keyW':
                players[socket.id].y -= SPEED
                break
            case 'keyA':
                players[socket.id].x -= SPEED
                break
            case 'keyS':
                players[socket.id].y += SPEED
                break
            case 'keyD':
                players[socket.id].x += SPEED
                break            
        }
        
    })
    console.log(players)

})

setInterval(() => {

    for (const playerId in players) {
        const player = players[playerId]
        purpose = purposes[purposeId]

        const DISTANCE = Math.hypot(
            purpose.x - player.x, 
            purpose.y - player.y
        )

        if(DISTANCE < PROJECTILE_RADIUS + player.radius) {
            players[player.id].score++
            delete purposes[purposeId]
            purposeId++
            purposes[purposeId] = {
                x: Math.random() * 256,
                y: Math.random() * 374,
                radius: Math.random() * (30-10) + 10,
                color: `hsl(${360*Math.random()}, 100%, 50%)`,
                id: purposeId
            }
        }
    }
    

    io.emit('updatePlayers', players)
    io.emit('updatePurpose', purposes)
}, 15)
  
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

console.log('server load')
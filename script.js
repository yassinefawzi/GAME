const player = document.querySelector('.player');
let x = 50
let y = 0
const speed = 5
const jumpHeight = 100
const gameWidth = 800



document.addEventListener('keydown', handleMovement)
function handleMovement(event) {
    if (event.key === 'ArrowLeft') {
        x -= speed
    } else if (event.key === 'ArrowRight') {
        x += speed
    } else if (event.key === 'ArrowUp' && y === 0) {
        jump()
    }

    if (x < 0) x = 0
    if (x > gameWidth - player.offsetWidth) x = gameWidth - player.offsetWidth

    player.style.left = x + 'px'
    player.style.bottom = y + 'px'
}

function jump() {
    let jumpUp = setInterval(() => {
        y += 5
        player.style.bottom = y + 'px'
        if (y >= jumpHeight) {
            clearInterval(jumpUp)
            fall()
        }
    }, 20)

    function fall() {
        let fallDown = setInterval(() => {
            y -= 5
            player.style.bottom = y + 'px'
            if (y <= 0) {
                y = 0
                clearInterval(fallDown)
            }
        }, 20)
    }
}
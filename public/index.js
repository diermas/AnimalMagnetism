const spritesheet = new Image();
spritesheet.src = "spritesheet.png";
// IP 149.170.13.97
const socket = io.connect("http://localhost:8081");

let players = [];
let feed = [];
let id = 0;
let gamePlaying = true;
let winner = "";
let winnerID = 0;

socket.on("player data", function (data) {
	players = data;
	id = socket.id;
});

socket.on("feed data", function (data) {
	feed = data;
});

socket.on("game over", function (data) {
	gamePlaying = false;
	winner = data;
});

$(document).ready(function () {
	
	$("canvas").mousemove(function (event) {
		let mouseX = event.offsetX;
		let mouseY = event.offsetY;
		socket.emit("move", ({x: mouseX, y: mouseY}));
	});
	startAnimating(60);
});

function startAnimating (fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    animate();
};

function animate () {
	 requestAnimationFrame(animate);

    let now = Date.now();
    let elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        let canvas = $("canvas").get(0);
        let context = canvas.getContext("2d");
		
        context.clearRect(0, 0, canvas.width, canvas.height);
		
		
		if (gamePlaying){
			context.strokeStyle = "black";
			for (let i = 0; i < feed.length; i++){
				context.fillStyle = (feed[i].colour);
				context.beginPath();
				context.arc(feed[i].x, feed[i].y, feed[i].size/2, 0, Math.PI*2);
				context.fill();
				context.closePath();
			}
			
			for (let i = 0; i < players.length; i++){
				if (id == players[i].id){
					context.fillStyle = "#ffec84";
					context.strokeStyle = "#ffec84";
					context.beginPath();
					context.arc(players[i].x + players[i].size/2, players[i].y + players[i].size/2, players[i].size/2 + 3, 0, Math.PI*2);
					context.fill();
					context.closePath();
				}
				context.drawImage(spritesheet,players[i].type*128,0,128,128,players[i].x,players[i].y,players[i].size,players[i].size);
			}
		} else {
			context.font = "80px Arial";
			context.fillStyle = "black";
			context.strokeStyle = "black";
			switch (winnerID){
				case 0:
					winner = "DOG";
					break;
				case 1:
					winner = "ELEPHANT";
					break;
				case 2:
					winner = "ZEBRA";
					break;
				case 3:
					winner = "HORSE";
					break;
				case 4:
					winner = "COW";
					break;
				case 5:
					winner = "GORILLA";
					break;
				case 6:
					winner = "MONKEY";
					break;
				case 7:
					winner = "OWL";
					break;
				case 8:
					winner = "CROCODILE";
					break;
				default:
					winner = "NO WINNER";
					break;
			}
			context.fillText("WINNER: "+winner, 450, 450);
		}
	}
	
	
}
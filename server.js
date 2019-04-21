const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

let players = [];
let feed = [];
let maxSize = 10;
let minSize = 2;
let usedChars = [];

app.use(express.static("public"));

function findDist(x1, y1, x2, y2) {
	xDist = Math.abs(x1-x2);
	yDist = Math.abs(y1-y2);
	xSq = xDist*xDist;
	ySq = yDist*yDist;
	return Math.sqrt(xSq+ySq);
	
}
function spawnFeed () {
	let spawnMax = Math.floor(Math.random() * maxSize + 1);
	let fsize = Math.floor(Math.random() * maxSize + 1);
	while (fsize > spawnMax) {
		fsize = Math.floor(Math.random() * maxSize + 1);
	}
	if (fsize < minSize/5) {
		fsize = minSize/5;
	}
	let fx = Math.floor(Math.random() * 1500);
	let fy = Math.floor(Math.random() * 1000);
	let fr = Math.round(Math.random() * 255);
	let fg = Math.round(Math.random() * 255);
	let fb = Math.round(Math.random() * 255);
	let fcolour = 'rgb('+fr+','+fg+','+fb+')';
	feed.push({x: fx, y: fy, size: fsize, colour: fcolour});
};

function spawnPoint () {
	let sx = Math.floor(Math.random() * 1000);
	let sy = Math.floor(Math.random() * 1000);
	return {x: sx, y: sy};
};

function checkPickups() {
	for (let i = 0; i < players.length; i++){
		let px = players[i].x + players[i].size/2;
		let py = players[i].y + players[i].size/2;
		for (let j = 0; j < feed.length; j++){
			let fx = feed[j].x;
			let fy = feed[j].y;
			let fsize = feed[j].size;
			let fr = fsize/2;
			if (players[i].size > fsize){
				if (findDist(px,py,fx,fy) < players[i].size/2+fr){
					console.log("size: "+players[i].size);
					let sizeChange = fsize/10;
					console.log("size change: "+sizeChange);
					players[i].size += sizeChange;
					players[i].speed = 600/players[i].size;
					feed.splice(j,1);
				}
			}
		}
	}
};

function checkCollisions() {
	for (let i = 0; i < players.length; i++){
		for (let j = 0; j < players.length; j++){
			if (i != j){
				if (players[i].size > players[j].size*1.2){
					let p1x = players[i].x + players[i].size/2;
					let p1y = players[i].y + players[i].size/2;
					let p2x = players[j].x + players[j].size/2;
					let p2y = players[j].y + players[j].size/2;
					if (findDist(p1x,p1y,p2x,p2y) < (players[i].size/2+players[j].size/2)){
						let sizeChange = players[j].size/10;
						players[i].size += sizeChange;
						players[i].speed = 600/players[i].size;
						let newSpawn = spawnPoint();
						players[j].x = newSpawn.x;
						players[j].y = newSpawn.y;
						players[j].size = 20;
						players[j].speed = 600/players[j].size;
					};
				}
			}
		}
	}
};

function animate () {	
    let now = Date.now();
    let elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
		
		for (let i = 0; i < players.length; i++){
			let px = players[i].x;
			let py = players[i].y;
			let mx = players[i].mx;
			let my = players[i].my;			
			if (px < mx) {
				players[i].x += players[i].speed;
			}
			if (px > mx) {
				players[i].x -= players[i].speed;
			}
			if (py < my) {
				players[i].y += players[i].speed;
			}
			if (py > my) {
				players[i].y -= players[i].speed;
			}
			if (Math.abs(px-mx) < players[i].speed){
				players[i].x = mx;
			}
			if (Math.abs(py-my) < players[i].speed){
				players[i].y = my;
			}
		}	
		if (counter == 20) {
			spawnFeed();
			counter = 0;
		} else {
			counter++;
		}
		
		io.emit("player data", players);
		io.emit("feed data", feed);
		
		minSize = 0;
		for (let i = 0; i < players.length; i++) {
			if (players[i].size > maxSize) {
				maxSize = players[i].size;
			}
			if (minSize == 0){
				minSize = players[i].size;
			} else if (players[i].size < minSize){
				minSize = players[i].size;
			}
		}
		checkPickups();
		checkCollisions();
		
		for (let i = 0; i < players.length; i++){
			if (players[i].size >= 500){
				io.emit("game over", players[i].type);
				break;
			}
		}
	}
	
}

function startAnimating(fps) {
	counter = 0;
	fpsInterval = 1000 / fps;
    then = Date.now();
    setInterval(animate, 1);
};
	
io.on("connection", function (socket) {
	console.log("A player has connected");
	let spawn = spawnPoint();
	let sx = spawn.x;
	let sy = spawn.y;
	if (usedChars.length == 0){
		players.push({x: sx, y: sy, id: socket.id, type: 0, size: 20, mx: sx, my: sy, speed: 1000/20});
		usedChars.push(0);
	} else {
		for (let i = 0; i < 9; i++){
			if (!usedChars.includes(i)){
				players.push({x: sx, y: sy, id: socket.id, type: i, size: 20, mx: sx, my: sy, speed: 1000/20});
				usedChars.push(i);
				break;
			}
		}
	}
	io.emit("player data", players);
	
	socket.on("move", function (mousePos) {
		for (let i = 0; i < players.length; i++){
			if (players[i].id == socket.id){
				players[i].mx = mousePos.x - players[i].size/2;
				players[i].my = mousePos.y - players[i].size/2;
			}
		}
	});
					
	
	socket.on("disconnect", function () {
		console.log("Player "+socket.id+" has disconnected.");
		for (let i = 0; i < players.length; i++){
			if (socket.id == players[i].id){
				for (let j = 0; j < usedChars.length; j++){
					if (usedChars[j] == players[i].type){
						usedChars.splice(j,1);
					}
				}
				players.splice(i,1);				
			}
		}
	});
	
});


server.listen(8081, function() {
	console.log("Server has started.");
	startAnimating(60);
});

var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};


class Entity {
	constructor(param) {
		this.x = 10;
		this.y = 300;
		this.spdX = 0;
		this.spdY = 0;
		this.id = "";
		this.map = 'forest';

		if(param){
			if(param.x)
				this.x = param.x;
			if(param.y)
				this.y = param.y;
			if(param.map)
				this.map = param.map;
			if(param.id)
				this.id = param.id;		
		}
	}

	updateEntity() {
		this.updatePosition();
	}
	updatePosition() {
		this.x += this.spdX;
		this.y += this.spdY;
	}
	getDistance(pt) {
		return Math.sqrt(Math.pow(this.x-pt.x,2) + Math.pow(this.y-pt.y,2));
	}
	getFrameUpdateData() {
		var pack = {
			initPack:{
				player:initPack.player,
				bullet:initPack.bullet,
			},
			removePack:{
				player:removePack.player,
				bullet:removePack.bullet,
			},
			updatePack:{
				player:Player.update(),
				bullet:Bullet.update(),
			}
		};
		initPack.player = [];
		initPack.bullet = [];
		removePack.player = [];
		removePack.bullet = [];
		return pack;
	}
}

class Player extends Entity {
	constructor(param) {
		super();
		this.number = "" + Math.floor(10 * Math.random());
		this.username = param.username;
		this.pressingRight = false;
		this.pressingLeft = false;
		this.pressingUp = false;
		this.pressingDown = false;
		this.pressingAttack = false;
		this.mouseAngle = 0;
		this.maxSpd = 10;
		this.hp = 10;
		this.hpMax = 10;
		this.score = 0;
		this.inventory = new Inventory(param.progress.items,param.socket,true);
		Player.list[this.id] = this;
		initPack.player.push(this.getInitPack());
	}
	update() {
		this.updateSpd();	
		this.updateEntity();	
		if(this.pressingAttack){
			this.shootBullet(this.mouseAngle);
		}
	}
	shootBullet(angle) {
		//if(Math.random() < 0.1)
		//	this.inventory.addItem("potion",1);
		Bullet({
			parent:this.id,
			angle:angle,
			x:this.x,
			y:this.y,
			map:this.map,
		});
	}	
	updateSpd() {
		if(this.pressingRight)
			this.spdX = this.maxSpd;
		else if(this.pressingLeft)
			this.spdX = -this.maxSpd;
		else
			this.spdX = 0;
		
		if(this.pressingUp)
			this.spdY = -this.maxSpd;
		else if(this.pressingDown)
			this.spdY = this.maxSpd;
		else
			this.spdY = 0;		
	}
	getInitPack() {
		return {
			id:this.id,
			x:this.x,
			y:this.y,	
			number:this.number,	
			hp:this.hp,
			hpMax:this.hpMax,
			score:this.score,
			map:this.map,
		};		
	}
	getUpdatePack() {
		return {
			id:this.id,
			x:this.x,
			y:this.y,
			hp:this.hp,
			score:this.score,
			map:this.map,
		}	
	}

	onConnect(socket,username,progress) {
		var map = 'field';
		//if(Math.random() < 0.5)
		//	map = 'field';
		var player = new Player({
			username:username,
			id:socket.id,
			map:map,
			socket:socket,
			progress:progress,
		});
		player.inventory.refreshRender();
	
		socket.on('keyPress',function(data){
			if(data.inputId === 'left')
				player.pressingLeft = data.state;
			else if(data.inputId === 'right')
				player.pressingRight = data.state;
			else if(data.inputId === 'up')
				player.pressingUp = data.state;
			else if(data.inputId === 'down')
				player.pressingDown = data.state;
			else if(data.inputId === 'attack')
				player.pressingAttack = data.state;
			else if(data.inputId === 'mouseAngle')
				player.mouseAngle = data.state;
		});
		
		socket.on('changeMap',function(data){
			if(player.map === 'field')
				player.map = 'forest';
			else
				player.map = 'field';
		});
		
		socket.on('sendMsgToServer',function(data){
			for(var i in socketList){
				socketList[i].emit('addToChat',player.username + ': ' + data);
			}
		});
		socket.on('sendPmToServer',function(data){ //data:{username,message}
			var recipientSocket = null;
			for(var i in Player.list)
				if(Player.list[i].username === data.username)
					recipientSocket = socketList[i];
			if(recipientSocket === null){
				socket.emit('addToChat','The player ' + data.username + ' is not online.');
			} else {
				recipientSocket.emit('addToChat','From ' + player.username + ':' + data.message);
				socket.emit('addToChat','To ' + data.username + ':' + data.message);
			}
		});
		
		socket.emit('init',{
			selfId:socket.id,
			player:Player.getAllInitPack(),
			bullet:Bullet.getAllInitPack(),
		})
	}
}
Player.list = {};
Player.getAllInitPack = function() {
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}

Player.onDisconnect = function(socket) {
	let player = Player.list[socket.id];
	if(!player)
		return;
	Database.savePlayerProgress({
		username:player.username,
		items:player.inventory.items,
	});
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}
Player.update = function() {
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());		
	}
	return pack;
}

class Bullet extends Entity {
	constructor(param) {
		super();
		this.id = Math.random();
		this.angle = param.angle;
		this.spdX = Math.cos(param.angle/180*Math.PI) * 10;
		this.spdY = Math.sin(param.angle/180*Math.PI) * 10;
		this.parent = param.parent;
		
		this.timer = 0;
		this.toRemove = false;
			
		Bullet.list[this.id] = this;
		initPack.bullet.push(this.getInitPack());
	}

	update() {
		if(this.timer++ > 100)
			this.toRemove = true;
		this.updateEntity();
		
		for(var i in Player.list){
			var p = Player.list[i];
			if(this.map === p.map && this.getDistance(p) < 32 && this.parent !== p.id){
				p.hp -= 1;
								
				if(p.hp <= 0){
					var shooter = Player.list[this.parent];
					if(shooter)
						shooter.score += 1;
					p.hp = p.hpMax;
					p.x = Math.random() * 500;
					p.y = Math.random() * 500;					
				}
				this.toRemove = true;
			}
		}
	}
	getInitPack() {
		return {
			id:this.id,
			x:this.x,
			y:this.y,
			map:this.map,
		};
	}
	getUpdatePack()	{
		return {
			id:this.id,
			x:this.x,
			y:this.y,		
		};
	}
}
Bullet.list = {};

Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push(bullet.getUpdatePack());		
	}
	return pack;
}

Bullet.getAllInitPack = function(){
	var bullets = [];
	for(var i in Bullet.list)
		bullets.push(Bullet.list[i].getInitPack());
	return bullets;
}
class Inventory {
	constructor(items,socket,server) {
		this.items = items; //{id:"itemId",amount:1}
		this.socket = socket;
		this.server = server;
		}
	}
	addItem(id,amount) {
		for(var i = 0 ; i < this.items.length; i++){
			if(this.items[i].id === id){
				this.items[i].amount += amount;
				this.refreshRender();
				return;
			}
		}
		this.items.push({id:id,amount:amount});
		this.refreshRender();
    }
    removeItem(id,amount) {
		for(var i = 0 ; i < this.items.length; i++){
			if(this.items[i].id === id){
				this.items[i].amount -= amount;
				if(this.items[i].amount <= 0)
					this.items.splice(i,1);
				this.refreshRender();
				return;
			}
		}    
    }
    hasItem (id,amount){
		for(var i = 0 ; i < this.items.length; i++){
			if(this.items[i].id === id){
				return this.items[i].amount >= amount;
			}
		}  
		return false;
    }
	refreshRender() {
		//server
		if(this.server){
			this.socket.emit('updateInventory',this.items);
			return;
		}
		//client only
		var inventory = document.getElementById("inventory");
		inventory.innerHTML = "";
		var addButton = function(data){
			let item = Item.list[data.id];
			let button = document.createElement('button'); 
			button.onclick = function(){
				this.socket.emit("useItem",item.id);
			}
			button.innerText = item.name + " x" + data.amount;
			inventory.appendChild(button);
		}
		for(var i = 0 ; i < this.items.length; i++)
			addButton(this.items[i]);
	}
	if(this.server){
		this.socket.on("useItem",function(itemId){
			if(!this.hasItem(itemId,1)){
				console.log("Cheater");
				return;
			}
			let item = Item.list[itemId];
			item.event(Player.list[this.socket.id]);
		});

	}

}

class Item {
	constructor(id,name,event) {
		this.id = id;
		this.name = name;
		this.event = event;
		Item.list[this.id] = this;
	}
		
}
Item.list = {};

Item("potion","Potion",function(player){
	player.hp = 10;
	player.inventory.removeItem("potion",1);
	player.inventory.addItem("superAttack",1);
});

Item("superAttack","Super Attack",function(player){
	for(var i = 0 ; i < 360; i++)
		player.shootBullet(i);
});






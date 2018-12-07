var USE_DB = true;
var mongojs = USE_DB ? require("mongojs") : null;
var db = USE_DB ? mongojs('localhost:27017/myGame', ['account','progress']) : null;

//account:  {username:string, password:string}
//progress:  {username:string, items:[{id:string,amount:number}]}

class Database {
	isValidPassword(data,cb){
		if(!USE_DB)
			return cb(true);
		db.account.findOne({username:data.username,password:data.password},function(err,res){
			if(res)
				cb(true);
			else
				cb(false);
		});
	}
	isUsernameTaken(data,cb){
		if(!USE_DB)
			return cb(false);
		db.account.findOne({username:data.username},function(err,res){
			if(res)
				cb(true);
			else
				cb(false);
		});
	}
	addUser(data,cb){
		if(!USE_DB)
			return cb();
		db.account.insert({username:data.username,password:data.password},function(err){
			Database.savePlayerProgress({username:data.username,items:[]},function(){
				cb();
			})
		});
	}
	getPlayerProgress(username,cb){
		if(!USE_DB)
			return cb({items:[]});
		db.progress.findOne({username:username},function(err,res){
			cb({items:res.items});
		});
	}
	savePlayerProgress(data,cb){
		cb = cb || function(){}
		if(!USE_DB)
			return cb();
		db.progress.update({username:data.username},data,{upsert:true},cb);
	}

};

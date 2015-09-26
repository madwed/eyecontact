var queue = function () {
  this.onlineUsers = {};
  this.waitingUsers = [];
};

queue.prototype.onlineUserCount = function () {
  return Object.keys(this.onlineUsers).length;
}

queue.prototype.logon = function (id) {
  if(!this.onlineUsers[id]){
    this.onlineUsers[id] = true;
  }
}

queue.prototype.logout = function (id) {
  delete this.onlineUsers[id];
  this.getOutLine(id);
}

queue.prototype.getInLine = function (id) {
  this.waitingUsers.push(id);
}

queue.prototype.getOutLine = function (id) {
  var placeInLine = this.waitingUsers.indexOf(id);
  if(!~placeInLine){
    this.waitingUsers.splice(placeInLine, 1);
  }
}

queue.prototype.shouldMeet = function (id) {
  return this.waitingUsers.length > 0 && !~this.waitingUsers.indexOf(id);
}

//Check if user should get in line or meet someone;
queue.prototype.checkin = function (id) {
  var message = {users: this.onlineUserCount()};
  if(this.shouldMeet(id)){
    message.meet = this.waitingUsers.shift();
  }else{
    this.getInLine(id);
    message.meet = "hold"
  }
  return message;
}

module.exports = queue;

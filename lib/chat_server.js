const socketio = require('socket.io'); // 基于WebSocket的传输方式的封装

var guestNumber = 1; // 访客数
var nickNames = {}; // 用户昵称
var namesUsed = []; // 已有昵称库
var currentRoom = {}; // 当前房间
var io;

exports.listen = function (server) {
    // 启动socketio服务器，搭建在已有的http服务器上
    io = socketio.listen(server);
    io.set('log level', 1);

    // 监听用户连接后的处理
    io.sockets.on('connection', function (socket) {
        // 初始化新加入用户名称,得到新的访客数量
        guestNumber = initGuestName(socket, guestNumber);
        // 加入默认房间room1
        joinRoom(socket, 'room1')
        // 改名
        nameChange(socket)
        // 发送信息
        sendMessage(socket)
        // 更改聊天室（没有该聊天室则新建）
        roomChange(socket)
        // 用户发出请求时，向其提供已经被占用的聊天室列表
        socket.on('rooms', function () {
            socket.emit('rooms', io.of('/').adapter.rooms);
        });
        // 用户断开连接后清除
        closeConnection(socket)
    })
}

/**
 * 初始化用户昵称
 * @param socket
 * @param guestNumber 访客数
 * @param nickNames 用户昵称
 * @param namesUsed 已有昵称
 * @returns 新的访客数
 */
function initGuestName(socket, guestNumber) {
    // 生成新访客昵称
    const name = 'Guest' + guestNumber;
    // 将用户昵称与客户端Id关联
    nickNames[socket.id] = name;
    // 触发nameResult事件，让用户知道自己的昵称
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    // 存放在已有昵称中，防止昵称相同
    namesUsed.push(name)
    // 访客数量+1
    return guestNumber + 1;
}
/**
 * 加入房间
 * @param socket
 * @param room 房间名
 */
function joinRoom(socket, room) {
    socket.join(room);
    // 记录用户的当前房间
    currentRoom[socket.id] = room;
    // 触发joinResult事件，让用户知道他们加入了房间
    socket.emit('joinResult', {room: room});
    // 让房间里的人知道有新用户加入
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + 'has joined' + room + '.'
    })

    // 获取当前房间的用户信息
    var usersInRoom = io.nsps['/'].adapter.rooms[room];
    if(usersInRoom.length > 1) {
        var usersInRoomSummary = room + '里现在有:';

        // 获取每个人的用户信息
        const roomUserInfo = usersInRoom.sockets
        // 获取用户信息里每个人的ID
        Object.keys(roomUserInfo).forEach(
            (value, key) => {
                // 把自己排除掉
                if(value != socket.id) {
                    // 第一个不需要逗号，直接输出，后面依次逗号
                    if(key > 0) {
                        usersInRoomSummary += ','
                    }
                    // 添加用户名字
                    usersInRoomSummary += nickNames[value]
                }
            }
        )

        usersInRoomSummary += '.';
        socket.emit('message', {
            text: usersInRoomSummary
        })
    }
}
/**
 * 改名
 * @param socket
 */
function nameChange(socket) {
    // 监听nameAttemp事件
    socket.on('nameAttemp', function (name) {
        // 控制昵称不能以Guest为开头
        if(name.indexOf('Guest') == 0){
            // 触发nameResult事件，让用户知道自己更名操作后的信息没有成功
            socket.emit('nameResult', {
                success: false,
                message: '昵称不能以Guest为开头'
            })

            return false;
        }
        // 判断昵称是否被占用
        if (namesUsed.indexOf(name) != -1) {
            // 触发nameResult事件，让用户知道自己更名操作后的信息没有成功
            socket.emit('nameResult', {
                success: false,
                message: '昵称被占用'
            })

            return false;
        }
        // 获取当前用户之前的名字
        var nameBefore = nickNames[socket.id];
        // 获取用户之前的名字的在昵称库里的index
        var nameBeforeIndex = namesUsed.indexOf(nameBefore);
        // 将新名字添加到昵称库
        namesUsed.push(name);
        // 当前用户名字改为新名
        nickNames[socket.id] = name;
        // 删除用户之前的名字在昵称库的记录
        delete namesUsed[nameBeforeIndex];
        // 触发nameResult事件，让用户知道自己更名成功
        socket.emit('nameResult', {
            success: true,
            name: name
        })
        // 让房间其他人知道该用户更名成功
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
            text: nameBefore + '改名为' + name
        })
    })
}
/**
 * 发送消息
 * @param socket
 */
function sendMessage(socket) {
    // 监听用户message事件，并发送给在房间里的所有人
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ':' + message.text
        })
    })
}
/**
 * 更改房间
 * @param socket
 */
function roomChange(socket) {
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id])
        joinRoom(socket, room.newRoom)
    })
}
/**
 * 断开连接
 * @param socket
 */
function closeConnection(socket) {
    // 监听disconnect事件，用户断开连接
    socket.on('disconnect', function () {
        // 删除namesUsed和nickNames相对应的昵称
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
}
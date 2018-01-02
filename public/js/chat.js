class Chat {
    constructor(socket) {
        this.socket = socket;
    };
    // 发送消息
    sendMessage(room, text) {
        const message = {
            room: room,
            text: text
        }
        this.socket.emit('message', message)
    };
    // 变更房间
    roomChange(room) {
        this.socket.emit('join', {
            newRoom: room
        })
    };
    // 处理聊天指令
    processCommand(command) {
        // 用空格区分用户指令
        var words = command.split(' ');
        // 第一个空格前的内容为用户指令，转换为小写
        var command = words[0].substring(1, words[0].length).toLowerCase();
        var message = false;
        // 识别用户指令病处理
        switch (command) {
            case 'join':
                // 删除words[0]（即join）
                words.shift();
                // 将words剩余的所有元素生成字符串
                var room = words.join(' ');
                this.roomChange(room);
                break;
            case 'nick':
                words.shift();
                var name = words.join('')
                this.socket.emit('nameAttemp', name);
                break;

            default:
                message = '无法识别'
                break;
        }
        return message;
    }
}
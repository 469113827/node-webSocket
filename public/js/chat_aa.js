/**
 * 可疑文本需要净化
 * 将特殊字符转换成HTML实体
 * 直接输出内容
 * 而不会按HTML标签去解析
 */
function divEscapedConetntElement(message) {
    return $('<div></div>').text(message)
}

/**
 * 系统创建文本为可信任文本
 */
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message + '<i>')
}
/**
 * 用户输入信息处理
 * @param socket
 * @param chatApp
 */
function userInput(socket, chatApp) {
    var $message = $('#messages');
    var value = $('#send-message').val();

    var systemMessage;
    // 如果以 / 开头的，则作为命令操作
    if(value.charAt(0) == '/')  {
        systemMessage = chatApp.processCommand(value);

        if(systemMessage) {
            $message.append(divEscapedConetntElement(systemMessage))
        }
    }
    else {
        // 非命令操作则发送消息
        chatApp.sendMessage($('#room').text, value);
        $message.append(divEscapedConetntElement(value))
            .scrollTop($message.prop('scrollHeight'))
    }
    // 清空输入框
    $('#send-message').val('');
}

var socket = io.connect();
$(document).ready(function () {
    var chatApp = new Chat(socket)

    // 监听改名
    socket.on('nameResult', function (result) {
        var message;

        if(result.success) {
            message = '你的名字为' + result.name
        }
        else {
            message = result.message;
        };

        $('#messages').append(divSystemContentElement(message))
    });

    // 改变房间
    socket.on('joinResult', function (result) {
        $('#room').text(result.room)
        $('#messages').append(divSystemContentElement('进入了' + result.room))
    });

    // 接受信息
    socket.on('message', function (message) {
        console.log(message)
        const newElement = $('<div></div>').text(message.text)
        $('#messages').append(newElement)
    });
    // // 显示可用房间列表
    // socket.on('rooms', function (rooms) {
    // //     // $('#room-list').empty();
    //     console.log(rooms)
    // })


    $('#send-form').submit(function () {
        userInput(socket, chatApp)
        return false
    })
})





/**
 * 创建静态文件服务器
 */

const http = require('http');   // 提供HTTP服务器与客户端功能
const fs = require('fs');  // 提供文件操作方式
const path = require('path');   // 提供文件系统与路径相关功能
const mime = require('mime');   // 提供根据文件扩展名得出MIME类型的功能
const chatSerber = require('./lib/chat_server'); //处理基于Socket.IO的服务端聊天功能

const cache = {}; // 缓存文件内容的对象

/**
 * 请求文件不存在时发送404
 * @param response 响应对象
 */
function send404(response) {
    response.writeHead(
        404,
        {'Content-Type': 'text/plain'}
    )
    response.write('Error 404: resource not found')
    response.end()
};

/**
 * 文件数据
 * @param response 响应对象
 * @param filePath 文件路径
 * @param fileContents 文件内容
 */
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        {'content-type': mime.getType(path.basename(filePath))}
    )
    response.end(fileContents)
}

/**
 * 静态文件管理
 * @param response 响应对象
 * @param cache 缓存对象
 * @param absPath 需要的路径
 */
function serverStatic(response, cache, absPath) {
    // 是否在缓存在内存中
    if(cache[absPath]) {
        // 从内存中返回文件
        sendFile(response, absPath, cache[absPath])
    }
    else {
        // 检查文件是否存在
        if(fs.existsSync(absPath)) {
            // 从硬盘中读取文件
            fs.readFile(absPath, function(err, data) {
                // 读取失败返回404
                if(err){
                    send404(response)
                }
                // 读取成功返回文件并做缓存处理
                else {
                    cache[absPath] = data;
                    sendFile(response, absPath, data)
                }
            })
        }
        else {
            send404(response)
        }
    }
}

/**
 * 创建HTTP服务器
 * @param request 请求对象
 * @param response 响应对象
 */
const server = http.createServer(function (request, response) {
    let filePath = false;
    if(request.url == '/') {
        filePath = './public/index.html';
    }
    else {
        filePath = './public/' + request.url;
    }

    serverStatic(response, cache, filePath)
})

/**
 * 监听服务器启动
 * TCP/IP端口3000（随便写的，1024上端口都可以）
 */
server.listen(
    3000,
    function () {
        console.log('端口3000的本地服务器启动成功')
    }
);


chatSerber.listen(server)
### 关于对nodejs单进程的思考

---
##### 相关背景
###### 关于线程(thread)和进程(process)的区别
> 参考 http://www.ruanyifeng.com/blog/2013/04/processes_and_threads.html
简单归纳<br/>
process 运行时独占CPU资源,占用一部分的ram(不和其他process共享) <br/>
process(包含一个或多个thread) thread共享 process占用的ram（资源强占什么的有点复杂，就不去考虑）
###### js单线程
> JavaScript引擎是单线程运行的,浏览器无论在什么时候都只且只有一个线程在运行JavaScript程序（后来HTML5出了一个work办法，算是多线程）。宿主环境为浏览器时，js线程是作为浏览器进程的一个线程；当宿主环境是nodejs环境时，就作为进程。


> 之前看了一个nodejs的技术讨论会，用了简单的例子展现nodejs单进程可能遇到的问题。

---
##### 具体例子
新建了一个web服务器
```
http.createServer(function(req, res) {
    var params = urllib.parse(req.url, true);
    var str = params.query;
    var idx = parseInt(params.query.idx || 10, 10);
    // 计算斐波那契数（当idx到40左右后，耗时明显增加）
    var result = fbnq_op(idx);
    str = JSON.stringify(str);
    // 将结果写入response
    res.end(result.toString());
}).listen(CONF.port);
```
请求http://127.0.0.1:8813/?idx=n，将返回fbnq_op(n)的结果。
* 先访问http://127.0.0.1:8813/?idx=50
* 再新建页面访问http://127.0.0.1:8813/?idx=5。
当idx >=40时，计算斐波那契数列费时，这个计算还没有结束，cpu被第一个计算占用。新建页面访问的http://127.0.0.1:8813/?idx=5是会被阻塞(nodejs只利用了一个cpu，这个cpu已经被占用,只能计算)


##### 略微优化
```
var cluster = require('cluster');
var os = require('os');
var CONF = {
    port: 8813,
    cpu_num: os.cpus().length
};
// fork主程序 达到合理利用CPU的效果
if (cluster.isMaster) {
    for (var i = 1; i < CONF.cpu_num; i++) {
        cluster.fork();
    }
}
else {
    http.createServer(function(req, res) {
        var params = urllib.parse(req.url, true);
        var str = params.query;
        var idx = parseInt(params.query.idx || 10, 10);
        var result = fibonacci(idx);
        str = JSON.stringify(str);
        // 将结果写入response
        res.end(result.toString());
    }).listen(CONF.port);
}
```
根据cpu数量fork出相同数目的进程，便于充分利用cpu。但是还是有问题，在四次访问http://127.0.0.1:8813/?idx=50（比如本机四核cpu），第五次再去访问http://127.0.0.1:8813/?idx=5也是会陷入阻塞情况，但是这样情况暂时没有想到更好的解决办法。


##### 其他优化
如果要用更好的解决更加复杂一些，比如libuv（和C++相关）
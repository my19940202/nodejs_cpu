/**
 * 关于对CPU密集型的应用的思考
 * nodejs单线程的劣势 以及处理办法
 * 关于线程(thread)和进程(process)的区别 参考:http://www.ruanyifeng.com/blog/2013/04/processes_and_threads.html
 * 简单归纳
 * process 运行时独占CPU资源,占用一部分的ram(不和其他process共享)
 * process(包含一个或多个thread) thread各项 process占用的ram
 */

var http = require('http');
var urllib = require('url');
var cluster = require('cluster');
var os = require('os');
var CONF = {
    port: 8813,
    cpu_num: os.cpus().length
};
// 待会儿试着引入log4js 更好的优化一下打日志的逻辑

// 斐波那契
var fbnq_op = function (idx) {
    var result = 0;
    if (idx > 2) {
        return fbnq_op(idx - 1) + fbnq_op(idx - 2);
    }
    else if (idx > 0) {
        return idx - 1;
    }
    else {
        console.log('invalid idx');
    }
};

var fibonacci = function(n) {
    return n < 2 ? 1 : (fibonacci(n - 1) + fibonacci(n - 2));
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


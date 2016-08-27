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
var CONF = {
    port: 8813
};
// 待会儿试着引入log4js 更好的优化一下打日志的逻辑

// 斐波那契 好好想想递归用的不多
// 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233
var sum = 0;
// fbnq0 累加而已
var fbnq0 = function (index) {
    if (index >= 1) {
        // TODO:
        sum += index;
        index--;
        fbnq(index)
    }
    else {
        return sum;
    }
};

// 傻瓜版斐波那契
var fbnq = function (idx) {
    var cell1 = 0;
    var cell2 = 1;
    var result = 0;
    if (idx >= 3) {
        result = fbnq(idx - 1) + fbnq(idx - 2);
        return result;
    }
    else if (idx > 0) {
        return idx - 1;
    }
    else {
        console.log('invalid idx');
    }
};

// 代码改良版
var fbnq_op = function (idx) {
    var result = 0;
    if (idx > 2) {
        return fbnq(idx - 1) + fbnq(idx - 2);
    }
    else if (idx > 0) {
        return idx - 1;
    }
    else {
        console.log('invalid idx');
    }
};

http.createServer(function(req, res) {
    var params = urllib.parse(req.url, true);
    var str = params.query;
    var idx = parseInt(params.query.idx || 10, 10);
    var result = fbnq_op(idx);
    str = JSON.stringify(str);
    // 将结果写入response
    res.end(result.toString());
}).listen(CONF.port);
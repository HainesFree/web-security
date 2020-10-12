var express = require('express');
var escape = require('escape-html');
var bodyParser = require('body-parser');
var app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// 零配置的、事务性的 SQL 数据库引擎
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
// 创建2个账户
db.serialize(function() { 
    db.run("CREATE TABLE user (id int,username TEXT,password TEXT)");
    db.run("insert into user values (1,'张三','123')");
    db.run("insert into user values (2,'李四','456')");
})

//---------------------xss---------------------------------
var content = "";
// 详情接口
app.get("/content",(req,res)=>{
    res.send(content)
    // xss解决方案：
    //res.send(escape(content))
})
// xss表单提交接口
app.post('/setContent',function(req,res){
    console.log(req.body,'req...body')
    content=req.body.content
    res.send("OK111")
})

//---------------------sql---------------------------------
app.post('/login',(req,res)=>{
    // sql选择用户传入的username和password
    var sql = `select * from user where username='${req.body.username}' and password='${req.body.password}'`
    console.log(sql)

    //解决方案：sql预编译,提前生成模版，填入具体的数据
    //var stmt = db.prepare(`select * from user where username=? and password=?`)
    
    db.serialize(function() {
        //stmt.all([req.body.username,req.body.password],function(err,data){
        db.all(sql,function(err,data){
            if(err)console.log(err)
            console.log(data)
            if(data.length>0)
                res.send("登录成功")
            else
                res.send("登录失败")
        })
    })
})

// x-frame-options响应头配置，
// content-security-policy
app.all("*",(req,res,next)=>{
    // 限制以frame或iframe方式引入
    // res.header('x-frame-options','deny');
    // csp
    // res.header('content-security-policy',"script-src 'self' https://cdn.bootcss.com")
    next()
})
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(express.static('./public'))

app.listen(4000)
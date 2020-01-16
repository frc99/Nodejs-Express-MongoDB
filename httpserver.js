const express=require('express')
const app=express();
const session=require("express-session")
const path=require('path')
const dbData=require('mongoose')
const bodyParser = require('body-parser');
//user初始index
let u_num=0
//house初始index
let h_num=5
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

dbData.connect('mongodb://localhost/user')

var db = dbData.connection;

db.on('error', console.error.bind(console, 'connection error:'));

var userSchema = dbData.Schema(
    {   id:Number,
        username: {
            type:String,
            ref:'money'

        },
        password:String,
        identification:String,
        time:String}
,{versionKey:false}
);
var Uschema = dbData.model('user', userSchema);


var goodSchema = dbData.Schema(
    {   id:Number,
        name:String,
        status:String,
        address:String,
        owner:String,
        rent:Number,
        tenant:String,
        charge:Number
    },
    {versionKey:false}
);
var Gschema = dbData.model('good', goodSchema);

var moneySchema=dbData.Schema(
    {
        username:String,
        income:Number,
        outlay:Number,
    }
)
var Mschema=dbData.model('money',moneySchema);
// var new_money=new Mschema({
//     username:'MArs',
//     income:0,
//     outlay:3500
// })

// new_money.save()
app.use(session({
    secret:'keyboard cat',
    resave:true,
    saveUninitialized:true,
    cookie:{
        maxAge:100*60*30
    },
    rolling:true
}))



function getTime(){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    return year+''+month+''+day+''+hour+''+minute+''+second
}
//静态资源目录
app.use(express.static('file'))
//ejs目录
app.set('view engine','ejs')

app.set('views',path.join(__dirname,'views'))


app.get('/login',function (req,res){
    if(req.query.submitName=="login"){
        if((req.query.username!='')&&(req.query.password!='')&&(req.query.identify=='user')){
            Uschema.findOne({username:req.query.username,password:req.query.password,identification:'user'},function (err, data) {
                if (err) return console.error(err);
                if(data==null){
                    res.render('index',{keyData:{warning:'找不到该用户信息',register:''}})
                    //console.log(req.query)
                }
                else{
                    if(req.query.identify=='admin'){
                        // res.sendfile(__dirname+'/'+'file/admin.ejs')
                        res.render('index',{keyData:{warning:'您不是管理员',register:''}})
                    }
                    else if(req.query.identify=='user'){
                        //res.sendfile(__dirname+'/'+'file/user.ejs')
                        //保存至session
                        req.session.userInfo=data.username
                        app.locals['userInfo']=req.session.userInfo;
                        //console.log(data)
                        res.render('ImOwner',{keyData:req.query,islogin:app.locals['userInfo']})
                    }
                    else{
                        res.render('index',{keyData:{warning:'请选择身份',register:''}})

                    }

                }
                // console.log('find_data');
                // console.log(data);
            })

        }
        else if((req.query.username!='')&&(req.query.password!='')&&(req.query.identify=='admin')){
            Uschema.findOne({username:req.query.username,password:req.query.password,identification:'admin'},function (err, data) {
                if (err) return console.error(err);
                if(data==null){
                    res.render('index',{keyData:{warning:'找不到该用户信息',register:''}})
                }
                else{
                    if(req.query.identify=='admin'){
                        req.session.userInfo=data.username
                        //console.log(data.username)
                        //console.log(res.locals.userInfo)
                        app.locals['userInfo']=req.session.userInfo;
                        //console.log(app.locals['userInfo'])
                        res.render('house',{keyData:req.query,islogin:app.locals['userInfo']})
                        //res.render('house',{Iden:req.query.username})

                    }
                    else if(req.query.identify=='user'){
                        res.render('index',{keyData:{warning:'您不是普通用户',register:''}})
                    }
                    else{
                        res.render('index',{keyData:{warning:'请选择身份',register:''}})

                    }

                }
            })
        }
        else{
            res.render('index',{keyData:{warning:'用户名和密码不能为空',register:''}})
        }

    }
    else if(req.query.submitName=="register"){


        if((req.query.username!='')&&(req.query.password!='')){
            Uschema.findOne({username:req.query.username,password:req.query.password,identification:'user'},function (err, data) {
                if (err) return console.error(err);
                if(data==null){
                    if(req.query.identify=="user"){
                        u_num=u_num+1
                        var new_user=new Uschema({id:u_num,username:req.query.username,password:req.query.password,identification:'user',time:getTime()});
                        new_user.save(function(err,new_user){
                            if(err) return console.error(err)
                            console.log(new_user)
                            res.render('index',{keyData:{warning:'',register:'注册成功'}})
                        })
                        var new_m=new Mschema({username:req.query.username,income:0,outlay:0})
                        new_m.save(function(err,new_m){
                            if(err) return console.error(err)
                        })

                    }
                    else{
                        res.render('index',{keyData:{warning:'管理员不允许注册',register:''}})
                    }
                }
                else {
                    res.render('index',{keyData:{warning:'该账号已注册',register:''}})
                }
            })

        }
        else {
            res.render('index',{keyData:{warning:'用户名和密码不能为空',register:''}})
        }

    }
});

app.use(function(req,res,next){
    if(req.session.userInfo){
        app.locals['userInfo']=req.session.userInfo;
        next()
    }
    else{
        res.redirect('/');
    }
})
app.get('/house_search',function(req,res){
if(req.query.submitName=="search") {
    if ((req.query.p_id == "") && (req.query.p_name != '')) {

        var reg = new RegExp(req.query.p_name)
        Gschema.find({
            'name': {$regex: reg}
        }, function (err, data) {
            if (data != null) {
                res.render('house_result', {Data: data})
            }
        })
    }
    else if(req.query.p_id!=''&&req.query.p_name==''){
        Gschema.find({
            'id': req.query.p_id
        }, function (err, data) {
            if (data != null) {
                res.render('house_result', {Data: data})
            }
        })
    }
    //多条件查询
    else if ((req.query.p_id != "") && (req.query.p_name != '')) {

        var reg = new RegExp(req.query.p_name)
        Gschema.find({
            $or: {
                'name': {$regex: reg},
                'id': req.query.p_id
            }
        }, function (err, data) {
            if (data != null) {
                res.render('house_result', {Data: data})
            }
        })
    }

}
})
app.get('/house',function(req,res){
    //新增信息
    if(req.query.submitName=="Add"){
        if(req.query.pname!=''){


        Gschema.findOne({name:req.query.pname},function (err, data){
            if (err) return console.error(err);
            if(data==null) {
                h_num=h_num+1;
                var new_good = new Gschema({
                    id:h_num,
                    name: req.query.pname,
                    status: '已出租',
                    address: req.query.address,
                    owner: req.query.oname,
                    rent: req.query.rent,
                    tenant: req.query.tname,
                    charge: 0
                })
                new_good.save(function (err, new_good) {
                    if (err) return console.error(err)
                    console.log(new_good)
                })
            }
    })
    }

    }
    //更新信息
    if(req.query.submitName=="Update"){



        if((req.query.pname!='')){

            if(req.query.rent!=''&&req.query.tname==''&&req.query.pstatus==''&&req.query.water=='')
            {
                Gschema.update({'id':req.query.id},{'rent':req.query.rent},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent!=''&&req.query.tname!=''&&req.query.pstatus==''&&req.query.water==''){
                Gschema.update({'id':req.query.id},{'rent':req.query.rent,'tenant':req.query.tname},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent!=''&&req.query.tname!=''&&req.query.pstatus!=''&&req.query.water==''){
                Gschema.update({'id':req.query.id},{'rent':req.query.rent,'tenant':req.query.tname,'status':req.query.pstatus},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent!=''&&req.query.tname!=''&&req.query.pstatus!=''&&req.query.water!=''){
                Gschema.update({'id':req.query.id},{'rent':req.query.rent,'tenant':req.query.tname,'status':req.query.pstatus,'charge':req.query.water},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent==''&&req.query.tname==''&&req.query.pstatus==''&&req.query.water!=''){
                Gschema.update({'id':req.query.id},{'charge':req.query.water},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent==''&&req.query.tname==''&&req.query.pstatus!=''&&req.query.water!=''){
                Gschema.update({'iname':req.query.pname},{'status':req.query.pstatus,'charge':req.query.water},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent==''&&req.query.tname!=''&&req.query.pstatus==''&&req.query.water==''){
                Gschema.update({'name':req.query.pname},{'tenant':req.query.tname},function(err,data) {
                    if (err) console.error(err);
                })
            }

            else if(req.query.rent==''&&req.query.tname==''&&req.query.pstatus!=''&&req.query.water==''){
                Gschema.update({'name':req.query.pname},{'status':req.query.pstatus},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent==''&&req.query.tname==''&&req.query.pstatus==''&&req.query.water==''&&req.query.pname!=''){
                Gschema.update({'name':req.query.name},{'id':req.query.id},function(err,data) {
                    if (err) console.error(err);
                    console.log(req.query.id)
                })
            }
            //未完待续...好傻的写法
        }
    }

        Gschema.find(function(err,data){
            if(err) console.error(err);
            res.render('house',{islogin:app.locals['userInfo'],keyData:data})
        })


})
app.get('/delete',function(req,res){
    var deleteID=req.query.id
    Gschema.deleteOne({'id':deleteID},function(err,data){
        if(err) console.error(err);
        else{
            console.log(deleteID)
            res.redirect('/house');
        }
    })
})
app.get('/user_search',function(req,res){
    if(req.query.submitName=="search") {
        if (req.query.uname != '') {

            var reg = new RegExp(req.query.uname)
            // var result={
            //     id:Number,
            //     username:String,
            //     password:String,
            //     time:String,
            //     identification:String,
            //     income:Number,
            //     outlay:Number
            // }
            Uschema.find({
                'username': {$regex: reg}
            }, function (err, data) {
                if (data != null) {
                            res.render('user_result', {islogin:app.locals['userInfo'],keyData: data})
                        }
            })
        }

    }
})
app.get('/deleteUser',function(req,res){
    var deleteID=req.query.id
    Uschema.deleteOne({'id':deleteID},function(err,data){
        if(err) console.error(err);
        else{
            //console.log(deleteID)
            res.redirect('/owner');
        }
    })
})
app.get('/owner',function(req,res){


    if(req.query.submitName=="Add"){
        if(req.query.username!=''){


            Uschema.findOne({name:req.query.username},function (err, data){
                if (err) return console.error(err);
                if(data==null) {
                    u_num=u_num+1;
                    var new_user = new Uschema({
                        id:u_num,
                        username: req.query.username,
                        password:req.query.password,
                        identification:'admin',
                        time:getTime(),

                    })
                    new_user.save(function (err, new_user) {
                        if (err) return console.error(err)
                        console.log(new_user)
                    })
                }
            })
        }

    }
    Uschema.find(function(err,data){
        if(err) console.error(err);
        res.render('user',{islogin:app.locals['userInfo'],keyData:data})
    })

})
app.get('/sub_owner',function(req,res){

    if(req.query.submitName=='Add'){
        if(req.query.pname!=''){


            Gschema.findOne({name:req.query.pname},function (err, data){
                if (err) return console.error(err);
                if(data==null) {
                    h_num=h_num+1;
                    var new_good = new Gschema({
                        id:h_num,
                        name: req.query.pname,
                        status: '未出租',
                        address: req.query.address,
                        owner:app.locals['userInfo'],
                        rent: req.query.rent,
                        tenant: '',
                        charge: 0
                    })
                    new_good.save(function (err, new_good) {
                        if (err) return console.error(err)
                        console.log(new_good)
                    })
                }
            })
        }
    }
    else if(req.query.submitName=='Update'){
        if(req.query.pname!==''){
            if(req.query.rent!=''&&req.query.water==''){
                Gschema.update({'name':req.query.pname},{'rent':req.query.rent},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else if(req.query.rent==''&&req.query.water!=''){
                Gschema.update({'name':req.query.pname},{'charge':req.query.water},function(err,data) {
                    if (err) console.error(err);
                })
            }
            else{

            }
        }

    }
    Gschema.find({owner:app.locals['userInfo']},function (err,data) {
        if(err) console.log(err)
        console.log(data)
        res.render('ImOwner',{keyData:data,islogin:app.locals['userInfo']})
    })

})
app.get('/owner_delete',function(req,res){
    var deleteID=req.query.id
    Gschema.deleteOne({'id':deleteID},function(err,data){
        if(err) console.error(err);
        else{
            console.log(deleteID)
            res.redirect('/sub_owner');
        }
    })
})
app.get('/sub_tenant',function(req,res){
    Gschema.find({status:'未出租'},function (err,data) {
        if(err) console.log(err)
        //console.log(data)
        res.render('ImTenant',{keyData:data,islogin:app.locals['userInfo']})
    })

})
app.get('/rentHouse',function(req,res){
    var rentId=req.query.id;
    Gschema.findOne({id:rentId},function (err, data){
        if (err) return console.error(err);
        if(data!=null){
            Gschema.update({id:rentId},{status:'已出租',tenant:app.locals['userInfo']},function(err) {
                if (err) console.error(err);
            })
            Mschema.findOne({username:app.locals['userInfo']},function(err,info){
                if(err) console.error(err);
                if(info!=null){
                    Mschema.update({username:app.locals['userInfo']},{outlay:info.outlay-data.rent},function(err,result){
                        if(err) console.error(err)
                        console.log(result)
                    })
                    }
                    })
            Mschema.findOne({username:data.owner},function(err,info){
                    if(err) console.error(err);
                    if(info!=null){
                        Mschema.update({username:data.owner},{income:info.income+data.rent},function(err,result){
                            if(err) console.error(err)
                            console.log(result)
                        })
                    }
                })

                }
            res.redirect('/sub_tenant');

        })

})
app.get('/sub_info',function (req,res) {


    Mschema.findOne({username:app.locals['userInfo']},function (err,information) {
        let outlay=information.outlay
        let income=information.income
        if(err) console.log(err)
        Gschema.find({tenant:app.locals['userInfo']},function(err,data){
            if(err) console.log(err)
            else {
                res.render('sub_info', {islogin: app.locals['userInfo'], keyData:data,income:income,outlay:outlay})
            }
        })

    })


})
app.get('/pay',function (req,res) {
    var rentId=req.query.id;
    Gschema.findOne({id:rentId},function (err,data) {
        if(err) return console.error(err)
        if(data!=null){
            Mschema.findOne({username:app.locals['userInfo']},function(err,info){
                if(err) return console.error(err)
                else{
                    console.log(info.outlay)
                    console.log(info['outlay'])
                    Mschema.update({username:app.locals['userInfo']},{outlay:info.outlay-data.charge})
                    res.redirect('/sub_info')
                }
            })
        }
    })

})

app.get('/quit',function (req,res) {
    var rentId=req.query.id;
    Gschema.findOne({id:rentId},function (err,data) {
        if(err) return console.error(err)
        if(data!=null){
            Gschema.updateOne({tenant:app.locals['userInfo']},{tenant:'',status:'未出租'},function(err){
                if(err) console.error(err)
            })
        }
        res.redirect('/sub_info')
    })

})
// app.get('/populate',function(req,res){
//         Mschema.find({'username':'b'}).populate({
//             path:'username',
//             model:'money',
//         }).exec().then(function(err,data){
//                 if(err) console.error(err)
//                 console.log(data.username.rent)
//             })
// })
app.use('/logout',function(req,res,next){
    app.locals['userInfo']=null
    res.redirect('/')
})
app.listen(3000)
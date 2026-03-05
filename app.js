const express = require("express");
const app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", function(req,res){
    res.render(__dirname + "/app/views/main.ejs");
});

app.get("/sobre", function(req,res){
    res.send("Sobre nós");
});

app.get("/ola/:nome/:cargo", function(req,res){
    res.send(req.params);
});

app.listen(5000, function(){
    console.log("Servidor rodando na url: http://localhost:5000");
}); 



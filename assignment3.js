const https = require('https');
const express = require('express');
const app = express();

app.get('/',function(req,res){
    let web_url = req.query.web_url;
    res.send('The given website url is: '+ web_url);
});

let port = 12348;
app.listen(port, function(req,res){
    console.log('listening on port' + port)
});
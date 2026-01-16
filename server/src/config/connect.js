const mongoose = require("mongoose")

function connect(){
    mongoose.connect(process.env.MONGO_URI , {
        tls: true,              // force TLS
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }).then(()=>{
    console.log("Mongoose Connected");
    }).catch(err =>{
        console.log("Error in mongoose connection - ", err);
    })
}

module.exports = connect
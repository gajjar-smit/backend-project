import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import { app } from "./app.js";


import connectDB from "./db/index.js";

import dotenv from "dotenv"
dotenv.config({
    path:'./.env'
})



//APPROACH_1

// import express from "express"
// const app=express()

// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("err: ",error);
//             throw error
            
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`app is listening on ${process.env.PORT}`);
            
//         })
//     } catch (error) {
//         console.error("Error: ",error)
//         throw error
//     }
// })() //ifis

//APPROACH_2

connectDB()
.then(()=>{
    app.listen(process.env.PORT ||8000,()=>{
        console.log('server is running on port: ',process.env.PORT )
    })
}
)
.catch((err)=>{
    console.log('mongodb connection faild !!!',err);
    
})
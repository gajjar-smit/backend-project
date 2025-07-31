import express, { json } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGINE,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
//we can export routes here like pro prectice
import  userRouter from "./routes/user.routes.js"

//routes declaration
//now router is in other files ,we have to use middlewares
app.use("/api/v1/users",userRouter)


export {app}
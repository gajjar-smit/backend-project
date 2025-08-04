import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"


export const verifyJWT=asyncHandler( async (req,res,next)=>{

    try {
        
        
    
        //getting token from browser cookies or header
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","")

         
        //verifying the token
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
    
        //decodeing token
        const decodedToken=await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
    
        )
    
        //finding user from token and validating 
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            //TODO; discuss about front end
            throw new ApiError(401,"Invlid Access Token")
        }
    
        //if we find user then adding new obj in req
         
        req.user=user;
        next()
    
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Access Token")
    }


})
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/User.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"
import mongoose from 'mongoose'

const genrateAccessAndRefresToken=async (userId)=>{

    try {
        const user=await User.findById(userId) 
        const accessToken=await user.genrateAccessToken()
        const refreshToken=await user.genrateRefreshToken()
         
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something wnet wrong while genrating refresh and access token")
    }

}

const registerUser = asyncHandler(
    async (req, res) => {
        //get user detail from frontend
        //validatio of details-not empty
        //check if user already exist:username,email
        //check for images,check for avatar
        //upload them to cloudnery
        //create user object-create entry in db
        //remove password and refresh token field from response
        //chech for user creation
        //return res


        // const {username,email, fullname,password}=req.body
        const { email, password, username, fullname } = req.body
        //chacking if any field is missing (validation)

        if ([fullname, email, username, password].some((field) => (field?.trim() === " ")
        )) {
            throw new ApiError(400, "fullname is required")
        }
        //checking if user exist by email and username ,(useing db oprators)
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (existingUser) {

            throw new ApiError(409, "user with email or username already exist")
        }


        //handeling files ,avatar,,middleware multer give us methods
        const avatarLocalpath = req.files?.avatar[0]?.path;
        const coverImageLocalpath=req.files?.coverImage[0]?.path;

        //other classic way of code if coverimage is present or not
        // let coverImageLocalpath
        // if (req.files && Array.isArray(req.files.coverImage)
        //     && req.files.coverImage.length > 0) {
        //     coverImageLocalpath = req.files.coverImage[0].path
        // }

        if (!avatarLocalpath) {
            throw new ApiError(400, "Avatar file is required")
        }

        //upload on cloudnery
        const avatar = await uploadOnCloudinary(avatarLocalpath)
        const coverImage = await uploadOnCloudinary(coverImageLocalpath)

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required")
        }

        //create obj and so entry in db
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || " ",
            email,
            password,
            username: username.toLowerCase()
        })
        //find if user created
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if (!createdUser) {
            throw new ApiError(500, "something went wrong while registering user")
        }

        console.log(createdUser)
        return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully")
        )


    }
)

const loginUser= asyncHandler(
    async (req, res) => {
    
    //get data from user
    //check user (username or email)
    //find user
    //not then sing in
    //password check
    //access and refresh token
    //send cookie

    //get data from user   
     const { email, password, username    } = req.body
    //check user validation
    if(!username && !email){
        throw new ApiError(400,"username or password is required")
    }

    //find user
    const user=await User.findOne(
       { $or:[{username},{email}]}
    )
    if(!user){
        throw new ApiError(404,"user does not exist");
    }
    
    //check password
    // const isPasswordValid=await user.isPasswordCorrect(password)
     
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"password incorrect");
    }

    //create access and referesh token
    const {accessToken,refreshToken}=await genrateAccessAndRefresToken(user._id)

   


    const loggedUser=await User.findById(user._id).
    select("-password -refreshToken")

    const optinon={
        httpOnly:true,
        secure:true,

    }
    return res
    .status(200).cookie("accessToken",accessToken,optinon)
    .status(200).cookie("refreshToken",refreshToken,optinon)
    .json(
        new ApiResponse(
            200,{
                user : loggedUser,accessToken,refreshToken
            },
            "user logged in succesfully"
        )
    )
})

const logoutUser=asyncHandler( async(req,res)=>{
    
    //clear cookies
    //clear refresh token from user db

    //now we have middleware of auth we can get and find user
    //setting their cookie to undefined,delete its cooke
    const a=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{ 
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
     

   
       const optinon={
        httpOnly:true,
        secure:true,

    }
    return res.status(200)
    .clearCookie("accessToken",optinon)
    .clearCookie("refreshToken",optinon)
    .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken=asyncHandler ( async (req,res)=>{
try {
    
        //access refresh token
        //validatet it and give access token
    
        //get ref token
        const incomeingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    
        if(!incomeingRefreshToken){
            throw new ApiError(401,"unauthorized request")
        }
        
        //decode token
        const decodedToken=await jwt.verify(
            incomeingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        
        
        //find user with id
        const user=await User.findById(decodedToken?._id)

        if (!user){
            throw new ApiError(401,"invalid Refresh Token")
        }
    
        if (incomeingRefreshToken != user.refreshToken){
            throw new ApiError(401,
                "refresh token is expired or used"
            )
        }
    
        const option={
            httpOnly:true,
            secure:true
        }
    
        const {newrefreshToken,accessToken}= await genrateAccessAndRefresToken(user._id)
    
        return req
        .status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",newrefreshToken,option)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "access token refrenshed successfully"
            )
        )
    
}  catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
}

})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body

    //getting user from aur middleware
    const user =await User.findById(req.user?.id)
    const isPasswordCorr= await user.isPasswordCorrect(oldPassword)

    //checking if old password is true
    if(!isPasswordCorr){
        throw new ApiError(400,"invalid old password")
    }

    //set and save new password
    user.password=newPassword
    await user.save({validateBeforeSave:false})//validateBeforeSave prevent db validation for this opration


    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails=asyncHandler( async(req,res)=>{

    //getthering data
    const {fullname,email}=req.body
    if (!fullname && !email){
        throw new ApiError(400,"All field are required")
    }

    //getting user and updating it
    const user=User.findByIdAndUpdate(req.user?._id,{
        
        $set:{
            fullname,
            email:email
        }
    },{
        new:true  //new return you user after updation
    }).select("-password -refreshToken")

    return res.status(200)
    .json( new ApiResponse(200,user,"Account Details Updated Succesfuly"))
})

const updateUserAvatar=asyncHandler ( async(req,res)=>{
    //we need multer middleware and auth middleware for this
    //check if user is authed
    //get new file
    //replace it with old

    //get avatar local path
    const avatarLocalPath=req.files?.path

    //check it
    if (!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    
    //TODO:delete old avatar
    //my attempt to utiliti of remove old avatar
    //holding old avatar info
    var oldavatar=User.findById(req.user?._id).avatar

    //upload on cloudninery
    const avatar =await uploadOnCloudinary(avatarLocalPath)

    //checkit
    if(!avatar.url){
        throw new ApiError(400,"error while uplaoding on avatar")
    }

    //update the field
    const user =await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{new:true}
    ).select("-password -refreshToken")

    //my utility do delete old avatar
    deleteFromCloudinary(oldavatar)

    //sending res
    res.status(200)
    .json(new ApiResponse(200,user,"Avatar Updated Successfully"))
} )

const updateUserCoverImage=asyncHandler ( async(req,res)=>{
    //we need multer middleware and auth middleware for this
    //check if user is authed
    //get new file
    //replace it with old

    //get cover local path
    const coverImageLocalPath=req.files?.path

    //check it
    if (!coverImageLocalPath){
        throw new ApiError(400,"cover file is missing")
    }
    
    //upload on cloudninery
    const coverimage =await uploadOnCloudinary(coverImageLocalPath)

    //checkit
    if(!coverimage.url){
        throw new ApiError(400,"error while uplaoding on cover")
    }

    //update the field
    const user =await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverimage.url
            }
        },{new:true}
    ).select("-password -refreshToken")

    //sending res
    res.status(200)
    .json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
} )

//now start the usage of aggregation pipeline of mongodb

//the function i didnt understand much
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    //getting username for params ,we get it as url
    const {username}=req.params

    //check it
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")
    }

    //use aggrigation to find channel
    const channel=await User.aggregate([ 
        { 
            $match:{
                username:username?.toLowerCase()  //match the user
            }
        },{ 
            $lookup:{                           //joining subscription to user and save in subscribers
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{                          //joining chnnel which is subscribed in subscribedTo
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"

            }
        },{
            $addFields:{                          // adding field in doc of counts
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.users?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                        
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
                
            }
        }
     ])

     if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
     }

     return res.status(200)
     .json(new ApiResponse(200,channel[0],"User Channel Fatched Successfully"))
})

const getWatchHistory=asyncHandler(async(req,res)=>{

    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{           //match video is from watchhistory
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"WatchHistory",
                pipeline:[
                    {
                        $lookup:{  //subpipline for user in video to get user info
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[//sub pipeline for only get user fields
                                {
                                    $project:{//project this field
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                    $addFields:{
                        owner:{ //getting first field of array to clean data
                            $first:"$owner"
                        }
                    }}
                ]
            },

        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully"))


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/User.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const genrateAccessAndRefresToken=async (userId)=>{

    try {
        const user=await User.findById(userId)
        const accessToken= user.genrateAccessToken()
        const refreshToken=user.genrateRefreshToken()

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

const loginUser=asyncHandler(async(req,res)=>{
    //get data from user
    //check user (username or email)
    //find user
    //not then sing in
    //password check
    //access and refresh token
    //send cookie

    //get data from user
    const {username,email,password}=req.body()
    
    //check user validation
    if(!username || !email){
        throw new ApiError(400,"username or password is required")
    }

    //find user
    const user= User.findOne(
        $or[{usernam},{email}]
    )
    if(!user){
        throw new ApiError(404,"user does not exist");
    }
    
    //check password
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"password incorrect");
    }

    //create access and referesh token
    const {accessToken,refreshToken}=await genrateAccessAndRefresToken(user._id)

    const loggedUser=await User.findById(_id).
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
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{ 
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    //
       const optinon={
        httpOnly:true,
        secure:true,

    }
    return res.status(200)
    .clearCookie("accessToken",optinon)
    .clearCookie("refreshToken",optinon)
    .json(new ApiResponse(200,{},"User logged Out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}
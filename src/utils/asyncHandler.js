const asyncHandler=(reqHandlear)=>{
    return (req,res,next)=>{
        Promise.resolve(reqHandlear(req,res,next)).catch((error)=>next(error))
    }

}
export {asyncHandler}


// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,req,next)
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }
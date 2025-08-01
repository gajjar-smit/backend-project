import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

  cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:  process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SCERET 
    });


const uploadOnCloudinary =async (localFilePath)=>{

    try {
        if(!localFilePath) return null
        //upload file on cloudnary
        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        //file had been uploaded successfull
        console.log('file uploaded on cloudinary succcesfully ',response.url);
        fs.unlinkSync(localFilePath)//remove mellecious local saved temp file 
        
        
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove mellecious local saved temp file if not found  local path in upload
        return null;
    }
}
export {uploadOnCloudinary}
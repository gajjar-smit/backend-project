import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

  cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:  process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SCERET 
    });

const getPublicId=(fileurl)=>{
    const parts=fileurl.split('/')
    const filname=parts.pop().split('.')[0] 
    const folder=parts.slice(parts.indexOf("upload")+1).join('/')
    return `${filname}`
}

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
const deleteFromCloudinary = async (publicId) => {
  try {
    const realpublicId=getPublicId(publicId)
     
    
    const result = await cloudinary.uploader.destroy(realpublicId, {
      resource_type: 'image', // or 'video', 'raw' depending on your use case
      invalidate: true
    });
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return null;
  }
};


export { 
    uploadOnCloudinary,
    deleteFromCloudinary
}
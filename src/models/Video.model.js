import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const videoSchema = new Schema(
    {

        videoFile: {
            type: String, //cloudnery,
            reqired: true
        },
        thumbnail: {
            type: String,
            reqired: True
        },
        title: {
            type: String,
            reqired: True
        },
        description: {
            type: String,
            reqired: True
        },
        duration: {
            type: Number,
            reqired: True
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    }
    , { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)
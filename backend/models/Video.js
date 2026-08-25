import mongoose from "mongoose";
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  thumbnailUrl: { type: String, required: true }, videoUrl: { type: String, required: true },
  description: { type: String, default: "", maxlength: 2000 },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, views: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  category: { type: String, required: true }, uploadDate: { type: Date, default: Date.now }
}, { timestamps: true });
videoSchema.virtual("likes").get(function () { return this.likedBy.length; });
videoSchema.virtual("dislikes").get(function () { return this.dislikedBy.length; });
videoSchema.set("toJSON", { virtuals: true });
export default mongoose.model("Video", videoSchema);

import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: "" },
  channels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }]
}, { timestamps: true });
export default mongoose.model("User", userSchema);

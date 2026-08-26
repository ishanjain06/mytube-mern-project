import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Video from "./models/Video.js";

dotenv.config();

const oldSampleUrl =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";
const sampleUrl = "https://media.w3.org/2010/05/sintel/trailer.mp4";

await connectDB();

const result = await Video.updateMany(
  { videoUrl: oldSampleUrl },
  { $set: { videoUrl: sampleUrl } }
);

console.log(`Updated ${result.modifiedCount} sample video URL(s).`);
process.exit();

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Channel from "./models/Channel.js";
import Video from "./models/Video.js";
import Comment from "./models/Comment.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token is required.",
    });
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }
};

const ownVideo = async (id, user) =>
  Video.findOne({ _id: id, uploader: user });

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required.",
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({
        message: "An account already exists with this email.",
      });
    }

    await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        username
      )}`,
    });

    res.status(201).json({
      message: "Registration successful. Please log in.",
    });
  } catch (e) {
    res.status(400).json({
      message: e.message,
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const u = await User.findOne({ email });

  if (!u || !(await bcrypt.compare(req.body.password || "", u.password))) {
    return res.status(401).json({
      message: "Incorrect email or password.",
    });
  }

  res.json({
    token: tokenFor(u._id),
    user: {
      id: u._id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
    },
  });
});

app.get("/api/videos", async (req, res) => {
  const q = {};

  if (req.query.search) {
    q.title = {
      $regex: req.query.search,
      $options: "i",
    };
  }

  if (req.query.category && req.query.category !== "All") {
    q.category = req.query.category;
  }

  res.json(
    await Video.find(q)
      .populate("channel", "channelName")
      .sort({ createdAt: -1 })
  );
});

app.get("/api/videos/:id", async (req, res) => {
  try {
    const v = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("channel", "channelName owner");

    if (!v) {
      return res.status(404).json({
        message: "Video not found.",
      });
    }

    res.json(v);
  } catch {
    res.status(400).json({
      message: "Invalid video id.",
    });
  }
});

app.post("/api/videos", auth, async (req, res) => {
  const {
    title,
    thumbnailUrl,
    videoUrl,
    description,
    category,
    channelId,
  } = req.body;

  if (![title, thumbnailUrl, videoUrl, category, channelId].every(Boolean)) {
    return res.status(400).json({
      message: "Complete all required video fields.",
    });
  }

  const c = await Channel.findOne({
    _id: channelId,
    owner: req.user.id,
  });

  if (!c) {
    return res.status(403).json({
      message: "You can only upload to your own channel.",
    });
  }

  const v = await Video.create({
    title,
    thumbnailUrl,
    videoUrl,
    description,
    category,
    channel: c._id,
    uploader: req.user.id,
  });

  await Channel.findByIdAndUpdate(c._id, {
    $push: { videos: v._id },
  });

  res.status(201).json(v);
});

app.put("/api/videos/:id", auth, async (req, res) => {
  const v = await ownVideo(req.params.id, req.user.id);

  if (!v) {
    return res.status(403).json({
      message: "You can only edit your own videos.",
    });
  }

  ["title", "thumbnailUrl", "videoUrl", "description", "category"].forEach(
    (key) => {
      if (req.body[key] !== undefined) {
        v[key] = req.body[key];
      }
    }
  );

  await v.save();

  res.json(v);
});

app.delete("/api/videos/:id", auth, async (req, res) => {
  const v = await ownVideo(req.params.id, req.user.id);

  if (!v) {
    return res.status(403).json({
      message: "You can only delete your own videos.",
    });
  }

  await Channel.findByIdAndUpdate(v.channel, {
    $pull: { videos: v._id },
  });

  await Comment.deleteMany({
    video: v._id,
  });

  await v.deleteOne();

  res.json({
    message: "Video deleted.",
  });
});

app.post("/api/videos/:id/rate", auth, async (req, res) => {
  const v = await Video.findById(req.params.id);

  if (!v || !["like", "dislike"].includes(req.body.type)) {
    return res.status(400).json({
      message: "Invalid rating request.",
    });
  }

  const id = req.user.id;
  const inLikes = v.likedBy.map(String).includes(id);
  const inDislikes = v.dislikedBy.map(String).includes(id);

  if (req.body.type === "like") {
    v.likedBy = inLikes
      ? v.likedBy.filter((x) => String(x) !== id)
      : [...v.likedBy, id];

    v.dislikedBy = v.dislikedBy.filter(
      (x) => String(x) !== id
    );
  } else {
    v.dislikedBy = inDislikes
      ? v.dislikedBy.filter((x) => String(x) !== id)
      : [...v.dislikedBy, id];

    v.likedBy = v.likedBy.filter(
      (x) => String(x) !== id
    );
  }

  await v.save();

  res.json({
    likes: v.likedBy.length,
    dislikes: v.dislikedBy.length,
    liked: v.likedBy.map(String).includes(id),
    disliked: v.dislikedBy.map(String).includes(id),
  });
});

app.post("/api/channels", auth, async (req, res) => {
  if (!req.body.channelName?.trim()) {
    return res.status(400).json({
      message: "Channel name is required.",
    });
  }

  const c = await Channel.create({
    ...req.body,
    owner: req.user.id,
  });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { channels: c._id },
  });

  res.status(201).json(c);
});

app.get("/api/channels/mine", auth, async (req, res) =>
  res.json(await Channel.find({ owner: req.user.id }))
);

app.get("/api/channels/:id", async (req, res) => {
  const channel = await Channel.findById(req.params.id).populate(
    "owner",
    "username avatar"
  );

  if (!channel) {
    return res.status(404).json({
      message: "Channel not found.",
    });
  }

  res.json({
    channel,
    videos: await Video.find({
      channel: channel._id,
    }).sort({ createdAt: -1 }),
  });
});

app.get("/api/comments/:videoId", async (req, res) =>
  res.json(
    await Comment.find({
      video: req.params.videoId,
    })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
  )
);

app.post("/api/comments/:videoId", auth, async (req, res) => {
  if (!req.body.text?.trim()) {
    return res.status(400).json({
      message: "Comment cannot be empty.",
    });
  }

  const c = await Comment.create({
    video: req.params.videoId,
    user: req.user.id,
    text: req.body.text,
  });

  res.status(201).json(
    await c.populate("user", "username avatar")
  );
});

app.put("/api/comments/:id", auth, async (req, res) => {
  const c = await Comment.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!c) {
    return res.status(403).json({
      message: "You can only edit your own comments.",
    });
  }

  c.text = req.body.text?.trim();

  if (!c.text) {
    return res.status(400).json({
      message: "Comment cannot be empty.",
    });
  }

  await c.save();

  res.json(c);
});

app.delete("/api/comments/:id", auth, async (req, res) => {
  const c = await Comment.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!c) {
    return res.status(403).json({
      message: "You can only delete your own comments.",
    });
  }

  res.json({
    message: "Comment deleted.",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
  });
});

app.use((err, req, res, next) =>
  res.status(500).json({
    message: "Server error. Please try again.",
  })
);

connectDB();

app.listen(
  process.env.PORT || 5000,
  () =>
    console.log(
      `Server running on port ${process.env.PORT || 5000}`
    )
);
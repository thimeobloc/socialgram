// Load the .env file first, before any other module reads process.env
// (auth.ts checks JWT_SECRET as soon as it is imported).
import "dotenv/config";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import router from "./routes";

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

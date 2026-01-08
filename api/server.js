import express from "express";
import { router } from "./route.js";

const app = express();


app.use(express.json());


app.use("/notify", router);

app.listen(3000, () => {
  console.log("API running on port 3000");
});

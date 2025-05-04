import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = fs.readFileSync("./today.json", "utf-8");
  res.status(200).json(JSON.parse(data));
}

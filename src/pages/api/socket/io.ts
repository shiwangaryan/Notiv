//create connection, listen to it and everything

import { NextApiResponseSocketIO } from "@/lib/types";
import { NextApiRequest } from "next";
import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = async (req: NextApiRequest, res: NextApiResponseSocketIO) => {

  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      socket.on("create-room", (fileId) => {
        socket.join(fileId);
      });
      socket.on("send-changes", (deltas, fileId) => {
        socket.to(fileId).emit("receive-changes", deltas, fileId);
      });
      socket.on("send-cursor-move", (range, fileId, cursorId) => {
        socket.to(fileId).emit("receive-cursor-move", range, fileId, cursorId);
      });
    });
    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;

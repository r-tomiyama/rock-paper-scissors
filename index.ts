import express from "express";
import http from "http";
import socketio from "socket.io";

const app: express.Express = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io: socketio.Server = new socketio.Server(server);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
io.on("connection", (socket: socketio.Socket) => {
  console.log("connect");

  let counter = 0;

  socket.on("test", (data: { message: string }) => {
    console.log(`type: ${typeof data}   data: ${data.message}`);
    socket.emit("test2", { message: `server message ${counter++}` });
  });
});

server.listen(3000, () => {
  console.log("Start on port 3000.");
});

app.get("/", (req: express.Request, res: express.Response) => {
  res.render("./index.ejs", { hoge: "hoge" });
});

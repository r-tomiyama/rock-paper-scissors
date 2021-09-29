import express from "express";
import http from "http";
import socketio from "socket.io";

const app: express.Express = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io: socketio.Server = new socketio.Server(server);

let players: Array<Player> = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
io.on("connection", (socket: socketio.Socket) => {
  console.log("connect");

  const userId = Math.random().toString(32).substring(2);

  let isJoined = false;

  socket.on("join", () => {
    console.log("join申請");

    if (players.length < 2) {
      players.push({ id: userId });
      isJoined = true;
      console.log(`join成功しました。${players.length}人目の参加者です。`);
      socket.emit("joined");

      if (players.length === 2) {
        io.emit("start");
      }
    } else {
      console.log("満員のため、joinできません。");
      socket.emit("FaildeToJoin");
    }
  });

  socket.on("choose", (data: { hand: string }) => {
    console.log(`${data.hand}が選択されました`);

    const userIndex = players.findIndex((player) => player.id === userId);
    players[userIndex].hand = data.hand;

    const handCount = players.reduce(
      (acc: number, player: Player): number => (player.hand ? acc + 1 : acc),
      0
    );

    if (handCount === 2) {
      // 勝負
      io.emit("done");

      players.forEach((player) => (player.hand = undefined));
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnect");

    if (isJoined) {
      players = players.filter((player) => player.id === userId);
      console.log(`現在の参加者は${players.length}人です。`);
    }
  });
});

server.listen(3000, () => {
  console.log("Start on port 3000.");
});

app.get("/", (req: express.Request, res: express.Response) => {
  res.render("./index.ejs");
});

interface Player {
  id: string;
  hand?: string;
}

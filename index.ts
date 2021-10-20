import express from "express";
import http from "http";
import socketio from "socket.io";

const app: express.Express = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const server = http.createServer(app);
const io: socketio.Server = new socketio.Server(server);

let players: Array<Player> = [];

function calc_result(userHand: Hand, opponentHand: Hand): Result {
  const win_patterns: Array<[Hand, Hand]> = [
    ["rock", "scissor"],
    ["paper", "rock"],
    ["scissor", "paper"],
  ];

  if (userHand === opponentHand) {
    return "draw";
  } else if (
    win_patterns.reduce(
      (acc: boolean, pattern: [Hand, Hand]) =>
        userHand === pattern[0] && opponentHand === pattern[1] ? true : false,
      false
    )
  ) {
    return "win";
  } else {
    return "lose";
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
io.on("connection", (socket: socketio.Socket) => {
  console.log("connect");

  const userId = Math.random().toString(32).substring(2);

  let isJoined = false;

  function resetRoom() {
    players = [];
    io.emit("reset-room", {
      message: "エラーが発生したため、トップページに戻ります。",
    });
  }

  socket.on("join", () => {
    console.log("join申請");

    try {
      if (players.length < 2) {
        players.push({ id: userId });
        isJoined = true;
        console.log(`join成功しました。${players.length}人目の参加者です。`);
        socket.emit("joined", { id: userId });

        if (players.length === 2) {
          io.emit("start");
        }
      } else {
        console.log("満員のため、joinできません。");
        socket.emit("error", {
          message:
            "じゃんけん部屋は満室のため、参加できません。時間を空けてからまた参加しましょう。",
        });
      }
    } catch (e) {
      resetRoom();
      console.error(e);
    }
  });

  socket.on("choose", (data: { hand: Hand }) => {
    console.log(`${data.hand}が選択されました`);

    try {
      const user = players[players.findIndex((player) => player.id === userId)];
      user.hand = data.hand;

      const opponent = players.filter((player) => player.id !== user.id)[0];

      if (opponent.hand) {
        const result = calc_result(user.hand, opponent.hand);
        io.emit("done", {
          isDraw: result === "draw",
          winner: result === "win" ? user.id : opponent.id,
          opponentHand: opponent.hand,
        });

        players.forEach((player) => (player.hand = undefined));
      }
    } catch (e) {
      resetRoom();
      console.error(e);
    }
  });

  socket.on("disconnect", () => {
    console.log("disconnect");

    try {
      if (isJoined) {
        players = players.filter((player) => player.id === userId);
        console.log(`現在の参加者は${players.length}人です。`);

        io.emit("opponent-disconnect");
      }
    } catch (e) {
      resetRoom();
      console.error(e);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Start on port ${port}.`);
});

app.get("/", (req: express.Request, res: express.Response) => {
  res.render("./index.ejs");
});

type Hand = "rock" | "paper" | "scissor";

type Result = "win" | "lose" | "draw";

interface Player {
  id: string;
  hand?: Hand;
}

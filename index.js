"use strict";

var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });

var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));

var app = express_1.default();
app.set("view engine", "ejs");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));

var server = http_1.default.createServer(app);
var io = new socket_io_1.default.Server(server);
var players = [];

function calc_result(userHand, opponentHand) {
  var win_patterns = [
    ["rock", "scissor"],
    ["paper", "rock"],
    ["scissor", "paper"],
  ];

  if (userHand === opponentHand) {
    return "draw";
  } else if (
    win_patterns.reduce(function (acc, pattern) {
      return userHand === pattern[0] && opponentHand === pattern[1]
        ? true
        : false;
    }, false)
  ) {
    return "win";
  } else {
    return "lose";
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
io.on("connection", function (socket) {
  console.log("connect");

  var userId = Math.random().toString(32).substring(2);
  var isJoined = false;

  function resetRoom() {
    players = [];
    io.emit("reset-room", {
      message: "エラーが発生したため、トップページに戻ります。",
    });
  }
  socket.on("join", function () {
    console.log("join申請");

    try {
      if (players.length < 2) {
        players.push({ id: userId });
        isJoined = true;
        console.log(
          "join\u6210\u529F\u3057\u307E\u3057\u305F\u3002" +
            players.length +
            "\u4EBA\u76EE\u306E\u53C2\u52A0\u8005\u3067\u3059\u3002"
        );
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
  socket.on("choose", function (data) {
    console.log(data.hand + "\u304C\u9078\u629E\u3055\u308C\u307E\u3057\u305F");

    try {
      var user_1 =
        players[
          players.findIndex(function (player) {
            return player.id === userId;
          })
        ];
      user_1.hand = data.hand;

      var opponent = players.filter(function (player) {
        return player.id !== user_1.id;
      })[0];

      if (opponent.hand) {
        var result = calc_result(user_1.hand, opponent.hand);
        io.emit("done", {
          isDraw: result === "draw",
          winner: result === "win" ? user_1.id : opponent.id,
          opponentHand: opponent.hand,
        });
        players.forEach(function (player) {
          return (player.hand = undefined);
        });
      }
    } catch (e) {
      resetRoom();
      console.error(e);
    }
  });
  socket.on("disconnect", function () {
    console.log("disconnect");

    try {
      if (isJoined) {
        players = players.filter(function (player) {
          return player.id === userId;
        });
        console.log(
          "\u73FE\u5728\u306E\u53C2\u52A0\u8005\u306F" +
            players.length +
            "\u4EBA\u3067\u3059\u3002"
        );
        io.emit("opponent-disconnect");
      }
    } catch (e) {
      resetRoom();
      console.error(e);
    }
  });
});

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log("Start on port " + port + ".");
});
app.get("/", function (req, res) {
  res.render("./index.ejs");
});

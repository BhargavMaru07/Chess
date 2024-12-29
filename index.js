require('dotenv').config()
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = socket(server);
const PORT = process.env.PORT || 4000

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home", { title: "Chess Game" });
});

io.on("connection",function(uniqueSocket){
    console.log("connected");

    if(!players.white) {
      players.white = uniqueSocket.id
      uniqueSocket.emit("playerRole","w")
    }
    else if(!players.black){
      players.black = uniqueSocket.id
      uniqueSocket.emit("playerRole","b")
    }
    else{
      uniqueSocket.emit("spectatorRole")
    }

    uniqueSocket.on("disconnect",function(){
        if(uniqueSocket.id === players.white){
          delete players.white
        }
        else if (uniqueSocket.id === players.black){
          delete players.black
        }
    })

    uniqueSocket.on("move",(move)=>{
      if(chess.turn() === 'w' && uniqueSocket.id !== players.white) return;
      if(chess.turn() === 'b' && uniqueSocket.id !== players.black) return;

      try {

        let result = chess.move(move);

        if (result) {
          currentPlayer = chess.turn();
          io.emit("move",move)
          io.emit("boardState",chess.fen())
        } else {
          console.log("Invalid Move : ",move);
          uniqueSocket.emit("InvalidMove",move)
        }
      } catch (error) {
        console.log("Error in Move :",error);
        uniqueSocket.emit("InvalidMove", move);
      }
    })

})

server.listen(PORT, () => {
  console.log("Server is listening",PORT);
});

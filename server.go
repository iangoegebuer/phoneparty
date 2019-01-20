package main

import (
	"log"
	"net/http"
	"strings"
	"time"

	uuid "github.com/google/uuid"
	socketio "github.com/googollee/go-socket.io"
)

type Room struct {
	name      string
	entryCode string
	owner     string
	members   []Player
	expires   time.Time // todo implement
}

type Player struct {
	name   string
	id     string
	socket socketio.Socket
}

var rooms []Room

func main() {
	server, err := socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}
	server.On("connection", func(so socketio.Socket) {
		log.Println("on connection")
		so.Request().ParseForm()
		var postValues = so.Request().Form
		log.Println("Room code: ", "chat_"+postValues.Get("room"))
		log.Println("Player ID: ", postValues.Get("playerID"))
		so.Join("chat_" + postValues.Get("room"))
		var playerID = postValues.Get("playerID")
		if "" == playerID {
			var id, _ = uuid.NewRandom()
			playerID = id.String()
			log.Println("Assigning player ID ", playerID, " to ", postValues.Get("name"))
			so.Emit("set playerID", playerID)
		}
		// from is a player ID
		so.On("to everyone", func(data string) {
			server.BroadcastTo(so.Rooms()[0], "to everyone", data)
		})
		so.On("to host", func(data string) {
			// TODO define one socket as the host
		})
		so.On("to player", func(to string, data string) {

		})
		so.On("player list", func() {
			// TODO send down the list of players
		})
		so.On("disconnection", func() {
			log.Println("on disconnect")
		})
	})
	server.On("error", func(so socketio.Socket, err error) {
		log.Println("error:", err)
	})

	http.Handle("/socket.io/", server)
	http.Handle("/site/", http.StripPrefix("/site/", http.FileServer(http.Dir("site"))))
	http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "site/favicon.ico")
	})
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		url := strings.Split(r.URL.String(), "?")[0]
		if len(url) > 0 {
			url = url[1:]
		}
		if strings.Contains(url, "/") {
			http.ServeFile(w, r, "./site/error.html")
		} else if len(url) == 0 {
			// serve index
			http.ServeFile(w, r, "./site/index.html")
		} else {
			// serve room
			log.Println("url for room is ", url)
			http.ServeFile(w, r, "./site/room.html")
		}
	})
	log.Println("Serving at localhost:8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

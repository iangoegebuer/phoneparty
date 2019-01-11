package main

import (
	"log"
	"net/http"

	"github.com/googollee/go-socket.io"
)

type Room struct {
  Name string
  EntryCode string
  //Owner int
  //Members []int
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
		log.Println("Room code: ","chat_"+postValues.Get("room"))
		so.Join("chat_"+postValues.Get("room"))
		so.On("chat message", func(msg string) {
			log.Println("emit:", so.Emit("chat message", msg))
			server.BroadcastTo(so.Rooms()[0], "chat message", msg)
		})
		so.On("disconnection", func() {
			log.Println("on disconnect")
		})
	})
	server.On("error", func(so socketio.Socket, err error) {
		log.Println("error:", err)
	})

	http.Handle("/socket.io/", server)
	http.Handle("/", http.FileServer(http.Dir("./site")))
	log.Println("Serving at localhost:8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

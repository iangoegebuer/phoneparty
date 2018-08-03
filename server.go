package main

import (
	"fmt"
	"net/http"
  //"html/template"
)

type Room struct {
  Name string
  EntryCode string
  //Owner int
  //Members []int
}

var rooms []Room

func main() {
  http.HandleFunc("/new/", addRoom)
  http.HandleFunc("/list", listRooms)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, you've requested: %s\n", r.URL.Path)
	})

	http.ListenAndServe(":8080", nil)
}

func addRoom(w http.ResponseWriter, r *http.Request) {
  rooms = append(rooms, Room{Name: r.URL.Path, EntryCode: "WHAT"})
  fmt.Fprintf(w, "Added a room: %s", r.URL.Path)
}

func listRooms(w http.ResponseWriter, r *http.Request) {
  fmt.Fprintf(w, "Listing ol rooms\n")
  for _, elem := range rooms {
    fmt.Fprintf(w, "Room: %s : %s\n", elem.Name, elem.EntryCode)
  }
}

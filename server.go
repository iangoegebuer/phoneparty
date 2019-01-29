package main

import (
	"bufio"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	uuid "github.com/google/uuid"
	socketio "github.com/googollee/go-socket.io"
)

// Room : Data structure for rooms
type Room struct {
	entryCode        string
	members          []*Player // the first player is always the owner
	expires          time.Time // todo implement room expiration
	timerActive      bool
	timerSecondsLeft int
	timerStop        chan struct{}
}

func (room Room) findPlayer(playerID string) (bool, *Player) {
	for _, player := range room.members {
		if player.id == playerID {
			return true, player
		}
	}
	return false, nil
}

func (room Room) listPlayers() string {
	result := ""
	for i, player := range room.members {
		result += player.id
		if i < len(room.members)-1 {
			result += ","
		}
	}
	return result
}

// Player : Data structure for players
type Player struct {
	name   string
	id     string
	socket socketio.Socket
}

var rooms []*Room

func findRoom(code string) (bool, *Room) {
	for _, room := range rooms {
		if room.entryCode == code {
			return true, room
		}
	}
	return false, nil
}

func main() {
	rand.Seed(time.Now().UTC().UnixNano())
	server, err := socketio.NewServer(nil)
	if err != nil {
		log.Fatal(err)
	}
	server.On("connection", func(so socketio.Socket) {
		log.Println("on connection")
		so.Request().ParseForm()
		var postValues = so.Request().Form
		var roomCode = postValues.Get("room")
		var name = postValues.Get("name")
		log.Println("Room code: ", "chat_"+roomCode)
		so.Join("chat_" + roomCode)
		var playerID = postValues.Get("playerID")
		log.Println("Player ID: ", playerID)
		if "" == playerID {
			var id, _ = uuid.NewRandom()
			playerID = id.String()
			log.Println("Assigning player ID ", playerID, " to ", name)
			so.Emit("set playerID", playerID)
		}
		found, room := findRoom(roomCode)
		if !found {
			log.Println("Couldn't find room code ", roomCode)
			// room is expired
			so.Emit("error", "Unable to find the specified room")
			return
		}
		found, playerInRoom := room.findPlayer(playerID)
		if !found {
			playerInRoom = &Player{name: name, id: playerID, socket: so}
			room.members = append(room.members, playerInRoom)
		} else {
			// rename and use the new socket i guess?
			playerInRoom.name = name
			playerInRoom.socket = so
		}
		log.Println("Current player list in room ", room.entryCode, " : ", room.listPlayers())

		// from is a player ID
		so.On("to everyone", func(data string) {
			server.BroadcastTo("chat_"+roomCode, "to everyone", data)
		})
		so.On("to host", func(data string) {
			if len(room.members) > 0 {
				hostSo := room.members[0].socket
				hostSo.Emit("to host", data)
			}
		})
		so.On("to player", func(to string, data string) {
			found, player := room.findPlayer(to)
			if found {
				player.socket.Emit("to player", data)
			}
		})
		so.On("player list", func() {
			so.Emit("player list", room.listPlayers())
		})
		so.On("sync var", func(varName string, data string) {
			// only sync vars given by the host
			if playerInRoom.id != room.members[0].id {
				return
			}
			server.BroadcastTo("chat_"+roomCode, "sync var", varName, data)
		})
		// sync var where each player has a copy
		so.On("sync player var", func(varName string, playerID string, data string) {
			// only sync player vars given by the host
			if playerInRoom.id != room.members[0].id {
				return
			}
			server.BroadcastTo("chat_"+roomCode, "sync player var", varName, playerID, data)
		})

		so.On("start timer", func(seconds string) {
			// only the host can start the timer
			if playerInRoom.id != room.members[0].id || room.timerActive {
				return
			}
			secondsNum, err := strconv.Atoi(seconds)
			if err == nil {
				log.Println("Unable to parse timer time:", seconds)
				return
			}
			room.timerActive = true
			room.timerStop = make(chan struct{})
			room.timerSecondsLeft = secondsNum
			ticker := time.NewTicker(time.Second)
			go func() {
				for {
					select {
					case <-ticker.C:
						room.timerSecondsLeft--
						if room.timerSecondsLeft < 1 {
							log.Println("Timer ended in room ", room.entryCode)
							server.BroadcastTo("chat_"+roomCode, "finish timer")
							room.timerActive = false
							ticker.Stop()
							return
						}
						server.BroadcastTo("chat_"+roomCode, "sync timer", room.timerSecondsLeft)
						break
					case <-room.timerStop:
						log.Println("Timer cancelled in room ", room.entryCode)
						room.timerActive = false
						ticker.Stop()
						return
					}
				}
			}()

			server.BroadcastTo("chat_"+roomCode, "start timer", seconds)
		})
		// there is a message called "sync timer" that the server sends to clients to sync up their timers
		// there is a message called "finish timer" that the server sends to clients when the timer ends
		so.On("cancel timer", func() {
			// only the host can cancel the timer
			if playerInRoom.id != room.members[0].id || !room.timerActive {
				return
			}
			close(room.timerStop)
			server.BroadcastTo("chat_"+roomCode, "cancel timer")
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
	http.HandleFunc("/create", func(w http.ResponseWriter, r *http.Request) {
		// TODO create the room, and then redirect to it
		const letters = "abcdefghijklmnopqrstuvwxyz"

		randStr := ""
		for i := 0; i < 6; i++ {
			idx := rand.Intn(len(letters))
			randStr += letters[idx : idx+1]
		}

		room := &Room{entryCode: randStr, timerActive: false, expires: time.Now().Add(time.Hour * 2)}
		rooms = append(rooms, room)
		log.Println("Created room with code " + randStr)
		http.Redirect(w, r, "/"+randStr, 303)
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
			found, _ := findRoom(url)
			if !found {
				http.Redirect(w, r, "/?error=code", 400)
			} else {
				http.ServeFile(w, r, "./site/room.html")
			}
		}
	})

	startPeriodic()
	go processCommands()

	log.Println("Serving at localhost:8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func startPeriodic() {
	// I barely understand this but it runs periodic every 30 seconds
	ticker := time.NewTicker(30 * time.Second)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				periodic()
				break
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}

func periodic() {
	// scan through rooms and remove expired ones
	now := time.Now()
	for i := 0; i < len(rooms); i++ {
		if rooms[i].expires.Before(now) {
			log.Println("Removing expired room " + rooms[i].entryCode)
			rooms = append(rooms[:i], rooms[i+1:]...)
			i--
		}
	}
}

func processCommands() {
	reader := bufio.NewReader(os.Stdin)

	for {
		text, err := reader.ReadString('\n')
		if err != nil {
			log.Println("err", err)
			continue
		}
		text = strings.Replace(text, "\r", "", -1)
		text = strings.Replace(text, "\n", "", -1)
		log.Println("Command input: ", text)
		if strings.Compare("quit", text) == 0 {
			os.Exit(0)
		}
	}
}

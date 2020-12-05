package main

import (
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"time"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	idclients map[int]*Client

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

type TurnData struct {
	Username string
	Password string
	Ttl      int32
	Uris     []string
}

const (
	DELIMITER_STR   = "$*"
	DefaultTTL      = 86400
	Static_auth_key = "4e6b598f829d48e8e69c6d36364d9726"
)

var ICEUrls = [...]string{
	"turn:turn.fannunshuang.com:3478?transport=tcp",
	"turn:turn.fanjunshuang.com:3478?transport=udp",
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte, 20480),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		idclients:  make(map[int]*Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			log.Printf("register:%d\n", client.uid)
			h.clients[client] = true
			h.idclients[client.uid] = client
			turndata := h.CreateTurndata(client.uid)
			turn, _ := json.Marshal(turndata)
			turnmsg := "turndata" + DELIMITER_STR + string(turn)
			log.Println("turndata:" + string(turnmsg))
			client.send <- []byte(turnmsg)
		case client := <-h.unregister:
			log.Printf("unregister:%d\n", client.uid)
			if _, ok := h.clients[client]; ok {
				delete(h.idclients, client.uid)
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			log.Println("broadcast:" + string(message))
			messages := strings.Split(string(message), DELIMITER_STR)
			if len(messages) > 2 {
				switch messages[0] {
				case "offer":
					id, err := strconv.Atoi(messages[1])
					if err == nil {
						h.idclients[id].send <- message
					}
					continue
				case "answer":
					id, err := strconv.Atoi(messages[1])
					if err == nil {
						h.idclients[id].send <- message
					}
					continue
				case "icecandidate":
					id, err := strconv.Atoi(messages[1])
					if err == nil {
						h.idclients[id].send <- message
					}
					continue
				default:
				}
			}

			id, err := strconv.Atoi(messages[1])
			if err != nil {
				log.Printf("error: %v", err)
			}

			for client := range h.clients {
				if client.uid == id {
					continue
				}
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
	log.Printf("hub exit\n")
}

func (h *Hub) CreateTurndata(uid int) TurnData {

	bar := sha256.New()
	bar.Write([]byte(strconv.Itoa(uid)))
	username := base64.StdEncoding.EncodeToString(bar.Sum(nil))
	foo := hmac.New(sha1.New, []byte(Static_auth_key))

	expired := time.Now().Unix() + DefaultTTL
	username = strconv.Itoa(int(expired)) + ":" + username
	foo.Write([]byte(username))
	password := base64.StdEncoding.EncodeToString(foo.Sum(nil))

	var turnData TurnData
	// 以下硬编码
	turnData.Username = username
	turnData.Password = password
	turnData.Ttl = DefaultTTL
	//turnData.Uris = make([]string, 5)
	for _, v := range ICEUrls {
		turnData.Uris = append(turnData.Uris, v)
	}
	return turnData
}

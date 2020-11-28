package main

import (
	"strings"
	"strconv"
	"log"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	idclients map[uint32]*Client

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}
var DELIMITER_STR ="$*"

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte, 20480),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		idclients:    make(map[uint32]*Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			log.Printf("register:%d\n", client.uid)
			h.clients[client] = true
			h.idclients[client.uid] = client
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
						id , err := strconv.Atoi(messages[1])
						if err == nil {
							h.idclients[uint32(id)].send <- message
						}
						continue
					case "answer": 
						id , err := strconv.Atoi(messages[1])
						if err == nil {
							h.idclients[uint32(id)].send <- message
						}
						continue
					default:
				}
			}

			id , err := strconv.Atoi(messages[1])
			if err != nil {
				log.Printf("error: %v", err)
			}
			
			for client := range h.clients {
				if client.uid == uint32(id) {
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
package main

import (
	"flag"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8955", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "webroot/index.html")
}

func main() {
	flag.Parse()
	hub := newHub()
	go hub.run()
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("webroot/static"))))
	http.HandleFunc("/", serveHome)
	
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
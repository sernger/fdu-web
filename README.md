# fdu-web
#go run ./

webroot
production:
npm run build
npm install -g serve
nohup   serve -s build -l 8956 & > fe.log

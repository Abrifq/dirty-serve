# Dirty Serve

A quickly hacked together server for serving:
- [Static files!](#Serving-static-files)
- [Dynamic pages!](#Serving-dynamic-API-pages)
- [Websocket connections!](#Handling-a-Websocket-connection)

Click on the item to view a code example.

It's called dirty because I didn't intend doing it with good practices and readable code. I might reject PRs only changing code styling.

Code examples
---

**This module will always be imported via `require("dirty-serve")` in all examples.**
## Starting the server with default settings

```js
const serverInterface = require("dirty-serve");
serverInterface.startServer();
```

## Changing port
By default, the module checks if `$PORT` is defined, and if it is, sets the port to `$PORT`s value.
Otherwise it's set to 3000.

Let's change it without setting an environment variable.
```js
const serverInterface = require("dirty-serve");
serverInterface.port = 8080; 
//If you had to use sockets, you could just use socket file's relative path.
//For example, assume our socket is "app.sock":
serverInterface.port = "app.sock";
```

## Blacklisting requests by filtering parts of the requests
OK, I must admit the title is long, but it's necessary.
Let's say we need to filter `/admin` for some reason.
```js
const serverInterface = require("dirty-serve");
serverInterface.pathFilter.add("/admin"); 
```
Filters out any requests with "/admin" in them.
That will filters requests like this:
- /pictures`/admin`.jpg
- /settings`/admin`
- `/admin`
But it won't filter something like this:
/pictures/picture_of_admin.png
/controlAdmin
/haha/../Admin

You can use `/\/admin/u` (see RegExp for more details) to check it without case sensitivity or with more flexibility, or use something like `/\/.+admin(?:.html)?$/u` to filter requests with admin at the end of them. The possibilities are endless!

Also, let's say we have an api that needs to get ready asyncly before being able to serve.
You can also filter and remove that filter if you save the key!
```js
const serverInterface = require("dirty-serve");
//imaginary api has an initialize function which returns a promise that resolves when it's initialized.
function getApiReady(){
    const filterKey = serverInterface.pathFilters.add(IMAGINARY_API_SERVE_PATH);
    imaginaryApi.initialize().then(()=>serverInterface.pathFilters.remove(filterKey));
}
```

## Serving static files
Assuming we have files in "/app/www" we want to serve, but [filter out](#Blacklisting-requests-by-filtering-parts-of-the-requestst) `.git` requests.
```js
const serverInterface = require("dirty-serve");
serverInterface.pathFilters.add(".git");
serverInterface.static.servePath = "/app/www";
//do other things you need to do, and start the server.
```

## Serving dynamic (API) pages

Assume that we need to make a coin flipper API which can output json and html depending on `Accept` header. Let's code it!
```js
function flipACoin(){
    return Math.random() > 0.5;
}

function handleCoinFlipPage(incoming,outgoing,_sanitizedPath){
    const serveHTTP = ("accept" in incoming.headers) && (incoming.headers.accept.split(",").includes("text/html"));
    const coinResult = flipACoin() ? "heads" : "tails";
    if(serveHTTP){
        outgoing.writeHead(200,"OK",{ "Content-Type": "text/html"});
        outgoing.write("<p>" + coinResult + "</p>");
        outgoing.end();
    }else{
        outgoing.writeHead(200,"OK",{ "Content-Type": "application/json"});
        outgoing.write('"' + coinResult + '"');
        outgoing.end();
    }
}

const serverInterface = require("dirty-serve");
serverInterface.apiPageHandlers.add("/flipcoin",handleCoinFlipPage);
```
## Handling a Websocket connection

```js
const serverInterface = require("dirty-serve");
const connections = new Set();

function acceptConnection(connection){
    connections.add(connection);
    //The developer must handle removing of connections by themselves.
    connection.on("error",()=>connections.delete(connection));
    connection.on("close",()=>connections.delete(connection));
}
serverInterface.websocketHandlers.add("/getUpdates",acceptConnection);

function publishUpdate(updateText){
    connections.forEach(connection=>connection.sendUTF(updateText));
}
someEventEmitter.on("update",publishUpdate);
```

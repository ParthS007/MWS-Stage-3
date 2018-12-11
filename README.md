# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

# Project Overview: Stage 3

## Client Side

For the **Restaurant Reviews** projects, I will incrementally convert a static webpage to a mobile-ready web application. In **Stage Three**, I have taken the connected application built in Stage One and Stage Two and added additional functionality. I have added a form to allow users to create their own reviews. If the app is offline, form will defer updating to the remote database until a connection is established. Finally, I have worked to optimizing the site to meet even stricter performance benchmarks than the previous project, and test again using Lighthouse.

### Specification

You have been provided the code for a restaurant reviews website. The code has a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. Your job is to update the code to resolve these issues while still maintaining the included functionality. 

### What do I do from here?

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
3. Explore the provided code, and start making a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. Write code to implement the updates to get this site on its way to being a mobile-ready website.

### Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). You need to replace `<your MAPBOX API KEY HERE>` with a token from [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. 

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write. 


## Server Side

### Usage
#### Get Restaurants
```
curl "http://localhost:1337/restaurants"
```
#### Get Restaurants by id
````
curl "http://localhost:1337/restaurants/{3}"
````

### Architecture
Local server
- Node.js
- Sails.js

### Contributors

- [Brandy Lee Camacho - Technical Project Manager](mailto:brandy.camacho@udacity.com)
- [David Harris - Web Services Lead](mailto:david.harris@udacity.com)
- [Omar Albeik - Frontend engineer](mailto:omaralbeik@gmail.com)

### Getting Started

First, run the stage 3 server from https://github.com/udacity/mws-restaurant-stage-3.

Then, run this project as - 

```
sh
npm install gulp-cli -g
npm install
gulp

```

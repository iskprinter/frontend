# iskprinter/frontend
https://iskprinter.com

Suggests market deals in Eve Online.

![Build Status](https://iskprinter.com/jenkins/buildStatus/icon?job=frontend%2Fmain)
![Coverage](https://img.shields.io/badge/dynamic/json?label=coverage&query=%24.results.elements%5B%3F%28%40.name%20%3D%3D%20%27Conditional%27%29%5D.ratio&suffix=%20branch%25&url=https%3A%2F%2Fiskprinter.com%2Fjenkins%2Fjob%2Ffrontend%2Fjob%2Fmain%2FlastBuild%2Fcoverage%2Fresult%2Fapi%2Fjson%3Fdepth%3D1)

## How to develop locally
1. Export the necessary environment variables and then run the development script, which will
    * Build the image
    * Run it with the `./dist` directory mounted into the directory served by nginx
    * Initiate webpack continuous compilation
    ```
    export BACKEND_URL='http://localhost:80/api'
    ./dev-server.sh
    ```
1. The first time you visit page `http://localhost:8080` served by the development server, you won't be able to sign in because the callback URL for the Eve Application is `http://localhost:80`, which is occupied by kubernetes ingress.

    As a workaround, visit `http://localhost:80` and export the access token
    ```
    // In the browser console at http://localhost:80
    window.localStorage.getItem('accessToken');
    ```
    Then, copy the token and store it for `http://localhost:8080`.
    ```
    // In the browser console at http://localhost:8080
    window.localStorage.setItem('accessToken', <access-token>);
    ```

## How to build the image

To build the image and push it:
```
tag=$(git rev-parse --verify --short HEAD)
docker build . -t "docker.io/iskprinter/frontend:${tag}"
docker push "docker.io/iskprinter/frontend:${tag}"
```

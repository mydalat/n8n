#!/bin/bash

# Function to get the user to input the needed vars
get_vars () {
    read -p "Cloudron E-Mail: " EMAIL
    read -p "Cloudron Username: " USERNAME
    read -s -p "Cloudron Password: " PASSWORD
    read -p "Cloudron URL: " CLOUDRON_URL
    read -p "DOCKER REPOSITORY URL: " DOCKER_REPOSITORY_URL
    read -p "DOCKER USERNAME: " DOCKER_REPOSITORY_USERNAME
    read -p -s "DOCKER PASSWORD: " DOCKER_REPOSITORY_PASSWORD


    printf "EMAIL=$EMAIL\n
            USERNAME=$USERNAME\n
            PASSWORD=$PASSWORD\n
            DOCKER_REPOSITORY_URL=$DOCKER_REPOSITORY_URL\n
            DOCKER_REPOSITORY_USERNAME=$DOCKER_REPOSITORY_USERNAME\n
            DOCKER_REPOSITORY_PASSWORD=$DOCKER_REPOSITORY_PASSWORD\n
            " > .env
}

# check if .env file exists and read it or check if vars exsist
if [ -f ".env" ]; then
    export $(egrep -v '^#' .env | xargs) &> /dev/null
else
    echo ".env File missing - asking for required vars"
    get_vars
fi

if [ -z "$EMAIL" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ] || [ -z "$CLOUDRON_URL" ] || [ -z "$DOCKER_REPOSITORY_URL" ] || [ -z "$DOCKER_REPOSITORY_USERNAME" ] || [ -z "$DOCKER_REPOSITORY_PASSWORD" ]; then
    echo "some vars are empty - asking for required vars"
    get_vars
fi

echo "=> Login Docker"
docker login --username $DOCKER_REPOSITORY_USERNAME --password $DOCKER_REPOSITORY_PASSWORD $DOCKER_REPOSITORY_URL
echo "=> Login Cloudron"
cloudron login --username $USERNAME --password $PASSWORD my.$CLOUDRON_URL

set -x

# Get the ID and VERSION from the CloudronManifest.json
ID=$(jq -r ".id" CloudronManifest.json)
VERSION=$(jq -r ".version" CloudronManifest.json)

echo "=> Create Test Data dir"
mkdir -p ./cloudron_test/data ./cloudron_test/tmp ./cloudron_test/run

echo "=> Cleanup Test Data"
rm -rf ./cloudron_test/data/* ./cloudron_test/tmp/* ./cloudron_test/run/*

echo "=> Build test image"
cloudron build --set-repository $DOCKER_REPOSITORY_URL/$ID
docker build -t $DOCKER_REPOSITORY_URL/$ID:$VERSION .

if [[ RUN_IMG = "" ]]; then
    read -p "Do you want to run the image created image?: (y/N)" RUN_IMG
fi

if [[ "$RUN_IMG" = "y" || "$RUN_IMG" = "Y" ]]; then
echo "=> Run `test` tag of build image"
docker run -ti --read-only \
    --volume $(pwd)/cloudron_test/data:/app/data:rw \
    --volume $(pwd)/cloudron_test/tmp:/tmp:rw \
    --volume $(pwd)/cloudron_test/run:/run:rw \
    $DOCKER_REPOSITORY_URL/$ID:$VERSION \
    bash
fi

echo "=> Running tests"
cd test
echo "=> Installing package.json"
npm install
if [[ -f ./node_modules/.bin/mocha ]]; then
    ./node_modules/.bin/mocha ./test.js -b
fi

if [[ -f ../node_modules/.bin/mocha ]]; then
    ../node_modules/.bin/mocha ./test.js -b
fi

# remove installed test instance
sleep 10
cloudron uninstall --app test.$CLOUDRON_URL
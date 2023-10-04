#!/usr/bin/env bash
CLI_LOCATION="$(pwd)/cli"
echo "Building plugin in $(pwd)"

# read -s sudopass

# printf "\n"

$CLI_LOCATION/decky plugin build $(pwd)

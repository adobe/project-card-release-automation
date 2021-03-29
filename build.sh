#!/usr/bin/env bash

npx ncc build initialize-card/index.js -o initialize-card/dist --source-map --license licenses.txt
npx ncc build trigger-release/index.js -o trigger-release/dist --source-map --license licenses.txt
npx ncc build validate-version/index.js -o validate-version/dist --source-map --license licenses.txt
